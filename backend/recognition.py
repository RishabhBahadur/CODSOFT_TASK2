
import cv2
import json
import uuid
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RECOGNITION_DIR = BASE_DIR / "recognition_data"
FACES_DIR = RECOGNITION_DIR / "faces"
MODEL_PATH = RECOGNITION_DIR / "lbph_model.yml"
LABELS_PATH = RECOGNITION_DIR / "labels.json"
CASCADE_PATH = BASE_DIR / "models" / "haarcascade_frontalface_default.xml"

RECOGNITION_DIR.mkdir(exist_ok=True)
FACES_DIR.mkdir(exist_ok=True)

face_cascade = cv2.CascadeClassifier(str(CASCADE_PATH))

if face_cascade.empty():
    raise RuntimeError("Failed to load Haar Cascade model")

UNKNOWN_THRESHOLD = 75.0
FACE_SIZE = (200, 200)


def load_labels():
    if not LABELS_PATH.exists():
        return {}

    with open(LABELS_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def save_labels(labels):
    with open(LABELS_PATH, "w", encoding="utf-8") as file:
        json.dump(labels, file, indent=4)


def extract_faces(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(50, 50)
    )

    return gray, faces


def prepare_face(gray, coordinates):
    x, y, w, h = coordinates
    face = gray[y:y+h, x:x+w]
    face = cv2.resize(face, FACE_SIZE)
    face = cv2.equalizeHist(face)

    return face


def train_model():
    labels = load_labels()
    training_faces = []
    training_labels = []

    for label_string, person_name in labels.items():
        label = int(label_string)
        person_folder = FACES_DIR / f"person_{label}"

        if not person_folder.exists():
            continue

        for image_path in person_folder.glob("*.jpg"):
            image = cv2.imread(
                str(image_path),
                cv2.IMREAD_GRAYSCALE
            )

            if image is None:
                continue

            image = cv2.resize(image, FACE_SIZE)
            training_faces.append(image)
            training_labels.append(label)

    if not training_faces:
        raise ValueError(
            "No registered face samples available for training."
        )

    recognizer = cv2.face.LBPHFaceRecognizer_create()

    recognizer.train(
        training_faces,
        np.array(training_labels, dtype=np.int32)
    )

    temporary_model = RECOGNITION_DIR / "lbph_model_temp.yml"
    recognizer.save(str(temporary_model))
    temporary_model.replace(MODEL_PATH)

    return len(training_faces)


def register_face(image, name):
    name = name.strip()

    if not name:
        raise ValueError("Please provide a person's name.")

    if len(name) > 50:
        raise ValueError("Name must be 50 characters or fewer.")

    gray, faces = extract_faces(image)

    if len(faces) == 0:
        raise ValueError("No face detected. Upload a clearer image.")

    if len(faces) > 1:
        raise ValueError(
            "Multiple faces detected. Upload an image containing one person."
        )

    labels = load_labels()
    existing_label = None

    for label_string, saved_name in labels.items():
        if saved_name.casefold() == name.casefold():
            existing_label = int(label_string)
            break

    if existing_label is None:
        existing_label = max(
            [int(label) for label in labels.keys()],
            default=-1
        ) + 1

        labels[str(existing_label)] = name

    person_folder = FACES_DIR / f"person_{existing_label}"
    person_folder.mkdir(exist_ok=True)

    face = prepare_face(gray, faces[0])

    sample_name = f"{uuid.uuid4().hex}.jpg"
    sample_path = person_folder / sample_name

    if not cv2.imwrite(str(sample_path), face):
        raise RuntimeError("Could not save the face sample.")

    try:
        save_labels(labels)
        total_samples = train_model()
    except Exception:
        sample_path.unlink(missing_ok=True)
        raise

    return {
        "name": name,
        "total_samples": total_samples
    }


def recognize_faces(image):
    if not MODEL_PATH.exists():
        raise ValueError(
            "No trained recognition model found. Register a person first."
        )

    labels = load_labels()

    if not labels:
        raise ValueError("No registered identities found.")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(str(MODEL_PATH))

    gray, faces = extract_faces(image)

    if len(faces) == 0:
        raise ValueError("No face detected in the uploaded image.")

    output = image.copy()
    results = []

    for coordinates in faces:
        face = prepare_face(gray, coordinates)
        predicted_label, distance = recognizer.predict(face)

        person_name = labels.get(str(predicted_label))

        if person_name is not None and distance <= UNKNOWN_THRESHOLD:
            name = person_name
            status = "Recognized"
            color = (0, 255, 0)
        else:
            name = "Unknown"
            status = "Unknown"
            color = (0, 0, 255)

        similarity_score = round(
            max(0.0, min(100.0, 100.0 * (1.0 - distance / 150.0))),
            1
        )

        x, y, w, h = coordinates

        cv2.rectangle(
            output,
            (x, y),
            (x + w, y + h),
            color,
            2
        )

        cv2.putText(
            output,
            name,
            (x, max(y - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color,
            2
        )

        results.append({
            "name": name,
            "status": status,
            "distance": round(float(distance), 2),
            "similarity_score": similarity_score
        })

    return output, results
