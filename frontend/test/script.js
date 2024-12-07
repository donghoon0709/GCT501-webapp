const sendButton = document.getElementById('send-button');
const userInput = document.getElementById('user-input');
const messagesDiv = document.getElementById('messages');

const captureButton = document.getElementById('capture-button');

let keywords = null;

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
            keywords = data.keywords;
            displayMessage("Keywords: " + keywords, 'bot');
            displayMessage("This is summary of your day. Is it OK?", 'bot');

            userInput.disabled = true;
            sendButton.disabled = true;

            makeYesOrNoButtons();
        }

    } catch (error) {
        console.error(error);
        displayMessage(error, 'bot-message');
    }

    // Clear input
    userInput.value = '';
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
}

function handleNo() {
    displayMessage("No", 'user');

    sendButton.disabled = true;
    userInput.disabled = true;

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

        // newKeywordButton.className = 'response-button';
        // newKeywordButton.textContent = newKeyword;
        // newKeywordButton.addEventListener('click', () => {
        //     const deleteKeyword = confirm(`Do you want to delete the keyword "${newKeyword}"?`);
        //     if (deleteKeyword) {
        //         keywords.splice(keywords.indexOf(newKeyword), 1);
        //         newKeywordButton.remove();
        //     }
        // });
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

        keywordContainer.remove();
        adjustContainer.remove();

        sendButton.remove();
        userInput.remove();
    }
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