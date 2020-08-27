// Class for draggable objects
class Draggable {
    constructor(color) {
        this.color = color;
        this.selected = false;
    }

    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
        this.mesh.material.color.set(this.color);
    }
}


// Obstacles to the explorer
class Obstacle extends Draggable {
    constructor(geometry, height, width, depth, color) {
        super(color);
        this.id = 'obstacle';
        this.height = height;
        this.width = width;
        this.depth = depth;
        this.mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: this.color, flatShading: true })
        );
    }
}

// The Explorer that follows the path
class Explorer extends Draggable {
    constructor(color) {
        super(color);
        this.id = 'explorer';
        this.height = 1;
        this.mesh = new THREE.Mesh(
            new THREE.IcosahedronBufferGeometry(0.5, 1),
            new THREE.MeshStandardMaterial({ color: this.color, flatShading: true })
        )
    }
}

// Destination for explorer to reach
class Destination extends Draggable {
    constructor(color) {
        super(color);
        this.id = 'destination';
        this.height = 2;
        this.mesh = new THREE.Mesh(
            new THREE.ConeBufferGeometry(1, 2, 10),
            new THREE.MeshStandardMaterial({ color: this.color, flatShading: true })
        )
    }

    build() {
        this.mesh.rotateZ(180 * Math.PI / 180);
    }
}