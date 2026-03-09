// === ÉTIQUETTES DE PLANÈTES ===
const planetLabels = [];

function createPlanetLabels() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '99';
    document.body.appendChild(svg);

    planetsObjects.forEach((mesh) => {
        const label = document.createElement('div');
        label.className = 'planet-label';
        const text = `&#10142; ${mesh.userData.planet.name}`;
        label.innerHTML = `<span class="label-base">${text}</span><span class="label-sun" aria-hidden="true">${text}</span>`;
        document.body.appendChild(label);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#ff99ff');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0');
        line.style.transition = 'opacity 0.2s ease';
        svg.appendChild(line);

        planetLabels.push({ element: label, mesh, line });
    });
}

function updatePlanetLabels() {
    const margin = 8;
    const gap = 18;
    const elHeight = 18;

    planetLabels.forEach(({ element, mesh, line }) => {
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        const vector = worldPos.clone();
        vector.project(camera);

        const isVisible = vector.z < 1 && vector.z > -1;

        if (isVisible) {
            const sx = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const sy = (-(vector.y * 0.5) + 0.5) * window.innerHeight;

            const planetSize = mesh.userData.planet.size / 2;
            const rv = worldPos.clone().add(new THREE.Vector3(planetSize, 0, 0));
            rv.project(camera);
            const radiusPx = Math.abs((rv.x * 0.5 + 0.5) * window.innerWidth - sx);

            const onRight = sx > window.innerWidth * 0.5;
            const side = onRight ? 'left' : 'right';

            if (element.dataset.side !== side) {
                element.dataset.side = side;
                const newText = onRight
                    ? `${mesh.userData.planet.name} &larr;`
                    : `&rarr; ${mesh.userData.planet.name}`;
                element.querySelector('.label-base').innerHTML = newText;
                element.querySelector('.label-sun').innerHTML  = newText;
            }

            const labelTop = Math.max(margin, Math.min(window.innerHeight - elHeight - margin, sy - elHeight / 2));
            const labelCenterY = labelTop + elHeight / 2;

            element.style.top = `${labelTop}px`;
            element.style.opacity = isAnimationPaused ? '1' : '0';

            let lineX1, lineX2;

            if (onRight) {
                const rightEdge = sx - radiusPx - gap;
                element.style.left = `${rightEdge}px`;
                element.style.transform = 'translateX(-100%)';
                lineX1 = sx - radiusPx;
                lineX2 = rightEdge;
            } else {
                const leftEdge = sx + radiusPx + gap;
                element.style.left = `${leftEdge}px`;
                element.style.transform = 'none';
                lineX1 = sx + radiusPx;
                lineX2 = leftEdge;
            }

            line.setAttribute('x1', lineX1);
            line.setAttribute('y1', sy);
            line.setAttribute('x2', lineX2);
            line.setAttribute('y2', labelCenterY);
            line.setAttribute('opacity', isAnimationPaused ? '0.6' : '0');

            // Effet bleu sur la zone couverte par le soleil
            const sunWorld = new THREE.Vector3(0, 0, 0);
            const sunProj  = sunWorld.clone().project(camera);
            const sunScreenX = (sunProj.x * 0.5 + 0.5) * window.innerWidth;
            const sunScreenY = (-(sunProj.y * 0.5) + 0.5) * window.innerHeight;
            const sunEdgeProj = new THREE.Vector3(25, 0, 0).project(camera);
            const sunEdgeX   = (sunEdgeProj.x * 0.5 + 0.5) * window.innerWidth;
            const sunRadiusPx = Math.abs(sunEdgeX - sunScreenX);

            const sunOverlay = element.querySelector('.label-sun');
            const rect = element.getBoundingClientRect();
            const relX = sunScreenX - rect.left;
            const relY = sunScreenY - rect.top;
            sunOverlay.style.clipPath = `circle(${sunRadiusPx}px at ${relX}px ${relY}px)`;
        } else {
            element.style.opacity = '0';
            line.setAttribute('opacity', '0');
        }
    });
}

// === BOUTON PAUSE ===
const animationPauseBtn = document.getElementById('animation-pause-btn');

function togglePause() {
    isAnimationPaused = !isAnimationPaused;
    animationPauseBtn.innerHTML = isAnimationPaused ? '&#9654;' : '&#9208;';
    if (isAnimationPaused) updatePlanetLabels();
}

if (animationPauseBtn) {
    // Click (desktop)
    animationPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePause();
    });
    // Touchend (mobile) — réponse immédiate sans attendre le click synthétique
    animationPauseBtn.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        togglePause();
    }, { passive: false });
}
