// Game variables
let stage = 1;
let gold = 0;
let currentDPS = 0;
let maxHP = 100;
let currentHP = 100;
let weaponCounts = { w1: 0, w2: 0, w3: 0 };
const defaultEnemyNames = ["Poly Grunt", "Cyber Sentinel", "Voxel Core", "Mesh Titan", "Null Overlord"];

// UI Elements
const hpBar = document.getElementById('hp-bar');
const currentHPEl = document.getElementById('current-hp');
const maxHPEl = document.getElementById('max-hp');
const goldEl = document.getElementById('gold-count');
const dpsEl = document.getElementById('dps-count');
const stageEl = document.getElementById('stage-num');
const nameEl = document.getElementById('enemy-name');
const enemyNameInput = document.getElementById('enemy-name-input');
const container = document.getElementById('canvas3d-container');

// Sound Variable
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// --- THREE.JS REAL 3D ENGINE INSTANTIATION ---
let scene, camera, renderer, characterGroup;
let isHitAnimation = false;
let hitTimer = 0;

function init3D() {
    // 1. Create Scene & View Angle Depth
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 250 / 320, 0.1, 1000);
    camera.position.z = 6.5;
    camera.position.y = 0.5;

    // 2. Setup WebGL Renderer Attached to DOM Container
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(250, 320);
    container.appendChild(renderer.domElement);

    // 3. Add Custom Neon Lighting Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const redLight = new THREE.PointLight(0xff3366, 1.5, 50);
    redLight.position.set(5, 5, 5);
    scene.add(redLight);

    const cyberLight = new THREE.PointLight(0x00e5ff, 1.2, 50);
    cyberLight.position.set(-5, -2, 5);
    scene.add(cyberLight);

    // 4. GENERATE FULL 3D MATHEMATICAL LOW-POLY MANNEQUIN
    characterGroup = new THREE.Group();

    // Matte White Low-Poly Material Config
    const modelMaterial = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.4,
        metalness: 0.1,
        flatShading: true // Gives it that raw faceted low-poly game look!
    });

    // Head (Sphere mesh)
    const headGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const head = new THREE.Mesh(headGeo, modelMaterial);
    head.position.y = 1.3;
    characterGroup.add(head);

    // Neck (Cylinder)
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.15, 6);
    const neck = new THREE.Mesh(neckGeo, modelMaterial);
    neck.position.y = 0.98;
    characterGroup.add(neck);

    // Torso/Chest (Cylinder)
    const torsoGeo = new THREE.CylinderGeometry(0.45, 0.3, 1.0, 7);
    const torso = new THREE.Mesh(torsoGeo, modelMaterial);
    torso.position.y = 0.4;
    characterGroup.add(torso);

    // Left Arm (Capsule structure)
    const leftArmGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 5);
    const leftArm = new THREE.Mesh(leftArmGeo, modelMaterial);
    leftArm.position.set(-0.65, 0.4, 0);
    leftArm.rotation.z = 0.15;
    characterGroup.add(leftArm);

    // Right Arm
    const rightArmGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 5);
    const rightArm = new THREE.Mesh(rightArmGeo, modelMaterial);
    rightArm.position.set(0.65, 0.4, 0);
    rightArm.rotation.z = -0.15;
    characterGroup.add(rightArm);

    // Left Leg
    const leftLegGeo = new THREE.CylinderGeometry(0.15, 0.11, 1.0, 6);
    const leftLeg = new THREE.Mesh(leftLegGeo, modelMaterial);
    leftLeg.position.set(-0.24, -0.55, 0);
    characterGroup.add(leftLeg);

    // Right Leg
    const rightLegGeo = new THREE.CylinderGeometry(0.15, 0.11, 1.0, 6);
    const rightLeg = new THREE.Mesh(rightLegGeo, modelMaterial);
    rightLeg.position.set(0.24, -0.55, 0);
    characterGroup.add(rightLeg);

    // Scale group adjust and add directly inside core world matrix
    characterGroup.position.y = -0.3;
    scene.add(characterGroup);

    // Begin Infinite Render Loop Frame Pipeline
    animate();
}

// 3D Frame Loop Pipeline Handles Rotations and Hit Physics Calculations
function animate() {
    requestAnimationFrame(animate);

    if (characterGroup) {
        if (!isHitAnimation) {
            // Idle state: Slowly float and track spin rotations automatically
            characterGroup.rotation.y += 0.015;
            characterGroup.position.y = -0.3 + Math.sin(Date.now() * 0.002) * 0.04;
            characterGroup.scale.set(1.4, 1.4, 1.4);
        } else {
            // Processing heavy backward recoil animation frame sequence
            hitTimer += 0.2;
            if (hitTimer >= Math.PI) {
                isHitAnimation = false;
                hitTimer = 0;
            } else {
                // Distort rotation angles dynamically relative to shockwave curves
                characterGroup.scale.set(1.15, 1.15, 1.15);
                characterGroup.rotation.x = -Math.sin(hitTimer) * 0.6;
            }
        }
    }

    renderer.render(scene, camera);
}

// Click Trigger Connected directly to Raycasting Viewport DOM Canvas Area
if (container) {
    container.addEventListener('mousedown', (e) => {
        dealDamage(1);
        
        // Trigger 3D physics flash/recoil properties
        isHitAnimation = true;
        hitTimer = 0;

        // Sound Engine Link
        playHitNoise();

        // Project HTML standard floating points indicators above container space
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
        osc.frequency.setValueAtTime(140 + Math.random() * 60, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch(err){}
}

function enemyDefeated() {
    gold += stage * 10;
    stage++;
    maxHP = Math.floor(100 * Math.pow(1.3, stage - 1));
    currentHP = maxHP;

    if (stageEl) stageEl.textContent = stage;
    const index = (stage - 1) % defaultEnemyNames.length;
    
    // Change character color profile randomly to simulate structural level mutation variations!
    if (characterGroup) {
        const randomHexColors = [0xeeeeee, 0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff];
        characterGroup.children.forEach(mesh => {
            if (mesh.material) mesh.material.color.setHex(randomHexColors[index % randomHexColors.length]);
        });
    }

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

// Passive Loop Damage
setInterval(() => {
    if (currentDPS > 0) dealDamage(currentDPS);
}, 1000);

// Initialize WebGL Application Context Engine
init3D();
updateUI();
