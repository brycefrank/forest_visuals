import * as THREE from 'three';
import Asset from '../core/Asset.js';

/**
 * Terrain Mesh - Procedural ground for the forest.
 */
export default class TerrainMesh extends Asset {
    constructor(size = 100, color = '#83bd62') {
        super();
        this.size = size;
        this.color = color; // Lightened grass color
        this.init();
    }

    init() {
        // Clear previous children
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        // Increase subdivisions for smoother stream curves
        const geo = new THREE.PlaneGeometry(this.size, this.size, 128, 128);
        
        const pos = geo.attributes.position;
        const streamWidth = 6.0;
        const streamDepth = 2.5;

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            
            // Add subtle noise to the terrain vertices
            let z = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.3 + Math.sin(x * 0.05) * 0.5;

            // Calculate meandering stream path down the middle
            const streamX = Math.sin(y * 0.1) * 8 + Math.cos(y * 0.03) * 12;
            const dist = Math.abs(x - streamX);

            // Cut the riverbed into the mesh
            if (dist < streamWidth) {
                const normalizedDist = dist / streamWidth;
                // Smooth bell-like curve for the riverbed depth
                const depthProfile = Math.cos(normalizedDist * Math.PI / 2);
                z -= depthProfile * depthProfile * streamDepth;
            }

            pos.setZ(i, z);
        }
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.8,
            metalness: 0.0,
            flatShading: true // Gives a nice low-poly but smooth look
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        
        this.group.add(mesh);

        // Add a water plane that sits underneath the terrain but above the riverbed floor
        const waterGeo = new THREE.PlaneGeometry(this.size, this.size);
        const waterMat = new THREE.MeshStandardMaterial({
            color: '#3B7A9E', // Water color
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.rotation.x = -Math.PI / 2;
        // Position exactly in the middle of the stream depth
        waterMesh.position.y = -(streamDepth * 0.45);
        waterMesh.receiveShadow = true;

        this.group.add(waterMesh);
    }
}
