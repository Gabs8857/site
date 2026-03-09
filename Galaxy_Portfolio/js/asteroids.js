// === CEINTURES D'ASTÉROÏDES ===
// Zones de ceinture exportées pour le clamping des orbites planétaires
const BELT_ZONES = [
    { innerX: 101, outerX: 109, innerZ: 78.8, outerZ: 85.0  },
    { innerX: 137, outerX: 147, innerZ: 106.9, outerZ: 114.7 }
];

function createAsteroidBelt(distance, count, thickness, ellipseRatio = 0.78, speed = 0.00022) {
    const particles = new THREE.BufferGeometry();
    const posArray  = new Float32Array(count * 3);

    const radiusX = distance;
    const radiusZ = distance * ellipseRatio;

    // Données per-astéroïde pour l'animation orbitale individuelle
    const angles   = new Float32Array(count);
    const spreadsX = new Float32Array(count);
    const spreadsZ = new Float32Array(count);
    const ys       = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const spread = (Math.random() - 0.5) * thickness;
        const y      = (Math.random() - 0.5) * thickness * 0.3;

        angles[i]   = angle;
        spreadsX[i] = spread;
        spreadsZ[i] = spread * ellipseRatio;
        ys[i]       = y;

        posArray[i * 3]     = Math.cos(angle) * (radiusX + spread);
        posArray[i * 3 + 1] = y;
        posArray[i * 3 + 2] = Math.sin(angle) * (radiusZ + spread * ellipseRatio);
    }

    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        color: 0xaa66ff,
        size: 0.8,
        transparent: true,
        opacity: 0.6
    });

    const mesh = new THREE.Points(particles, material);
    scene.add(mesh);

    return { mesh, angles, spreadsX, spreadsZ, ys, radiusX, radiusZ, speed };
}

const beltLine1 = createAsteroidBelt(105, 800, 8,   0.78,  0.00022);
const beltLine2 = createAsteroidBelt(142, 600, 10,  0.78, -0.00015);
