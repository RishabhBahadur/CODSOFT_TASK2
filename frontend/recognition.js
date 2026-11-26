
const personName = document.getElementById("personName");
const registerImage = document.getElementById("registerImage");
const recognizeImage = document.getElementById("recognizeImage");

const registerButton = document.getElementById("registerFace");
const recognizeButton = document.getElementById("recognizeFace");

const registerStatus = document.getElementById("registerStatus");
const recognizeStatus = document.getElementById("recognizeStatus");

const recognitionResult = document.getElementById("recognitionResult");
const recognizedName = document.getElementById("recognizedName");
const recognitionConfidence = document.getElementById("recognitionConfidence");
const recognizedImage = document.getElementById("recognizedImage");


async function readResponse(response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        throw new Error(
            `Server returned an invalid response (HTTP ${response.status}). Check Flask.`
        );
    }
}


// REGISTER FACE
registerButton.addEventListener("click", async () => {
    const name = personName.value.trim();
    const file = registerImage.files[0];

    if (!name) {
        registerStatus.textContent = "Please enter a person's name.";
        return;
    }

    if (!file || !file.type.startsWith("image/")) {
        registerStatus.textContent = "Please select a valid face image.";
        return;
    }

    const consent = window.confirm(
        "Confirm that you have this person's informed permission to register and store their face image locally."
    );

    if (!consent) {
        registerStatus.textContent = "Registration cancelled. Consent is required.";
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", file);
    formData.append("consent", "true");

    registerButton.disabled = true;
    registerButton.textContent = "Registering...";
    registerStatus.textContent = "Registering face and training model...";

    try {
        const response = await fetch("/register-face", {
            method: "POST",
            body: formData
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Registration failed.");
        }

        registerStatus.textContent = data.message;

        personName.value = "";
        registerImage.value = "";

    } catch (error) {
        registerStatus.textContent = "Error: " + error.message;

    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "Register Face";
    }
});


// RECOGNIZE FACE
recognizeButton.addEventListener("click", async () => {
    const file = recognizeImage.files[0];

    if (!file || !file.type.startsWith("image/")) {
        recognizeStatus.textContent = "Please select a valid image.";
        return;
    }

    const formData = new FormData();
    formData.append("image", file);

    recognizeButton.disabled = true;
    recognizeButton.textContent = "Recognizing...";

    recognizeStatus.textContent = "Analyzing face...";
    recognitionResult.style.display = "none";

    try {
        const response = await fetch("/recognize-face", {
            method: "POST",
            body: formData
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Recognition failed.");
        }

        recognizedName.textContent = data.name || "Unknown";

        if (data.confidence !== null && data.confidence !== undefined) {
            recognitionConfidence.textContent =
                data.confidence + "% estimated similarity (not probability)";
        } else {
            recognitionConfidence.textContent =
                "Multiple faces detected. See the processed image.";
        }

        if (data.output_image) {
            recognizedImage.src = data.output_image + "?t=" + Date.now();
            recognizedImage.style.display = "block";
        } else {
            recognizedImage.style.display = "none";
        }

        recognitionResult.style.display = "block";
        recognizeStatus.textContent = data.message || "Recognition completed.";

    } catch (error) {
        recognizeStatus.textContent = "Error: " + error.message;

    } finally {
        recognizeButton.disabled = false;
        recognizeButton.textContent = "Recognize Face";
    }
});
