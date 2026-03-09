function getFibonacciSphereDirection(index, total) {
    const i = index + 0.5;
    const phi = Math.acos(1 - (2 * i) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(phi)
    ).normalize();
}

function pseudoNoise3(vector) {
    const value = Math.sin(vector.x * 4.73 + vector.y * 7.11 + vector.z * 5.37) *
        Math.cos(vector.x * 3.17 - vector.y * 2.29 + vector.z * 6.41);
    return (value + 1) * 0.5;
}

function buildContinentPatchGeometry(sourceGeometry, centerDir, angularRadius, planetRadius, options = {}) {
    const threshold = Math.cos(angularRadius);
    const thresholdOffset = options.thresholdOffset ?? -0.07;
    const thresholdNoise = options.thresholdNoise ?? 0.1;
    const elevationBase = options.elevationBase ?? 0.18;
    const elevationAmount = options.elevationAmount ?? 1.05;
    const elevationPower = options.elevationPower ?? 0.75;
    const surfaceOffset = options.surfaceOffset ?? 0.6;

    const positions = sourceGeometry.attributes.position.array;
    const patchPositions = [];

    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const centroid = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 9) {
        v1.set(positions[i], positions[i + 1], positions[i + 2]);
        v2.set(positions[i + 3], positions[i + 4], positions[i + 5]);
        v3.set(positions[i + 6], positions[i + 7], positions[i + 8]);

        centroid.copy(v1).add(v2).add(v3).multiplyScalar(1 / 3).normalize();
        const boundaryNoise = pseudoNoise3(centroid.clone().multiplyScalar(2.9).add(centerDir.clone().multiplyScalar(4.2)));
        const noisyThreshold = threshold + thresholdOffset + boundaryNoise * thresholdNoise;

        if (centroid.dot(centerDir) >= noisyThreshold) {
            const displacedVertices = [v1, v2, v3].map((vertex) => {
                const dir = vertex.clone().normalize();
                const centerInfluence = THREE.MathUtils.clamp((dir.dot(centerDir) - threshold) / Math.max(0.0001, 1 - threshold), 0, 1);
                const reliefNoise = pseudoNoise3(dir.clone().multiplyScalar(3.5).add(centerDir.clone().multiplyScalar(1.7)));
                const edgeFade = Math.pow(centerInfluence, elevationPower);
                const elevation = (elevationBase + reliefNoise * elevationAmount) * edgeFade;
                return dir.multiplyScalar(planetRadius + surfaceOffset + elevation);
            });

            patchPositions.push(
                displacedVertices[0].x, displacedVertices[0].y, displacedVertices[0].z,
                displacedVertices[1].x, displacedVertices[1].y, displacedVertices[1].z,
                displacedVertices[2].x, displacedVertices[2].y, displacedVertices[2].z
            );
        }
    }

    if (patchPositions.length === 0) {
        return null;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(patchPositions, 3));
    geometry.computeVertexNormals();
    return geometry;
}

function addPolygonReliefMeshes(target, centerDir, continent, planetRadius, color, scale = 1, targetList = null) {
    // Un rocher par skill du continent (parsé depuis continent.detail), max 3
    const skills = (continent.detail || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    const count = skills.length > 0 ? skills.length : 3;

    const up = Math.abs(centerDir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const tangentA = new THREE.Vector3().crossVectors(centerDir, up).normalize();
    const tangentB = new THREE.Vector3().crossVectors(centerDir, tangentA).normalize();

    for (let i = 0; i < count; i++) {
        const angle = ((i / count) * Math.PI * 2) + (Math.random() * 0.8);
        const spread = (0.09 + Math.random() * 0.16) * scale;
        const direction = centerDir.clone()
            .add(tangentA.clone().multiplyScalar(Math.cos(angle) * spread))
            .add(tangentB.clone().multiplyScalar(Math.sin(angle) * spread))
            .normalize();

        const polyRadius = planetRadius * (0.04 + Math.random() * 0.035) * scale;
        const polyGeometry = new THREE.IcosahedronGeometry(polyRadius, 0);
        const polyMaterial = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.38,
            roughness: 0.68,
            metalness: 0.08,
            transparent: true,
            opacity: 0.98
        });

        const polyMesh = new THREE.Mesh(polyGeometry, polyMaterial);
        polyMesh.position.copy(direction.multiplyScalar(planetRadius + 0.9 + Math.random() * 0.7 * scale));
        polyMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        polyMesh.userData = {
            isContinent: true,
            isSkillRock: skills.length > 0,
            skillName: skills[i] || null,
            continent,
            originalOpacity: 0.98,
            originalEmissiveIntensity: 0.38
        };

        target.add(polyMesh);

        if (targetList) {
            targetList.push(polyMesh);
        }
    }
}
