
// ==========================================
// 1. IMAGE FACE DETECTION
// ==========================================

const imageInput = document.getElementById("imageInput");
const chooseBtn = document.getElementById("chooseBtn");
const detectBtn = document.getElementById("detectBtn");

const fileName = document.getElementById("fileName");
const status = document.getElementById("status");

const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const faceCount = document.getElementById("faceCount");

let selectedImage = null;
let originalImageURL = null;

chooseBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    if (originalImageURL) {
        URL.revokeObjectURL(originalImageURL);
    }

    selectedImage = file;
    originalImageURL = URL.createObjectURL(file);

    fileName.textContent = file.name;

    originalImage.src = originalImageURL;
    originalImage.style.display = "block";

    document.getElementById("originalPlaceholder").hidden = true;

    resultImage.style.display = "none";
    document.getElementById("resultPlaceholder").hidden = false;

    faceCount.textContent = "0";

    status.textContent = "Image selected. Ready for detection.";

    detectBtn.disabled = false;
});

detectBtn.addEventListener("click", async () => {

    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("image", selectedImage);

    detectBtn.disabled = true;
    status.textContent = "Detecting faces...";

    try {

        const response = await fetch("/detect", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Image detection failed.");
        }

        resultImage.src = data.output_image;
        resultImage.style.display = "block";

        document.getElementById("resultPlaceholder").hidden = true;

        faceCount.textContent = data.face_count;

        status.textContent = "Image detection completed successfully.";

    } catch (error) {

        status.textContent = error.message;

    } finally {

        detectBtn.disabled = false;
    }
});


// ==========================================
// 2. LIVE WEBCAM FACE DETECTION
// ==========================================

const webcam = document.getElementById("webcam");
const webcamCanvas = document.getElementById("webcamCanvas");

const webcamContext = webcamCanvas.getContext("2d");

const startWebcam = document.getElementById("startWebcam");
const stopWebcam = document.getElementById("stopWebcam");

const webcamStatus = document.getElementById("webcamStatus");
const webcamFaceCount = document.getElementById("webcamFaceCount");

const webcamPlaceholder = document.getElementById("webcamPlaceholder");

// Separate canvas for capturing raw webcam frames.
const captureCanvas = document.createElement("canvas");
const captureContext = captureCanvas.getContext("2d");

let webcamStream = null;
let webcamRunning = false;
let webcamSession = 0;


// Convert canvas to an image blob.
function canvasToBlob(canvas) {

    return new Promise((resolve, reject) => {

        canvas.toBlob(blob => {

            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Could not capture webcam frame."));
            }

        }, "image/jpeg", 0.85);

    });
}


// Start webcam.
startWebcam.addEventListener("click", async () => {

    try {

        webcamStatus.textContent = "Requesting webcam access...";

        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        webcam.srcObject = webcamStream;

        await new Promise(resolve => {
            webcam.onloadedmetadata = resolve;
        });

        await webcam.play();

        captureCanvas.width = webcam.videoWidth;
        captureCanvas.height = webcam.videoHeight;

        webcamCanvas.width = webcam.videoWidth;
        webcamCanvas.height = webcam.videoHeight;

        webcamCanvas.style.display = "block";
        webcamPlaceholder.hidden = true;

        webcamRunning = true;
        webcamSession++;

        startWebcam.disabled = true;
        stopWebcam.disabled = false;

        webcamStatus.textContent = "Live face detection is running.";

        processWebcamFrames(webcamSession);

    } catch (error) {

        webcamStatus.textContent =
            "Webcam error: " + error.message;

        stopWebcamStream();
    }
});


// Process webcam frames through Flask.
async function processWebcamFrames(session) {

    while (webcamRunning && session === webcamSession) {

        try {

            if (webcam.readyState < 2) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            // Capture the current webcam frame.
            captureContext.drawImage(
                webcam,
                0,
                0,
                captureCanvas.width,
                captureCanvas.height
            );

            const blob = await canvasToBlob(captureCanvas);

            const formData = new FormData();
            formData.append("image", blob, "webcam.jpg");

            // Send frame to the detection API.
            const response = await fetch("/detect", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Detection failed.");
            }

            if (!webcamRunning || session !== webcamSession) {
                break;
            }

            // Load the processed frame.
            const processedImage = new Image();

            await new Promise((resolve, reject) => {

                processedImage.onload = resolve;
                processedImage.onerror = reject;

                processedImage.src = data.output_image +
                    "?t=" + Date.now();

            });

            if (!webcamRunning || session !== webcamSession) {
                break;
            }

            // Draw processed frame on visible canvas.
            webcamContext.clearRect(
                0,
                0,
                webcamCanvas.width,
                webcamCanvas.height
            );

            webcamContext.drawImage(
                processedImage,
                0,
                0,
                webcamCanvas.width,
                webcamCanvas.height
            );

            webcamFaceCount.textContent = data.face_count;

        } catch (error) {

            if (webcamRunning && session === webcamSession) {
                webcamStatus.textContent =
                    "Webcam processing error: " + error.message;
            }

            break;
        }

    }

}


// Stop webcam.
stopWebcam.addEventListener("click", stopWebcamStream);

function stopWebcamStream() {

    webcamRunning = false;
    webcamSession++;

    if (webcamStream) {

        webcamStream.getTracks().forEach(track => {
            track.stop();
        });

        webcamStream = null;
    }

    webcam.srcObject = null;

    startWebcam.disabled = false;
    stopWebcam.disabled = true;

    webcamCanvas.style.display = "none";
    webcamPlaceholder.hidden = false;

    webcamFaceCount.textContent = "0";

    webcamContext.clearRect(
        0,
        0,
        webcamCanvas.width,
        webcamCanvas.height
    );

    webcamStatus.textContent = "Webcam is currently off.";
}


// ==========================================
// 3. VIDEO FACE DETECTION
// ==========================================

const videoInput = document.getElementById("videoInput");

const chooseVideoBtn = document.getElementById("chooseVideoBtn");
const processVideoBtn = document.getElementById("processVideoBtn");

const videoFileName = document.getElementById("videoFileName");
const videoStatus = document.getElementById("videoStatus");

const originalVideo = document.getElementById("originalVideo");
const processedVideo = document.getElementById("processedVideo");

const framesProcessed = document.getElementById("framesProcessed");
const totalVideoFaces = document.getElementById("totalVideoFaces");

const downloadVideo = document.getElementById("downloadVideo");

let selectedVideo = null;
let originalVideoURL = null;

chooseVideoBtn.addEventListener("click", () => {
    videoInput.click();
});


// Select video.
videoInput.addEventListener("change", () => {

    const file = videoInput.files[0];

    if (!file) return;

    const allowedExtensions = [".mp4", ".avi", ".mov", ".mkv"];

    const extension = file.name.substring(
        file.name.lastIndexOf(".")
    ).toLowerCase();

    if (!allowedExtensions.includes(extension)) {

        videoStatus.textContent = "Unsupported video format.";
        videoInput.value = "";
        return;
    }

    if (file.size > 100 * 1024 * 1024) {

        videoStatus.textContent = "Video must be smaller than 100 MB.";
        videoInput.value = "";
        return;
    }

    if (originalVideoURL) {
        URL.revokeObjectURL(originalVideoURL);
    }

    selectedVideo = file;
    originalVideoURL = URL.createObjectURL(file);

    videoFileName.textContent = file.name;

    originalVideo.src = originalVideoURL;
    originalVideo.style.display = "block";

    document.getElementById("originalVideoPlaceholder").hidden = true;

    processedVideo.pause();
    processedVideo.removeAttribute("src");
    processedVideo.load();

    processedVideo.style.display = "none";
    document.getElementById("processedVideoPlaceholder").hidden = false;

    downloadVideo.hidden = true;

    framesProcessed.textContent = "0";
    totalVideoFaces.textContent = "0";

    videoStatus.textContent = "Video selected. Ready to process.";

    processVideoBtn.disabled = false;
});


// Process uploaded video.
processVideoBtn.addEventListener("click", async () => {

    if (!selectedVideo) return;

    const formData = new FormData();
    formData.append("video", selectedVideo);

    processVideoBtn.disabled = true;
    chooseVideoBtn.disabled = true;

    videoStatus.textContent =
        "Processing video. Please wait...";

    try {

        const response = await fetch("/detect-video", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Video processing failed.");
        }

        // Display processed video.
        const resultURL = data.output_video;

        processedVideo.src = resultURL;
        processedVideo.style.display = "block";

        document.getElementById("processedVideoPlaceholder").hidden = true;

        processedVideo.load();

        // Display statistics.
        framesProcessed.textContent = data.frames_processed;
        totalVideoFaces.textContent = data.total_face_detections;

        // Enable download.
        downloadVideo.href = resultURL;
        downloadVideo.hidden = false;

        videoStatus.textContent =
            "Video processing completed successfully!";

    } catch (error) {

        videoStatus.textContent = error.message;

    } finally {

        processVideoBtn.disabled = false;
        chooseVideoBtn.disabled = false;
    }

});


// ==========================================
// 4. CLEANUP
// ==========================================

window.addEventListener("beforeunload", () => {

    stopWebcamStream();

    if (originalImageURL) {
        URL.revokeObjectURL(originalImageURL);
    }

    if (originalVideoURL) {
        URL.revokeObjectURL(originalVideoURL);
    }

});
