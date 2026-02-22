import * as THREE from 'three';
import Asset from '../../core/Asset.js';

export default class PonsseCobra extends Asset {
    constructor() {
        super();
        this.init();
    }

    init() {
        // Simple harvester placeholder
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1, 3),
            new THREE.MeshStandardMaterial({ color: '#ffeb3b' }) // Yellow for machinery
        );
        body.position.y = 1;
        this.group.add(body);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: '#212121' });
        
        const positions = [
            [-0.8, 0.5, 1.2], [0.8, 0.5, 1.2],
            [-0.8, 0.5, -1.2], [0.8, 0.5, -1.2]
        ];

        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            this.group.add(wheel);
        });
    }
}
