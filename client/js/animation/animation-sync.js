/** Client Animation Synchronization
 * Receives animation commands from server and synchronizes local puppet playback.
 * Handles network latency compensation and smooth interpolation for late-synced animations.
 */

class ClientAnimationSync {
  /**
   * @param {Object} socket - Socket.io client socket instance with on() and emit() methods
   */
  constructor(socket) {
    this.socket = socket;

    // Map<puppetId, puppetInstance>
    this.puppets = new Map();

    // Map<puppetId, remoteState> - tracks what the server says is playing
    this.remoteStates = new Map();

    // Server time offset: serverTime = localTime + offset
    this.serverTimeOffset = 0;

    // Flag to avoid processing our own events
    this.isLocalRequest = false;

    // Bind handlers so we can remove them on stop
    this._onAnimationStarted = this._onAnimationStarted.bind(this);
    this._onAnimationStopped = this._onAnimationStopped.bind(this);
    this._onAnimationState = this._onAnimationState.bind(this);
    this._onAdminStartAnimation = this._onAdminStartAnimation.bind(this);
    this._onAdminStopAnimation = this._onAdminStopAnimation.bind(this);
  }

  // ============================================================
  // Public API - Puppet management
  // ============================================================

  /**
   * Register a puppet so it can receive remote animation commands
   * @param {string} puppetId
   * @param {Object} puppet - Puppet instance with playAnimation() / stopAnimation()
   */
  registerPuppet(puppetId, puppet) {
    this.puppets.set(puppetId, puppet);
  }

  /**
   * Unregister a puppet (e.g., when a player leaves)
   * @param {string} puppetId
   */
  unregisterPuppet(puppetId) {
    this.puppets.delete(puppetId);
    this.remoteStates.delete(puppetId);
  }

  /**
   * Get all registered puppets as a plain object
   * @returns {Object}
   */
  getPuppets() {
    const result = {};
    for (const [id, puppet] of this.puppets) {
      result[id] = puppet;
    }
    return result;
  }

  // ============================================================
  // Public API - Request animations from server
  // ============================================================

  /**
   * Ask the server to start an animation on the given puppet
   * @param {string} puppetId
   * @param {Object} animation - Animation config { id, name, duration, loop, keyframes }
   */
  requestStartAnimation(puppetId, animation) {
    this.isLocalRequest = true;
    this.socket.emit('start-animation', { puppetId, animation });
    this.isLocalRequest = false;
  }

  /**
   * Ask the server to stop the animation on the given puppet
   * @param {string} puppetId
   */
  requestStopAnimation(puppetId) {
    this.isLocalRequest = true;
    this.socket.emit('stop-animation', { puppetId });
    this.isLocalRequest = false;
  }

  // ============================================================
  // Public API - Remote state queries
  // ============================================================

  /**
   * Get the server-reported state for a puppet
   * @param {string} puppetId
   * @returns {Object|null}
   */
  getRemoteState(puppetId) {
    const state = this.remoteStates.get(puppetId);
    if (!state) return null;
    return { ...state };
  }

  /**
   * Get the estimated current server time (local + offset)
   * @returns {number}
   */
  getEstimatedServerTime() {
    return Date.now() + this.serverTimeOffset;
  }

  /**
   * Get the raw server-time offset
   * @returns {number}
   */
  getServerTimeOffset() {
    return this.serverTimeOffset;
  }

  // ============================================================
  // Public API - Listen lifecycle
  // ============================================================

  /**
   * Attach all socket listeners for animation sync events
   */
  startListening() {
    this.socket.on('animation-started', this._onAnimationStarted);
    this.socket.on('animation-stopped', this._onAnimationStopped);
    this.socket.on('animation-state', this._onAnimationState);
    this.socket.on('admin-start-animation', this._onAdminStartAnimation);
    this.socket.on('admin-stop-animation', this._onAdminStopAnimation);
  }

  /**
   * Remove all socket listeners
   */
  stopListening() {
    this.socket.off('animation-started', this._onAnimationStarted);
    this.socket.off('animation-stopped', this._onAnimationStopped);
    this.socket.off('animation-state', this._onAnimationState);
    this.socket.off('admin-start-animation', this._onAdminStartAnimation);
    this.socket.off('admin-stop-animation', this._onAdminStopAnimation);
  }

  // ============================================================
  // Private - Event handlers
  // ============================================================

  /**
   * @param {{ puppetId, animation, serverTime, currentTime }} data
   */
  _onAnimationStarted(data) {
    const { puppetId, animation, serverTime, currentTime } = data;

    // Update server time offset for latency compensation
    if (serverTime) {
      this.serverTimeOffset = serverTime - Date.now();
    }

    // Store remote state
    this.remoteStates.set(puppetId, {
      animationId: animation.id,
      duration: animation.duration,
      loop: animation.loop,
      startTime: Date.now(),
      initialTime: currentTime || 0,
    });

    // Play on local puppet
    const puppet = this.puppets.get(puppetId);
    if (puppet) {
      puppet.playAnimation(animation);
    }
  }

  /**
   * @param {{ puppetId }} data
   */
  _onAnimationStopped(data) {
    const { puppetId } = data;

    // Clear remote state
    this.remoteStates.delete(puppetId);

    // Stop on local puppet
    const puppet = this.puppets.get(puppetId);
    if (puppet) {
      puppet.stopAnimation();
    }
  }

  /**
   * Periodic state sync - update remote state & seek if drift is large
   * @param {{ puppetId, animation, currentTime, serverTime }} data
   */
  _onAnimationState(data) {
    const { puppetId, animation, currentTime, serverTime } = data;

    if (serverTime) {
      this.serverTimeOffset = serverTime - Date.now();
    }

    // Update or create remote state
    this.remoteStates.set(puppetId, {
      animationId: animation.id,
      duration: animation.duration,
      loop: animation.loop,
      serverCurrentTime: currentTime,
    });
  }

  /**
   * Admin forced animation start - same as animation-started but authoritative
   * @param {{ puppetId, animation, serverTime, currentTime }} data
   */
  _onAdminStartAnimation(data) {
    // Reuse the same handler logic
    this._onAnimationStarted(data);
  }

  /**
   * Admin forced animation stop - same as animation-stopped but authoritative
   * @param {{ puppetId }} data
   */
  _onAdminStopAnimation(data) {
    this._onAnimationStopped(data);
  }
}

export default ClientAnimationSync;