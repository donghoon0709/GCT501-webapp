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

    const yesButton = document.createElement('button');
    yesButton.className = 'response-button';
    yesButton.textContent = 'Yes';
    yesButton.addEventListener('click', () => {
        handleYes();
    });

    const noButton = document.createElement('button');
    noButton.className = 'response-button';
    noButton.textContent = 'No';
    noButton.addEventListener('click', () => {
        handleNo();
    });

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

    const changeButton = document.createElement('button');
    changeButton.className = 'response-button';
    changeButton.textContent = 'Change keywords';
    changeButton.addEventListener('click', () => {
        handleChange();
    });

    const newButton = document.createElement('button');
    newButton.className = 'response-button';
    newButton.textContent = 'Make new input';
    newButton.addEventListener('click', () => {
        handleNew();
    });

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

function handleNew () {
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
        const keywordButton = document.createElement('button');
        keywordButton.className = 'response-button';
        keywordButton.textContent = keyword;

        // 클릭 이벤트 추가
        keywordButton.addEventListener('click', () => {
            const deleteKeyword = confirm(`Do you want to delete the keyword "${keyword}"?`);
            if (deleteKeyword) {
                keywords.splice(index, 1);
                keywordButton.remove();
            }
        });

        keywordContainer.appendChild(keywordButton);
    });

    const addNewButton = document.createElement('button');
    addNewButton.className = 'response-button';
    addNewButton.textContent = 'Add new';
    addNewButton.addEventListener('click', () => {
        const newKeyword = prompt("Input new keywords to add");
        if (newKeyword && !keywords.includes(newKeyword)) {
            keywords.push(newKeyword);

            const newKeywordButton = document.createElement('button');
            newKeywordButton.className = 'response-button';
            newKeywordButton.textContent = newKeyword;
            newKeywordButton.addEventListener('click', () => {
                const deleteKeyword = confirm(`Do you want to delete the keyword "${newKeyword}"?`);
                if (deleteKeyword) {
                    keywords.splice(keywords.indexOf(newKeyword), 1);
                    newKeywordButton.remove();
                }
            });
            keywordContainer.appendChild(newKeywordButton);
        }
    });

    // Finish button to confirm keyword selection
    const finishButton = document.createElement('button');
    finishButton.className = 'response-button';
    finishButton.textContent = 'Done';
    finishButton.addEventListener('click', () => {
        const confirmKeyword = confirm("Do you want to confirm those keywords?");
        if (confirmKeyword) {
            displayMessage(`Final keywords: ${keywords.join(', ')}`, 'bot');
            displayMessage("Then, let's take some photos!", 'bot');

            keywordContainer.remove();
            adjustContainer.remove();

            sendButton.remove();
            userInput.remove();
        }
    });

    adjustContainer.appendChild(addNewButton);
    adjustContainer.appendChild(finishButton);
    
    messagesDiv.appendChild(keywordContainer);
    messagesDiv.appendChild(adjustContainer);

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