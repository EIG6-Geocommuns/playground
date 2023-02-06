import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GUI } from 'dat.gui';

import { Water } from '../water/Water';

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let water: Water;
let prevTime = 0;

const flowMapTexture = 'textures/water/Water_1_M_Flow.jpg';
const groundTexture = 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg';
const normalMap0Texture = 'textures/water/Water_1_M_Normal.jpg';
const normalMap1Texture = 'textures/water/Water_2_M_Normal.jpg';

const config = {
    color: 0x00ffff,
    height: 4,
    normalMap0: normalMap0Texture,
    normalMap1: normalMap1Texture,
    loadNormalMap0: function() {},
    loadNormalMap1: function() {}
}

// TODO: Build from blender and export as a gltf file
function buildGround() {
    const textureLoader = new THREE.TextureLoader();
    const ground = new THREE.Group();

    // Base geometries and materials
    const baseGeometry = new THREE.PlaneGeometry(5, 20, 10, 10);
    const baseMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
    });

    const sideGeometry = new THREE.PlaneGeometry(2.5, 20, 10, 10);
    const sideMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
    });

    // Load texture
    textureLoader.load(groundTexture, function(map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        map.repeat.set(1, 4);
        baseMaterial.map = map;
        baseMaterial.needsUpdate = true;
    });
    textureLoader.load(groundTexture, function(map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        map.repeat.set(0.5, 4);
        sideMaterial.map = map;
        sideMaterial.needsUpdate = true;
    });

    // Builders
    function buildBase(f: (_: THREE.Mesh) => void) {
        const object = new THREE.Mesh(baseGeometry, baseMaterial);
        object.rotation.x = (Math.PI * (- 0.5)); // local plane
        f(object);
        return object;
    }

    function buildSide(f: (_: THREE.Mesh) => void) {
        const object = new THREE.Mesh(sideGeometry, sideMaterial);
        object.rotation.x = (Math.PI * (- 0.5)); // local plane
        object.rotation.y = (Math.PI * (- 0.5));
        f(object);
        return object;
    }

    ground.add(buildBase((mesh) => {}));
    ground.add(buildBase((mesh) => {
        mesh.position.x -= 5;
        mesh.position.y += 2.5;
    }));
    ground.add(buildBase((mesh) => {
        mesh.position.x += 5;
        mesh.position.y += 2.5;
    }));
    ground.add(buildBase((mesh) => {
        mesh.position.x -= 10;
        mesh.position.y += 5;
    }));
    ground.add(buildBase((mesh) => {
        mesh.position.x += 10;
        mesh.position.y += 5;
    }));

    ground.add(buildSide((mesh) => {
        mesh.position.x += 2.5;
        mesh.position.y += 1.25;
    }));
    ground.add(buildSide((mesh) => {
        mesh.position.x -= 2.5;
        mesh.position.y += 1.25;
    }));
    ground.add(buildSide((mesh) => {
        mesh.position.x += 7.5;
        mesh.position.y += 3.75;
    }));
    ground.add(buildSide((mesh) => {
        mesh.position.x -= 7.5;
        mesh.position.y += 3.75;
    }));

    return ground;
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
    camera.position.set(0, 30, 0);
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
    const ground = buildGround();
    scene.add(ground);

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
    const waterFolder = gui.addFolder('Water parameters');
    waterFolder.add(config, 'height', 0.1, 10)
        .onChange(() => water.position.y = config.height)
        .name('height');
    waterFolder.addColor(config, 'color')
        .onChange(() => {
            water.material.uniforms.color.value = new THREE.Color(config.color);
        })
        .name('color');
    const textureFolder = gui.addFolder('Texture parameters');
    textureFolder.add(config, 'loadNormalMap0')
        .name('load normal map 0');
    textureFolder.add(config, 'loadNormalMap1')
        .name('load normal map 1');
    gui.open();

    // TODO: Factorize code
    config.loadNormalMap0 = function() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = function(e) {
            if (!input.files) return;
            const textureLoader = new THREE.TextureLoader();
            const fileURL = URL.createObjectURL(input.files[0]);
            const normalMap = textureLoader.load(fileURL);
            water.material.uniforms.tNormalMap0.value = normalMap;
            water.material.needsUpdate = true;
        }
        input.click();
    }

    config.loadNormalMap1 = function() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = function(e) {
            if (!input.files) return;
            const textureLoader = new THREE.TextureLoader();
            const fileURL = URL.createObjectURL(input.files[0]);
            const normalMap = textureLoader.load(fileURL);
            water.material.uniforms.tNormalMap1.value = normalMap;
        }
        input.click();
    }

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
