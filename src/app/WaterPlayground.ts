import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GUI } from 'dat.gui';

import { Water } from '../water/Water';

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let light: THREE.Light;
let tile: THREE.Mesh;
let water: Water;

// DONE: Change texture to something more green-like
// DONE: Change tile size to WGS84 zoom level 16 or 17 (58.7cm/px or 29,9cm/px)
// => Gives four tiles for a total length of 300,533m or 153,088m
// TODO: Shoebox building
// DONE: More realistic river and not a pond
// TODO: Skybox

const flowMapTexture = 'textures/water/Water_1_M_Flow.jpg';
const heightMapTexture = 'textures/height/dem.jpg'
const groundTexture = 'textures/floors/ortho.jpg';
const normalMap0Texture = 'textures/water/Water_1_M_Normal.jpg';
const normalMap1Texture = 'textures/water/Water_2_M_Normal.jpg';

const config = {
    color: 0x00ffff,
    height: 2,
    tileSize: 153, // four tiles of WGS84 zoom level 17
    heightMax: 16,
    normalMap0: normalMap0Texture,
    normalMap1: normalMap1Texture,
    heightMap: heightMapTexture,
    loadNormalMap0: function() {},
    loadNormalMap1: function() {},
    loadHeightMap: function() {}
}

function init(viewerDiv: HTMLDivElement) {
    // scene
    scene = new THREE.Scene();

    // renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.createElement('canvas'),
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    viewerDiv.appendChild(renderer.domElement);

    // camera
    camera = new THREE.PerspectiveCamera(
        45, // fov
        viewerDiv.clientWidth / viewerDiv.clientHeight, // aspect ratio
        0.1, // near plane
        400 // far plane
    );
    camera.position.set(0, 30, 0);
    camera.lookAt(scene.position);

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 100;

    // loaders
    const textureLoader = new THREE.TextureLoader();

    // light
    light = new THREE.AmbientLight(0x404040);
    scene.add(light);

    // tile
    const tileGeometry = new THREE.PlaneGeometry(config.tileSize, config.tileSize, 128, 128);
    const tileMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide
    });
    tile = new THREE.Mesh(tileGeometry, tileMaterial);
    tile.rotation.x = (Math.PI * (- 0.5)); // local plane
    scene.add(tile);

    textureLoader.load(groundTexture, function(map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.anisotropy = 16;
        //map.repeat.set(4, 4); // TODO: cause side-effects on heightmap texture
        tileMaterial.map = map;
        tileMaterial.needsUpdate = true;
    });
    textureLoader.load(heightMapTexture, function(map) {
        tileMaterial.displacementMap = map;
        tileMaterial.displacementScale = config.heightMax;
    });

    // water
    const waterGeometry = new THREE.PlaneGeometry(config.tileSize, config.tileSize);
    const flowMap = textureLoader.load(flowMapTexture);
    water = new Water(waterGeometry, {
        color: config.color,
        normalMap0: textureLoader.load(config.normalMap0),
        normalMap1: textureLoader.load(config.normalMap1),
        flowMap
    });
    water.position.y = config.height; // local plane
    water.rotation.x = Math.PI * (- 0.5);
    scene.add(water);

    // gui
    const gui = new GUI();
    const waterFolder = gui.addFolder('Water parameters');
    waterFolder.add(config, 'height', 0.1, config.heightMax - 1)
        .onChange(() => water.position.y = config.height)
        .name('height');
    waterFolder.addColor(config, 'color')
        .onChange(() => {
            water.material.uniforms.color.value = new THREE.Color(config.color);
        })
        .name('color');
    waterFolder.add(config, 'loadNormalMap0')
        .name('load normal map 0');
    waterFolder.add(config, 'loadNormalMap1')
        .name('load normal map 1');
    const terrainFolder = gui.addFolder('Terrain parameters');
    terrainFolder.add(config, 'loadHeightMap')
        .name('load height map');
    gui.open();

    // TODO: Factorize code
    config.loadNormalMap0 = function() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = function(e) {
            if (!input.files) return;
            const fileURL = URL.createObjectURL(input.files[0]);
            const normalMap = textureLoader.load(fileURL);
            water.material.uniforms.tNormalMap0.value = normalMap;
            water.material.needsUpdate = true;
        }
        input.click();
    }

    // TODO: Factorize code
    config.loadNormalMap1 = function() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = function(e) {
            if (!input.files) return;
            const fileURL = URL.createObjectURL(input.files[0]);
            const normalMap = textureLoader.load(fileURL);
            water.material.uniforms.tNormalMap1.value = normalMap;
        }
        input.click();
    }

    // TODO: Factorize code
    config.loadHeightMap = function() {
        let input = document.createElement('input');
        input.type = 'file';
        input.onchange = function(e) {
            if (!input.files) return;
            const fileURL = URL.createObjectURL(input.files[0]);
            const map = textureLoader.load(fileURL);
            tileMaterial.displacementMap = map;
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

    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}

function start(viewerDiv: HTMLDivElement) {
    init(viewerDiv);
    requestAnimationFrame(update);
}

export default start;
