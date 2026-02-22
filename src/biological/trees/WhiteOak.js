import * as THREE from 'three';
import Deciduous from './Deciduous.js';

export default class WhiteOak extends Deciduous {
    constructor(options = {}) {
        super({
            height: options.height || 2.5,
            dbh: options.dbh || 0.6,
            crownBaseHeight: options.crownBaseHeight !== undefined ? options.crownBaseHeight : 1.2,
            crownWidth: options.crownWidth !== undefined ? options.crownWidth : 2.0,
            trunkColor: options.trunkColor || '#6d4c41',
            crownColor: options.crownColor || '#2e7d32',
            ...options
        });
        
        this.init();
    }

    init() {
        while(this.group.children.length > 0) { 
            this.group.remove(this.group.children[0]); 
        }

        const trunkHeight = this.options.height;
        const crownHeight = Math.max(0.1, trunkHeight - this.options.crownBaseHeight);

        // Limit trunk height to avoid poking through the top of the spherical crown
        const visibleTrunkHeight = this.options.crownBaseHeight + (crownHeight * 0.4);
        
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(this.options.trunkRadius * 0.6, this.options.trunkRadius, visibleTrunkHeight, 8),
            new THREE.MeshStandardMaterial({ color: this.options.trunkColor })
        );
        trunk.position.y = visibleTrunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.group.add(trunk);
        
        const crownRadius = this.options.crownWidth / 2;
        
        const foliage = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: this.options.crownColor,
                roughness: 0.8 
            })
        );
        
        // Scale to form an ellipsoid matching the specific crown width and height
        foliage.scale.set(crownRadius, crownHeight / 2, crownRadius);

        // Place the foliage so it rests securely on the crown base
        foliage.position.y = this.options.crownBaseHeight + (crownHeight / 2);
        
        foliage.castShadow = true;
        foliage.receiveShadow = true;
        this.group.add(foliage);
        
        this.group.rotation.y = Math.random() * Math.PI * 2;
    }
}
