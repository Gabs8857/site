// === SCENE, CAMÉRA, RENDERER ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0015);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

camera.position.z = 200;

// Correction portrait mobile : le viewport peut être incorrect au chargement initial
requestAnimationFrame(() => {
    const w = renderer.domElement.clientWidth  || window.innerWidth;
    const h = renderer.domElement.clientHeight || window.innerHeight;
    if (w !== window.innerWidth || h !== window.innerHeight) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
    }
});

// === TEXTE DE CONTRÔLES ===
const controlsText = document.querySelector('.controls p');

function updateControlsText() {
    if (!controlsText) return;
    if (window.innerWidth <= 768) {
        controlsText.textContent = 'Glisser: Rotation | Pincer: Zoom | Tap: Details';
    } else {
        controlsText.textContent = 'Clic gauche + mouvement: Rotation | Molette: Zoom | Clic: Details';
    }
}

// === LUMIÈRES ===
const ambientLight = new THREE.AmbientLight(0x6600ff, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xff99ff, 2, 500);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
scene.add(sunLight);

// === SOLEIL ===
const sunGeometry = new THREE.IcosahedronGeometry(25, 5);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xff66ff
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 0, 0);
scene.add(sun);

const glowGeometry = new THREE.IcosahedronGeometry(27, 4);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff66ff,
    transparent: true,
    opacity: 0.1
});
const glow = new THREE.Mesh(glowGeometry, glowMaterial);
sun.add(glow);

// === CV ===
function openCv() {
    window.open('https://gabrielmuller.dev/Galaxy_Portfolio/CV_Steam/index.html', '_blank', 'noopener');
}
