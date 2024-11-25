document.getElementById('send-button').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (!message) return;

    // Display user message
    displayMessage(message, 'user-message');

    // Send message to server
    try {
        const response = await fetch('http://localhost:8000/chat', {
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
        displayMessage(data.message, 'bot-message');
    } catch (error) {
        console.error('Error:', error);
        displayMessage('Error: Could not reach the server.', 'bot-message');
    }

    // Clear input
    userInput.value = '';
});

function displayMessage(text, className) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}