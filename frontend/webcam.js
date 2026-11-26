
const video = document.getElementById("webcam");
const canvas = document.getElementById("webcamCanvas");
const context = canvas.getContext("2d");

const startButton = document.getElementById("startWebcam");
const stopButton = document.getElementById("stopWebcam");

const webcamStatus = document.getElementById("webcamStatus");
const faceCountDisplay = document.getElementById("webcamFaceCount");

let webcamStream = null;
let detectionInterval = null;
let isProcessing = false;

async function startWebcam() {

    try {

        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        video.srcObject = webcamStream;

        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        startButton.disabled = true;
        stopButton.disabled = false;

        webcamStatus.textContent = "Webcam started. Detecting faces...";

        detectionInterval = setInterval(processWebcamFrame, 500);

    } catch (error) {

        webcamStatus.textContent =
            "Camera error: " + error.message;

    }

}

async function processWebcamFrame() {

    if (!webcamStream || isProcessing || video.readyState < 2) {
        return;
    }

    isProcessing = true;

    try {

        const captureCanvas = document.createElement("canvas");

        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;

        const captureContext = captureCanvas.getContext("2d");

        captureContext.drawImage(
            video,
            0,
            0,
            captureCanvas.width,
            captureCanvas.height
        );

        const blob = await new Promise(resolve => {
            captureCanvas.toBlob(resolve, "image/jpeg", 0.85);
        });

        if (!blob) {
            return;
        }

        const formData = new FormData();

        formData.append("image", blob, "webcam.jpg");

        const response = await fetch("/detect", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Detection failed.");
        }

        const resultImage = new Image();

        resultImage.onload = () => {

            if (!webcamStream) return;

            context.clearRect(0, 0, canvas.width, canvas.height);

            context.drawImage(
                resultImage,
                0,
                0,
                canvas.width,
                canvas.height
            );

            faceCountDisplay.textContent = data.face_count;

        };

        resultImage.src = data.output_image + "?t=" + Date.now();

    } catch (error) {

        webcamStatus.textContent = "Detection error: " + error.message;

    } finally {

        isProcessing = false;

    }

}

function stopWebcam() {

    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }

    if (webcamStream) {

        webcamStream.getTracks().forEach(track => track.stop());

        webcamStream = null;

    }

    video.srcObject = null;

    context.clearRect(0, 0, canvas.width, canvas.height);

    faceCountDisplay.textContent = "0";

    startButton.disabled = false;
    stopButton.disabled = true;

    webcamStatus.textContent = "Webcam stopped.";

}

startButton.addEventListener("click", startWebcam);

stopButton.addEventListener("click", stopWebcam);

window.addEventListener("beforeunload", stopWebcam);
