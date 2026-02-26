import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import FIAPlot from '../src/measurement/FIAPlot.js';
import DouglasFir from '../src/biological/trees/DouglasFir.js';
import Generator from '../src/core/Generator.js';

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(200, 500, 200);
sun.castShadow = true;
sun.shadow.camera.left = -500;
sun.shadow.camera.right = 500;
sun.shadow.camera.top = 500;
sun.shadow.camera.bottom = -500;
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
scene.add(sun);

// --- Ground (for shadows) ---
const planeGeo = new THREE.PlaneGeometry(2000, 2000);
const planeMat = new THREE.ShadowMaterial({ opacity: 0.15 });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// --- Generate 3x3 Grid of Plots ---
const assets = [];

const SUBPLOT_DISTANCE = 36.576; // 120 feet
const SUBPLOT_RADIUS = 7.3152;  // 24 feet
// Total FIA plot area (4 subplots) in acres is ~ 0.1661 (or exactly 43560 / 7238.22)
// Multiplier to convert "trees found on plot" to "trees per acre"
const EXPANSION_FACTOR = 43560 / (4 * Math.PI * (24 * 24));

const gridSpacing = 200; // 200m between plots
const plotData = [];
let plotIdCounter = 1;

for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
        const plotX = col * gridSpacing;
        const plotZ = row * gridSpacing;

        const plotGroup = new THREE.Group();
        plotGroup.position.set(plotX, 0, plotZ);
        scene.add(plotGroup);

        const fiaPlot = new FIAPlot({ 
            radius: SUBPLOT_RADIUS, 
            color: '#000000',
            linetype: 'solid'
        });
        fiaPlot.addTo(plotGroup);

        const subplotCenters = [
            { x: 0, z: 0 },
            { azimuth: 0, d: SUBPLOT_DISTANCE },
            { azimuth: 120, d: SUBPLOT_DISTANCE },
            { azimuth: 240, d: SUBPLOT_DISTANCE }
        ];

        let totalTreesOnPlot = 0;

        subplotCenters.forEach((center) => {
            let cx = 0;
            let cz = 0;

            if (center.azimuth !== undefined) {
                const rad = (center.azimuth * Math.PI) / 180;
                cx = Math.sin(rad) * center.d;
                cz = -Math.cos(rad) * center.d;
            }

            const treeCount = Generator.rangeInt(3, 8); 
            totalTreesOnPlot += treeCount;

            for (let i = 0; i < treeCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.sqrt(Math.random()) * SUBPLOT_RADIUS;
                const tx = cx + Math.cos(angle) * dist;
                const tz = cz + Math.sin(angle) * dist;

                const hOffset = Generator.range(-0.5, 0.5);
                const dimensionJitter = Generator.range(-0.2, 0.2);
                
                const tree = new DouglasFir({
                    height: 16.0 + (hOffset * 4.0),
                    dbh: 0.75 + (dimensionJitter * 0.1),
                    crownBaseHeight: 8.0 + (hOffset * 3.0),
                    crownWidth: 5.0 + (dimensionJitter * 1.5),
                    trunkColor: '#ce623e',
                    crownColor: '#0ea351'
                });
                
                tree.setPosition(tx, 0, tz);
                tree.addTo(plotGroup);
                assets.push(tree);
            }
        });

        plotData.push({
            id: plotIdCounter++,
            x: plotX,
            z: plotZ,
            treeCount: totalTreesOnPlot,
            tpa: totalTreesOnPlot * EXPANSION_FACTOR
        });
    }
}

// Populate the Sidebar Table
const tbody = document.querySelector('#plot-table tbody');
plotData.forEach(data => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><strong>${data.id}</strong></td>
        <td>${data.treeCount}</td>
        <td style="color: #2e7d32; font-weight: 600;">${data.tpa.toFixed(1)}</td>
    `;
    tbody.appendChild(tr);
});

// --- View Definitions ---
const frustumSize = 800;
const mainCamera = new THREE.OrthographicCamera(
    frustumSize / -2, 
    frustumSize / 2, 
    frustumSize / 2, 
    frustumSize / -2, 
    1, 
    2000
);
mainCamera.position.set(0, 800, 0);
mainCamera.lookAt(0, 0, 0);

const mainViewElement = document.getElementById('main-view');
const mainControls = new OrbitControls(mainCamera, mainViewElement);
mainControls.enableDamping = true;
mainControls.enableRotate = false; // 2D map panning style

// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    assets.forEach(asset => {
        if (asset.update) asset.update(time, delta);
    });

    mainControls.update();
    renderViews();

    if (isRecording) {
        // Must capture straight from renderer canvas if we want everything
        capturer.capture(renderer.domElement);
    }
}

function renderViews() {
    // Clear whole screen
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();

    renderer.setScissorTest(true);

    // Main View
    const rect = mainViewElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        const left = rect.left;
        const bottom = renderer.domElement.clientHeight - rect.bottom;
        const width = rect.width;
        const height = rect.height;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);
        
        renderer.setClearColor(0xeef2f3, 1);
        renderer.clear();

        const aspect = width / height;
        mainCamera.left = -frustumSize * aspect / 2;
        mainCamera.right = frustumSize * aspect / 2;
        mainCamera.top = frustumSize / 2;
        mainCamera.bottom = -frustumSize / 2;
        mainCamera.updateProjectionMatrix();

        renderer.render(scene, mainCamera);
    }

    renderer.setScissorTest(false);
}

// --- Capture Setup ---
const capturer = new window.CCapture({
    format: 'gif',
    workersPath: './',
    framerate: 30,
    quality: 10,
    verbose: true
});
let isRecording = false;

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r' && !isRecording) {
        console.log("Recording started...");
        capturer.start();
        isRecording = true;
    } else if (e.key.toLowerCase() === 's' && isRecording) {
        console.log("Recording stopped. Saving...");
        isRecording = false;
        capturer.stop();
        capturer.save();
    }
});

animate();
