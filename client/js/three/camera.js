/** Three.js Camera Module
 * Orthographic camera setup for 2D side-view theater rendering
 */

import * as THREE from 'three';

/**
 * Camera class using OrthographicCamera for 2D side-view rendering
 * Camera is fixed in side-on orientation with no rotation or zoom by default
 * Optional zoom in/out buttons adjust the frustum uniformly
 */
class Camera {
  /**
   * Create a new Camera instance
   * @param {HTMLCanvasElement} canvas - The canvas element (kept for API compatibility)
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Calculate frustum based on viewport aspect ratio
    const left = -this.width / 2;
    const right = this.width / 2;
    const top = this.height / 2;
    const bottom = -this.height / 2;

    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, -100, 100);
    this.camera.position.set(0, 0, 10);

    // No orbit controls - camera is fixed for 2D theater view
    this.controls = null;

    // Zoom limits
    this.minFrustumWidth = 1;
    this.maxFrustumWidth = 8000;
  }

  /**
   * Get the underlying Three.js camera
   * @returns {THREE.OrthographicCamera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Zoom in by reducing the frustum uniformly (divide by 2 = smaller view area)
   */
  zoomIn() {
    const left = this.camera.left / 2;
    const right = this.camera.right / 2;
    const top = this.camera.top / 2;
    const bottom = this.camera.bottom / 2;

    // Clamp to minimum frustum size
    const frustumWidth = right - left;
    if (frustumWidth < this.minFrustumWidth) {
      const scale = this.minFrustumWidth / (this.camera.right - this.camera.left);
      this.camera.left *= scale;
      this.camera.right *= scale;
      this.camera.top *= scale;
      this.camera.bottom *= scale;
    } else {
      this.camera.left = left;
      this.camera.right = right;
      this.camera.top = top;
      this.camera.bottom = bottom;
    }

    this.camera.updateProjectionMatrix();
  }

  /**
   * Zoom out by expanding the frustum uniformly (multiply by 2 = larger view area)
   */
  zoomOut() {
    const left = this.camera.left * 2;
    const right = this.camera.right * 2;
    const top = this.camera.top * 2;
    const bottom = this.camera.bottom * 2;

    // Clamp to maximum frustum size
    const frustumWidth = right - left;
    if (frustumWidth > this.maxFrustumWidth) {
      const scale = this.maxFrustumWidth / (this.camera.right - this.camera.left);
      this.camera.left *= scale;
      this.camera.right *= scale;
      this.camera.top *= scale;
      this.camera.bottom *= scale;
    } else {
      this.camera.left = left;
      this.camera.right = right;
      this.camera.top = top;
      this.camera.bottom = bottom;
    }

    this.camera.updateProjectionMatrix();
  }

  /**
   * Handle window resize events
   * Recalculates orthographic frustum to maintain proper aspect ratio
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    this.width = width;
    this.height = height;
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Update method (no-op since there are no orbit controls)
   * Kept for API compatibility with render loops
   */
  update() {
    // No-op: no orbit controls to update
  }

  /**
   * Dispose of resources
   * Handles null controls safely
   */
  dispose() {
    // No controls to dispose since camera is fixed
    if (this.controls) {
      this.controls.dispose();
    }
  }
}

export default Camera;