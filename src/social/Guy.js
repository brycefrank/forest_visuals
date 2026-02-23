import * as THREE from 'three';
import Asset from '../core/Asset.js';

/**
 * Guy - A simple 6-foot tall human figure for scale reference.
 */
export default class Guy extends Asset {
    constructor(options = {}) {
        super();
        this.options = {
            height: options.height || 1.8288, // 6 feet in meters
            color: options.color || '#3b82f6', // A nice blue shirt
            skinColor: options.skinColor || '#fcd34d',
            pantsColor: options.pantsColor || '#1e3a8a',
            leftArmAngleX: options.leftArmAngleX || 0,
            rightArmAngleX: options.rightArmAngleX || 0,
            ...options
        };

        this.init();
    }

    init() {
        // Clear existing children
        while(this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }

        const totalHeight = this.options.height;
        const headRadius = totalHeight * 0.12; 
        const bodyHeight = totalHeight * 0.45;
        const legHeight = totalHeight * 0.43;
        const bodyWidth = totalHeight * 0.25;
        const bodyDepth = totalHeight * 0.15;
        const legRadius = totalHeight * 0.06;

        // Legs
        const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
        const pantsMat = new THREE.MeshStandardMaterial({ color: this.options.pantsColor });
        
        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(-bodyWidth * 0.25, legHeight / 2, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        this.group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(bodyWidth * 0.25, legHeight / 2, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        this.group.add(rightLeg);

        // Body (Shirt)
        const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
        const shirtMat = new THREE.MeshStandardMaterial({ color: this.options.color });
        const body = new THREE.Mesh(bodyGeo, shirtMat);
        body.position.set(0, legHeight + (bodyHeight / 2), 0);
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);

        // Head
        const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
        const skinMat = new THREE.MeshStandardMaterial({ color: this.options.skinColor });
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.set(0, legHeight + bodyHeight + headRadius, 0);
        head.castShadow = true;
        head.receiveShadow = true;
        this.group.add(head);

        // Arms (with shoulder pivots)
        const armRadius = totalHeight * 0.05;
        const armHeight = totalHeight * 0.38;
        const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, armHeight, 8);

        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-bodyWidth / 2 - armRadius, legHeight + bodyHeight - armRadius, 0);
        const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
        leftArmMesh.position.set(0, -armHeight / 2 + armRadius, 0); // Drop arm down from pivot
        leftArmMesh.castShadow = true;
        leftArmMesh.receiveShadow = true;
        this.leftArm.add(leftArmMesh);
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Group();
        this.rightArm.position.set(bodyWidth / 2 + armRadius, legHeight + bodyHeight - armRadius, 0);
        const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
        rightArmMesh.position.set(0, -armHeight / 2 + armRadius, 0); // Drop arm down from pivot
        rightArmMesh.castShadow = true;
        rightArmMesh.receiveShadow = true;
        this.rightArm.add(rightArmMesh);
        this.group.add(this.rightArm);

        // Apply initial rotations
        this.setArmRotations(this.options.leftArmAngleX, this.options.rightArmAngleX);
    }

    /**
     * Set the X-axis (pitch) rotation of the arms.
     */
    setArmRotations(leftX = 0, rightX = 0) {
        if (this.leftArm && this.rightArm) {
            this.leftArm.rotation.x = leftX;
            this.rightArm.rotation.x = rightX;
        }
    }
}
