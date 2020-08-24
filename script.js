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

	let ambientLight = new THREE.AmbientLight(16724294);
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

	// if (!isMoving) {
	// 	let intersects = raycaster.intersectObjects(obstacles, true);
	// 	if (intersects.length > 0) {
	// 		isMoving = true;
	// 		currentTarget = intersects[0].object.uuid;
	// 	}
	// } else {
	// 	isMoving = false;
	// 	currentTarget = 0;
	// }

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
	updateGrid();
	renderer.render(scene, camera);
};


function buildGrid() {

	let geometry = new THREE.PlaneBufferGeometry(SQUARESIZE, SQUARESIZE);
	let positions = [];
	let color = 'grey';

	for (let x = -GRIDCOLS / 2; x < GRIDCOLS / 2; x++) {
		for (let z = -GRIDROWS / 2; z < GRIDROWS / 2; z++) {
			positions.push(new THREE.Vector3(x, 0, z));
		}
	}

	for (let i = 0; i < GRIDROWS * GRIDCOLS; i++) {
		let material = new THREE.MeshBasicMaterial({ color: 'royalblue' });
		let square = new THREE.Mesh(geometry, material);
		square.rotateX(-90 * Math.PI / 180);
		square.material.color.set(color);
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
	let cylinder = new THREE.CylinderBufferGeometry(2, 2, 5, 10);
	let material = new THREE.MeshStandardMaterial({ color: 'royalblue' });
	let mesh = new THREE.Mesh(cylinder, material);
	mesh.position.y = 2.5;
	scene.add(mesh);
	obstacles.push(mesh);


	//with classes
	let shapeGeometry = new THREE.CylinderBufferGeometry(2, 2, 5, 10);
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'royalblue'));
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'royalblue'));
	moveableShapes.push(new Obstacle(shapeGeometry, 5, 4, 4, 'royalblue'));

	for (let shape of moveableShapes) {

		shape.mesh.position.set(rand(-GRIDCOLS / 2, GRIDCOLS / 2), shape.height / 2, rand(-GRIDROWS / 2, GRIDROWS / 2));
		console.log(shape.mesh.position);
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
		obstacle.mesh.position.set(pointOfIntersection.x, 2.5, pointOfIntersection.z);
	}
	else {
		for (let shape of moveableShapes) {
			shape.mesh.material.color.set('royalblue');
		}
	}



}

function updateGrid() {
	if (obstacleWasMoved) {
		// update obstacle positions on the grid

		obstacleWasMoved = false;
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


//run program
init();
buildGrid();
buildObstacles();
animate();

