import * as THREE from 'three';
import Asset from '../core/Asset.js';

/**
 * Terrain Mesh - Procedural ground for the forest.
 */
export default class TerrainMesh extends Asset {
    constructor(size = 40, color = '#3d5a2d') {
        super();
        this.size = size;
        this.color = color;
        this.init();
    }

    init() {
        const geo = new THREE.PlaneGeometry(this.size, this.size, 32, 32);
        
        // Add some very subtle noise to the terrain vertices
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            // Simple wavy displacement
            const z = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.2;
            pos.setZ(i, z);
        }
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.9,
            metalness: 0.0
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        
        this.group.add(mesh);
    }
}
