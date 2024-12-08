const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const messagesDiv = document.getElementById('messages');

const captureButton = document.getElementById('capture-button');

const PORT = 8000

let keywords = null;

// Send the daily report to the ChatGPT and get summary from it
sendButton.addEventListener('click', async () => {
    sendMessage();
});

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage () {
    const message = userInput.value.trim();
    if (!message) return;

    userInput.value = ''

    sendButton.disabled = true;
    userInput.disabled = true;

    // Display user message
    displayMessage(message, 'user');
    displayMessage("Loading...", 'loading');

    // Send message to server
    try {
        const response = await fetch(`http://localhost:${PORT}/api/summarize-day`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Remove loading message
        const loadingMessage = document.querySelectorAll('.loading');
        loadingMessage.forEach((msg) => msg.remove());

        displayMessage(data.message, 'bot');
        if (data.keywords.length > 0) {
            keywords = data.keywords;
            displayMessage("Keywords: " + keywords, 'bot');
            displayMessage("This is summary of your day. Is it OK?", 'bot');

            makeYesOrNoButtons();
        }
        else {
            sendButton.disabled = false;
            userInput.disabled = false;
        }

    } catch (error) {
        console.error(error);
        displayMessage(error, 'bot-message');
    }
}

function makeYesOrNoButtons () {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const yesButton = createButton("Yes", handleYes);
    const noButton = createButton("No", handleNo)

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    messagesDiv.appendChild(buttonContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleYes() {
    displayMessage("Yes", 'user');

    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.remove();

    sendButton.remove();
    userInput.remove();
    displayMessage("Then, let's take some photos!", 'bot');

    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    const takephotoButton = createButton("Take photo", photoPhase);
    const containerElement = document.querySelector('.container');
    containerElement.appendChild(takephotoButton);
}

function handleNo() {
    displayMessage("No", 'user');

    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.remove();

    displayMessage("Do you want to change keywords, or input another messages?", 'bot');
    makeChangeOrNewButtons();
}

function makeChangeOrNewButtons () {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const changeButton = createButton("Change keywords", handleChange);
    const newButton = createButton("Make new input", handleNewInput);

    buttonContainer.appendChild(changeButton);
    buttonContainer.appendChild(newButton);
    messagesDiv.appendChild(buttonContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleChange () {
    displayMessage("Change keywords", 'user');
    displayMessage("Select a keyword you want to delete. Click \"Add new\" button to add new keywords", 'bot');

    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.remove();

    makeKeywordButtons(keywords);
}

function handleNewInput () {
    displayMessage("Make new input", 'user');
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.remove();

    sendButton.disabled = false;
    userInput.disabled = false;
}

function makeKeywordButtons(keywords) {
    const keywordContainer = document.createElement('div');
    const adjustContainer = document.createElement('div');

    keywordContainer.className = 'keyword-container';

    keywords.forEach((keyword, index) => {
        const keywordButton = createButton(keyword, () => handleDeleteKeyword(index, keywordButton));

        keywordContainer.appendChild(keywordButton);
    });

    const addNewButton = createButton('Add new', () => handleAddNewKeyword(keywordContainer));
    const finishButton = createButton('Done', () => handleConfirmChange(keywordContainer, adjustContainer));

    adjustContainer.appendChild(addNewButton);
    adjustContainer.appendChild(finishButton);
    
    messagesDiv.appendChild(keywordContainer);
    messagesDiv.appendChild(adjustContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleAddNewKeyword(keywordContainer) {
    const newKeyword = prompt("Input new keywords to add");
    if (newKeyword && !keywords.includes(newKeyword)) {
        keywords.push(newKeyword);

        const newKeywordButton = createButton(newKeyword,
            () => handleDeleteKeyword(keywords.indexOf(newKeyword), newKeywordButton));
        keywordContainer.appendChild(newKeywordButton);
    }
}

function handleDeleteKeyword(index, buttonElement) {
    const deleteKeyword = confirm(`Do you want to delete the keyword "${keywords[index]}"?`);
    if (deleteKeyword) {
        keywords.splice(index, 1);
        buttonElement.remove();
    }
}

function handleConfirmChange(keywordContainer, adjustContainer) {
    const confirmKeyword = confirm("Do you want to confirm those keywords?");
    if (confirmKeyword) {
        displayMessage(`Final keywords: ${keywords.join(', ')}`, 'bot');
        displayMessage("Then, let's take some photos!", 'bot');

        const takephotoButton = createButton("Take photo", photoPhase);
        const containerElement = document.querySelector('.container');
        containerElement.appendChild(takephotoButton);

        keywordContainer.remove();
        adjustContainer.remove();

        sendButton.remove();
        userInput.remove();
    }
}

async function photoPhase() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = 'none';

    const cameraContainer = document.getElementById('camera-container');
    cameraContainer.style.display = 'block';

    const webcam = document.getElementById('webcam');
    const snapshotCanvas = document.getElementById('snapshot');
    let mediaStream = null;
    let photos = [];

    const countdownElement = document.createElement('div');
    countdownElement.className = 'countdown-timer';
    cameraContainer.appendChild(countdownElement);

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcam.srcObject = mediaStream;

        const totalPhotos = 4;

        for (let photoCount = 0; photoCount < totalPhotos; ++photoCount) {
            await startCountdown(3, countdownElement);
            
            snapshotCanvas.width = webcam.videoWidth;
            snapshotCanvas.height = webcam.videoHeight;
            const context = snapshotCanvas.getContext('2d');
            context.drawImage(webcam, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

            const photoURL = snapshotCanvas.toDataURL('image/png');
            displayImage(photoURL);

            photos.push(photoURL.split(',')[1]);
        }
        
    } catch (error) {
        console.error(error);
    } finally {
        mediaStream.getTracks().forEach(track => track.stop());
        await uploadPhoto(photos);
        generateStickers();
    }
}

async function generateStickers() {
    try {
        const response = await fetch (`http://localhost:${PORT}/api/generate-stickers`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ keywords })
        });

        if (!response.ok) throw new Error("Failed to generate stickers");

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error(error);
    }

}

async function uploadPhoto(photos) {
    try {
        const response = await fetch (`http://localhost:${PORT}/api/upload-photos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ photos }),
        });

        if (!response.ok) throw new Error("Failed to upload image");

        const result = await response.json();
        console.log(result.message);
    } catch (error) {
        console.error(error);
    }
}

function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

function startCountdown(seconds, countdownElement) {
    return new Promise((resolve) => {
        let countdown = seconds;

        const interval = setInterval(() => {
            countdownElement.textContent = `Next photo in: ${countdown}s`;
            countdown--;

            if (countdown < 0) {
                clearInterval(interval);
                countdownElement.textContent = '';
                resolve(); // 카운트다운 종료
            }
        }, 1000);
    });
}

// function to display message
function displayMessage(text, className) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function createButton(text, onClick, className = 'response-button') {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

// function to display image
function displayImage (url) {
    const cameraContainer = document.getElementById('camera-container');
    const img = document.createElement ('img');
    img.src = url

    img.style.maxWidth = "25%"; 
    img.style.height = "auto"; 
    img.style.maxHeight = "300px"; 

    cameraContainer.appendChild(img)
    cameraContainer.scrollTop = cameraContainer.scrollHeight;
}