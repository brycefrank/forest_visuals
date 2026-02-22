import * as THREE from 'three';
import Conifer from './Conifer.js';
import Generator from '../../core/Generator.js';

/**
 * Douglas Fir - A coniferous evergreen tree.
 * Implements procedural growth rules for a low-poly aesthetic.
 */
export default class DouglasFir extends Conifer {
    constructor(options = {}) {
        super({
            height: options.height !== undefined ? options.height : Generator.range(1.5, 2.5),
            dbh: options.dbh !== undefined ? options.dbh : 0.5,
            crownBaseHeight: options.crownBaseHeight !== undefined ? options.crownBaseHeight : 0.6,
            crownWidth: options.crownWidth !== undefined ? options.crownWidth : 2.0,
            layers: options.layers || 3,
            trunkColor: options.trunkColor || '#4a3728',
            crownColor: options.crownColor || options.color || new THREE.Color().setHSL(0.3 + Math.random() * 0.05, 0.4, 0.25 + Math.random() * 0.1),
            ...options
        });

        this.init();
    }

    init() {
        // We will recreate the group if init is called again
        while(this.group.children.length > 0) { 
            this.group.remove(this.group.children[0]); 
        }

        const trunkHeight = this.options.height;
        // The space available for foliage is total height minus crown base height
        const crownHeight = Math.max(0.1, trunkHeight - this.options.crownBaseHeight);

        // Trunk
        // Stop the trunk midway through the crown so it doesn't poke through the top
        const visibleTrunkHeight = this.options.crownBaseHeight + (crownHeight * 0.5);
        const trunkGeo = new THREE.CylinderGeometry(this.options.trunkRadius * 0.4, this.options.trunkRadius, visibleTrunkHeight, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: this.options.trunkColor });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = visibleTrunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        this.group.add(trunk);

        // Foliage (Cones)
        const leafMat = new THREE.MeshStandardMaterial({ 
            color: this.options.crownColor,
            roughness: 0.8
        });

        for (let i = 0; i < this.options.layers; i++) {
            const layerScale = 1 - (i * (1 / this.options.layers)); 
            
            // Cones get thinner as they go up
            const coneRadius = (this.options.crownWidth / 2) * layerScale;
            // The height of a single layer cone
            const coneHeight = crownHeight * 0.7;
            
            const leafGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 8);
            const leaves = new THREE.Mesh(leafGeo, leafMat);
            
            // Space the layers linearly between crown base and the top of the tree
            const stepY = i === 0 ? 0 : (crownHeight - (coneHeight/2)) / Math.max(1, this.options.layers - 1);
            leaves.position.y = this.options.crownBaseHeight + (coneHeight / 2) + (i * stepY);
            
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            this.group.add(leaves);
        }

        // Random rotation for variety
        this.group.rotation.y = Math.random() * Math.PI * 2;
    }
}
