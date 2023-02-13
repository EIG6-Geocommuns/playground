// See https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram
// for built-in uniforms and attributes of ShaderMaterial
// uniform mat4 viewMatrix;     // = camera.matrixWorldInverse
// uniform vec3 cameraPosition; // = camera position in world space

#include <common>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>

uniform sampler2D tNormalMap0;
uniform sampler2D tNormalMap1;

uniform sampler2D tDepth;
uniform sampler2D tDiffuse;

#ifdef USE_FLOWMAP
uniform sampler2D tFlowMap;
#else
uniform vec2 flowDirection;
#endif

uniform vec3 color;
uniform vec4 config;

in vec2 vUv;

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture(depthSampler, coord).x;
}

// http://graphicsrunner.blogspot.com/2010/08/water-using-flow-maps.html
void main() {
    #include <logdepthbuf_fragment>

    float flowMapOffset0 = config.x;
    float flowMapOffset1 = config.y;
    float halfCycle = config.z;
    float scale = config.w;

    // Get and uncompress the flow vector for this pixel
    vec2 flow;
    #ifdef USE_FLOWMAP
    flow = texture2D(tFlowMap, vUv).rg * 2.0 - 1.0; // [0, 1] -> [-1, 1]
    #else
    flow = flowDirection;
    #endif

    // Sample normal map
    vec4 normalColor0 = texture2D(tNormalMap0, (vUv * scale) + flow * flowMapOffset0);
    vec4 normalColor1 = texture2D(tNormalMap1, (vUv * scale) + flow * flowMapOffset1);

    // Linear interpolate the two normals
    float flowLerp = abs(halfCycle - flowMapOffset0) / halfCycle;
    vec4 normalColor = mix(normalColor0, normalColor1, flowLerp);

    // Get our final color.
    gl_FragColor = vec4(texture(tDepth, vUv));
    //gl_FragColor = vec4(color, 0.8) * normalColor;
    //gl_FragColor = refractColor;
    //gl_FragColor = normalColor;
    //gl_FragColor = vec4(color, 1.0);


    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
}
