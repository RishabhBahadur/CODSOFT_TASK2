
from flask import Flask, request, jsonify, send_file, send_from_directory
from pathlib import Path
import cv2
import numpy as np
import uuid

from detection import detect_faces, process_video
from recognition import register_face, recognize_faces

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_FOLDER = BASE_DIR / "frontend"
UPLOAD_FOLDER = BASE_DIR / "uploads"
OUTPUT_FOLDER = BASE_DIR / "outputs"

app = Flask(__name__)

UPLOAD_FOLDER.mkdir(exist_ok=True)
OUTPUT_FOLDER.mkdir(exist_ok=True)

app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv"}


def decode_image(file):
    image_bytes = file.read()

    if not image_bytes:
        return None

    return cv2.imdecode(
        np.frombuffer(image_bytes, dtype=np.uint8),
        cv2.IMREAD_COLOR
    )


@app.route("/")
def home():
    return send_from_directory(FRONTEND_FOLDER, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND_FOLDER, filename)


# IMAGE FACE DETECTION
@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = decode_image(request.files["image"])

    if image is None:
        return jsonify({"error": "Invalid image file"}), 400

    result, face_count = detect_faces(image)

    output_name = f"{uuid.uuid4().hex}.jpg"
    output_path = OUTPUT_FOLDER / output_name

    cv2.imwrite(str(output_path), result)

    return jsonify({
        "message": "Face detection completed",
        "face_count": face_count,
        "output_image": f"/result/{output_name}"
    })


@app.route("/result/<filename>")
def get_result(filename):
    if Path(filename).name != filename:
        return jsonify({"error": "Invalid filename"}), 400

    output_path = OUTPUT_FOLDER / filename

    if not output_path.is_file():
        return jsonify({"error": "Result not found"}), 404

    return send_file(output_path, mimetype="image/jpeg")


# VIDEO FACE DETECTION
@app.route("/detect-video", methods=["POST"])
def detect_video():
    if "video" not in request.files:
        return jsonify({"error": "No video uploaded"}), 400

    file = request.files["video"]

    if not file.filename or "." not in file.filename:
        return jsonify({"error": "Invalid video filename"}), 400

    extension = file.filename.rsplit(".", 1)[1].lower()

    if extension not in ALLOWED_VIDEO_EXTENSIONS:
        return jsonify({"error": "Unsupported video format"}), 400

    input_name = f"{uuid.uuid4().hex}.{extension}"
    output_name = f"{uuid.uuid4().hex}.mp4"

    input_path = UPLOAD_FOLDER / input_name
    output_path = OUTPUT_FOLDER / output_name

    file.save(str(input_path))

    try:
        frames_processed, total_face_detections = process_video(
            input_path,
            output_path
        )

        return jsonify({
            "message": "Video processing completed",
            "frames_processed": frames_processed,
            "total_face_detections": total_face_detections,
            "output_video": f"/video-result/{output_name}"
        })

    except Exception:
        app.logger.exception("Video processing failed")
        output_path.unlink(missing_ok=True)
        return jsonify({"error": "Video processing failed."}), 500

    finally:
        input_path.unlink(missing_ok=True)


@app.route("/video-result/<filename>")
def get_video_result(filename):
    if Path(filename).name != filename:
        return jsonify({"error": "Invalid filename"}), 400

    output_path = OUTPUT_FOLDER / filename

    if not output_path.is_file():
        return jsonify({"error": "Video result not found"}), 404

    return send_file(output_path, mimetype="video/mp4")


# FACE REGISTRATION
@app.route("/register-face", methods=["POST"])
def register():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    name = request.form.get("name", "").strip()

    if request.form.get("consent") != "true":
        return jsonify({
            "error": "Permission is required to register this person's face."
        }), 400

    image = decode_image(request.files["image"])

    if image is None:
        return jsonify({"error": "Invalid image file"}), 400

    try:
        result = register_face(image, name)

        return jsonify({
            "message": (
                f"{result['name']} registered successfully. "
                f"Total training samples: {result['total_samples']}."
            ),
            "name": result["name"],
            "total_samples": result["total_samples"]
        })

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        app.logger.exception("Face registration failed")
        return jsonify({
            "error": "Face registration failed. Check the server terminal."
        }), 500


# FACE RECOGNITION
@app.route("/recognize-face", methods=["POST"])
def recognize():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = decode_image(request.files["image"])

    if image is None:
        return jsonify({"error": "Invalid image file"}), 400

    try:
        output, results = recognize_faces(image)

        output_name = f"{uuid.uuid4().hex}.jpg"
        output_path = OUTPUT_FOLDER / output_name

        if not cv2.imwrite(str(output_path), output):
            raise RuntimeError("Could not save recognition result.")

        if len(results) == 1:
            name = results[0]["name"]
            confidence = results[0]["similarity_score"]
        else:
            name = f"{len(results)} faces detected"
            confidence = None

        return jsonify({
            "message": (
                "Face recognition completed. Similarity scores are "
                "estimates, not probabilities."
            ),
            "name": name,
            "confidence": confidence,
            "faces": results,
            "output_image": f"/result/{output_name}"
        })

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception:
        app.logger.exception("Face recognition failed")
        return jsonify({
            "error": "Face recognition failed. Check the server terminal."
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)
