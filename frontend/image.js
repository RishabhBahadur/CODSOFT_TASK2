
const imageInput = document.getElementById("imageInput");
const processButton = document.getElementById("processImage");
const imageStatus = document.getElementById("imageStatus");
const imageResult = document.getElementById("imageResult");
const processedImage = document.getElementById("processedImage");
const faceCount = document.getElementById("faceCount");
const downloadImage = document.getElementById("downloadImage");

processButton.addEventListener("click", async () => {

    const file = imageInput.files[0];

    if (!file) {
        imageStatus.textContent = "Please select an image first.";
        return;
    }

    if (!file.type.startsWith("image/")) {
        imageStatus.textContent = "Please select a valid image file.";
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    processButton.disabled = true;
    processButton.textContent = "Processing...";
    imageStatus.textContent = "Analyzing image. Please wait...";
    imageResult.style.display = "none";

    try {

        const response = await fetch("/detect", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Image processing failed.");
        }

        processedImage.src = data.output_image + "?t=" + Date.now();

        faceCount.textContent = data.face_count;

        downloadImage.href = data.output_image;

        imageResult.style.display = "block";

        imageStatus.textContent = data.message || "Image processed successfully!";

    } catch (error) {

        imageStatus.textContent = "Error: " + error.message;

    } finally {

        processButton.disabled = false;
        processButton.textContent = "Detect Faces";

    }

});
