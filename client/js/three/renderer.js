/** Three.js WebGL Renderer Module
 * Initializes and manages the Three.js WebGL renderer
 */

import * as THREE from 'three';

/**
 * Renderer class that wraps Three.js WebGLRenderer
 */
class Renderer {
  /**
   * Create a new Renderer instance
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {Object} options - Renderer options
   * @param {boolean} options.antialias - Enable antialiasing (default: true)
   * @param {boolean} options.alpha - Enable alpha channel (default: false)
   * @param {number} options.clearColor - Clear color hex (default: 0x1a1a2e)
   * @param {number} options.clearAlpha - Clear alpha (default: 1)
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      antialias: true,
      alpha: false,
      clearColor: 0x1a1a2e,
      clearAlpha: 1,
      ...options,
    };

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: this.options.antialias,
      alpha: this.options.alpha,
    });
  }

  /**
   * Initialize the renderer with the given dimensions
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {THREE.WebGLRenderer} The initialized renderer
   */
  init(width, height) {
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(this.options.clearColor, this.options.clearAlpha);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    return this.renderer;
  }

  /**
   * Handle window resize events
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    this.renderer.setSize(width, height);
  }

  /**
   * Render a scene from the camera's perspective
   * @param {THREE.Scene} scene - The scene to render
   * @param {THREE.Camera} camera - The camera to render from
   */
  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  /**
   * Get the underlying Three.js renderer
   * @returns {THREE.WebGLRenderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Dispose of the renderer and clean up resources
   */
  dispose() {
    this.renderer.dispose();
  }
}

export default Renderer;