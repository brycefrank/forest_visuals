import * as THREE from 'three';
import Deciduous from './Deciduous.js';

export default class WhiteOak extends Deciduous {
    constructor(options = {}) {
        super({
            height: options.height || 2.5,
            dbh: options.dbh || 0.6,
            crownBaseHeight: options.crownBaseHeight !== undefined ? options.crownBaseHeight : 1.2,
            ...options
        });
        
        this.init();
    }

    init() {
        while(this.group.children.length > 0) { 
            this.group.remove(this.group.children[0]); 
        }

        const trunkHeight = this.options.height;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(this.options.trunkRadius * 0.8, this.options.trunkRadius, trunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: '#6d4c41' })
        );
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.group.add(trunk);

        const crownHeight = Math.max(0.1, trunkHeight - this.options.crownBaseHeight);
        
        const foliage = new THREE.Mesh(
            // Approximate radius based on how much crown height is available
            new THREE.SphereGeometry(crownHeight * 0.6, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: '#2e7d32',
                roughness: 0.8 
            })
        );
        
        // Place the foliage right above the crown base height
        foliage.position.y = this.options.crownBaseHeight + (crownHeight * 0.4);
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        this.group.add(foliage);
        
        this.group.rotation.y = Math.random() * Math.PI * 2;
    }
}
