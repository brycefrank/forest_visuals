import * as THREE from 'three';

/**
 * Base class for all 3D assets in the forestry library.
 * Designed to be LLM-readable and modular.
 */
export default class Asset {
    constructor() {
        this.group = new THREE.Group();
        this.isLoaded = false;
    }

    /**
     * Add this asset to a Three.js scene or parent object.
     * @param {THREE.Object3D} parent 
     */
    addTo(parent) {
        parent.add(this.group);
    }

    /**
     * Remove this asset from its parent.
     */
    removeFromParent() {
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
    }

    /**
     * Update loop for animations.
     * @param {number} time - Elapsed time in seconds.
     * @param {number} delta - Time since last frame.
     */
    update(time, delta) {
        // To be implemented by subclasses
    }

    /**
     * Set position of the asset.
     */
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    /**
     * Set scale of the asset.
     */
    setScale(s) {
        this.group.scale.set(s, s, s);
    }
}
