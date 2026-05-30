/** Three.js Scene Module
 * Creates and manages the main Three.js scene
 */

import * as THREE from 'three';

/**
 * Scene manager class that wraps Three.js Scene
 */
class Scene {
  /**
   * Create a new Scene instance
   */
  constructor() {
    this.scene = new THREE.Scene();
  }

  /**
   * Get the underlying Three.js scene
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }

  /**
   * Add an object to the scene
   * @param {THREE.Object3D} object - The object to add
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene
   * @param {THREE.Object3D} object - The object to remove
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Clear all objects from the scene
   */
  clear() {
    const toRemove = [...this.scene.children];
    toRemove.forEach((child) => {
      this.scene.remove(child);
    });
  }

  /**
   * Find an object in the scene by name
   * @param {string} name - The name of the object to find
   * @returns {THREE.Object3D|null} The found object or null
   */
  getObjectByName(name) {
    return this.scene.getObjectByName(name);
  }

  /**
   * Get the number of children in the scene
   * @returns {number}
   */
  get childCount() {
    return this.scene.children.length;
  }
}

export default Scene;