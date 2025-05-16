//Set up game
window.addEventListener("load", async () => {
    await loadWords();
    createSquares();
    getNewWord();
    setupKeyboard();
    handlePhysicalKeyboardInput();
});

const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayText = document.getElementById('how-to-play-text');

//Opens and closes how to play text
howToPlayBtn.addEventListener('click', () => {
    howToPlayText.classList.toggle('visible');
    howToPlayText.classList.toggle('hidden');

    if (howToPlayText.classList.contains('visible')) {
        howToPlayBtn.textContent = "How to Play ▲";
    } else {
        howToPlayBtn.textContent = "How to Play ▼";
    }
});

let guessedWords = [[]];
let availableSpace = 1;
let word = "";
let guessedWordCount = 0;
let allowedWords = [];
let gameOver = false;
const url = "https://api.dictionaryapi.dev/api/v2/entries/en/";

//color constants
const COLOR_CORRECT = "rgb(83, 141, 78)";
const COLOR_OFF = "rgb(181, 159, 59)";
const COLOR_WRONG = "rgb(40, 58, 60)";


//Loads the words from WORDS.txt to the game
function loadWords() {
    return fetch('WORDS.txt')
        .then(response => response.text())
        .then(text => {
            allowedWords = text.split('\n').map(w => w.trim().toLowerCase());
        })
        .catch(err => {
            console.error('Failed to load words file:', err);
        });
}

//Get a new word to solve
function getNewWord() {
    if (mode === 'game') {
        word = allowedWords[Math.floor(Math.random() * allowedWords.length)];
        console.log(`Today's Word: ${word}`);
    } else if (mode === 'solo') {
        const today = new Date();
        const startDate = new Date('2025-05-03');
        const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const index = dayIndex % allowedWords.length;
        word = allowedWords[index];
        console.log(`Today's Word: ${word}`);
    } else {
        console.error("Unrecognized game mode:", mode);
    }
}

//Create boxes/grid for the board container
function createSquares() {
    const gameBoard = document.getElementById("board");

    for (let index = 0; index < 30; index++) {
        let square = document.createElement("div");
        square.classList.add("square");
        square.classList.add("animate__animated");
        square.setAttribute("id", index + 1);
        gameBoard.appendChild(square);
    }
}

//Sends key to board when pressed on the screen
function setupKeyboard() {
    const keys = document.querySelectorAll(".keyboard-row button");
    for (let i = 0; i < keys.length; i++) {
        keys[i].onclick = ({ target }) => {
            const letter = target.getAttribute("data-key").toLowerCase();

            if (letter === "enter") {
                handleSubmitWord();
                return;
            }

            if (letter === "del") {
                handleDeleteLetter();
                return;
            }

            updateGuessedWords(letter);
        };
    }
}

//Sends key to board when pressed on your physical keyboard
function handlePhysicalKeyboardInput() {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === "enter") {
            handleSubmitWord();
            return;
        }

        if (key === "backspace") {
            handleDeleteLetter();
            return;
        }

        if (/^[a-z]$/.test(key)) {
            updateGuessedWords(key);
        }
    });
}

//Returns current word you're ussing
function getCurrentWordArr() {
    const numberOfGuessedWords = guessedWords.length;
    return guessedWords[numberOfGuessedWords - 1];
}

//Checks if there is space and adds letter to current word
function updateGuessedWords(letter) {
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr && currentWordArr.length < 5) {
        currentWordArr.push(letter);

        const availableSpaceEl = document.getElementById(String(availableSpace));
        availableSpace = availableSpace + 1;
        availableSpaceEl.textContent = letter.toUpperCase();
    }
}

//Deletes one letter from current word
function handleDeleteLetter() {
    const currentWordArr = getCurrentWordArr();
    if (!currentWordArr.length) return;

    if (availableSpace > 1) {
        availableSpace -= 1;
    }

    currentWordArr.pop();

    const lastLetterEl = document.getElementById(String(availableSpace));
    if (lastLetterEl) {
        lastLetterEl.textContent = "";
    }
}

//Get tile colors for each letter of the solutionWord
function getTileColor(letter, index) {
    const isCorrectLetter = word.includes(letter);

    if (!isCorrectLetter) {
        return COLOR_WRONG;
    }

    const letterInThatPosition = word.charAt(index);
    const isCorrectPosition = letter === letterInThatPosition;

    if (isCorrectPosition) {
        return COLOR_CORRECT;
    }

    return COLOR_OFF;
}

//Check if Word is a Valid Word
async function isValidWord(word) {
    const word_url = url + word;
    try {
        const response = await fetch(word_url);

        if (response.status === 404) {
            showNotification(`"${word}" Is Not A Valid Word.`);
            return false;
        }

        const json = await response.json();
        console.log("Dictionary API response:", json);
        return true;
    } catch (error) {
        console.error("Error checking word:", error.message);
        return false;
    }
}

//Handles running the submission of each word
async function handleSubmitWord() {
    if (gameOver) {
        return;
    }
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr.length !== 5) {
        showNotification("Word must be 5 letters");
        return;
    }

    const currentWord = currentWordArr.join("").toLowerCase();

    const valid = await isValidWord(currentWord);
    if (!valid) {
        return;
    }

    const firstLetterId = guessedWordCount * 5 + 1;
    const interval = 200;

    //Adds the Keyboard color + effects
    currentWordArr.forEach((letter, index) => {
        setTimeout(() => {
            const tileColor = getTileColor(letter, index);

            const letterId = firstLetterId + index;
            const letterEl = document.getElementById(letterId);
            letterEl.classList.add("animate__flipInX");
            letterEl.style = `background-color:${tileColor};border-color:${tileColor}`;

            //change on-web keyboard color
            const keyButton = document.querySelector(`[data-key="${letter}"]`);
            console.log('Key color:', keyButton);
            if (keyButton) {
                const keyColor = keyButton.style.backgroundColor;

                if (keyColor !== COLOR_CORRECT) {
                    keyButton.style.backgroundColor = tileColor;
                    keyButton.style.borderColor = tileColor;
                }
            }
        }, interval * index);
    });

    guessedWordCount += 1;

    //game end
    if (currentWord === word) {
        showNotification("Congratulations! 🎉");
        gameOver = true;
        setTimeout(() => {
            showEndScreen(true);
            sendGameResultToBackend(true, guessedWordCount);
        }, 1500);
        return;
    }

    if (guessedWords.length === 6) {
        showNotification(`Sorry, you have no more guesses! The word was "${word}".`);
        gameOver = true;
        setTimeout(() => {
            showEndScreen(false);
            sendGameResultToBackend(false, guessedWords.length);
        }, 1500);
        return;
    }

    guessedWords.push([]);
}

//Show Notification
function showNotification(message, duration = 1000) {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.classList.add("show");
    notification.classList.remove("hidden");

    setTimeout(() => {
        notification.classList.remove("show");
        notification.classList.add("hidden");
    }, duration);
}

function showEndScreen(won) {
    const endScreen = document.getElementById("end-screen");
    const endTitle = document.getElementById("end-title");
    const endMessage = document.getElementById("end-message");
    const endGuesses = document.getElementById("end-guesses");

    endTitle.textContent = won ? "You Won! 🎉" : "Game Over";
    endMessage.textContent = won ? "Nice job!" : `The word was "${word}"`;

    endGuesses.innerHTML = "";
    guessedWords.forEach(guessArr => {
        const row = document.createElement("div");
        row.textContent = guessArr.join("").toUpperCase();
        endGuesses.appendChild(row);
    });

    endScreen.classList.remove("hidden");
}

document.getElementById("restart-btn").addEventListener("click", () => {
    location.reload();
});

// Send game results to backend
function sendGameResultToBackend(won, attempts) {
    const payload = {
        word: word,
        won: won,
        attempts: attempts,
        guesses: guessedWords.map(arr => arr.join('').toLowerCase())
    };
    
    fetch('/api/word/result/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include' // This sends cookies with the request
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Game result recorded:', data);
        showBackendNotification('Game result sent to ChiGame!');
    })
    .catch(error => {
        console.error('Error recording game result:', error);
        showBackendNotification('Failed to send result to ChiGame', true);
    });
}

// Show notification for backend communication
function showBackendNotification(message, isError = false) {
    // Create notification element if it doesn't exist
    let backendNotification = document.getElementById('backend-notification');
    if (!backendNotification) {
        backendNotification = document.createElement('div');
        backendNotification.id = 'backend-notification';
        backendNotification.style.position = 'fixed';
        backendNotification.style.bottom = '20px';
        backendNotification.style.right = '20px';
        backendNotification.style.padding = '10px 20px';
        backendNotification.style.borderRadius = '5px';
        backendNotification.style.color = 'white';
        backendNotification.style.fontWeight = 'bold';
        backendNotification.style.zIndex = '1000';
        document.body.appendChild(backendNotification);
    }
    
    // Set color based on error status
    backendNotification.style.backgroundColor = isError ? '#d9534f' : '#5cb85c';
    
    // Set message
    backendNotification.textContent = message;
    
    // Show notification
    backendNotification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
        backendNotification.style.display = 'none';
    }, 3000);
}
