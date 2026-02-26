import * as THREE from 'three';
import Asset from '../core/Asset.js';

/**
 * Hypsometer - A handheld laser rangefinder/hypsometer.
 * Essential tool for measuring tree height and stand parameters.
 * Modeled roughly to the size of a human hand based on a Nikon Forestry Pro style.
 */
export default class Hypsometer extends Asset {
    constructor(options = {}) {
        super();
        this.options = {
            width: options.width || 0.045,  // 4.5 cm wide
            height: options.height || 0.08, // 8.0 cm tall
            depth: options.depth || 0.13,   // 13.0 cm long
            mainColor: options.mainColor || '#facc15', // Bright Yellow
            gripColor: options.gripColor || '#374151', // Dark Rubber/Grey
            lensColor: options.lensColor || '#93c5fd', // Light Blue Glass
            screenColor: options.screenColor || '#d1d5db', // Screen Grey
            ...options
        };

        this.init();
    }

    init() {
        // Clear existing children
        while(this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const { width, height, depth, mainColor, gripColor, lensColor, screenColor } = this.options;
        
        // Materials
        const mainMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.3 });
        const gripMat = new THREE.MeshStandardMaterial({ color: gripColor, roughness: 0.9, flatShading: true });
        const lensMat = new THREE.MeshStandardMaterial({ color: lensColor, roughness: 0.1, metalness: 0.8 });
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: screenColor, 
            roughness: 0.4, 
            emissive: screenColor,
            emissiveIntensity: 0.1
        });
        
        // 1. Main Body (Yellow casing)
        const bodyGeo = new THREE.BoxGeometry(width, height, depth * 0.8);
        const body = new THREE.Mesh(bodyGeo, mainMat);
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);
        
        // 2. Front Rubber Housing (holds the objective lenses)
        const frontHousingDepth = depth * 0.2;
        const frontGeo = new THREE.BoxGeometry(width * 1.05, height * 1.05, frontHousingDepth);
        const front = new THREE.Mesh(frontGeo, gripMat);
        // Positioned at the "-Z" forward-facing end
        front.position.set(0, 0, -depth / 2 + (frontHousingDepth / 2));
        front.castShadow = true;
        front.receiveShadow = true;
        this.group.add(front);

        // 3. Top Grip & Buttons (Rubber layer on top)
        const topGripGeo = new THREE.BoxGeometry(width * 1.05, height * 0.1, depth * 0.6);
        const topGrip = new THREE.Mesh(topGripGeo, gripMat);
        topGrip.position.set(0, height / 2, -depth * 0.1);
        this.group.add(topGrip);

        const btnGeo = new THREE.CylinderGeometry(width * 0.2, width * 0.2, height * 0.15, 12);
        
        const btn1 = new THREE.Mesh(btnGeo, gripMat);
        btn1.position.set(0, height / 2 + 0.005, -depth * 0.2);
        this.group.add(btn1);
        
        const btn2 = new THREE.Mesh(btnGeo, gripMat);
        btn2.position.set(0, height / 2 + 0.005, 0);
        this.group.add(btn2);

        // 4. Lenses (Looking forward in -Z)
        // Top smaller lens (laser emitter/receiver)
        const topLensGeo = new THREE.CylinderGeometry(width * 0.25, width * 0.25, depth * 0.05, 16);
        topLensGeo.rotateX(Math.PI / 2);
        const topLens = new THREE.Mesh(topLensGeo, lensMat);
        topLens.position.set(0, height * 0.2, -depth / 2 - 0.0025);
        this.group.add(topLens);
        
        // Bottom bigger lens (monocular objective)
        const botLensGeo = new THREE.CylinderGeometry(width * 0.35, width * 0.35, depth * 0.05, 16);
        botLensGeo.rotateX(Math.PI / 2);
        const botLens = new THREE.Mesh(botLensGeo, lensMat);
        botLens.position.set(0, -height * 0.2, -depth / 2 - 0.0025);
        this.group.add(botLens);

        // 5. Side LCD Screen (+X side)
        const screenGeo = new THREE.BoxGeometry(width * 0.1, height * 0.6, depth * 0.5);
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(width / 2 + 0.002, 0, -depth * 0.05);
        this.group.add(screen);

        // 6. Eyepiece (+Z back side)
        const eyepieceGeo = new THREE.CylinderGeometry(width * 0.35, width * 0.35, depth * 0.15, 16);
        eyepieceGeo.rotateX(Math.PI / 2);
        const eyepiece = new THREE.Mesh(eyepieceGeo, gripMat);
        eyepiece.position.set(0, height * 0.15, depth / 2 * 0.8 + (depth * 0.075));
        this.group.add(eyepiece);
    }
}
