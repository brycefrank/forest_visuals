import * as THREE from 'three';
import FixedRadiusPlot from './FixedRadiusPlot.js';

/**
 * FIAPlot - A complex plot design used by the Forest Inventory and Analysis (FIA) program.
 * It consists of four circular subplots:
 * - Subplot 1: Center
 * - Subplot 2: North (0 deg azimuth) at 120 ft (36.576 m)
 * - Subplot 3: Southeast (120 deg azimuth) at 120 ft (36.576 m)
 * - Subplot 4: Southwest (240 deg azimuth) at 120 ft (36.576 m)
 * 
 * Each subplot has a radius of 24 ft (7.3152 m).
 */
export default class FIAPlot extends FixedRadiusPlot {
    constructor(options = {}) {
        super({
            radius: options.radius || 7.3152, // standard FIA subplot radius
            ...options
        });
    }

    /**
     * Create the FIA plot structure with 4 subplots.
     */
    init() {
        // Clear existing children
        while(this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const distance = 36.576; // 120 feet in meters

        // Subplot configurations based on FIA design
        const subplots = [
            { id: 1, x: 0, z: 0 }, // Center
            { id: 2, azimuth: 0 },   // North
            { id: 3, azimuth: 120 }, // Southeast
            { id: 4, azimuth: 240 }  // Southwest
        ];

        subplots.forEach(subplot => {
            let x = 0;
            let z = 0;

            if (subplot.azimuth !== undefined) {
                const angle = (subplot.azimuth * Math.PI) / 180;
                x = Math.sin(angle) * distance;
                z = -Math.cos(angle) * distance; // Negative Z is North in our coordinate system
            } else if (subplot.x !== undefined) {
                x = subplot.x;
                z = subplot.z;
            }

            const geometry = this.createCircleGeometry(this.options.radius);
            const material = this.createMaterial();
            const circle = new THREE.Line(geometry, material);
            
            if (this.options.linetype === 'dashed') {
                circle.computeLineDistances();
            }

            circle.position.set(x, 0, z);
            this.group.add(circle);
            
            // Optional: Add a small label or marker in the center of the subplot?
            // For now, just the circles are fine as requested.
        });

        // Lift slightly to avoid z-fighting
        this.group.position.y = 0.02;
    }
}
