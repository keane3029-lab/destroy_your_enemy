// Internal Engine Scopes
let stage = 1;
let gold = 0;
let currentDPS = 0;
let maxHP = 100;
let currentHP = 100;

let weaponCounts = { w1: 0, w2: 0, w3: 0 };

// Baseline Stage Progression Array
const defaultEnemyNames = ["Alpha Dummy", "Beta Sentinel", "Gamma Core", "Omega Titan", "Overlord Prime"];
const enemyImages = [
    "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=400",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400",
    "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=400",
    "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400"
];

// Document Bindings
const hpBar = document.getElementById('hp-bar');
const currentHPEl = document.getElementById('current-hp');
const maxHPEl = document.getElementById('max-hp');
const goldEl = document.getElementById('gold-count');
const dpsEl = document.getElementById('dps-count');
const stageEl = document.getElementById('stage-num');
const nameEl = document.getElementById('enemy-name');
const enemyImg = document.getElementById('enemy-img');
const enemyCube = document.getElementById('enemy-cube');
const enemyNameInput = document.getElementById('enemy-name-input');

// Sound Variable
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Custom Input Field Event Watcher
if (enemyNameInput && nameEl) {
    enemyNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val === "") {
            const index = (stage - 1) % defaultEnemyNames.length;
            nameEl.textContent = defaultEnemyNames[index];
        } else {
            nameEl.textContent = val;
        }
    });
}

// Mechanical Clicks
if (enemyCube) {
    enemyCube.addEventListener('mousedown', (e) => {
        dealDamage(1); 
        trigger3DImpact(e);
    });
}

function dealDamage(amount) {
    currentHP -= amount;
    if (currentHP <= 0) {
        currentHP = 0;
        enemyDefeated();
    }
    updateUI();
}

function trigger3DImpact(e) {
    if (!enemyCube) return;

    enemyCube.classList.add('cube-hit');

    // Project floating number metrics inside the scene
    if (e) {
        const rect = enemyCube.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'damage-pop';
        pop.textContent = `-1 HP`;
        pop.style.left = `${e.clientX - rect.left}px`;
        pop.style.top = `${e.clientY - rect.top}px`;
        enemyCube.appendChild(pop);
        setTimeout(() => pop.remove(), 400);
    }

    playHitNoise();

    setTimeout(() => {
        enemyCube.classList.remove('cube-hit');
    }, 100);
}

function playHitNoise() {
    initAudio();
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130 + Math.random() * 40, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(err){}
}

function enemyDefeated() {
    const reward = stage * 10;
    gold += reward;

    stage++;
    maxHP = Math.floor(100 * Math.pow(1.3, stage - 1));
    currentHP = maxHP;

    // Reset or preserve target name context depending on text inputs
    if (stageEl) stageEl.textContent = stage;
    
    const index = (stage - 1) % defaultEnemyNames.length;
    if (enemyImg) enemyImg.src = enemyImages[index];
    
    if (enemyNameInput && enemyNameInput.value.trim() !== "") {
        // Keeps user's typed name intact across runs
        if (nameEl) nameEl.textContent = enemyNameInput.value.trim();
    } else {
        if (nameEl) nameEl.textContent = defaultEnemyNames[index];
    }
}

function updateUI() {
    const hpPercent = (currentHP / maxHP) * 100;
    if (hpBar) hpBar.style.width = `${hpPercent}%`;
    if (currentHPEl) currentHPEl.textContent = currentHP;
    if (maxHPEl) maxHPEl.textContent = maxHP;
    if (goldEl) goldEl.textContent = gold;
    if (dpsEl) dpsEl.textContent = currentDPS;
    
    updateShopButtons();
}

window.buyWeapon = function(dpsValue, baseCost, countId, btnId) {
    const weaponKey = btnId.replace('btn-', '');
    const currentOwned = weaponCounts[weaponKey];
    const computedCost = Math.floor(baseCost * Math.pow(1.2, currentOwned));

    if (gold >= computedCost) {
        gold -= computedCost;
        weaponCounts[weaponKey]++;
        
        const countEl = document.getElementById(countId);
        if (countEl) countEl.textContent = weaponCounts[weaponKey];
        
        calculateTotalDPS();
        updateUI();
    }
}

function calculateTotalDPS() {
    currentDPS = (weaponCounts.w1 * 1) + (weaponCounts.w2 * 8) + (weaponCounts.w3 * 50);
}

function updateShopButtons() {
    const prices = [15, 100, 600];
    const counts = [weaponCounts.w1, weaponCounts.w2, weaponCounts.w3];

    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`btn-w${i}`);
        if (btn) {
            const currentCost = Math.floor(prices[i-1] * Math.pow(1.2, counts[i-1]));
            btn.textContent = `Gold: ${currentCost}`;
            btn.disabled = gold < currentCost;
        }
    }
}

// Processing Loops
setInterval(() => {
    if (currentDPS > 0) {
        dealDamage(currentDPS);
    }
}, 1000);

updateUI();
