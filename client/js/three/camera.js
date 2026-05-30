/** Three.js Camera Module
 * Perspective camera setup with orbit controls and presets
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Camera class with orbit controls and presets
 */
class Camera {
  /**
   * Create a new Camera instance
   * @param {HTMLCanvasElement} canvas - The canvas element for orbit controls
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);

    // Camera presets
    this.presets = {
      default: {
        position: { x: 0, y: 5, z: 10 },
        target: { x: 0, y: 0, z: 0 },
      },
      topDown: {
        position: { x: 0, y: 15, z: 0.01 },
        target: { x: 0, y: 0, z: 0 },
      },
      side: {
        position: { x: 10, y: 3, z: 0 },
        target: { x: 0, y: 0, z: 0 },
      },
    };
  }

  /**
   * Get the underlying Three.js camera
   * @returns {THREE.PerspectiveCamera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Apply a camera preset
   * @param {string} presetName - Name of the preset ('default', 'topDown', 'side')
   * @returns {boolean} True if preset was applied, false if not found
   */
  setPreset(presetName) {
    const preset = this.presets[presetName];
    if (!preset) return false;

    this.camera.position.set(
      preset.position.x,
      preset.position.y,
      preset.position.z
    );
    this.controls.target.set(
      preset.target.x,
      preset.target.y,
      preset.target.z
    );
    return true;
  }

  /**
   * Handle window resize events
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Update the orbit controls (call each frame)
   */
  update() {
    this.controls.update();
  }

  /**
   * Dispose of controls and clean up resources
   */
  dispose() {
    this.controls.dispose();
  }
}

export default Camera;