const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');

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

        displayMessage(data.message, 'bot-message');
        displayMessage(data.keywords);
        
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Error: Could not reach the server.', 'bot-message');
    }

    // Clear input
    userInput.value = '';
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