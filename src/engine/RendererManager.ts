import * as THREE from 'three';
import { IRendererManager, RendererMode, RenderStats } from '../types';

export class RendererManager implements IRendererManager {
  public renderer!: THREE.WebGLRenderer | any;
  public mode: RendererMode = 'WebGL2';
  public isWebGPU: boolean = false;
  public domElement: HTMLCanvasElement;
  private canvasContainer: HTMLElement;

  constructor(canvasContainer: HTMLElement) {
    this.canvasContainer = canvasContainer;
    if (typeof document !== 'undefined') {
      this.domElement = document.createElement('canvas');
      this.domElement.id = 'game-canvas';
      this.canvasContainer?.appendChild?.(this.domElement);
    } else {
      this.domElement = { addEventListener: () => {}, removeEventListener: () => {} } as any;
    }
  }

  public async init(): Promise<void> {
    const isNode = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isNode || typeof window === 'undefined') {
      this.renderer = {
        render: () => {},
        setSize: () => {},
        setPixelRatio: () => {},
        info: { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } },
        shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
        outputColorSpace: THREE.SRGBColorSpace
      };
      this.mode = 'WebGL2';
      this.isWebGPU = false;
      return;
    }

    // Initialize high-performance WebGL2 Renderer for guaranteed PBR material & shadow rendering
    console.log('⚡ KINGMAKER Engine initializing WebGL2 Renderer');
    const webglRenderer = new THREE.WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });

    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    webglRenderer.toneMappingExposure = 1.0;
    webglRenderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer = webglRenderer;
    this.mode = 'WebGL2';
    this.isWebGPU = false;

    // Configure common renderer properties
    this.setSize(window.innerWidth, window.innerHeight);
  }


  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (this.renderer) {
      if (this.isWebGPU && typeof (this.renderer as any).renderAsync === 'function') {
        (this.renderer as any).renderAsync(scene, camera);
      } else {
        (this.renderer as THREE.WebGLRenderer).render(scene, camera);
      }
    }
  }

  public setSize(width: number, height: number): void {
    const pixelRatio = Math.min(window.devicePixelRatio, 2); // Cap at 2 for performance
    if (this.renderer) {
      if (typeof (this.renderer as any).setSize === 'function') {
        (this.renderer as any).setSize(width, height, false);
      }
      if (typeof (this.renderer as THREE.WebGLRenderer).setPixelRatio === 'function') {
        (this.renderer as THREE.WebGLRenderer).setPixelRatio(pixelRatio);
      }
    }
  }

  public getStats(): Partial<RenderStats> {
    return {
      rendererMode: this.mode,
      webGpuSupported: 'gpu' in navigator && !!navigator.gpu
    };
  }
}
