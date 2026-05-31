/** PuppetPals Game State Manager
 * Tracks all player states: position, animation, puppet config, and lock status
 * Manages predefined stage locations and state synchronization
 */

class GameState {
  /**
   * Initialize the GameState with all network optimization features
   */
  constructor() {
    // Delta/broadcast caching
    this._cachedStates = {};
    // Throttle control: default 50ms = 20Hz max
    this._throttleInterval = 50;
    this._lastUpdateTimes = new Map();
    // Animation batching buffer
    this._animationBatch = [];
    // Connection quality ping history (max 10 entries per player)
    this._pingHistory = new Map();
    this._maxPingHistory = 10;
    // Animation time tracking for drift correction
    this._animationTimes = new Map();
    // Slot-based stage positioning
    this.onScreenSlotCount = 5;
    this._stageWidth = 16;
    this._stageHeight = 9;
    this._puppetWidth = 2;
  }

  /**
   * Pre-defined stage locations for puppet positioning
   * @returns {Object} Stage location definitions
   */
  getStageLocations() {
    return {
      center:        { x: 0, y: 0, z: 0 },
      stageLeft:     { x: -5, y: 0, z: 0 },
      stageRight:    { x: 5, y: 0, z: 0 },
      upstageLeft:   { x: -5, y: 0, z: -4 },
      upstageRight:  { x: 5, y: 0, z: -4 },
      downstageLeft: { x: -5, y: 0, z: 4 },
      downstageRight:{ x: 5, y: 0, z: 4 },
    };
  }

  /**
   * Create a default player state object
   * @param {string} playerId - The player's session ID
   * @param {string} puppetId - The puppet identifier
   * @param {string} [nickname] - Optional player nickname
   * @returns {Object} Default player state
   */
  _createDefaultState(playerId, puppetId, nickname) {
    return {
      playerId,
      puppetId,
      nickname: nickname || '',
      position: { x: 0, y: 0, z: 0 },
      currentAnimation: null,
      puppetConfig: null,
      isLocked: false,
      currentSlotIndex: 2, // Default to first on-screen slot (index 2)
      facingDirection: 'right', // Default facing direction
      isTransitioning: false, // Whether currently in a movement transition
    };
  }

  /**
   * Deep clone an object using JSON serialization
   * @param {Object} obj - The object to clone
   * @returns {Object} A deep copy
   */
  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Register a new player or update an existing player's registration
   * @param {string} playerId - The player's session ID
   * @param {string} puppetId - The puppet identifier
   * @param {string} [nickname] - Optional player nickname
   */
  registerPlayer(playerId, puppetId, nickname) {
    this.players = this.players || new Map();
    this.players.set(playerId, this._createDefaultState(playerId, puppetId, nickname));
  }

  /**
   * Unregister a player (called on disconnect)
   * @param {string} playerId - The player's session ID
   * @returns {boolean} True if a player was removed
   */
  unregisterPlayer(playerId) {
    if (!this.players) return false;
    return this.players.delete(playerId);
  }

  /**
   * Move a player to a predefined stage location
   * @param {string} playerId - The player's session ID
   * @param {string} location - The predefined location key
   * @returns {boolean} True if moved successfully
   */
  movePlayer(playerId, location) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    const locations = this.getStageLocations();
    const target = locations[location];
    if (!target) return false;

    player.position.x = target.x;
    player.position.z = target.z;
    return true;
  }

  /**
   * Move a player to exact coordinates
   * @param {string} playerId - The player's session ID
   * @param {number} x - X coordinate
   * @param {number} z - Z coordinate
   * @returns {boolean} True if moved successfully
   */
  movePlayerTo(playerId, x, z) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    player.position.x = x;
    player.position.z = z;
    return true;
  }

  /**
   * Set the current animation for a player
   * @param {string} playerId - The player's session ID
   * @param {Object|null} animation - The animation object or null to clear
   * @returns {boolean} True if set successfully
   */
  setAnimation(playerId, animation) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    player.currentAnimation = animation || null;
    return true;
  }

  /**
   * Lock a player's puppet (prevent owner control)
   * @param {string} playerId - The player's session ID
   * @returns {boolean} True if locked successfully
   */
  lockPlayer(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    player.isLocked = true;
    return true;
  }

  /**
   * Unlock a player's puppet (restore owner control)
   * @param {string} playerId - The player's session ID
   * @returns {boolean} True if unlocked successfully
   */
  unlockPlayer(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    player.isLocked = false;
    return true;
  }

  /**
   * Set puppet configuration for a player
   * @param {string} playerId - The player's session ID
   * @param {Object} config - The puppet skeleton configuration
   * @returns {boolean} True if set successfully
   */
  setPuppetConfig(playerId, config) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    player.puppetConfig = config;
    return true;
  }

  /**
   * Get a deep copy of a player's state
   * @param {string} playerId - The player's session ID
   * @returns {Object|null} Player state or null if not found
   */
  getPlayerState(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return null;

    return this._deepClone(player);
  }

  /**
   * Get deep copies of all player states keyed by playerId
   * @returns {Object} All player states
   */
  getAllPlayerStates() {
    if (!this.players) return {};

    const states = {};
    for (const [playerId, player] of this.players) {
      states[playerId] = this._deepClone(player);
    }
    return states;
  }

  /**
   * Create a full snapshot of the game state (alias for getAllPlayerStates)
   * @returns {Object} Full state snapshot
   */
  createStateSnapshot() {
    return this.getAllPlayerStates();
  }

  /**
   * Find a player ID by their puppet ID
   * @param {string} puppetId - The puppet identifier
   * @returns {string|null} Player ID or null if not found
   */
  getPlayerByPuppetId(puppetId) {
    if (!this.players) return null;

    for (const [playerId, player] of this.players) {
      if (player.puppetId === puppetId) {
        return playerId;
      }
    }
    return null;
  }

  /**
   * Get the internal players Map reference (for broadcast integration)
   * @returns {Map} The players Map
   */
  getPlayersMap() {
    return this.players;
  }

  /**
   * Set a raw property on a player's state directly (bypasses deep clone)
   * @param {string} playerId - The player's session ID
   * @param {string} key - The property key to set
   * @param {*} value - The value to set
   * @returns {boolean} True if set successfully
   */
  _rawSet(playerId, key, value) {
    const player = this.players?.get(playerId);
    if (!player) return false;
    player[key] = value;
    return true;
  }

  // ============================================================
  // State Delta Updates
  // ============================================================

  /**
   * Update cached states for all players (snapshots current state)
   */
  updateCachedStates() {
    if (!this.players) return;
    this._cachedStates = {};
    for (const [playerId, player] of this.players) {
      this._cachedStates[playerId] = this._deepClone(player);
    }
  }

  /**
   * Get the current cached states
   * @returns {Object} Cached states keyed by playerId
   */
  getCachedStates() {
    return this._cachedStates;
  }

  /**
   * Compute the delta between a cached state and the current state for a player
   * @param {string} playerId - The player's session ID
   * @param {Object} cachedState - The previously cached state to compare against
   * @returns {Object|null} Delta object with only changed fields, or null if player not found
   */
  computeDelta(playerId, cachedState) {
    const current = this.players?.get(playerId);
    if (!current) return null;

    const delta = {};

    // Compare position
    if (!this._deepEqual(cachedState.position, current.position)) {
      delta.position = {
        old: this._deepClone(cachedState.position),
        new: this._deepClone(current.position),
      };
    }

    // Compare currentAnimation
    if (!this._deepEqual(cachedState.currentAnimation, current.currentAnimation)) {
      delta.currentAnimation = {
        old: this._deepClone(cachedState.currentAnimation),
        new: this._deepClone(current.currentAnimation),
      };
    }

    // Compare isLocked
    if (cachedState.isLocked !== current.isLocked) {
      delta.isLocked = {
        old: cachedState.isLocked,
        new: current.isLocked,
      };
    }

    // Compare puppetConfig
    if (!this._deepEqual(cachedState.puppetConfig, current.puppetConfig)) {
      delta.puppetConfig = {
        old: this._deepClone(cachedState.puppetConfig),
        new: this._deepClone(current.puppetConfig),
      };
    }

    // Compare currentSlotIndex
    if (cachedState.currentSlotIndex !== current.currentSlotIndex) {
      delta.currentSlotIndex = {
        old: cachedState.currentSlotIndex,
        new: current.currentSlotIndex,
      };
    }

    // Compare facingDirection
    if (cachedState.facingDirection !== current.facingDirection) {
      delta.facingDirection = {
        old: cachedState.facingDirection,
        new: current.facingDirection,
      };
    }

    // Compare isTransitioning
    if (cachedState.isTransitioning !== current.isTransitioning) {
      delta.isTransitioning = {
        old: cachedState.isTransitioning,
        new: current.isTransitioning,
      };
    }

    return delta;
  }

  /**
   * Deep equality check for two values
   * @param {*} a - First value
   * @param {*} b - Second value
   * @returns {boolean} True if deeply equal
   */
  _deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /**
   * Broadcast delta updates only for players whose state changed since last cache
   * @param {Object} io - The Socket.io server instance
   */
  broadcastDeltaOnly(io) {
    if (!this.players) return;

    for (const [playerId, player] of this.players) {
      const cached = this._cachedStates[playerId];
      if (!cached) continue;

      const delta = this.computeDelta(playerId, cached);
      // Only broadcast if something actually changed
      if (delta && Object.keys(delta).length > 0) {
        io.emit('state-delta-update', {
          playerId,
          puppetId: player.puppetId,
          delta,
        });
      }
    }

    // Update cache after broadcast
    this.updateCachedStates();
  }

  // ============================================================
  // Throttled Position Updates
  // ============================================================

  /**
   * Set the throttle interval in milliseconds (default 50ms = 20Hz)
   * @param {number} intervalMs - Throttle interval
   */
  setThrottleInterval(intervalMs) {
    this._throttleInterval = intervalMs;
  }

  /**
   * Check if a player's update can be broadcast (not throttled)
   * @param {string} playerId - The player's session ID
   * @returns {boolean} True if update is allowed
   */
  canBroadcastUpdate(playerId) {
    const lastTime = this._lastUpdateTimes.get(playerId) || 0;
    const now = Date.now();
    return (now - lastTime) >= this._throttleInterval;
  }

  /**
   * Record that an update was broadcast for a player
   * @param {string} playerId - The player's session ID
   */
  recordUpdate(playerId) {
    this._lastUpdateTimes.set(playerId, Date.now());
  }

  /**
   * Get the last update time for a player
   * @param {string} playerId - The player's session ID
   * @returns {number} Timestamp in ms, 0 if never updated
   */
  getLastUpdateTime(playerId) {
    return this._lastUpdateTimes.get(playerId) || 0;
  }

  // ============================================================
  // Animation State Batching
  // ============================================================

  /**
   * Queue an animation update in the batch buffer
   * @param {string} puppetId - The puppet identifier
   * @param {Object} update - The animation update data
   */
  queueAnimationUpdate(puppetId, update) {
    // Remove any existing entry for this puppet (last update wins)
    const existingIndex = this._animationBatch.findIndex(item => item.puppetId === puppetId);
    if (existingIndex !== -1) {
      this._animationBatch.splice(existingIndex, 1);
    }

    this._animationBatch.push({
      puppetId,
      update,
      timestamp: Date.now(),
    });
  }

  /**
   * Flush the animation batch buffer and return all queued updates
   * @returns {Array} Array of batched animation updates
   */
  flushAnimationBatch() {
    const batch = [...this._animationBatch];
    this._animationBatch = [];
    return batch;
  }

  // ============================================================
  // Connection Quality Indicator
  // ============================================================

  /**
   * Record a ping measurement for a player
   * @param {string} playerId - The player's session ID
   * @param {number} pingMs - Ping time in milliseconds
   */
  recordPing(playerId, pingMs) {
    if (!this._pingHistory.has(playerId)) {
      this._pingHistory.set(playerId, []);
    }
    const history = this._pingHistory.get(playerId);
    history.push(pingMs);
    // Limit history size to prevent memory leaks
    if (history.length > this._maxPingHistory) {
      history.shift();
    }
  }

  /**
   * Get the average ping for a player
   * @param {string} playerId - The player's session ID
   * @returns {number} Average ping in ms, 0 if no data
   */
  getAveragePing(playerId) {
    const history = this._pingHistory.get(playerId);
    if (!history || history.length === 0) return 0;
    const sum = history.reduce((acc, val) => acc + val, 0);
    return sum / history.length;
  }

  /**
   * Classify connection quality based on average ping
   * @param {string} playerId - The player's session ID
   * @returns {string} 'excellent' (<50ms), 'good' (50-100ms), 'poor' (100-200ms), 'critical' (>200ms), or 'unknown'
   */
  getConnectionQuality(playerId) {
    const avg = this.getAveragePing(playerId);
    if (avg === 0) return 'unknown';
    if (avg < 50) return 'excellent';
    if (avg < 100) return 'good';
    if (avg < 200) return 'poor';
    return 'critical';
  }

  // ============================================================
  // Animation Sync Drift Correction
  // ============================================================

  /**
   * Set animation timing info for drift tracking
   * @param {string} playerId - The player's session ID
   * @param {number} serverTime - Server animation time
   * @param {number} clientTime - Client reported animation time
   */
  setAnimationTime(playerId, serverTime, clientTime) {
    this._animationTimes.set(playerId, { serverTime, clientTime });
  }

  /**
   * Get the animation drift (difference between client and server time)
   * @param {string} playerId - The player's session ID
   * @returns {number|null} Drift in ms, or null if no animation tracked
   */
  getAnimationDrift(playerId) {
    const timing = this._animationTimes.get(playerId);
    if (!timing) return null;
    return Math.abs(timing.clientTime - timing.serverTime);
  }

  /**
   * Check if animation resync is needed based on drift tolerance
   * @param {string} playerId - The player's session ID
   * @param {number} toleranceMs - Maximum allowed drift in ms (default 200)
   * @returns {boolean} True if resync is needed
   */
  needsAnimationResync(playerId, toleranceMs = 200) {
    const drift = this.getAnimationDrift(playerId);
    if (drift === null) return false;
    return drift > toleranceMs;
  }

  // ============================================================
  // Asset Loading Fallback
  // ============================================================

  /**
   * Get the default puppet configuration (fallback when loading fails)
   * @returns {Object} Default puppet skeleton config
   */
  getDefaultPuppetConfig() {
    return {
      name: 'Default Puppet',
      bones: [
        {
          id: 'torso',
          name: 'Torso',
          parentId: null,
          asset: 'torso.png',
          position: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1 },
        },
        {
          id: 'head',
          name: 'Head',
          parentId: 'torso',
          asset: 'head.png',
          socketOffset: { x: 0, y: 1.2 },
          scale: { x: 0.8, y: 0.8 },
        },
        {
          id: 'upper-arm-l',
          name: 'Upper Arm Left',
          parentId: 'torso',
          asset: 'upper-arm-l.png',
          socketOffset: { x: -0.8, y: 0.5 },
          scale: { x: 0.5, y: 0.8 },
        },
        {
          id: 'upper-arm-r',
          name: 'Upper Arm Right',
          parentId: 'torso',
          asset: 'upper-arm-r.png',
          socketOffset: { x: 0.8, y: 0.5 },
          scale: { x: 0.5, y: 0.8 },
        },
        {
          id: 'upper-leg-l',
          name: 'Upper Leg Left',
          parentId: 'torso',
          asset: 'upper-leg-l.png',
          socketOffset: { x: -0.4, y: -0.8 },
          scale: { x: 0.5, y: 0.8 },
        },
        {
          id: 'upper-leg-r',
          name: 'Upper Leg Right',
          parentId: 'torso',
          asset: 'upper-leg-r.png',
          socketOffset: { x: 0.4, y: -0.8 },
          scale: { x: 0.5, y: 0.8 },
        },
      ],
    };
  }

  /**
   * Resolve a puppet config, falling back to default if invalid
   * @param {string} playerId - The player's session ID
   * @param {Object|null} config - The puppet config to validate
   * @returns {Object} Valid puppet config (either provided or default)
   */
  resolvePuppetConfig(playerId, config) {
    if (config && config.name && Array.isArray(config.bones) && config.bones.length > 0) {
      return config;
    }
    return this.getDefaultPuppetConfig();
  }

  // ============================================================
  // Slot-Based Stage Positioning
  // ============================================================

  /**
   * Calculate all slot positions based on current onScreenSlotCount
   * @returns {Array} Array of location objects
   */
  _calculateSlotPositions() {
    const locations = [];
    const floorY = -this._stageHeight * 0.35;

    // Off-screen slots (indices 0 and 1)
    locations.push({
      id: 'offscreen-far-left',
      x: -this._stageWidth / 2 - this._puppetWidth * 1.5,
      y: floorY,
      z: 0,
      isOffScreen: true,
      label: 'Off-screen (far left)',
    });

    locations.push({
      id: 'offscreen-left',
      x: -this._stageWidth / 2 - this._puppetWidth * 0.5,
      y: floorY,
      z: 0,
      isOffScreen: true,
      label: 'Off-screen (left)',
    });

    // On-screen slots (indices 2+)
    const slotWidth = this._stageWidth / this.onScreenSlotCount;
    for (let i = 0; i < this.onScreenSlotCount; i++) {
      const x = -this._stageWidth / 2 + slotWidth * (i + 0.5);
      locations.push({
        id: `slot-${i}`,
        x,
        y: floorY,
        z: 0,
        isOffScreen: false,
        label: `Slot ${i}`,
      });
    }

    return locations;
  }

  /**
   * Get calculated slot positions for current onScreenSlotCount
   * @returns {Array} Array of location objects
   */
  getSlotPositions() {
    return this._calculateSlotPositions();
  }

  /**
   * Get current slot index for a player
   * @param {string} playerId - The player's session ID
   * @returns {number} Current slot index, -1 if player not found
   */
  getPlayerSlotIndex(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return -1;
    return player.currentSlotIndex;
  }

  /**
   * Set number of on-screen slots (admin-controlled)
   * @param {number} count - New on-screen slot count (clamped to 2-10)
   */
  setOnScreenSlotCount(count) {
    this.onScreenSlotCount = Math.max(2, Math.min(10, count));
    // Clamp existing player slot indices to new total
    if (!this.players) return;
    const slots = this.getSlotPositions();
    const maxIndex = slots.length - 1;
    for (const [playerId, player] of this.players) {
      if (player.currentSlotIndex > maxIndex) {
        player.currentSlotIndex = maxIndex;
      }
    }
  }

  /**
   * Move a player one slot in the given direction with wrap-around
   * @param {string} playerId - The player's session ID
   * @param {'left'|'right'} direction - Movement direction
   * @returns {Object|false} Move details { playerId, fromIndex, toIndex, direction } or false if transitioning
   */
  movePlayerDirection(playerId, direction) {
    const player = this.players?.get(playerId);
    if (!player) return false;
    if (direction !== 'left' && direction !== 'right') return false;

    // Block movement if already transitioning
    if (player.isTransitioning) return false;

    const slots = this.getSlotPositions();
    const total = slots.length;
    const fromIndex = player.currentSlotIndex;

    let toIndex;
    if (direction === 'right') {
      toIndex = (fromIndex + 1) % total;
    } else {
      toIndex = (fromIndex - 1 + total) % total;
    }

    player.currentSlotIndex = toIndex;
    player.facingDirection = direction;
    player.isTransitioning = true;
    const targetSlot = slots[toIndex];
    player.position.x = targetSlot.x;
    player.position.y = targetSlot.y;
    player.position.z = targetSlot.z;

    return {
      playerId,
      fromIndex,
      toIndex,
      direction,
    };
  }

  /**
   * Complete a transition for a player (set isTransitioning to false)
   * @param {string} playerId - The player's session ID
   * @returns {boolean} True if transition was completed
   */
  completeTransition(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return false;
    player.isTransitioning = false;
    return true;
  }

  /**
   * Get the clamped slot index for a player based on current slot count
   * @param {string} playerId - The player's session ID
   * @returns {number} Clamped slot index
   */
  getClampedSlotIndex(playerId) {
    const player = this.players?.get(playerId);
    if (!player) return 0;
    const slots = this.getSlotPositions();
    const maxIndex = slots.length - 1;
    return Math.min(player.currentSlotIndex, maxIndex);
  }

  /**
   * Move a player to a specific slot index
   * @param {string} playerId - The player's session ID
   * @param {number} slotIndex - The target slot index
   * @returns {boolean} True if moved successfully
   */
  movePlayerToSlot(playerId, slotIndex) {
    const player = this.players?.get(playerId);
    if (!player) return false;

    const slots = this.getSlotPositions();
    if (slotIndex < 0 || slotIndex >= slots.length) return false;

    player.currentSlotIndex = slotIndex;
    const targetSlot = slots[slotIndex];
    player.position.x = targetSlot.x;
    player.position.y = targetSlot.y;
    player.position.z = targetSlot.z;

    return true;
  }
}

export default GameState;
