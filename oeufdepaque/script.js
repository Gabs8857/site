const scene = new THREE.Scene();
import GLTFLoader from 'gltfloader';

const camera = new THREE.PerspectiveCamera(70, iw / ih);

const geometry = await GLTFLoader.loadGeometry('mario_1.glb');
const textureLoader = new THREE.TextureLoader().load('mario_1.png');

const material = new THREE.MeshPhongMaterial({ map: textureLoader });

const mesh = new THREE.Mesh(geometry, material);

const light = new THREE.DirectionalLight(0xf0f0f0, 50);
scene.add(mesh);

scene.add(light);
camera.position.set(0, 100, 200);
light.position.set(0, 200, 200);

const renderer = new THREE.WebGLRenderer({ canvas});
renderer.render(scene, camera);

function loop(){
    requestAnimationFrame(loop);
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.005;
    renderer.render(scene, camera);
}

loop();