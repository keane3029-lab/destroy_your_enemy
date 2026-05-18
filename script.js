// Game variables
let stage = 1;
let gold = 0;
let currentDPS = 0;
let maxHP = 100;
let currentHP = 100;
let weaponCounts = { w1: 0, w2: 0, w3: 0 };
const defaultEnemyNames = ["Poly Dummy", "Cyber Sentinel", "Voxel Raider", "Mesh Titan", "Null Overlord"];

// DOM Connections
const hpBar = document.getElementById('hp-bar');
const currentHPEl = document.getElementById('current-hp');
const maxHPEl = document.getElementById('max-hp');
const goldEl = document.getElementById('gold-count');
const dpsEl = document.getElementById('dps-count');
const stageEl = document.getElementById('stage-num');
const nameEl = document.getElementById('enemy-name');
const enemyNameInput = document.getElementById('enemy-name-input');
const container = document.getElementById('canvas3d-container');

// Audio Engine Context Holder
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// --- THREE.JS GRAPHICS CONTROLLER ENGINE ---
let scene, camera, renderer, enemyMesh;
let isHitAnimation = false;
let hitTimer = 0;

function init3D() {
    if (!container) return;

    // 1. Create Scene & View Angle Depth Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 250 / 320, 0.1, 1000);
    camera.position.z = 4.5;

    // 2. Instantiate Renderer Engine onto DOM Target Container
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(250, 320);
    container.appendChild(renderer.domElement);

    // 3. Ambient lighting properties configuration
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // 4. MAP YOUR MANNEQUIN IMAGE TO A SMOOTH RENDER PLANE
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('enemy3d.png', function(texture) {
        // Keeps details crispy and unblurred
        texture.minFilter = THREE.LinearFilter;
        
        // Match a rectangular layout dimension ratio
        const geometry = new THREE.PlaneGeometry(2.0, 3.2);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        
        enemyMesh = new THREE.Mesh(geometry, material);
        scene.add(enemyMesh);
    }, undefined, function(err) {
        console.log("Image load error. Falling back to simple default geometries.");
        // Emergency Fallback shape block if image isn't named right or missing
        const geometry = new THREE.BoxGeometry(1.2, 2.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffb834 });
        enemyMesh = new THREE.Mesh(geometry, material);
        scene.add(enemyMesh);
    });

    // Fire continuous frame processing pipeline
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (enemyMesh) {
        if (!isHitAnimation) {
            // Idle state: Slowly spin back and forth gracefully
            enemyMesh.rotation.y = Math.sin(Date.now() * 0.0015) * 0.4;
            enemyMesh.position.y = Math.sin(Date.now() * 0.003) * 0.05;
            enemyMesh.scale.set(1, 1, 1);
        } else {
            // Recoil hit sequence action physics
            hitTimer += 0.25;
            if (hitTimer >= Math.PI) {
                isHitAnimation = false;
                hitTimer = 0;
            } else {
                // Slam model backward and crunch size scaling down momentarily
                enemyMesh.scale.set(0.85, 0.85, 0.85);
                enemyMesh.rotation.x = -Math.sin(hitTimer) * 0.5;
            }
        }
    }

    renderer.render(scene, camera);
}

// Click Trigger Mapping Directly Over the Viewport Area
if (container) {
    container.addEventListener('mousedown', (e) => {
        dealDamage(1);
        
        // Activate impact reaction flags
        isHitAnimation = true;
        hitTimer = 0;

        playHitNoise();

        // Project HTML damage point pops above target hit site
        const rect = container.getBoundingClientRect();
        const pop = document.createElement('div');
        pop.className = 'damage-pop';
        pop.textContent = `-1 HP`;
        pop.style.left = `${e.clientX - rect.left}px`;
        pop.style.top = `${e.clientY - rect.top}px`;
        container.appendChild(pop);
        setTimeout(() => pop.remove(), 400);
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

function playHitNoise() {
    initAudio();
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 + Math.random() * 60, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } catch(err){}
}

function enemyDefeated() {
    gold += stage * 10;
    stage++;
    maxHP = Math.floor(100 * Math.pow(1.3, stage - 1));
    currentHP = maxHP;

    if (stageEl) stageEl.textContent = stage;
    const index = (stage - 1) % defaultEnemyNames.length;

    if (enemyNameInput && enemyNameInput.value.trim() !== "") {
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

if (enemyNameInput && nameEl) {
    enemyNameInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val === "") {
            nameEl.textContent = defaultEnemyNames[(stage - 1) % defaultEnemyNames.length];
        } else {
            nameEl.textContent = val;
        }
    });
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

// Automatic Passive Weapons Cycle Clock
setInterval(() => {
    if (currentDPS > 0) dealDamage(currentDPS);
}, 1000);

// Initialize App Frame
init3D();
updateUI();
