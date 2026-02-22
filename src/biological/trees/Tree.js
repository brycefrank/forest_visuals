import * as THREE from 'three';
import Asset from '../../core/Asset.js';

/**
 * Base class for all trees. 
 * Handles common properties like height, trunk radius, and shared behaviors like wind sway.
 */
export default class Tree extends Asset {
    constructor(options = {}) {
        super();
        this.options = {
            height: options.height || 2.5,
            dbh: options.dbh || 0.4,
            crownBaseHeight: options.crownBaseHeight !== undefined ? options.crownBaseHeight : 0.8,
            ...options
        };

        // Derive trunkRadius if not explicitly provided
        if (options.trunkRadius === undefined) {
            this.options.trunkRadius = this.options.dbh / 2;
        }
        
        // Offset for procedural sway animation to make each tree unique
        this.swayOffset = Math.random() * Math.PI * 2;
    }

    /**
     * Shared sway animation for all trees responding to wind.
     * @param {number} time - Elapsed time in seconds.
     * @param {number} delta - Time since last frame.
     */
    update(time, delta) {
        if (this.group) {
            // Subtle procedural sway based on time
            this.group.rotation.z = Math.sin(time + this.swayOffset) * 0.015;
            this.group.rotation.x = Math.cos(time * 0.8 + this.swayOffset) * 0.01;
        }
    }
}
