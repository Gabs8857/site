// === RAYCASTER & HELPERS ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let suppressNextClick = false;
let hoveredPlanet = null;

// Panel d'info survol
const infoPanel = document.createElement('div');
infoPanel.className = 'planet-info';
document.body.appendChild(infoPanel);

function getPlanetIntersection(clientX, clientY) {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    mouse.x = (clientX / w) * 2 - 1;
    mouse.y = -(clientY / h) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planetsObjects);
    return intersects.length > 0 ? intersects[0].object : null;
}

function getSpaceIntersection(clientX, clientY) {
    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    mouse.x = (clientX / w) * 2 - 1;
    mouse.y = -(clientY / h) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([sun, ...planetsObjects], true);
    return intersects.length > 0 ? intersects[0].object : null;
}

function isObjectInSunHierarchy(object) {
    let current = object;
    while (current) {
        if (current === sun) return true;
        current = current.parent;
    }
    return false;
}

function getPlanetFromObject(object) {
    let current = object;
    while (current) {
        if (planetsObjects.includes(current)) return current;
        current = current.parent;
    }
    return null;
}

function updateHoverFromPointer(clientX, clientY) {
    const planet = getPlanetIntersection(clientX, clientY);

    planetsObjects.forEach(mesh => {
        if (mesh.userData.isHovered) {
            mesh.userData.isHovered = false;
            mesh.scale.set(1, 1, 1);
        }
    });
    infoPanel.classList.remove('active');

    if (planet) {
        planet.userData.isHovered = true;
        hoveredPlanet = planet;
        infoPanel.innerHTML = `
            <h3>${planet.userData.planet.name}</h3>
            <p>${planet.userData.planet.skills}</p>
        `;
        infoPanel.classList.add('active');
    }
}

// === ÉVÉNEMENTS SOURIS ===
window.addEventListener('click', (event) => {
    if (suppressNextClick) {
        suppressNextClick = false;
        return;
    }

    const detailView = document.getElementById('detail-view');
    if (detailView && detailView.classList.contains('active')) return;

    const hitObject = getSpaceIntersection(event.clientX, event.clientY);
    if (hitObject && isObjectInSunHierarchy(hitObject)) {
        openCv();
        return;
    }

    const hitPlanet = getPlanetFromObject(hitObject);
    if (!isDragging && hitPlanet) {
        showDetailView(hitPlanet);
    }
});

// === DRAG & HOVER SOURIS ===
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener('mousedown', () => { isDragging = true; });

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        scene.rotation.y += deltaX * 0.005;
        scene.rotation.x += deltaY * 0.005;
    } else {
        updateHoverFromPointer(e.clientX, e.clientY);
    }
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => { isDragging = false; });

// === ZOOM MOLETTE ===
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    camera.position.z += e.deltaY * 0.15;
    camera.position.z = Math.max(80, Math.min(600, camera.position.z));
}, { passive: false });

// === CONTRÔLES TACTILES ===
const TOUCH_MOVE_THRESHOLD = 8; // px — déplacement min pour considérer un drag

const touchState = {
    isDragging: false,
    hasMoved: false,
    lastX: 0,
    lastY: 0,
    startX: 0,
    startY: 0,
    isPinching: false,
    lastDistance: 0,
};

function getTouchDistance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

window.addEventListener('touchstart', (event) => {
    // Ne pas interférer avec le bouton pause (preventDefault tuerait son click)
    if (event.target.closest('#animation-pause-btn')) return;

    const detailView = document.getElementById('detail-view');
    if (detailView && detailView.classList.contains('active')) return;

    if (event.touches.length === 1) {
        const t = event.touches[0];
        touchState.isDragging = true;
        touchState.hasMoved   = false;
        touchState.isPinching = false;
        touchState.lastX  = t.clientX;
        touchState.lastY  = t.clientY;
        touchState.startX = t.clientX;
        touchState.startY = t.clientY;
    } else if (event.touches.length === 2) {
        touchState.isPinching   = true;
        touchState.isDragging   = false;
        touchState.lastDistance = getTouchDistance(event.touches[0], event.touches[1]);
    }
    event.preventDefault();
}, { passive: false });

window.addEventListener('touchmove', (event) => {
    const detailView = document.getElementById('detail-view');
    if (detailView && detailView.classList.contains('active')) return;

    /* Pinch-to-zoom (2 doigts) */
    if (touchState.isPinching && event.touches.length === 2) {
        const dist  = getTouchDistance(event.touches[0], event.touches[1]);
        const delta = dist - touchState.lastDistance;
        camera.position.z -= delta * 0.25;
        camera.position.z   = Math.max(80, Math.min(600, camera.position.z));
        touchState.lastDistance = dist;
        event.preventDefault();
        return;
    }

    /* Rotation (1 doigt) */
    if (touchState.isDragging && event.touches.length === 1) {
        const t      = event.touches[0];
        const deltaX = t.clientX - touchState.lastX;
        const deltaY = t.clientY - touchState.lastY;

        scene.rotation.y += deltaX * 0.005;
        scene.rotation.x += deltaY * 0.005;

        touchState.lastX = t.clientX;
        touchState.lastY = t.clientY;

        /* Marque le mouvement uniquement au-delà du seuil */
        if (!touchState.hasMoved) {
            const dx = t.clientX - touchState.startX;
            const dy = t.clientY - touchState.startY;
            if (Math.hypot(dx, dy) > TOUCH_MOVE_THRESHOLD) touchState.hasMoved = true;
        }

        event.preventDefault();
    }
}, { passive: false });

window.addEventListener('touchend', (event) => {
    // Laisser le bouton pause gérer son propre toucher
    if (event.target.closest('#animation-pause-btn')) return;

    const detailView = document.getElementById('detail-view');
    if (detailView && detailView.classList.contains('active')) {
        touchState.isDragging = false;
        touchState.isPinching = false;
        return;
    }

    /* Tap sans glissement → interaction */
    if (!touchState.isPinching && !touchState.hasMoved && event.changedTouches.length > 0) {
        const t         = event.changedTouches[0];
        const hitObject = getSpaceIntersection(t.clientX, t.clientY);

        if (hitObject && isObjectInSunHierarchy(hitObject)) {
            suppressNextClick = true;
            openCv();
        } else {
            const planet = getPlanetFromObject(hitObject);
            if (planet) {
                suppressNextClick = true;
                updateHoverFromPointer(t.clientX, t.clientY);
                showDetailView(planet);
            }
        }
    }

    touchState.isDragging = false;
    touchState.isPinching = false;
    touchState.hasMoved   = false;
}, { passive: false });

window.addEventListener('touchcancel', () => {
    touchState.isDragging = false;
    touchState.isPinching = false;
    touchState.hasMoved   = false;
});

// === REDIMENSIONNEMENT ===
function onResize() {
    const w = renderer.domElement.clientWidth  || window.innerWidth;
    const h = renderer.domElement.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    updateControlsText();

    const detailCanvas = document.getElementById('detail-canvas');
    if (detailCanvas && detailRenderer && detailCamera) {
        const dw = detailCanvas.clientWidth;
        const dh = detailCanvas.clientHeight;
        if (dw > 0 && dh > 0) {
            detailCamera.aspect = dw / dh;
            detailCamera.updateProjectionMatrix();
            detailRenderer.setSize(dw, dh, false);
            detailDefaultCameraZ = calculateAdaptiveZoom();
            detailTargetCameraZ = detailDefaultCameraZ;
        }
    }
}

window.addEventListener('resize', () => {
    // Attendre que le viewport se stabilise (changement d'orientation mobile)
    setTimeout(onResize, 100);
});
