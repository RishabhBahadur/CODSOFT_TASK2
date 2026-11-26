# FaceMatrix

**Intelligent Face Detection and Recognition System**

FaceMatrix is a Python-based computer vision web application for detecting faces in uploaded images, live webcam streams, and video files. It uses OpenCV for face detection and Flask to connect the processing backend with a multi-page web interface.

> **Project status:** Image detection, live webcam detection, and video processing are implemented. The Face Recognition page is currently a frontend interface; identity registration and recognition require backend implementation.

## Features

- **Image Processing:** Upload an image, detect faces, display bounding boxes, and view the detected-face count.
- **Live Webcam Detection:** Capture webcam frames and process them for face detection.
- **Video Processing:** Upload a supported video and generate a processed output video.
- **Multi-page Interface:** Separate pages for the dashboard, image processing, webcam, video processing, face recognition interface, and project information.
- **Downloadable Results:** Save processed images and videos.

## Technology Stack

| Technology | Use |
|---|---|
| Python | Backend programming |
| OpenCV | Image and video processing |
| Haar Cascade | Face detection |
| NumPy | Numerical and image operations |
| Flask | Backend web server and API |
| HTML, CSS, JavaScript | Frontend |

## Project Structure

```text
FaceMatrix/
├── backend/
│   ├── app.py
│   └── detection.py
├── frontend/
│   ├── index.html
│   ├── image.html
│   ├── webcam.html
│   ├── video.html
│   ├── recognition.html
│   ├── about.html
│   ├── style.css
│   ├── image.js
│   ├── webcam.js
│   ├── video.js
│   └── recognition.js
├── models/
│   └── haarcascade_frontalface_default.xml
├── uploads/
├── outputs/
├── .gitignore
├── requirements.txt
└── README.md
```

The `uploads/` and `outputs/` directories are used for runtime files. They may be empty in a fresh clone.

## Requirements

- Python 3.9 or later
- pip
- A modern web browser
- Webcam access for live detection

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/RishabhBahadur/FaceMatrix.git
cd FaceMatrix
```

If your repository uses a different name or URL, replace the clone URL with the actual repository URL.

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

From the project root:

```powershell
cd backend
python app.py
```

Open the following address in your browser:

```text
http://127.0.0.1:5001
```

To stop the server, press `Ctrl+C` in the terminal.

## How to Use

1. Open the FaceMatrix dashboard.
2. Choose **Image Processing** to upload an image and detect faces.
3. Choose **Live Webcam** and allow camera permission to start live detection.
4. Choose **Video Processing** to upload a supported video and process it.
5. Use the **About** page to learn about the project.

Supported video extensions in the current interface/backend: `.mp4`, `.avi`, `.mov`, and `.mkv`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Serve the dashboard |
| POST | `/detect` | Process an uploaded image |
| GET | `/result/<filename>` | Retrieve a processed image |
| POST | `/detect-video` | Process an uploaded video |
| GET | `/video-result/<filename>` | Retrieve a processed video |

The face-recognition interface references `/register-face` and `/recognize-face`; these endpoints are not part of the currently implemented backend.

## Configuration and Notes

- The Haar Cascade XML file must be present at `models/haarcascade_frontalface_default.xml`.
- The Flask development server is intended for local development and demonstration, not production deployment.
- Webcam access generally requires `localhost` or a secure HTTPS context.
- Do not commit virtual environments, private datasets, uploaded media, generated outputs, credentials, or personal face images to a public repository.

## Limitations

- Haar Cascade detection can be affected by lighting, face angle, image quality, and occlusion.
- The current application detects faces; it does not establish a person's identity.
- The recognition page is a prepared interface and is not yet backed by a functioning recognition pipeline.
- Performance depends on the computer's processing capability and the input media.

## Privacy and Responsible Use

Use images and videos only when you have permission to process them. Obtain informed consent before collecting or storing anyone's face data. Do not use this student project for surveillance, access control, or other high-impact identity decisions.

## Future Improvements

- Integrate a deep-learning face-recognition model.
- Add face embeddings and similarity comparison.
- Implement consent-based identity registration and recognition.
- Improve detection robustness and add automated tests.
- Add stronger upload validation, storage controls, and deployment security.

## Author

**Rishabh Bahadur**

- LinkedIn: [linkedin.com/in/rishabh-bahadur](https://www.linkedin.com/in/rishabh-bahadur)
- GitHub: [github.com/RishabhBahadur](https://github.com/RishabhBahadur)

## Project Information

- **Project:** FaceMatrix
- **Domain:** Artificial Intelligence / Computer Vision
- **Completion date:** 22 November 2026

## License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for details.
