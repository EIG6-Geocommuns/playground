import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GUI } from 'dat.gui';

import { Water } from '../water/Water';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let water: Water;
let controls: OrbitControls;
let prevTime = 0;

const flowMapTexture = 'textures/water/Water_1_M_Flow.jpg';
const groundTexture = 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg';
const normalMap0Texture = 'textures/water/Water_1_M_Normal.jpg';
const normalMap1Texture = 'textures/water/Water_2_M_Normal.jpg';

const config = {
    color: 0x00ffff,
    height: 1,
    normalMap0: normalMap0Texture,
    normalMap1: normalMap1Texture,
}

function init(viewerDiv: HTMLDivElement) {
    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(
        45, // fov
        viewerDiv.clientWidth / viewerDiv.clientHeight, // aspect ratio
        0.1, // near plane
        200 // far plane
    );
    camera.position.set(0, 20, 0);
    camera.lookAt(scene.position);

    // renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.createElement('canvas'),
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    viewerDiv.appendChild(renderer.domElement);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // loaders
    const textureLoader = new THREE.TextureLoader();

    // ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);
    const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = (Math.PI * (- 0.5)); // local plane
    scene.add(ground);

    textureLoader.load(groundTexture, function(map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        map.repeat.set(4, 4);
        groundMaterial.map = map;
        groundMaterial.needsUpdate = true;
    });

    // flow
    const waterGeometry = new THREE.PlaneGeometry(20, 20);
    const flowMap = textureLoader.load(flowMapTexture);
    const normalMap0 = textureLoader.load(config.normalMap0);
    const normalMap1 = textureLoader.load(config.normalMap1);
    water = new Water(waterGeometry, {
        color: config.color,
        normalMap0,
        normalMap1,
        flowMap
    });
    water.position.y = config.height; // local plane
    water.rotation.x = Math.PI * (- 0.5);
    scene.add(water);

    // flow map helper
    const helperMaterial = new THREE.MeshBasicMaterial({ map: flowMap });
    const helper = new THREE.Mesh(waterGeometry, helperMaterial);
    helper.position.y = water.position.y;
    helper.rotation.x = water.rotation.x;
    helper.visible = false;
    scene.add(helper);

    // gui
    const gui = new GUI();
    gui.open();

    // listeners
    window.addEventListener('resize', () => {
        camera.aspect = viewerDiv.clientWidth / viewerDiv.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight);
    });
}

function update(time: number) {
    requestAnimationFrame(update);

    const dt = (time - prevTime) / 1000;

    controls.update();
    render();

    prevTime = time;
}

function render() {
    renderer.render(scene, camera);
}

function start(viewerDiv: HTMLDivElement) {
    init(viewerDiv);
    requestAnimationFrame(update);
}

export default start;
