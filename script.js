// globals
let scene, camera, renderer;
let gridSquares = [];
let obstacles = [];
let moveableShapes = [];
let meshList = [];
let explorer;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let pointOfIntersection = new THREE.Vector3();
let currentTarget = 0;

// constants
const GRIDROWS = 26;
const GRIDCOLS = 26;
const SQUARESIZE = 0.95;

//booleans
let isMoving = false;
let obstacleWasMoved = false;



function initScene() {

	scene = new THREE.Scene();
	scene.background = new THREE.Color('grey');

	//orbit control camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 20, 10);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.add(camera);

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	//lights
	let light = new THREE.DirectionalLight(0xffffff, 0.2);
	light.position.set(0, 10, 0);
	scene.add(light);

	let light2 = new THREE.DirectionalLight(0xffffff, 0.5);
	light2.position.set(10, 10, 0);
	scene.add(light2);

	let light3 = new THREE.DirectionalLight(0xffffff, 0.2);
	light3.position.set(5, 5, -10);
	scene.add(light3);

	let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	window.addEventListener('resize', onWindowResize, false);

	//mouse controls
	window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('mousedown', onMouseDown, false);

	document.querySelector('button').addEventListener('click', () => {

		updateGrid();
		ResetNodesFromGrid(gridSquares);
		getPath(startIndex, targetIndex);

	});
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

	//constrain point of intersection
	let edge = (GRIDCOLS / 2);
	pointOfIntersection.x = clampBetween(pointOfIntersection.x, -edge + 1, edge - 2);
	pointOfIntersection.z = clampBetween(pointOfIntersection.z, -edge + 1, edge - 2);

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
	updateObstacle(currentTarget);
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
		let material = new THREE.MeshStandardMaterial({ color: color });
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

	//edge cases ..literally
	for (i = 0; i < gridSquares.length; i++) {
		if (i <= GRIDROWS || i % GRIDROWS == 0 || (i + 1) % GRIDROWS == 0 || i > (GRIDROWS * GRIDROWS) - GRIDROWS) {
			gridSquares[i].edge = true;
		};
	}

}

function buildExplorer() {
	explorer = new Explorer('royalblue');
	explorer.mesh.position.set(-GRIDCOLS / 2 + 1, 0.5, GRIDROWS / 2 - 2);
	scene.add(explorer.mesh);
	moveableShapes.push(explorer);
	meshList.push(explorer.mesh);
}

function buildDestination() {
	destination = new Destination('tomato');
	destination.build();
	scene.add(destination.mesh);
	destination.mesh.position.y = destination.height / 2;
	moveableShapes.push(destination);
	meshList.push(destination.mesh);
}

function buildObstacles() {

	// some random obstacles placed on the grid
	let shapeGeometry = new THREE.CylinderBufferGeometry(1, 2, 2, 12);
	let obstacleColor = 'gold'
	moveableShapes.push(new Obstacle(shapeGeometry, 2, 4, 4, obstacleColor));
	moveableShapes.push(new Obstacle(shapeGeometry, 2, 4, 4, obstacleColor));
	moveableShapes.push(new Obstacle(shapeGeometry, 2, 4, 4, obstacleColor));
	moveableShapes.push(new Obstacle(shapeGeometry, 2, 4, 4, obstacleColor));


	for (let shape of moveableShapes) {

		shape.mesh.position.set(rand(-GRIDCOLS / 2 + 1, GRIDCOLS / 2 - 2), shape.height / 2, rand(-GRIDROWS / 2 + 1, GRIDROWS / 2 - 2));

		scene.add(shape.mesh);
		meshList.push(shape.mesh); //put all the meshes in an array for easier intersection tests.
	}

}


function updateObstacle(target) {
	if (target !== 0) {
		let selectedShape;
		for (let shape of moveableShapes) {
			if (shape.mesh.uuid === target) {
				selectedShape = shape;
			}
		}
		if (!selectedShape.selected) {
			selectedShape.select();
			let currentColor = selectedShape.mesh.material.color;
			selectedShape.mesh.material.color.set(currentColor.addScalar(0.3));
		}
		if (selectedShape.id !== 'obstacle') {
			//set pointOfIntersection to closest square position
			pointOfIntersection.x = Math.floor(pointOfIntersection.x);
			pointOfIntersection.z = Math.floor(pointOfIntersection.z);
		}
		selectedShape.mesh.position.set(pointOfIntersection.x, selectedShape.height / 2 + 0.5, pointOfIntersection.z);
		updateGrid();
	}
	else {
		for (let shape of moveableShapes) {
			if (shape.selected) {
				shape.deselect();
				shape.mesh.position.y = shape.height / 2;
			}
		}
	}
}


function updateGrid() {
	// clear grid = set all squares to light grey
	// set their blocked property to false and pathPosition to null
	for (const square of gridSquares) {
		square.pathPosition = null;
		square.blocked = false;
		if (square.edge == true) {
			square.material.color.set('black');
		} else {
			square.material.color.set('white');
		}
	}

	for (const shape of moveableShapes) {
		updateGridForItem(shape);
	}
}


function updateGridForItem(item) {
	let pos = item.mesh.position;
	if (item.id === 'obstacle') {
		for (const square of gridSquares) {
			if (circleSquareIntersection(pos, square.position, SQUARESIZE, 2)) {
				square.material.color.set('grey');
				square.blocked = true;
			}
		}
	} else {
		for (const square of gridSquares) {
			if (square.position.x == pos.x && square.position.z == pos.z) {
				if (item.id === 'explorer') {
					if (!square.blocked && !square.edge) {
						square.material.color.set('lightblue');
						square.pathPosition = 'start';
					}
				} else {
					if (!square.blocked && !square.edge) {
						square.material.color.set('lightcoral');
						square.pathPosition = 'target';
					}
				}

			}
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

function clampBetween(n, min, max) {
	return Math.min(Math.max(n, min), max);
}


//run program
initScene();
buildGrid();
buildObstacles();
buildExplorer();
buildDestination();
updateGrid();
getNodesFromGrid(gridSquares);
animate();

