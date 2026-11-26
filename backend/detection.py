
import cv2
from pathlib import Path

# Model configuration
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "haarcascade_frontalface_default.xml"

face_cascade = cv2.CascadeClassifier(str(MODEL_PATH))

if face_cascade.empty():
    raise RuntimeError("Failed to load Haar Cascade model")


# Image face detection
def detect_faces(image):

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(30, 30)
    )

    output = image.copy()

    for (x, y, w, h) in faces:

        cv2.rectangle(
            output,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

        cv2.putText(
            output,
            "Face Detected",
            (x, y - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )

    return output, len(faces)


# Video face detection
def process_video(input_path, output_path):

    cap = cv2.VideoCapture(str(input_path))

    if not cap.isOpened():
        raise ValueError("Could not open uploaded video")

    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 0:
        fps = 25.0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")

    writer = cv2.VideoWriter(
        str(output_path),
        fourcc,
        fps,
        (width, height)
    )

    if not writer.isOpened():
        cap.release()
        raise ValueError("Could not create output video")

    frames_processed = 0
    total_face_detections = 0

    try:
        while True:

            success, frame = cap.read()

            if not success:
                break

            processed_frame, face_count = detect_faces(frame)

            writer.write(processed_frame)

            frames_processed += 1
            total_face_detections += face_count

    finally:
        cap.release()
        writer.release()

    return frames_processed, total_face_detections
