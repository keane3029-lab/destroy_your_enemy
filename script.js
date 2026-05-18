// Game variables
let stage = 1;
let gold = 0;
let currentDPS = 0;

let maxHP = 100;
let currentHP = 100;

let weaponCounts = { w1: 0, w2: 0, w3: 0 };

const enemyNames = ["Goblin Grunt", "Orc Raider", "Dark Knight", "Shadow Drake", "Corrupted Behemoth"];
const enemyImages = [
    "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=400", // Scarecrow/Monster theme
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400", // Anime villain style
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400", // Dark abstract entity
    "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=400", // Deep fire look
    "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400"  // Cyber devil look
];

// UI Connections
const hpBar = document.getElementById('hp-bar');
const currentHPEl = document.getElementById('current-hp');
const maxHPEl = document.getElementById('max-hp');
const goldEl = document.getElementById('gold-count');
const dpsEl = document.getElementById('dps-count');
const stageEl = document.getElementById('stage-num');
const nameEl = document.getElementById('enemy-name');
const enemyImg = document.getElementById('enemy-img');
const enemyBox = document.getElementById('enemy-box');

// Main Player Click Attack
if (enemyImg) {
    enemyImg.addEventListener('mousedown', (e) => {
        dealDamage(1); // Deals 1 damage per click
        triggerImpactVisuals(e);
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

function triggerImpactVisuals(e) {
    if (!enemyImg || !enemyBox) return;

    // Shake the image box container
    enemyBox.classList.add('shake');
    enemyImg.style.transform = 'scale(0.93)';
    enemyImg.style.filter = 'brightness(1.5) sepia(1) hue-rotate(-50deg)'; // Flashes dangerous red tint

    setTimeout(() => {
        enemyBox.classList.remove('shake');
        enemyImg.style.transform = 'scale(1)';
        enemyImg.style.filter = 'none';
    }, 100);

    // Spawn floating damage hit text
    if (e) {
        const rect = enemyBox.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'damage-pop';
        pop.textContent = `-1`;
        pop.style.left = `${e.clientX - rect.left}px`;
        pop.style.top = `${e.clientY - rect.top}px`;
        enemyBox.appendChild(pop);
        setTimeout(() => pop.remove(), 400);
    }
}

function enemyDefeated() {
    // Reward Gold based on stage difficulty
    const reward = stage * 10;
    gold += reward;

    // Level up system: Advance stage and ramp up enemy health scaling
    stage++;
    maxHP = Math.floor(100 * Math.pow(1.3, stage - 1));
    currentHP = maxHP;

    // Cycle enemy names/pics or loop them if player passes stage 5
    const enemyIndex = (stage - 1) % enemyNames.length;
    if (nameEl) nameEl.textContent = enemyNames[enemyIndex];
    if (enemyImg) enemyImg.src = enemyImages[enemyIndex];
    if (stageEl) stageEl.textContent = stage;
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

// Universal Global Shop Logic
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

// Game Core Clock Loop (Handles Automated Passive Damage)
setInterval(() => {
    if (currentDPS > 0) {
        dealDamage(currentDPS);
    }
}, 1000);

// Run baseline evaluations
updateUI();