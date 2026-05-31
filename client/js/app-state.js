/** PuppetPals Client Application State
 * Mirrors server game state on the client side
 * Handles receiving state updates and emitting local events
 */

class AppState {
  constructor() {
    /** @type {string|null} */
    this.localPlayerId = null;
    /** @type {string|null} */
    this.localPuppetId = null;
    /** @type {string|null} */
    this.localNickname = null;
    /** @type {Object|null} */
    this.socketClient = null;

    /** @type {Object<string, Object>} Player states keyed by playerId */
    this.players = {};

    /** @type {Object<string, Array<Function>>} Event listeners */
    this._listeners = {};

    // Slot-based movement state (Request 19)
    /** @type {number} Button cooldown in milliseconds */
    this.buttonCooldownMs = 500;
    /** @type {boolean} Whether movement buttons are enabled */
    this.buttonsEnabled = true;
    /** @type {number|null} Current slot index for local player */
    this.currentSlotIndex = null;
    /** @type {number} Number of on-screen slots */
    this.onScreenSlotCount = 5;
  }

  // ============================================================
  // Simple Event Emitter
  // ============================================================

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param  {...*} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const callback of this._listeners[event]) {
      try {
        callback(...args);
      } catch (e) {
        console.error(`[AppState] Error in event listener for '${event}':`, e);
      }
    }
  }

  // ============================================================
  // Socket Client Setup
  // ============================================================

  /**
   * Set the socket client reference
   * @param {Object} socketClient - The socket.io client instance
   */
  setSocketClient(socketClient) {
    this.socketClient = socketClient;
  }

  /**
   * Set the local player identity after joining
   * @param {string} playerId - The player's session ID
   * @param {string} puppetId - The puppet identifier
   * @param {string} nickname - The player's nickname
   */
  setLocalPlayer(playerId, puppetId, nickname) {
    this.localPlayerId = playerId;
    this.localPuppetId = puppetId;
    this.localNickname = nickname;
  }

  /**
   * Set up socket event listeners for state synchronization
   */
  setupSocketListeners() {
    if (!this.socketClient) {
      console.warn('[AppState] No socket client set up for listeners');
      return;
    }

    // Full state sync on connect
    this.socketClient.on('state-sync', (data) => {
      this.applyFullStateSync(data);
      this.emit('stateSynced', data);
    });

    // Incremental state updates
    this.socketClient.on('state-update', (data) => {
      this.applyStateUpdate(data);
      this.emit('playerUpdated', data.playerId);
    });

    // Puppet movement broadcast
    this.socketClient.on('puppet-moved', (data) => {
      this.applyStateUpdate(data);
      this.emit('puppetMoved', data);
    });

    // Slot-based movement (Request 19)
    this.socketClient.on('slot-moved', (data) => {
      // Update player state with new slot info
      if (data.playerId && data.toIndex !== undefined) {
        if (!this.players[data.playerId]) {
          this.players[data.playerId] = {};
        }
        this.players[data.playerId].currentSlotIndex = data.toIndex;
        this.players[data.playerId].facingDirection = data.direction || this.players[data.playerId].facingDirection;

        // Update local player's slot index
        if (data.playerId === this.localPlayerId) {
          this.currentSlotIndex = data.toIndex;
        }
      }
      this.emit('slotMoved', data);
    });

    // Stage config update (Request 19)
    this.socketClient.on('stage-config-update', (data) => {
      if (data.onScreenSlotCount !== undefined) {
        this.onScreenSlotCount = data.onScreenSlotCount;
      }
      this.emit('stageConfigUpdated', data);
    });
  }

  // ============================================================
  // State Synchronization
  // ============================================================

  /**
   * Apply a full state sync from the server
   * @param {Object} stateData - All player states keyed by playerId
   */
  applyFullStateSync(stateData) {
    this.players = {};
    for (const [playerId, state] of Object.entries(stateData)) {
      this.players[playerId] = JSON.parse(JSON.stringify(state));
    }
  }

  /**
   * Apply an incremental state update for a single player
   * @param {Object} updateData - The update data
   */
  applyStateUpdate(updateData) {
    const { playerId, _remove, ...updates } = updateData;

    if (_remove) {
      delete this.players[playerId];
      return;
    }

    if (!this.players[playerId]) {
      this.players[playerId] = {};
    }

    // Merge updates into existing player state
    for (const [key, value] of Object.entries(updates)) {
      this.players[playerId][key] = JSON.parse(JSON.stringify(value));
    }
  }

  // ============================================================
  // State Accessors
  // ============================================================

  /**
   * Get a deep copy of a player's state
   * @param {string} playerId - The player's session ID
   * @returns {Object|null} Player state or null if not found
   */
  getPlayer(playerId) {
    if (!this.players[playerId]) return null;
    return JSON.parse(JSON.stringify(this.players[playerId]));
  }

  /**
   * Get deep copies of all player states
   * @returns {Object} All player states keyed by playerId
   */
  getAllPlayers() {
    const result = {};
    for (const [playerId, state] of Object.entries(this.players)) {
      result[playerId] = JSON.parse(JSON.stringify(state));
    }
    return result;
  }

  /**
   * Get the local player's state from the synced data
   * @returns {Object|null} Local player state or null
   */
  getLocalPlayerState() {
    if (!this.localPlayerId) return null;
    return this.getPlayer(this.localPlayerId);
  }

  /**
   * Check if the local player's puppet is locked
   * @returns {boolean} True if locked
   */
  isLocalPlayerLocked() {
    if (!this.localPlayerId) return false;
    const state = this.players[this.localPlayerId];
    return state ? state.isLocked : false;
  }

  // ============================================================
  // Movement Requests
  // ============================================================

  /**
   * Request to move the local puppet to a predefined stage location
   * @param {string} location - The predefined location key
   */
  requestMove(location) {
    if (!this.socketClient || !this.localPlayerId || !this.localPuppetId) return;

    this.socketClient.emit('move-puppet', {
      puppetId: this.localPuppetId,
      location,
    });
  }

  /**
   * Request to move the local puppet to exact coordinates
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   */
  requestMoveTo(x, z) {
    if (!this.socketClient || !this.localPlayerId || !this.localPuppetId) return;

    this.socketClient.emit('move-puppet', {
      puppetId: this.localPuppetId,
      x,
      z,
    });
  }

  // ============================================================
  // Direction Movement (Request 19)
  // ============================================================

  /**
   * Request to move the local puppet one slot in the given direction
   * @param {'left'|'right'} direction - Movement direction
   */
  requestMoveDirection(direction) {
    if (!this.socketClient || !this.localPlayerId) return;
    if (!this.buttonsEnabled) return;

    // Emit move-direction event
    this.socketClient.emit('move-direction', {
      direction,
    });

    // Disable buttons during cooldown
    this.buttonsEnabled = false;
    setTimeout(() => {
      this.buttonsEnabled = true;
    }, this.buttonCooldownMs);
  }

  /**
   * Check if the local puppet is currently off-screen
   * @returns {boolean} True if off-screen
   */
  isOffScreen() {
    if (this.currentSlotIndex === null) return false;
    // Off-screen slots are indices 0 and 1
    return this.currentSlotIndex < 2;
  }

  /**
   * Get the nearest on-screen slot index
   * @returns {number} The nearest on-screen slot index (always 2, the first on-screen slot)
   */
  getNearestOnScreenSlot() {
    if (this.currentSlotIndex === null) return 2;
    // If already on-screen, return current
    if (this.currentSlotIndex >= 2) return this.currentSlotIndex;
    // Off-screen slots (0, 1) - nearest on-screen is always slot 2
    return 2;
  }

  /**
   * Request to move the puppet to the nearest on-screen slot
   * Emits move-direction events as needed
   */
  requestMoveOnStage() {
    if (!this.isOffScreen()) return;
    // Move right to get on-screen (off-screen slots are to the left)
    this.requestMoveDirection('right');
  }

  // ============================================================
  // Stage Locations
  // ============================================================

  /**
   * Get predefined stage locations
   * @returns {Object} Stage location definitions
   */
  getStageLocations() {
    return {
      center:         { x: 0, y: 0, z: 0 },
      stageLeft:      { x: -5, y: 0, z: 0 },
      stageRight:     { x: 5, y: 0, z: 0 },
      upstageLeft:    { x: -5, y: 0, z: -4 },
      upstageRight:   { x: 5, y: 0, z: -4 },
      downstageLeft:  { x: -5, y: 0, z: 4 },
      downstageRight: { x: 5, y: 0, z: 4 },
    };
  }
}

export default AppState;