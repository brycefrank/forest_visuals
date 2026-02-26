import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TerrainMesh from '../src/environment/TerrainMesh.js';
import FIAPlot from '../src/measurement/FIAPlot.js';

// --- Scene Setup ---
const scene = new THREE.Scene();

const canvasContainer = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.autoClear = false;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvasContainer.appendChild(renderer.domElement);

const resizeRenderer = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', resizeRenderer);
resizeRenderer();

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(30, 50, 40);
sun.castShadow = true;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// --- Environment ---
const terrain = new TerrainMesh(100);
terrain.addTo(scene);

const terrainSurface = terrain.group.children[0];

// --- Interactive Marker & Plot Setup ---
let plotCenterX = 0;
let plotCenterZ = 0;

const markerGeo = new THREE.SphereGeometry(1.0, 16, 16);
const markerMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.2 });
const marker = new THREE.Mesh(markerGeo, markerMat);
marker.castShadow = true;
scene.add(marker);

const SUBPLOT_RADIUS = 7.3152;
const fiaPlot = new FIAPlot({ 
    radius: SUBPLOT_RADIUS, 
    color: '#ffdd00',
    linetype: 'solid'
});
fiaPlot.addTo(scene);

// Store original geometries for raycast displacement
fiaPlot.group.children.forEach(child => {
    if (child.geometry && child.geometry.attributes.position) {
        child.userData.originalVertices = child.geometry.attributes.position.array.slice();
    }
});

const raycaster = new THREE.Raycaster();
const downDirection = new THREE.Vector3(0, -1, 0);

// --- View Definitions ---
const mainCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
mainCamera.position.set(60, 45, 60);

const mainViewElement = document.getElementById('main-view');
const mainControls = new OrbitControls(mainCamera, mainViewElement);
mainControls.enableDamping = true;
mainControls.target.set(0, 0, 0);
mainControls.autoRotate = true;     
mainControls.autoRotateSpeed = 1.0; 

const views = [
    {
        element: mainViewElement,
        camera: mainCamera,
        controls: mainControls
    }
];

// Define subplot configurations
const streamDepth = 2.5; 
const waterPlaneY = -(streamDepth * 0.45);
const distance = 36.576; // 120ft

const subplots = [
    { id: 1, x: 0, z: 0 },
    { id: 2, azimuth: 0 },
    { id: 3, azimuth: 120 },
    { id: 4, azimuth: 240 }
];

// Add Orthoraphic Cameras for the right-hand panel
subplots.forEach((data) => {
    const viewSize = SUBPLOT_RADIUS * 2 * 1.2; 
    const aspect = 1; // Square
    
    const cam = new THREE.OrthographicCamera(
        -viewSize / 2 * aspect, 
        viewSize / 2 * aspect, 
        viewSize / 2, 
        -viewSize / 2, 
        0.1, 
        100
    );
    cam.position.set(0, 30, 0);
    cam.up.set(0, 0, -1); 
    cam.lookAt(0, 0, 0);
    
    views.push({
        element: document.getElementById(`view-subplot-${data.id}`),
        camera: cam,
        controls: null // Static camera for these
    });
});

// --- Dynamic Plot Update Function ---
function updatePlotPositionsAndTable() {
    scene.updateMatrixWorld(true);

    // 1. Position Marker onto surface
    raycaster.set(new THREE.Vector3(plotCenterX, 50, plotCenterZ), downDirection);
    let inters = raycaster.intersectObject(terrainSurface);
    if(inters.length > 0) {
        marker.position.set(plotCenterX, inters[0].point.y + 0.8, plotCenterZ); // Sit slighty into ground
    }

    // 2. Adjust Group Offset
    fiaPlot.group.position.set(plotCenterX, 0, plotCenterZ);
    fiaPlot.group.updateMatrixWorld(true);

    // 3. Project Vectors Over Terrain
    fiaPlot.group.children.forEach(circleLine => {
        if (circleLine.geometry && circleLine.geometry.attributes.position && circleLine.userData.originalVertices) {
            const positions = circleLine.geometry.attributes.position;
            const orig = circleLine.userData.originalVertices;

            for (let i = 0; i < positions.count; i++) {
                const localX = orig[i * 3];
                const localZ = orig[i * 3 + 2];
                
                // Write back local positions for accurate scaling bounds relative to the parent position
                positions.setX(i, localX);
                positions.setZ(i, localZ);

                // World position relative offset calculation
                const worldX = localX + circleLine.position.x + plotCenterX;
                const worldZ = localZ + circleLine.position.z + plotCenterZ;

                raycaster.set(new THREE.Vector3(worldX, 50, worldZ), downDirection);
                const intersects = raycaster.intersectObject(terrainSurface);

                // Assign the correctly dropped terrain Y!
                if (intersects.length > 0) {
                    positions.setY(i, intersects[0].point.y + 0.15);
                } else {
                    positions.setY(i, 0.15);
                }
            }
            positions.needsUpdate = true;
        }
    });

    // 4. Update Cameras and Condition Status
    const tbody = document.querySelector('#condition-table tbody');
    let rows = tbody.querySelectorAll('tr');
    let needsCreation = rows.length === 0;

    subplots.forEach((subplot, idx) => {
        let px = 0, pz = 0;
        if (subplot.azimuth !== undefined) {
            const angle = (subplot.azimuth * Math.PI) / 180;
            px = Math.sin(angle) * distance;
            pz = -Math.cos(angle) * distance;
        } else {
            px = subplot.x;
            pz = subplot.z;
        }
        
        let worldPx = px + plotCenterX;
        let worldPz = pz + plotCenterZ;

        // Sync Ortho view
        const camView = views.find(v => v.element.id === `view-subplot-${subplot.id}`);
        if(camView && camView.camera) {
            camView.camera.position.set(worldPx, 30, worldPz);
            camView.camera.lookAt(worldPx, 0, worldPz);
            camView.camera.updateProjectionMatrix();
        }

        // Sampling
        const samples = 400; // Optimal speed/smoothness ratio during drag
        let waterHits = 0, greenHits = 0;

        for (let i = 0; i < samples; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * SUBPLOT_RADIUS;
            const sx = worldPx + Math.cos(angle) * r;
            const sz = worldPz + Math.sin(angle) * r;

            raycaster.set(new THREE.Vector3(sx, 50, sz), downDirection);
            const intersects = raycaster.intersectObject(terrainSurface);

            if (intersects.length > 0) {
                if (intersects[0].point.y < waterPlaneY) waterHits++;
                else greenHits++;
            } else greenHits++; 
        }

        const totalHits = waterHits + greenHits;
        const waterProp = totalHits > 0 ? (waterHits / totalHits) * 100 : 0;
        const greenProp = totalHits > 0 ? (greenHits / totalHits) * 100 : 0;

        let tr;
        if (needsCreation) {
            tr = document.createElement('tr');
            tbody.appendChild(tr);
        } else {
            tr = rows[idx];
        }

        tr.innerHTML = `
            <td>${subplot.id}</td>
            <td style="color: #4CAF50; font-weight: 500;">${greenProp.toFixed(1)}%</td>
            <td style="color: #2196F3; font-weight: 500;">${waterProp.toFixed(1)}%</td>
        `;
    });
}

// Initial update to run map logic
updatePlotPositionsAndTable();

// --- Interactivity ---
let isDragging = false;
mainViewElement.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // Only process left click

    const rect = mainViewElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(x, y), mainCamera);
    
    // Test bounding box first for faster checks
    const intersects = raycaster.intersectObject(marker);

    if (intersects.length > 0) {
        isDragging = true;
        mainControls.enabled = false; 
        mainControls.autoRotate = false; // Stop auto-spinning instantly 
        document.body.style.cursor = 'grabbing';
    }
});

window.addEventListener('pointermove', (e) => {
    const rect = mainViewElement.getBoundingClientRect();

    if (!isDragging) {
        // Just hover styling
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
            document.body.style.cursor = 'default';
            return;
        }

        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(new THREE.Vector2(x, y), mainCamera);
        const intersects = raycaster.intersectObject(marker);
        
        if (intersects.length > 0) document.body.style.cursor = 'grab';
        else document.body.style.cursor = 'default';
        return;
    }

    // Is dragging! Calculate relative screen point logic over mesh
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(x, y), mainCamera);
    
    const intersects = raycaster.intersectObject(terrainSurface);
    if (intersects.length > 0) {
        plotCenterX = intersects[0].point.x;
        plotCenterZ = intersects[0].point.z;
        
        // Clamp to keep it largely contained on the terrain
        plotCenterX = Math.max(-48, Math.min(48, plotCenterX));
        plotCenterZ = Math.max(-48, Math.min(48, plotCenterZ));

        updatePlotPositionsAndTable();
    }
});

window.addEventListener('pointerup', () => {
    if (isDragging) {
        isDragging = false;
        mainControls.enabled = true;
        document.body.style.cursor = 'default';
    }
});


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    if (mainControls) mainControls.update();

    renderViews();
}

function renderViews() {
   // Top-level clear: Make the rest of the canvas completely transparent
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0); // 0 alpha = transparent!
    renderer.clear();

    renderer.setScissorTest(true);

    // Render each view in its designated screen area
    views.forEach(view => {
        const rect = view.element.getBoundingClientRect();
        
        if (rect.bottom < 0 || rect.top > window.innerHeight ||
            rect.right < 0 || rect.left > window.innerWidth ||
            rect.width === 0 || rect.height === 0) {
            return;
        }

        const width = rect.right - rect.left;
        const height = rect.bottom - rect.top;
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        renderer.setClearColor(0xeef2f3, 1);
        renderer.clear();

        if (view.camera.isPerspectiveCamera) {
            view.camera.aspect = width / height;
            view.camera.updateProjectionMatrix();
        }

        renderer.render(scene, view.camera);
    });
    
    renderer.setScissorTest(false);
}

animate();
