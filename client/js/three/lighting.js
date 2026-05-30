/** Three.js Lighting Module
 * Ambient and directional light setup for the 3D scene
 */

import * as THREE from 'three';

/**
 * Lighting class that manages scene lights
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
   * Setup basic lighting with ambient and directional lights
   * @returns {Object} Object containing the created lights
   */
  setupBasicLighting() {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    this.lights.push(ambient);

    // Directional light for shadows and depth
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7);
    this.scene.add(directional);
    this.lights.push(directional);

    return { ambient, directional };
  }

  /**
   * Add a point light to the scene for atmosphere
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} z - Z position
   * @param {number} color - Light color hex (default: 0xffffff)
   * @param {number} intensity - Light intensity (default: 1)
   * @param {number} distance - Light falloff distance (default: 0 = infinite)
   * @returns {THREE.PointLight} The created point light
   */
  addPointLight(x, y, z, color = 0xffffff, intensity = 1, distance = 0) {
    const point = new THREE.PointLight(color, intensity, distance);
    point.position.set(x, y, z);
    this.scene.add(point);
    this.lights.push(point);
    return point;
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