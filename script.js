// globals
let scene, camera, renderer;
let gridSquares = [];
let obstacles = [];
let moveableShapes = [];
let meshList = [];

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let pointOfIntersection = new THREE.Vector3();
let currentTarget = 0;

// constants
const GRIDROWS = 50;
const GRIDCOLS = 50;
const SQUARESIZE = 0.9;

//booleans
let isMoving = false;
let obstacleWasMoved = false;



function init() {

	scene = new THREE.Scene();
	scene.background = new THREE.Color('white');
	//add fog
	//scene.fog = new THREE.Fog( 'white',1,50);

	//orbit control camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 40, 10);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	//lights
	let light = new THREE.DirectionalLight(0xffffff);
	light.position.set(0, 100, 0);
	scene.add(light);

	let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);

	//mouse controls
	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('mousedown', onMouseDown, false);

};

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {

	//ray intersection with plane to update pointOfIntersection
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	raycaster.ray.intersectPlane(plane, pointOfIntersection);

}

function onMouseDown(event) {

	if (!isMoving) {
		let intersects = raycaster.intersectObjects(meshList, true);
		if (intersects.length > 0) {
			isMoving = true;
			currentTarget = intersects[0].object.uuid;
		}
	} else {
		isMoving = false;
		currentTarget = 0;
	}
}



function animate() {
	requestAnimationFrame(animate);
	controls.update();
	updateObstacles(currentTarget);
	// updateGrid();
	renderer.render(scene, camera);
};


function buildGrid() {

	let geometry = new THREE.PlaneBufferGeometry(SQUARESIZE, SQUARESIZE);
	let positions = [];
	let color = 'lightgrey';

	for (let x = -GRIDCOLS / 2; x < GRIDCOLS / 2; x++) {
		for (let z = -GRIDROWS / 2; z < GRIDROWS / 2; z++) {
			positions.push(new THREE.Vector3(x, 0, z));
		}
	}

	for (let i = 0; i < GRIDROWS * GRIDCOLS; i++) {
		let material = new THREE.MeshBasicMaterial({ color: color });
		let square = new THREE.Mesh(geometry, material);
		square.rotateX(-90 * Math.PI / 180);
		square.position.set(
			positions[i].x,
			positions[i].y,
			positions[i].z
		);
		scene.add(square);
		gridSquares.push(square);
	}

}

function buildObstacles() {

	// some random obstacles placed on the grid
	let shapeGeometry = new THREE.CylinderBufferGeometry(1, 2, 5, 10);
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'royalblue'));
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'green'));
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'yellow'));

	for (let shape of moveableShapes) {

		shape.mesh.position.set(rand(-GRIDCOLS / 2, GRIDCOLS / 2), shape.height / 2, rand(-GRIDROWS / 2, GRIDROWS / 2));

		scene.add(shape.mesh);
		meshList.push(shape.mesh); //put all the meshes in an array for easier intersection tests.
	}

}

function updateObstacles(target) {

	if (target !== 0) {
		let obstacle;
		for (let shape of moveableShapes) {

			if (shape.mesh.uuid === target) {
				obstacle = shape;
			}
		}
		obstacle.mesh.material.color.set('pink');
		obstacle.mesh.position.set(pointOfIntersection.x, 3, pointOfIntersection.z);
		updateGrid(obstacle);
	}
	else {
		for (let shape of moveableShapes) {
			shape.mesh.material.color.set(shape.color);
			shape.mesh.position.y = 2.5;
		}
	}



}

function updateGrid(shape) {

	let pos = shape.mesh.position;
	let min = new THREE.Vector2(pos.x - shape.width * 0.75, pos.z - shape.depth * 0.75);
	let max = new THREE.Vector2(pos.x + shape.width * 0.75, pos.z + shape.depth * 0.75);

	for (let square of gridSquares) {

		if (circleSquareIntersection(pos, square.position, SQUARESIZE, 2)) {
			square.material.color.set('black');
		} else {
			square.material.color.set('lightgrey');
		}

	}



}

//utils
function rand(min, max) {
	if (max === undefined) {
		max = min;
		min = 0;
	}
	return min + (max - min) * Math.random();
}

function circleSquareIntersection(circle, square, squareWidth, cirleRadius) {
	let circleDistance = new THREE.Vector2();

	circleDistance.x = Math.abs(circle.x - square.x);
	circleDistance.y = Math.abs(circle.z - square.z);

	if (circleDistance.x > (squareWidth / 2 + cirleRadius)) { return false; }
	if (circleDistance.y > (squareWidth / 2 + cirleRadius)) { return false; }

	if (circleDistance.x <= (squareWidth / 2)) { return true; }
	if (circleDistance.y <= (squareWidth / 2)) { return true; }

	let cornerDistance_sq = Math.pow(circleDistance.x - squareWidth / 2, 2) +
		Math.pow(circleDistance.y - squareWidth / 2, 2);

	return (cornerDistance_sq <= Math.pow(cirleRadius, 2));
}


//run program
init();
buildGrid();
buildObstacles();
animate();

