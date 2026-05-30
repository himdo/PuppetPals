/** Three.js Stage Module
 * 2D stage floor, backdrop, and location slot markers for side-view theater
 */

import * as THREE from 'three';

/**
 * Stage class that creates the 2D stage environment
 * Replaces 3D ground plane with 2D floor, backdrop, and slot markers
 */
class Stage {
  /**
   * Create a new Stage instance
   * @param {THREE.Scene} scene - The scene to add stage elements to
   * @param {Object} options - Stage configuration options
   * @param {number} options.width - Stage width (default: 20)
   * @param {number} options.onScreenSlotCount - Number of on-screen slot markers (default: 5)
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.stageWidth = options.width || 20;
    this.onScreenSlotCount = options.onScreenSlotCount || 5;
    this.stageObjects = [];
  }

  /**
   * Create the 2D stage floor (horizontal bar at bottom)
   * @returns {THREE.Mesh} The stage floor mesh
   */
  createStageFloor() {
    const geometry = new THREE.PlaneGeometry(this.stageWidth, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x2d2d5e });
    const floor = new THREE.Mesh(geometry, material);
    floor.position.y = -4.5;
    floor.name = 'stageFloor';
    this.scene.add(floor);
    this.stageObjects.push(floor);
    return floor;
  }

  /**
   * Create a backdrop plane at z: -1 as the background layer
   * @returns {THREE.Mesh} The backdrop plane mesh
   */
  createBackdrop() {
    const geometry = new THREE.PlaneGeometry(this.stageWidth + 10, 15);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.DoubleSide,
    });
    const backdrop = new THREE.Mesh(geometry, material);
    backdrop.position.set(0, 0, -1);
    backdrop.name = 'stageBackdrop';
    this.scene.add(backdrop);
    this.stageObjects.push(backdrop);
    return backdrop;
  }

  /**
   * Create location slot markers at each on-screen position
   * These are subtle vertical lines/icons marking where puppets can stand
   * @returns {THREE.Mesh[]} Array of slot marker meshes
   */
  createSlotMarkers() {
    const markers = [];
    const slotWidth = this.stageWidth / this.onScreenSlotCount;

    for (let i = 0; i < this.onScreenSlotCount; i++) {
      const x = -this.stageWidth / 2 + slotWidth * (i + 0.5);

      const geometry = new THREE.PlaneGeometry(0.3, 0.3);
      const material = new THREE.MeshBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.6,
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(x, -4.2, 0);
      marker.name = `slotMarker_${i}`;
      this.scene.add(marker);
      this.stageObjects.push(marker);
      markers.push(marker);
    }

    return markers;
  }

  /**
   * Setup the full 2D stage with floor, backdrop, and slot markers
   * Does NOT create grid helper or boundary markers (not needed for 2D view)
   */
  setupStage() {
    this.createStageFloor();
    this.createBackdrop();
    this.createSlotMarkers();
  }

  /**
   * Set a texture on the backdrop plane
   * @param {THREE.Texture} texture - The texture to apply
   */
  setBackgroundTexture(texture) {
    const backdrop = this.scene.getObjectByName('stageBackdrop');
    if (backdrop) {
      backdrop.material.map = texture;
      backdrop.material.needsUpdate = true;
    }
  }

  /**
   * Clear all stage elements from the scene
   */
  clearStage() {
    this.stageObjects.forEach((obj) => {
      this.scene.remove(obj);
    });
    this.stageObjects = [];
  }

  /**
   * Get the number of stage objects
   * @returns {number}
   */
  get stageObjectCount() {
    return this.stageObjects.length;
  }
}

export default Stage;