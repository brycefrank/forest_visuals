import * as THREE from 'three';
import Asset from '../core/Asset.js';

/**
 * FixedRadiusPlot - A circular measurement plot boundary.
 * Commonly used in forestry to define a sampled area of fixed size.
 */
export default class FixedRadiusPlot extends Asset {
    /**
     * @param {Object} options 
     * @param {number} options.radius - Radius of the plot circle.
     * @param {string} options.linetype - Type of line ('solid' or 'dashed').
     * @param {number|string} options.color - Color of the plot line.
     */
    constructor(options = {}) {
        super();
        this.options = {
            radius: options.radius !== undefined ? options.radius : 5.0,
            linetype: options.linetype || 'solid',
            color: options.color || 0x000000, // A nice forestry green
            ...options
        };

        this.init();
    }

    /**
     * Create or recreate the plot geometry.
     */
    init() {
        // Clear existing children
        while(this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const geometry = this.createCircleGeometry(this.options.radius);
        const material = this.createMaterial();
        const circle = new THREE.Line(geometry, material);
        
        if (this.options.linetype === 'dashed') {
            circle.computeLineDistances();
        }

        // Slightly lift it off the ground (y=0) to prevent z-fighting with the grid/ground
        this.group.add(circle);
        this.group.position.y = 0.02; 
    }

    createCircleGeometry(radius) {
        const segments = 128; // Smooth circle
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            vertices.push(
                Math.cos(theta) * radius,
                0,
                Math.sin(theta) * radius
            );
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }

    createMaterial() {
        if (this.options.linetype === 'dashed') {
            return new THREE.LineDashedMaterial({
                color: this.options.color,
                dashSize: 0.5,
                gapSize: 0.2,
                linewidth: 2,
            });
        } else {
            return new THREE.LineBasicMaterial({
                color: this.options.color,
                linewidth: 2
            });
        }
    }

    /**
     * Updates the plot parameters.
     * @param {Object} newOptions 
     */
    updateParams(newOptions = {}) {
        this.options = { ...this.options, ...newOptions };
        this.init();
    }
}
