/** Three.js Lighting Module
 * Simplified lighting for 2D: single ambient light for unlit sprite rendering
 */

import * as THREE from 'three';

/**
 * Lighting class that manages scene lights
 * Optimized for 2D sprite rendering (no shading needed)
 */
class Lighting {
  /**
   * Create a new Lighting instance
   * @param {THREE.Scene} scene - The scene to add lights to
   */
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
  }

  /**
   * Setup simplified 2D lighting with only ambient light
   * Directional and point lights are unneeded for unlit sprite rendering in 2D
   * @returns {THREE.AmbientLight} The created ambient light
   */
  setupBasicLighting() {
    // Single ambient light at full intensity for 2D sprite rendering
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);
    this.lights.push(ambient);

    return ambient;
  }

  /**
   * Remove all lights from the scene
   */
  removeAllLights() {
    this.lights.forEach((light) => {
      this.scene.remove(light);
    });
    this.lights = [];
  }

  /**
   * Get the number of active lights
   * @returns {number}
   */
  get lightCount() {
    return this.lights.length;
  }
}

export default Lighting;