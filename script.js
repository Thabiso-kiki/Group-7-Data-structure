// ========== VIEW SWITCHING ==========
const menuPanel = document.getElementById('menuPanel');
const bubblePanel = document.getElementById('bubblePanel');
const quickPanel = document.getElementById('quickPanel');

function showPanel(panelId) {
    menuPanel.classList.remove('activePanel');
    bubblePanel.classList.remove('activePanel');
    quickPanel.classList.remove('activePanel');
    if (panelId === 'menu') menuPanel.classList.add('activePanel');
    if (panelId === 'bubble') bubblePanel.classList.add('activePanel');
    if (panelId === 'quick') quickPanel.classList.add('activePanel');
    if (panelId !== 'bubble') pauseBgMusic();
}

document.querySelectorAll('[data-game="bubble"]').forEach(btn => btn.addEventListener('click', () => showPanel('bubble')));
document.querySelectorAll('[data-game="quick"]').forEach(btn => btn.addEventListener('click', () => showPanel('quick')));
document.getElementById('backFromBubble')?.addEventListener('click', () => showPanel('menu'));
document.getElementById('backFromQuick')?.addEventListener('click', () => showPanel('menu'));

// ========== AUDIO ==========
let introAudio = null, winAudio = null, loseAudio = null, warnAudio = null, bgAudio = null;
function initAudio() {
    if (!introAudio) { introAudio = new Audio("start.mp3"); introAudio.preload = "auto"; }
    if (!winAudio) { winAudio = new Audio("winning.mp4"); winAudio.preload = "auto"; }
    if (!loseAudio) { loseAudio = new Audio("fail.mp3"); loseAudio.preload = "auto"; }
    if (!warnAudio) { warnAudio = new Audio("warning.mp3"); warnAudio.preload = "auto"; }
    if (!bgAudio) { bgAudio = new Audio("background.mp3"); bgAudio.loop = true; bgAudio.volume = 0.2; bgAudio.preload = "auto"; }
}
function playStartSound() { initAudio(); if (introAudio) { introAudio.currentTime = 0; introAudio.play().catch(e=>{}); } }
function playWinSound()   { initAudio(); if (winAudio)   { winAudio.currentTime = 0; winAudio.play().catch(e=>{}); } }
function playLoseSound()  { initAudio(); if (loseAudio)  { loseAudio.currentTime = 0; loseAudio.play().catch(e=>{}); } }
function playWarnSound()  { initAudio(); if (warnAudio)  { warnAudio.currentTime = 0; warnAudio.play().catch(e=>{}); } }
function startBgMusic()   { initAudio(); if (bgAudio && bgAudio.paused) { bgAudio.currentTime = 0; bgAudio.play().catch(e=>{}); } }
function pauseBgMusic()   { if (bgAudio && !bgAudio.paused) bgAudio.pause(); }

// ========== BUBBLE SORT GAME ==========
let bubNumbers = [], bubGoal = [], bubSwapCount = 0, bubSecsLeft = 0, bubTimerId = null;
let bubGameActive = false, bubPaused = false, bubSelectedIdx = null, bubGridDim = 6, bubLivesRemaining = 3;
const bubField = document.getElementById('bubField'), bubSwapSpan = document.getElementById('bubSwap');
const bubTimerSpan = document.getElementById('bubTimer'), bubSizeSpan = document.getElementById('bubSize');
const bubLivesSpan = document.getElementById('bubLives'), bubInfoSpan = document.getElementById('bubInfo');
const bubTargetSpan = document.getElementById('bubTarget');

function shuffleArray(arr) { for (let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function generateBubGrid(size) { let arr=[]; for(let i=1;i<=size;i++) arr.push(i); return shuffleArray(arr); }
function isAscendingOrder(arr) { for(let i=0;i<arr.length-1;i++) if(arr[i]>arr[i+1]) return false; return true; }
function stopBubTimer() { if(bubTimerId) { clearInterval(bubTimerId); bubTimerId=null; } }
function startBubTimer(limit) {
    if(bubTimerId) stopBubTimer();
    bubSecsLeft=limit; bubTimerSpan.innerText=bubSecsLeft+'s';
    bubTimerId=setInterval(()=>{
        if(bubGameActive && !bubPaused && bubSecsLeft>0) {
            bubSecsLeft--; bubTimerSpan.innerText=bubSecsLeft+'s';
            if(bubSecsLeft===0) {
                bubGameActive=false; stopBubTimer(); playLoseSound();
                bubInfoSpan.innerHTML='💀 TIME EXPIRED! GAME OVER 💀';
                document.querySelectorAll('#bubField .tile').forEach(t=>t.style.opacity='0.5');
            }
        }
    },1000);
}
function renderBubField() {
    bubField.innerHTML='';
    for(let i=0;i<bubNumbers.length;i++) {
        let tile=document.createElement('div'); tile.className='tile';
        if(bubSelectedIdx===i) tile.classList.add('selectedTile');
        tile.textContent=bubNumbers[i];
        tile.addEventListener('click',(idx=>()=>bubTileClick(idx))(i));
        bubField.appendChild(tile);
    }
    bubSizeSpan.innerText=bubGridDim; bubTargetSpan.innerText=bubGoal.join(' → '); bubLivesSpan.innerText=bubLivesRemaining;
}
function bubWinCheck() {
    if(isAscendingOrder(bubNumbers)) {
        bubGameActive=false; stopBubTimer(); playWinSound();
        bubInfoSpan.innerHTML='🎉 SORTED! PERFECT! 🎉';
        document.querySelectorAll('#bubField .tile').forEach(t=>t.classList.add('winGlow'));
        return true;
    }
    return false;
}
function areNeighbours(a,b){ return Math.abs(a-b)===1; }
function attemptBubSwap(i,j) {
    if(!bubGameActive||bubPaused) return false;
    if(!areNeighbours(i,j)) { bubInfoSpan.innerHTML='⚠️ only adjacent tiles!'; return false; }
    if(i===j) return false;
    let left=Math.min(i,j), right=Math.max(i,j);
    if(bubNumbers[left]<bubNumbers[right]) {
        bubInfoSpan.innerHTML=`⛔ already correct! -1 life`;
        playWarnSound();
        bubLivesRemaining--; bubLivesSpan.innerText=bubLivesRemaining;
        let tiles=document.querySelectorAll('#bubField .tile');
        if(tiles[left]) tiles[left].classList.add('vibrate');
        if(tiles[right]) tiles[right].classList.add('vibrate');
        setTimeout(()=>{ if(tiles[left]) tiles[left].classList.remove('vibrate'); if(tiles[right]) tiles[right].classList.remove('vibrate'); },300);
        if(window.navigator?.vibrate) window.navigator.vibrate(200);
        if(bubLivesRemaining<=0) { bubGameActive=false; stopBubTimer(); playLoseSound(); bubInfoSpan.innerHTML='💀 NO LIVES LEFT! GAME OVER 💀'; document.querySelectorAll('#bubField .tile').forEach(t=>t.style.opacity='0.5'); }
        return false;
    }
    [bubNumbers[i],bubNumbers[j]]=[bubNumbers[j],bubNumbers[i]];
    bubSwapCount++; bubSwapSpan.innerText=bubSwapCount;
    renderBubField(); bubWinCheck();
    return true;
}
function bubTileClick(idx) {
    if(!bubGameActive||bubPaused) { bubInfoSpan.innerHTML=bubPaused?'⏸ paused':'game not started — press start'; return; }
    if(bubSelectedIdx===null) { bubSelectedIdx=idx; renderBubField(); bubInfoSpan.innerHTML=`👉 selected ${bubNumbers[idx]}`; return; }
    let first=bubSelectedIdx, second=idx; bubSelectedIdx=null;
    if(first===second) { renderBubField(); bubInfoSpan.innerHTML='✨ cleared'; return; }
    if(attemptBubSwap(first,second)) bubInfoSpan.innerHTML=`🔄 swapped ${bubNumbers[second]} ↔ ${bubNumbers[first]}`;
}
function resetBubGame(size,autoStart=false) {
    stopBubTimer(); bubGameActive=false; bubPaused=false; bubGridDim=size;
    bubNumbers=generateBubGrid(bubGridDim); bubGoal=[...bubNumbers].sort((a,b)=>a-b);
    bubSwapCount=0; bubSelectedIdx=null; bubLivesRemaining=3;
    bubSwapSpan.innerText='0'; bubSizeSpan.innerText=bubGridDim; bubLivesSpan.innerText='3';
    let limit=bubGridDim===4?30:(bubGridDim===6?45:60);
    bubTimerSpan.innerText=limit+'s';
    bubInfoSpan.innerHTML='game ready. press START';
    renderBubField();
    document.querySelectorAll('#bubField .tile').forEach(t=>{ t.style.opacity=''; t.classList.remove('winGlow'); });
    if(autoStart) startBubGame();
}
function startBubGame() {
    if(bubGameActive&&!bubPaused) { bubInfoSpan.innerHTML='already running'; return; }
    if(bubPaused) { bubPaused=false; startBubTimer(parseInt(bubTimerSpan.innerText)); bubInfoSpan.innerHTML='resumed'; return; }
    if(bubLivesRemaining<=0) { bubInfoSpan.innerHTML='no lives, restart'; return; }
    bubGameActive=true; bubPaused=false;
    let limit=bubGridDim===4?30:(bubGridDim===6?45:60);
    startBubTimer(limit); startBgMusic(); playStartSound();
    bubInfoSpan.innerHTML='game started!';
}
function pauseBubGame() { if(bubGameActive&&!bubPaused) { bubPaused=true; stopBubTimer(); pauseBgMusic(); bubInfoSpan.innerHTML='paused'; } }
function resumeBubGame() { if(bubGameActive&&bubPaused) { bubPaused=false; startBubTimer(parseInt(bubTimerSpan.innerText)); startBgMusic(); bubInfoSpan.innerHTML='resumed'; } }
function bubHint() {
    if(!bubGameActive||bubPaused) return;
    for(let i=0;i<bubNumbers.length-1;i++) {
        if(bubNumbers[i]>bubNumbers[i+1]) {
            bubInfoSpan.innerHTML=`💡 hint: swap ${bubNumbers[i]} and ${bubNumbers[i+1]}`;
            let tiles=document.querySelectorAll('#bubField .tile');
            if(tiles[i]&&tiles[i+1]) { tiles[i].style.backgroundColor='#ffe0b5'; tiles[i+1].style.backgroundColor='#ffe0b5'; setTimeout(()=>{ if(tiles[i]) tiles[i].style.backgroundColor=''; if(tiles[i+1]) tiles[i+1].style.backgroundColor=''; },700); }
            return;
        }
    }
    bubInfoSpan.innerHTML='no adjacent errors';
}
document.querySelectorAll('#bubblePanel .levelBtn').forEach(btn=>{
    btn.addEventListener('click',()=>{ if(!bubGameActive) resetBubGame(parseInt(btn.getAttribute('data-dim')),false); document.querySelectorAll('#bubblePanel .levelBtn').forEach(b=>b.classList.remove('activeLevel')); btn.classList.add('activeLevel'); });
});
document.getElementById('bubStart')?.addEventListener('click',startBubGame);
document.getElementById('bubPause')?.addEventListener('click',pauseBubGame);
document.getElementById('bubResume')?.addEventListener('click',resumeBubGame);
document.getElementById('bubRestart')?.addEventListener('click',()=>{ pauseBgMusic(); resetBubGame(bubGridDim,false); });
document.getElementById('bubHint')?.addEventListener('click',bubHint);

// ========== QUICK SORT PLAYABLE GAME ==========
let quickArray = [], quickSubStacks = [], quickCurrentRange = null, quickPivot = null, quickPivotIndex = null;
let quickCorrectIndices = [], quickClickedCorrect = [], quickScore = 0, quickLives = 3, quickGameActive = true, quickWinFlag = false;
const quickField = document.getElementById('quickField'), quickScoreSpan = document.getElementById('quickScore');
const quickLivesSpan = document.getElementById('quickLives'), quickLevelSpan = document.getElementById('quickLevel');
const quickPivotShow = document.getElementById('quickPivotShow'), quickInfoSpan = document.getElementById('quickInfo');

function shuffleQuick(arr) { for(let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function generateQuickArray(size=6) { let arr=[]; for(let i=1;i<=size;i++) arr.push(i); return shuffleQuick(arr); }
function renderQuickField() {
    quickField.innerHTML='';
    for(let i=0;i<quickArray.length;i++) {
        let tile=document.createElement('div'); tile.className='tile';
        if(quickCurrentRange && i===quickPivotIndex) tile.style.backgroundColor='#ffaa88';
        if(quickClickedCorrect.includes(i)) tile.style.backgroundColor='#aaffaa';
        tile.textContent=quickArray[i];
        tile.addEventListener('click',(idx=>()=>onQuickTileClick(idx))(i));
        quickField.appendChild(tile);
    }
}
function startNewQuickGame() {
    quickArray=generateQuickArray(6);
    quickSubStacks=[[0,quickArray.length-1]];
    quickScore=0; quickLives=3; quickGameActive=true; quickWinFlag=false;
    quickScoreSpan.innerText=quickScore; quickLivesSpan.innerText=quickLives; quickLevelSpan.innerText='1';
    quickInfoSpan.innerHTML='✨ New game! Click elements smaller than the pivot (orange).';
    processNextQuickRange();
}
function processNextQuickRange() {
    if(quickSubStacks.length===0) {
        if(!quickWinFlag) { quickWinFlag=true; quickGameActive=false; playWinSound(); quickInfoSpan.innerHTML='🎉 YOU SORTED THE ARRAY! PERFECT! 🎉'; quickPivotShow.innerText='Game finished!'; renderQuickField(); }
        return;
    }
    quickCurrentRange=quickSubStacks.shift();
    let [left,right]=quickCurrentRange;
    if(left>=right) { processNextQuickRange(); return; }
    quickPivotIndex=right; quickPivot=quickArray[quickPivotIndex];
    quickPivotShow.innerText=quickPivot;
    quickCorrectIndices=[];
    for(let i=left;i<right;i++) if(quickArray[i]<quickPivot) quickCorrectIndices.push(i);
    quickClickedCorrect=[];
    renderQuickField();
    quickInfoSpan.innerHTML=`Partition [${left}..${right}] | Pivot = ${quickPivot}. Click all numbers smaller than ${quickPivot}.`;
}
function onQuickTileClick(idx) {
    if(!quickGameActive||quickWinFlag) return;
    if(!quickCurrentRange) return;
    let [left,right]=quickCurrentRange;
    if(idx<left||idx>right) { quickInfoSpan.innerHTML='⚠️ Click only inside the current partition area!'; return; }
    if(idx===quickPivotIndex) { quickInfoSpan.innerHTML='❌ That is the pivot itself! Click smaller numbers only.'; playWarnSound(); quickLives--; quickLivesSpan.innerText=quickLives; if(quickLives<=0) { quickGameActive=false; playLoseSound(); quickInfoSpan.innerHTML='💀 GAME OVER! Press "New Game".'; renderQuickField(); } return; }
    if(quickCorrectIndices.includes(idx)) {
        if(!quickClickedCorrect.includes(idx)) {
            quickClickedCorrect.push(idx); quickScore++; quickScoreSpan.innerText=quickScore;
            renderQuickField();
            quickInfoSpan.innerHTML=`✅ Correct! ${quickArray[idx]} < ${quickPivot}`; playStartSound();
            if(quickClickedCorrect.length===quickCorrectIndices.length) {
                let leftPart=[], rightPart=[];
                for(let i=left;i<right;i++) {
                    if(quickArray[i]<quickPivot) leftPart.push(quickArray[i]);
                    else rightPart.push(quickArray[i]);
                }
                let newArray=[...quickArray.slice(0,left),...leftPart,quickPivot,...rightPart,...quickArray.slice(right+1)];
                quickArray=newArray;
                let pivotNewPos=left+leftPart.length;
                if(left<=pivotNewPos-1) quickSubStacks.push([left,pivotNewPos-1]);
                if(pivotNewPos+1<=right) quickSubStacks.push([pivotNewPos+1,right]);
                processNextQuickRange();
            }
        } else { quickInfoSpan.innerHTML='⚠️ You already clicked this correct element!'; }
    } else {
        quickInfoSpan.innerHTML=`❌ Wrong! ${quickArray[idx]} is NOT smaller than pivot ${quickPivot}. -1 life`; playWarnSound();
        quickLives--; quickLivesSpan.innerText=quickLives;
        if(quickLives<=0) { quickGameActive=false; playLoseSound(); quickInfoSpan.innerHTML='💀 GAME OVER! Press "New Game".'; renderQuickField(); }
    }
}
document.getElementById('quickNewGame')?.addEventListener('click',startNewQuickGame);
document.getElementById('backFromQuick')?.addEventListener('click',()=>showPanel('menu'));

// initialise both games
resetBubGame(6,false);
startNewQuickGame();
showPanel('menu');
