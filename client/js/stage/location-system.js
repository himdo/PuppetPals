/** Location System
 * Manages slot-based stage positioning with a circular cycle of locations.
 * Supports configurable on-screen slots and 2 off-screen positions to the left.
 */

class LocationSystem {
  /**
   * @param {number} [stageWidth=16] - Stage width in world units
   * @param {number} [stageHeight=9] - Stage height in world units
   */
  constructor(stageWidth = 16, stageHeight = 9) {
    this.onScreenCount = 5;
    this.stageWidth = stageWidth;
    this.stageHeight = stageHeight;
    this.puppetWidth = 2; // Default puppet width in world units
    this.locations = [];
    // Map of puppetId -> slot index
    this._puppetAssignments = new Map();
  }

  /**
   * Recalculate all slot positions based on current onScreenCount and viewport.
   */
  calculatePositions() {
    this.locations = [];

    // Off-screen slots first (indices 0 and 1)
    const offscreenFarLeftX = -this.stageWidth / 2 - this.puppetWidth * 1.5;
    const offscreenLeftX = -this.stageWidth / 2 - this.puppetWidth * 0.5;
    const floorY = -this.stageHeight * 0.35;

    this.locations.push({
      id: 'offscreen-far-left',
      x: offscreenFarLeftX,
      y: floorY,
      z: 0,
      isOffScreen: true,
      label: 'Off-screen (far left)',
    });

    this.locations.push({
      id: 'offscreen-left',
      x: offscreenLeftX,
      y: floorY,
      z: 0,
      isOffScreen: true,
      label: 'Off-screen (left)',
    });

    // On-screen slots (indices 2+)
    const slotWidth = this.stageWidth / this.onScreenCount;
    for (let i = 0; i < this.onScreenCount; i++) {
      const x = -this.stageWidth / 2 + slotWidth * (i + 0.5);
      this.locations.push({
        id: `slot-${i}`,
        x,
        y: floorY,
        z: 0,
        isOffScreen: false,
        label: `Slot ${i}`,
      });
    }
  }

  /**
   * Get location by cycle index (0 to total-1).
   * @param {number} index - The cycle index
   * @returns {Object|null} Location object or null if out of range
   */
  getLocation(index) {
    if (index < 0 || index >= this.locations.length) return null;
    return this.locations[index];
  }

  /**
   * Get next location in the given direction with wrap-around.
   * @param {number} index - Current cycle index
   * @param {'left'|'right'} direction - Movement direction
   * @returns {Object|null} Object with { index, location } or null if invalid
   */
  getNextLocation(index, direction) {
    if (index < 0 || index >= this.locations.length) return null;
    if (direction !== 'left' && direction !== 'right') return null;

    const total = this.locations.length;
    let newIndex;

    if (direction === 'right') {
      newIndex = (index + 1) % total;
    } else {
      newIndex = (index - 1 + total) % total;
    }

    return {
      index: newIndex,
      location: this.locations[newIndex],
    };
  }

  /**
   * Assign a puppet to a slot index.
   * @param {string} puppetId - The puppet identifier
   * @param {number} slotIndex - The cycle index to assign
   */
  assignPuppetToSlot(puppetId, slotIndex) {
    this._puppetAssignments.set(puppetId, slotIndex);
  }

  /**
   * Get current location of a puppet by its ID.
   * @param {string} puppetId - The puppet identifier
   * @returns {Object|null} Object with { index, location } or null if not assigned
   */
  getLocationByPuppetId(puppetId) {
    const index = this._puppetAssignments.get(puppetId);
    if (index === undefined) return null;
    const location = this.getLocation(index);
    if (!location) return null;
    return { index, location };
  }

  /**
   * Update number of on-screen slots and recalculate all positions.
   * @param {number} count - New on-screen slot count (clamped to 2-10)
   */
  setOnScreenCount(count) {
    this.onScreenCount = Math.max(2, Math.min(10, count));
    this.calculatePositions();
  }

  /**
   * Return all locations.
   * @returns {Array} All location objects
   */
  getAllLocations() {
    return this.locations;
  }
}

export default LocationSystem;
