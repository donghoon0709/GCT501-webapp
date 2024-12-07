const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const messagesDiv = document.getElementById('messages');

const captureButton = document.getElementById('capture-button');

// Send the daily report to the ChatGPT and get summary from it
sendButton.addEventListener('click', async () => {
    sendMessage();
});

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // if (userInput.value.trim())
        sendMessage();
    }
});

async function sendMessage () {
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message
    displayMessage(message, 'user');
    displayMessage("Loading...", 'loading');

    // Send message to server
    try {
        const response = await fetch('http://localhost:8000/api/summarize-day', {
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
            displayMessage("Keywords: " + data.keywords, 'bot');
            displayMessage("This is summary of your day. Is it OK?", 'bot');
            
            makeButtons();
        }

    } catch (error) {
        console.error(error);
        displayMessage(error, 'bot-message');
    }

    // Clear input
    userInput.value = '';
}

function makeButtons () {
    userInput.disabled = true;
    sendButton.disabled = true;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const yesButton = document.createElement('button');
    yesButton.className = 'response-button';
    yesButton.textContent = 'Yes';
    yesButton.addEventListener('click', () => {
        handleUserResponse(true); 
    });

    const noButton = document.createElement('button');
    noButton.className = 'response-button';
    noButton.textContent = 'No';
    noButton.addEventListener('click', () => {
        handleUserResponse(false);
    });

    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    messagesDiv.appendChild(buttonContainer);

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function handleUserResponse(isOkay) {
    userInput.disabled = false;
    sendButton.disabled = false;
    
    const messagesDiv = document.getElementById('messages');

    displayMessage(isOkay ? 'Yes' : 'No', 'user');

    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
        buttonContainer.remove();
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
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

// function to display image
function displayImage (url, className) {
    const messagesDiv = document.getElementById('messages');
    const img = document.createElement ('img');
    img.src = url
    img.className = `message ${className}`;

    img.style.maxWidth = "100%"; 
    img.style.height = "auto"; 
    img.style.maxHeight = "300px"; 

    messagesDiv.appendChild(img)
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}