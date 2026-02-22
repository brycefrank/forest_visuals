import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import FIAPlot from '../src/measurement/FIAPlot.js';
import DouglasFir from '../src/biological/trees/DouglasFir.js';
import WhiteOak from '../src/biological/trees/WhiteOak.js';
import Generator from '../src/core/Generator.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#eef2f3');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 40, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(30, 50, 40);
sun.castShadow = true;
// Wide shadow camera for the whole plot
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// --- Grid ---
const size = 200;
const divisions = 10; // Coarse grid (20m squares)
const gridHelper = new THREE.GridHelper(size, divisions, 0x9ca3af, 0xd1d5db);
scene.add(gridHelper);

// --- FIA Plot ---
const fiaPlot = new FIAPlot({ 
    radius: 7.3152, 
    color: '#000000',
    linetype: 'dashed'
});
fiaPlot.addTo(scene);

// --- Distribute Trees ---
const assets = [];
const SUBPLOT_DISTANCE = 36.576; // 120 feet
const SUBPLOT_RADIUS = 7.3152;  // 24 feet

const subplotCenters = [
    { x: 0, z: 0 },                    // Plot 1: Center
    { azimuth: 0, d: SUBPLOT_DISTANCE },  // Plot 2: North
    { azimuth: 120, d: SUBPLOT_DISTANCE },// Plot 3: SE
    { azimuth: 240, d: SUBPLOT_DISTANCE } // Plot 4: SW
];

subplotCenters.forEach((center, idx) => {
    let cx = 0;
    let cz = 0;

    if (center.azimuth !== undefined) {
        const rad = (center.azimuth * Math.PI) / 180;
        cx = Math.sin(rad) * center.d;
        cz = -Math.cos(rad) * center.d;
    }

    // Add trees to this subplot
    const treeCount = Generator.rangeInt(5, 12);
    for (let i = 0; i < treeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * SUBPLOT_RADIUS;
        const tx = cx + Math.cos(angle) * dist;
        const tz = cz + Math.sin(angle) * dist;

        const isConifer = Generator.chance(0.6);
        const tree = isConifer ? new DouglasFir() : new WhiteOak();
        
        tree.setPosition(tx, 0, tz);
        
        // Randomize size slightly
        const scale = Generator.range(0.7, 1.6);
        tree.setScale(scale);
        
        tree.addTo(scene);
        assets.push(tree);
    }
});

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// --- Animation Loop ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    assets.forEach(asset => {
        if (asset.update) asset.update(time, delta);
    });

    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
