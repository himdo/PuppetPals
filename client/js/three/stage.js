/** Three.js Stage Module
 * Renderable stage/ground plane, grid helper, boundary markers, and background
 */

import * as THREE from 'three';

/**
 * Stage class that creates the 3D stage environment
 */
class Stage {
  /**
   * Create a new Stage instance
   * @param {THREE.Scene} scene - The scene to add stage elements to
   * @param {Object} options - Stage configuration options
   * @param {number} options.width - Stage width (default: 20)
   * @param {number} options.depth - Stage depth (default: 20)
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.stageWidth = options.width || 20;
    this.stageDepth = options.depth || 20;
    this.stageObjects = [];
  }

  /**
   * Create the ground plane for the stage
   * @returns {THREE.Mesh} The ground plane mesh
   */
  createGroundPlane() {
    const geometry = new THREE.PlaneGeometry(this.stageWidth, this.stageDepth);
    const material = new THREE.MeshLambertMaterial({ color: 0x2d2d5e });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.name = 'groundPlane';
    this.scene.add(ground);
    this.stageObjects.push(ground);
    return ground;
  }

  /**
   * Create a grid helper for visual reference
   * @returns {THREE.GridHelper} The grid helper
   */
  createGridHelper() {
    const grid = new THREE.GridHelper(
      this.stageWidth,
      20,
      0x888888,
      0x444444
    );
    grid.name = 'gridHelper';
    this.scene.add(grid);
    this.stageObjects.push(grid);
    return grid;
  }

  /**
   * Create boundary markers at the four corners of the stage
   * @returns {THREE.Mesh[]} Array of 4 boundary marker meshes
   */
  createBoundaryMarkers() {
    const markers = [];
    const halfWidth = this.stageWidth / 2;
    const halfDepth = this.stageDepth / 2;
    const markerSize = 0.2;

    const corners = [
      { x: -halfWidth, z: -halfDepth },
      { x: halfWidth, z: -halfDepth },
      { x: -halfWidth, z: halfDepth },
      { x: halfWidth, z: halfDepth },
    ];

    corners.forEach((corner, i) => {
      const geometry = new THREE.PlaneGeometry(markerSize, markerSize);
      const material = new THREE.MeshBasicMaterial({ color: 0xff4444 });
      const marker = new THREE.Mesh(geometry, material);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(corner.x, 0.01, corner.z);
      marker.name = `boundaryMarker_${i}`;
      this.scene.add(marker);
      this.stageObjects.push(marker);
      markers.push(marker);
    });

    return markers;
  }

  /**
   * Create a background plane behind the stage
   * @returns {THREE.Mesh} The background plane mesh
   */
  createBackgroundPlane() {
    const geometry = new THREE.PlaneGeometry(30, 15);
    const material = new THREE.MeshBasicMaterial({
      color: 0x1a1a2e,
      side: THREE.DoubleSide,
    });
    const bg = new THREE.Mesh(geometry, material);
    bg.position.set(0, 5, -10);
    bg.name = 'backgroundPlane';
    this.scene.add(bg);
    this.stageObjects.push(bg);
    return bg;
  }

  /**
   * Setup the full stage with all elements (ground, grid, markers, background)
   */
  setupStage() {
    this.createGroundPlane();
    this.createGridHelper();
    this.createBoundaryMarkers();
    this.createBackgroundPlane();
  }

  /**
   * Set a texture on the background plane
   * @param {THREE.Texture} texture - The texture to apply
   */
  setBackgroundTexture(texture) {
    const bg = this.scene.getObjectByName('backgroundPlane');
    if (bg) {
      bg.material.map = texture;
      bg.material.needsUpdate = true;
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