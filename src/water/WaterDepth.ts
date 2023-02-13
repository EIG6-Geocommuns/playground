import {
    DepthFormat,
    DepthTexture,
    Mesh,
    NearestFilter,
    UnsignedShortType,
    WebGLRenderTarget
} from 'three';
import type {
    BufferGeometry,
    Camera,
    Scene,
    WebGLRenderer,
} from 'three';

export interface WaterDepthOptions {
    textureWidth?: number,
    textureHeight?: number
}

class WaterDepth extends Mesh {
    private renderTarget: WebGLRenderTarget;

    constructor(geometry: BufferGeometry, options: WaterDepthOptions = {}) {
        super(geometry);
        this.type = 'WaterDepth';

        const scope = this;

        const textureWidth = options.textureWidth || 512;
        const textureHeight = options.textureHeight || 512;
        this.renderTarget = new WebGLRenderTarget(textureWidth, textureHeight);
        this.renderTarget.minFilter = NearestFilter;
        this.renderTarget.magFilter = NearestFilter;
        this.renderTarget.stencilBuffer = false;
        this.renderTarget.depthTexture =
            new DepthTexture(textureWidth, textureHeight);
        this.renderTarget.depthTexture.format = DepthFormat;
        this.renderTarget.depthTexture.type = UnsignedShortType;

        function render(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
            scope.visible = false;

            // Push render target properties
            const currentRenderTarget = renderer.getRenderTarget();

            renderer.setRenderTarget(scope.renderTarget);
            renderer.render(scene, camera);

            // Pop render target properties
            renderer.setRenderTarget(currentRenderTarget);
            scope.visible = true;
        }

        this.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
            render(renderer, scene, camera);
        }
    }

    getRenderTarget() {
        return this.renderTarget;
    }
}

export { WaterDepth };
