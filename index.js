document.addEventListener("DOMContentLoaded", async () => {
    await loadWords();
    createSquares();
    getNewWord();
    setupKeyboard();
    handlePhysicalKeyboardInput();
});

let guessedWords = [[]];
let availableSpace = 1;
let word = "";
let guessedWordCount = 0;
let allowedWords = [];

function loadWords() {
    return fetch('words.txt')
        .then(response => response.text())
        .then(text => {
            allowedWords = text.split('\n').map(w => w.trim().toLowerCase());
        })
        .catch(err => {
            console.error('Failed to load words file:', err);
        });
}

function getNewWord() {
    word = allowedWords[Math.floor(Math.random() * allowedWords.length)];
    console.log("Today's word:", word);
}

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
function getCurrentWordArr() {
    const numberOfGuessedWords = guessedWords.length;
    return guessedWords[numberOfGuessedWords - 1];
}

function updateGuessedWords(letter) {
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr && currentWordArr.length < 5) {
        currentWordArr.push(letter);

        const availableSpaceEl = document.getElementById(String(availableSpace));
        availableSpace = availableSpace + 1;
        availableSpaceEl.textContent = letter.toUpperCase();
    }
}

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

function getTileColor(letter, index) {
    const isCorrectLetter = word.includes(letter);

    if (!isCorrectLetter) {
        return "rgb(40, 58, 60)";
    }

    const letterInThatPosition = word.charAt(index);
    const isCorrectPosition = letter === letterInThatPosition;

    if (isCorrectPosition) {
        return "rgb(83, 141, 78)";
    }

    return "rgb(181, 159, 59)";
}

function handleSubmitWord() {
    const currentWordArr = getCurrentWordArr();

    if (currentWordArr.length !== 5) {
        window.alert("Word must be 5 letters");
        return;
    }

    const currentWord = currentWordArr.join("").toLowerCase();

    if (!allowedWords.includes(currentWord)) {
        window.alert("Word is not recognised!");
        return;
    }

    const firstLetterId = guessedWordCount * 5 + 1;
    const interval = 200;

    currentWordArr.forEach((letter, index) => {
        setTimeout(() => {
            const tileColor = getTileColor(letter, index);

            const letterId = firstLetterId + index;
            const letterEl = document.getElementById(letterId);
            letterEl.classList.add("animate__flipInX");
            letterEl.style = `background-color:${tileColor};border-color:${tileColor}`;
        }, interval * index);
    });

    guessedWordCount += 1;

    if (currentWord === word) {
        window.alert("Congratulations! 🎉");
        return;
    }

    if (guessedWords.length === 6) {
        window.alert(`Sorry, you have no more guesses! The word was "${word}".`);
        return;
    }

    guessedWords.push([]);
}