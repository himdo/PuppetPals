/** PuppetPals Game State Manager
 * Tracks all player states: position, animation, puppet config, and lock status
 * Manages predefined stage locations and state synchronization
 */

class GameState {
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
}

export default GameState;