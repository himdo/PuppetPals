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
    this.slotMarkers = [];
    this.slotLabels = [];
    this.theaterElements = [];
    this.theaterEnabled = false;
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
    // Clear existing markers
    this.slotMarkers.forEach(m => this.scene.remove(m));
    this.slotMarkers = [];

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
      this.slotMarkers.push(marker);
    }

    return this.slotMarkers;
  }

  /**
   * Create numbered labels above each slot position
   * @returns {THREE.Mesh[]} Array of slot label meshes
   */
  createSlotLabels() {
    // Clear existing labels
    this.slotLabels.forEach(l => this.scene.remove(l));
    this.slotLabels = [];

    const slotWidth = this.stageWidth / this.onScreenSlotCount;

    for (let i = 0; i < this.onScreenSlotCount; i++) {
      const x = -this.stageWidth / 2 + slotWidth * (i + 0.5);

      // Create canvas texture for the label
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}`, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
      });
      const geometry = new THREE.PlaneGeometry(0.5, 0.5);
      const label = new THREE.Mesh(geometry, material);
      label.position.set(x, -3.2, 0);
      label.name = `slotLabel_${i}`;
      label.visible = true;
      this.scene.add(label);
      this.stageObjects.push(label);
      this.slotLabels.push(label);
    }

    return this.slotLabels;
  }

  /**
   * Hide all slot labels
   */
  hideSlotLabels() {
    this.slotLabels.forEach(label => {
      label.visible = false;
    });
  }

  /**
   * Show all slot labels
   */
  showSlotLabels() {
    this.slotLabels.forEach(label => {
      label.visible = true;
    });
  }

  /**
   * Set occupancy color on a slot marker to indicate a puppet is present
   * @param {number} slotIndex - The slot index
   * @param {string} color - The color to set (hex string or number)
   */
  setSlotOccupancy(slotIndex, color) {
    if (slotIndex >= 0 && slotIndex < this.slotMarkers.length) {
      this.slotMarkers[slotIndex].material.color = color;
    }
  }

  /**
   * Clear occupancy color on a slot marker, returning to default
   * @param {number} slotIndex - The slot index
   */
  clearSlotOccupancy(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.slotMarkers.length) {
      this.slotMarkers[slotIndex].material.color = 0x44aaff;
    }
  }

  /**
   * Update the number of slot markers and labels
   * @param {number} count - New number of on-screen slots
   */
  updateSlotCount(count) {
    this.onScreenSlotCount = count;
    this.createSlotMarkers();
    if (this.slotLabels.length > 0) {
      this.createSlotLabels();
    }
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
   * Create theater aesthetic elements: curtain pillars and proscenium arch
   * @returns {THREE.Mesh[]} Array of theater element meshes
   */
  createTheaterElements() {
    // Left curtain pillar
    const leftPillarGeo = new THREE.PlaneGeometry(0.8, 12);
    const pillarMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b0000,
      side: THREE.DoubleSide,
    });
    const leftPillar = new THREE.Mesh(leftPillarGeo, pillarMaterial);
    leftPillar.position.set(-this.stageWidth / 2 - 0.4, 0, 0.5);
    leftPillar.name = 'leftPillar';
    leftPillar.visible = false;
    this.scene.add(leftPillar);
    this.stageObjects.push(leftPillar);
    this.theaterElements.push(leftPillar);

    // Right curtain pillar
    const rightPillar = new THREE.Mesh(leftPillarGeo, new THREE.MeshBasicMaterial({
      color: 0x8b0000,
      side: THREE.DoubleSide,
    }));
    rightPillar.position.set(this.stageWidth / 2 + 0.4, 0, 0.5);
    rightPillar.name = 'rightPillar';
    rightPillar.visible = false;
    this.scene.add(rightPillar);
    this.stageObjects.push(rightPillar);
    this.theaterElements.push(rightPillar);

    // Proscenium arch (top beam)
    const archGeo = new THREE.PlaneGeometry(this.stageWidth + 1.6, 0.8);
    const archMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b0000,
      side: THREE.DoubleSide,
    });
    const arch = new THREE.Mesh(archGeo, archMaterial);
    arch.position.set(0, 6.4, 0.5);
    arch.name = 'prosceniumArch';
    arch.visible = false;
    this.scene.add(arch);
    this.stageObjects.push(arch);
    this.theaterElements.push(arch);

    return this.theaterElements;
  }

  /**
   * Enable theater aesthetic (show pillars and arch)
   */
  enableTheaterAesthetic() {
    this.theaterEnabled = true;
    if (this.theaterElements.length === 0) {
      this.createTheaterElements();
    }
    this.theaterElements.forEach(el => {
      el.visible = true;
    });
  }

  /**
   * Disable theater aesthetic (hide pillars and arch)
   */
  disableTheaterAesthetic() {
    this.theaterEnabled = false;
    this.theaterElements.forEach(el => {
      el.visible = false;
    });
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