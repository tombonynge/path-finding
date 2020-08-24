class Obstacle {
    constructor(geometry, height, width, depth, color) {
        this.height = height;
        this.width = width;
        this.depth = depth;
        this.color = color;
        this.mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: this.color })
        );
    }
}