// globals
let scene, camera, renderer;
let gridSquares = [];
let obstacles = [];

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let pointOfIntersection = new THREE.Vector3();

// constants
const GRIDROWS = 50;
const GRIDCOLS = 50;
const SQUARESIZE = 0.9;

//booleans
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

};

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {

	//test for mouse interaction

	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	let intersects = raycaster.intersectObjects(obstacles, true);
	console.log(intersects);
	if (intersects.length > 0) {
		intersects[0].object.material.color.set('green');
	}

}

function animate() {
	requestAnimationFrame(animate);
	controls.update();
	gridUpdate();
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

	gridSquares[26].material.color.set('pink');

}

function buildObstacles() {

	// some random obstacles placed on the grid
	let cylinder = new THREE.CylinderBufferGeometry(2, 2, 5, 10);
	let material = new THREE.MeshStandardMaterial({ color: 'royalblue' });
	let mesh = new THREE.Mesh(cylinder, material);
	mesh.position.y = 2.5;
	scene.add(mesh);
	obstacles.push(mesh);
}


function gridUpdate() {
	if (obstacleWasMoved) {
		// update obstacle positions on the grid
		obstacleWasMoved = false;
	}
}

//run program
init();
buildGrid();
buildObstacles();
animate();

