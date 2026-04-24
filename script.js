// ---------- GAME STATE (unique naming) ----------
let tileValues = [];
let correctOrder = [];
let swapCounter = 0;
let timeRemaining = 0;
let timerId = null;
let gameOngoing = true;
let selectedTileIndex = null;
let currentGridDimension = 6;

// DOM elements
const board = document.getElementById('tileContainer');
const swapSpan = document.getElementById('swapCounter');
const timeSpan = document.getElementById('timeCounter');
const sizeSpan = document.getElementById('sizeDisplay');
const messageSpan = document.getElementById('feedbackMsg');
const targetSpan = document.getElementById('targetList');

// ---------- AUDIO (your custom files) ----------
let introSound = null;
let winApplause = null;
let lossCry = null;
let warningBeep = null;

function loadAudio() {
    if (!introSound) {
        introSound = new Audio("getback.mp3");
        introSound.preload = "auto";
    }
    if (!winApplause) {
        winApplause = new Audio("umsebenzi.mp3");
        winApplause.preload = "auto";
    }
    if (!lossCry) {
        lossCry = new Audio("youlose.mp3");
        lossCry.preload = "auto";
    }
    if (!warningBeep) {
        warningBeep = new Audio("fahhhhhhhhhhhhhh.mp3");
        warningBeep.preload = "auto";
    }
}

function playIntro() {
    loadAudio();
    if (introSound) {
        introSound.currentTime = 0;
        introSound.play().catch(e => console.log("intro error", e));
    }
}

function playApplause() {
    loadAudio();
    if (winApplause) {
        winApplause.currentTime = 0;
        winApplause.play().catch(e => console.log("applause error", e));
    }
}

function playCry() {
    loadAudio();
    if (lossCry) {
        lossCry.currentTime = 0;
        lossCry.play().catch(e => console.log("cry error", e));
    }
}

function playWarningSound() {
    loadAudio();
    if (warningBeep) {
        warningBeep.currentTime = 0;
        warningBeep.play().catch(e => console.log("warning error", e));
    }
}

// ---------- HELPERS ----------
function randomizeArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[rand]] = [arr[rand], arr[i]];
    }
    return arr;
}

function createRandomSequence(size) {
    let arr = [];
    for (let i = 1; i <= size; i++) arr.push(i);
    return randomizeArray(arr);
}

function isSortedAscending(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}

function haltTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function launchTimer(limitSeconds) {
    if (timerId) haltTimer();
    timeRemaining = limitSeconds;
    timeSpan.innerText = timeRemaining + 's';
    timerId = setInterval(() => {
        if (gameOngoing && timeRemaining > 0) {
            timeRemaining--;
            timeSpan.innerText = timeRemaining + 's';
            if (timeRemaining === 0) {
                gameOngoing = false;
                haltTimer();
                playCry();
                messageSpan.innerHTML = '💀💔 TIME EXPIRED! 💔💀<br>😢😫 YOU LOST! TRY AGAIN 😫😢';
                selectedTileIndex = null;
                drawBoard();
                document.querySelectorAll('.tile').forEach(t => t.style.opacity = '0.5');
            }
        } else if (timeRemaining <= 0) {
            haltTimer();
        }
    }, 1000);
}

function drawBoard() {
    board.innerHTML = '';
    for (let i = 0; i < tileValues.length; i++) {
        const tileDiv = document.createElement('div');
        tileDiv.className = 'tile';
        if (selectedTileIndex === i) tileDiv.classList.add('selected');
        tileDiv.textContent = tileValues[i];
        tileDiv.addEventListener('click', (idx => () => onTilePressed(idx))(i));
        board.appendChild(tileDiv);
    }
    sizeSpan.innerText = currentGridDimension;
    targetSpan.innerText = correctOrder.join(' → ');
}

function checkWin() {
    if (isSortedAscending(tileValues)) {
        gameOngoing = false;
        haltTimer();
        playApplause();
        messageSpan.innerHTML = '🎉🎊✨ SORTED! PERFECT! ✨🎊🎉<br>😊🙌🎈 CONGRATULATIONS! 🎈🙌😊';
        document.querySelectorAll('.tile').forEach(t => t.classList.add('win-glow'));
        return true;
    }
    return false;
}

function areAdjacent(idxA, idxB) {
    return Math.abs(idxA - idxB) === 1;
}

function executeSwap(posA, posB) {
    if (!gameOngoing) return false;
    if (!areAdjacent(posA, posB)) {
        messageSpan.innerHTML = '⚠️ only adjacent tiles! bubble rule.';
        return false;
    }
    if (posA === posB) return false;
    const leftPos = Math.min(posA, posB);
    const rightPos = Math.max(posA, posB);
    if (tileValues[leftPos] < tileValues[rightPos]) {
        messageSpan.innerHTML = `⛔ already correct: ${tileValues[leftPos]} < ${tileValues[rightPos]} (ascending wants small → big). no swap needed.`;
        playWarningSound();
        return false;
    }
    // perform swap
    [tileValues[posA], tileValues[posB]] = [tileValues[posB], tileValues[posA]];
    swapCounter++;
    swapSpan.innerText = swapCounter;
    drawBoard();
    const allTiles = document.querySelectorAll('.tile');
    allTiles.forEach(t => t.style.transform = 'rotate(1deg)');
    setTimeout(() => allTiles.forEach(t => t.style.transform = ''), 100);
    const won = checkWin();
    if (won) selectedTileIndex = null;
    return true;
}

function onTilePressed(clickedIndex) {
    if (!window.startPlayed) {
        playIntro();
        window.startPlayed = true;
    }
    if (!gameOngoing) {
        messageSpan.innerHTML = timeRemaining === 0 ? '⏰ time over — restart' : 'game finished — restart';
        return;
    }
    if (selectedTileIndex === null) {
        selectedTileIndex = clickedIndex;
        drawBoard();
        messageSpan.innerHTML = `👉 selected ${tileValues[clickedIndex]} — now tap a neighbour`;
        return;
    }
    const first = selectedTileIndex;
    const second = clickedIndex;
    selectedTileIndex = null;
    if (first === second) {
        drawBoard();
        messageSpan.innerHTML = '✨ selection cleared — pick again';
        return;
    }
    const swapped = executeSwap(first, second);
    if (swapped && gameOngoing) {
        messageSpan.innerHTML = `🔄 swapped ${tileValues[second]} ↔ ${tileValues[first]}`;
    }
}

function resetGame(dimension) {
    haltTimer();
    currentGridDimension = dimension;
    tileValues = createRandomSequence(currentGridDimension);
    correctOrder = [...tileValues].sort((a, b) => a - b);
    swapCounter = 0;
    gameOngoing = true;
    selectedTileIndex = null;
    swapSpan.innerText = '0';
    sizeSpan.innerText = currentGridDimension;
    let timeLimit = 30;
    if (currentGridDimension === 4) timeLimit = 30;
    else if (currentGridDimension === 6) timeLimit = 45;
    else timeLimit = 60;
    timeSpan.innerText = timeLimit + 's';
    messageSpan.innerHTML = '🔄 fresh game! swap adjacent tiles only when left > right (need ascending)';
    drawBoard();
    document.querySelectorAll('.tile').forEach(t => {
        t.style.opacity = '';
        t.classList.remove('win-glow');
    });
    launchTimer(timeLimit);
}

function provideHint() {
    if (!gameOngoing) {
        messageSpan.innerHTML = timeRemaining === 0 ? 'game over — restart for hints' : 'game finished — restart';
        return;
    }
    for (let i = 0; i < tileValues.length - 1; i++) {
        if (tileValues[i] > tileValues[i + 1]) {
            messageSpan.innerHTML = `💡 hint: swap ${tileValues[i]} and ${tileValues[i+1]} (positions ${i}, ${i+1}) — they are out of order for ascending.`;
            const tiles = document.querySelectorAll('.tile');
            if (tiles[i] && tiles[i+1]) {
                tiles[i].style.backgroundColor = '#ffe0b5';
                tiles[i+1].style.backgroundColor = '#ffe0b5';
                setTimeout(() => {
                    if (tiles[i]) tiles[i].style.backgroundColor = '';
                    if (tiles[i+1]) tiles[i+1].style.backgroundColor = '';
                }, 700);
            }
            return;
        }
    }
    messageSpan.innerHTML = '✅ no adjacent errors — maybe you already won?';
}

function attachInteractions() {
    document.querySelectorAll('.diff-choice').forEach(btn => {
        btn.addEventListener('click', () => {
            const newDim = parseInt(btn.getAttribute('data-size'), 10);
            resetGame(newDim);
            document.querySelectorAll('.diff-choice').forEach(b => b.classList.remove('active-diff'));
            btn.classList.add('active-diff');
        });
    });
    document.getElementById('restartAction').addEventListener('click', () => resetGame(currentGridDimension));
    document.getElementById('hintAction').addEventListener('click', provideHint);
}

attachInteractions();
resetGame(6);