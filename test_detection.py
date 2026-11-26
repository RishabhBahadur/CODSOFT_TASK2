
import cv2
from backend.detection import detect_faces

# Load a test image
image = cv2.imread("test.jpg")

if image is None:
    print("Error: Could not load test.jpg")
    exit()

# Detect faces
result, face_count = detect_faces(image)

print("Faces detected:", face_count)

# Save the processed image
cv2.imwrite("outputs/detected_faces.jpg", result)

print("Processed image saved to outputs/detected_faces.jpg")
