// See https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram
// for built-in uniforms and attributes of ShaderMaterial
// -- Object3D
// uniform mat4 modelMatrix;        // = object.matrixWorld
// uniform mat4 projectionMatrix;   // = camera.projectionMatrix
// uniform mat4 viewMatrix;         // = camera.matrixWorldInverse
// uniform mat4 modelViewMatrix;    // = viewMatrix * modelMatrix
// uniform mat3 normalMatrix;       // = ((modelViewMatrix)^-1)^T
// uniform vec3 cameraPosition;     // = camera position in world space
// -- BufferGeometry
// attribute vec3 position;
// attribute vec3 normal;
// attribute vec3 uv;

#include <common>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>

out vec2 vUv;

void main() {
    vUv = uv;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec4 mvPosition =  viewMatrix * worldPosition; // used in fog_vertex
    gl_Position = projectionMatrix * mvPosition;

    #include <logdepthbuf_vertex>
    #include <fog_vertex>
}
