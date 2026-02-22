import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// --- Dynamic Asset Loading ---
const assetModules = import.meta.glob('./src/**/*.js', { eager: true });
const ASSET_MAP = {};
const CATEGORIES = {};

// Filter out base classes and core infrastructure
const IGNORED_FILES = ['Asset.js', 'Tree.js', 'Conifer.js', 'Deciduous.js', 'Generator.js'];

const ASSET_CATEGORY_MAP = {};

for (const path in assetModules) {
    const fileName = path.split('/').pop().replace('.js', '');
    
    if (IGNORED_FILES.includes(fileName) || path.includes('/core/')) {
        continue;
    }

    const module = assetModules[path];
    if (!module.default) continue;

    const pathParts = path.split('/');
    const rawCategory = pathParts[pathParts.length - 2];
    
    const categoryMapping = {
        'trees': 'Trees',
        'harvesters': 'Machinery',
        'environment': 'Environment',
        'measurement': 'Measurement',
        'ground': 'Ground'
    };
    
    const categoryName = categoryMapping[rawCategory] || (rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1));
    
    ASSET_MAP[fileName] = module.default;
    ASSET_CATEGORY_MAP[fileName] = categoryName;
    
    if (!CATEGORIES[categoryName]) {
        CATEGORIES[categoryName] = [];
    }
    
    CATEGORIES[categoryName].push({
        id: fileName,
        name: fileName.replace(/([A-Z])/g, ' $1').trim()
    });
}

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff'); // White background for the viewer


const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'highp' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; // Sharper shadows than PCFSoft
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- Lights ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// --- Environment Helpers (Viewer Grid) ---
const gridGroup = new THREE.Group();





// Invisible ground to catch shadows
const shadowGeo = new THREE.PlaneGeometry(250, 250);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 });
const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.receiveShadow = true;
gridGroup.add(shadowPlane);

scene.add(gridGroup);

// --- Viewer State ---
let currentAsset = null;

const loadAsset = (assetName) => {
    // Remove previous asset
    if (currentAsset) {
        currentAsset.removeFromParent();
        currentAsset = null;
    }

    // Instantiate new asset
    const AssetClass = ASSET_MAP[assetName];
    if (AssetClass) {
        currentAsset = new AssetClass();
        currentAsset.addTo(scene);

        // Adjust camera and viewer settings based on the asset
        if (assetName === 'TerrainMesh') {
            camera.position.set(40, 25, 40);
            controls.target.set(0, 0, 0);
            gridGroup.visible = false;
        } else if (assetName === 'FIAPlot') {
            camera.position.set(0, 60, 60); // Much higher to see the ~75m spread
            controls.target.set(0, 0, 0);
            gridGroup.visible = true; // Keep grid for FIA plot
        } else {
            camera.position.set(4, 4, 6);
            controls.target.set(0, 1.5, 0);
            gridGroup.visible = true; // Show grid for objects
            
            // Bring asset to center
            currentAsset.setPosition(0, 0, 0);
        }
        controls.update();
    }
};

// --- UI Logic ---
const assetSelect = document.getElementById('assetSelect');

// Populate the menu dynamically
Object.keys(CATEGORIES).sort().forEach(catName => {
    const group = document.createElement('optgroup');
    group.label = catName;
    
    CATEGORIES[catName].sort((a, b) => a.name.localeCompare(b.name)).forEach(asset => {
        const option = document.createElement('option');
        option.value = asset.id;
        option.textContent = asset.name;
        group.appendChild(option);
    });
    
    assetSelect.appendChild(group);
});

// Set default selection
if (ASSET_MAP['DouglasFir']) {
    assetSelect.value = 'DouglasFir';
}

const treeControls = document.getElementById('treeControls');
const plotControls = document.getElementById('plotControls');
const heightSlider = document.getElementById('heightSlider');
const heightValue = document.getElementById('heightValue');
const dbhSlider = document.getElementById('dbhSlider');
const dbhValue = document.getElementById('dbhValue');
const cbhSlider = document.getElementById('cbhSlider');
const cbhValue = document.getElementById('cbhValue');
const cwSlider = document.getElementById('cwSlider');
const cwValue = document.getElementById('cwValue');

const radiusSlider = document.getElementById('radiusSlider');
const radiusValue = document.getElementById('radiusValue');
const linetypeSelect = document.getElementById('linetypeSelect');
const colorPicker = document.getElementById('colorPicker');

assetSelect.addEventListener('change', (e) => {
    const assetId = e.target.value;
    loadAsset(assetId);
    
    const categoryName = ASSET_CATEGORY_MAP[assetId];
    
    // Show/hide controls based on category
    treeControls.style.display = categoryName === 'Trees' ? 'block' : 'none';
    plotControls.style.display = categoryName === 'Measurement' ? 'block' : 'none';

    if (categoryName === 'Trees') {
        // Reset sliders to the tree's current options
        heightSlider.value = (currentAsset.options.height || 2.5).toFixed(1);
        heightValue.innerText = heightSlider.value;
        
        if (currentAsset.options.dbh) {
            dbhSlider.value = currentAsset.options.dbh.toFixed(2);
            dbhValue.innerText = dbhSlider.value;
        }

        if (currentAsset.options.crownBaseHeight !== undefined) {
            cbhSlider.value = currentAsset.options.crownBaseHeight.toFixed(1);
            cbhValue.innerText = cbhSlider.value;
        }

        if (currentAsset.options.crownWidth !== undefined) {
            cwSlider.value = currentAsset.options.crownWidth.toFixed(1);
            cwValue.innerText = cwSlider.value;
        }
    } else if (categoryName === 'Measurement' && currentAsset.options) {
        // Reset sliders to the plot's current options
        if (currentAsset.options.radius) {
            radiusSlider.value = currentAsset.options.radius.toFixed(1);
            radiusValue.innerText = radiusSlider.value;
        }
        if (currentAsset.options.linetype) {
            linetypeSelect.value = currentAsset.options.linetype;
        }
        if (currentAsset.options.color) {
            const colorHex = '#' + new THREE.Color(currentAsset.options.color).getHexString();
            colorPicker.value = colorHex;
        }
    }
});

heightSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    heightValue.innerText = val.toFixed(1);
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.height = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

dbhSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    dbhValue.innerText = val.toFixed(2);
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.dbh = val;
        // Also update trunkRadius which is derived
        currentAsset.options.trunkRadius = val / 2;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

cbhSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    cbhValue.innerText = val.toFixed(1);
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.crownBaseHeight = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

cwSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    cwValue.innerText = val.toFixed(1);
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.crownWidth = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

radiusSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    radiusValue.innerText = val.toFixed(1);
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.radius = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

linetypeSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.linetype = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

colorPicker.addEventListener('input', (e) => {
    const val = e.target.value;
    
    if (currentAsset && currentAsset.options) {
        currentAsset.options.color = val;
        if (typeof currentAsset.init === 'function') {
            currentAsset.init();
        }
    }
});

// --- Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.5, 0);

// Load default asset
loadAsset(assetSelect.value);
// Trigger fake change event to setup initial UI state
assetSelect.dispatchEvent(new Event('change'));

// --- Resize Handler ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
const clock = new THREE.Clock();

const animate = () => {
    requestAnimationFrame(animate);
    
    const time = clock.getElapsedTime();
    const delta = clock.getDelta();
    
    // Update active asset logic (like swaying animations)
    if (currentAsset && typeof currentAsset.update === 'function') {
        currentAsset.update(time, delta);
    }
    
    controls.update();
    renderer.render(scene, camera);
};

animate();
