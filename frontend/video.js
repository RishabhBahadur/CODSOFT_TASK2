
const videoInput = document.getElementById("videoInput");
const processButton = document.getElementById("processVideo");

const videoStatus = document.getElementById("videoStatus");
const videoResult = document.getElementById("videoResult");

const framesProcessed = document.getElementById("framesProcessed");
const totalFaceDetections = document.getElementById("totalFaceDetections");

const processedVideo = document.getElementById("processedVideo");
const downloadVideo = document.getElementById("downloadVideo");

processButton.addEventListener("click", async () => {

    const file = videoInput.files[0];

    if (!file) {
        videoStatus.textContent = "Please select a video first.";
        return;
    }

    const allowedExtensions = ["mp4", "avi", "mov", "mkv"];
    const extension = file.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        videoStatus.textContent = "Unsupported video format.";
        return;
    }

    const formData = new FormData();

    formData.append("video", file);

    processButton.disabled = true;
    processButton.textContent = "Processing Video...";

    videoStatus.textContent =
        "Your video is being processed. Please wait...";

    videoResult.style.display = "none";

    try {

        const response = await fetch("/detect-video", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Video processing failed.");
        }

        framesProcessed.textContent = data.frames_processed;

        totalFaceDetections.textContent =
            data.total_face_detections;

        processedVideo.src = data.output_video + "?t=" + Date.now();

        processedVideo.load();

        downloadVideo.href = data.output_video;

        videoResult.style.display = "block";

        videoStatus.textContent =
            data.message || "Video processed successfully!";

    } catch (error) {

        videoStatus.textContent = "Error: " + error.message;

    } finally {

        processButton.disabled = false;
        processButton.textContent = "Process Video";

    }

});
