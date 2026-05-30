/** Animation Synchronization - Server-side animation state tracking
 * Tracks which animation each puppet is playing, manages playback time,
 * and provides state updates for client synchronization
 */

class AnimationSync {
  constructor() {
    // Map<puppetId, animationState>
    this.activeAnimations = new Map();
  }

  /**
   * Start an animation for a puppet
   * @param {string} puppetId - The puppet identifier
   * @param {string} requesterId - The socket/session ID of who requested
   * @param {Object} animationConfig - Animation object with id, name, duration, loop, keyframes
   * @param {boolean} isOwnerControlled - Whether the puppet owner requested this
   * @returns {Object} The animation state that was created
   */
  startAnimation(puppetId, requesterId, animationConfig, isOwnerControlled = true) {
    const now = Date.now();

    const state = {
      puppetId,
      ownerId: requesterId,
      animationId: animationConfig.id,
      animationConfig,
      startTime: now,
      elapsedTime: 0,
      isOwnerControlled,
      isPlaying: true,
    };

    this.activeAnimations.set(puppetId, state);

    return state;
  }

  /**
   * Stop an animation for a puppet
   * @param {string} puppetId - The puppet identifier
   */
  stopAnimation(puppetId) {
    this.activeAnimations.delete(puppetId);
  }

  /**
   * Get the current playback state for a specific puppet
   * @param {string} puppetId - The puppet identifier
   * @returns {Object|null} Animation state or null if not playing
   */
  getCurrentState(puppetId) {
    const state = this.activeAnimations.get(puppetId);
    if (!state) return null;

    const config = state.animationConfig;
    let currentTime = state.elapsedTime;

    // Calculate current time based on loop behavior
    if (config.loop && currentTime > config.duration) {
      currentTime = currentTime % config.duration;
    }

    return {
      puppetId,
      animationId: state.animationId,
      isPlaying: state.isPlaying,
      currentTime,
      duration: config.duration,
      loop: config.loop,
      isOwnerControlled: state.isOwnerControlled,
      keyframes: config.keyframes,
    };
  }

  /**
   * Get all active animation states (full internal state for server use)
   * @returns {Object} Map of puppetId to full animation state
   */
  getActiveAnimations() {
    const result = {};
    for (const [puppetId, state] of this.activeAnimations) {
      result[puppetId] = {
        puppetId,
        ownerId: state.ownerId,
        animationId: state.animationId,
        animationConfig: state.animationConfig,
        startTime: state.startTime,
        elapsedTime: state.elapsedTime,
        isOwnerControlled: state.isOwnerControlled,
        isPlaying: state.isPlaying,
      };
    }
    return result;
  }

  /**
   * Update all active animations (advances elapsed time)
   * Should be called periodically (e.g., every 100ms via setInterval)
   */
  update() {
    const now = Date.now();
    const toRemove = [];

    for (const [puppetId, state] of this.activeAnimations) {
      if (!state.isPlaying) continue;

      const elapsed = now - state.startTime;
      state.elapsedTime = elapsed;

      // Check if non-looping animation has ended
      if (!state.animationConfig.loop && elapsed >= state.animationConfig.duration) {
        toRemove.push(puppetId);
      }
    }

    // Remove finished non-looping animations
    for (const puppetId of toRemove) {
      this.activeAnimations.delete(puppetId);
    }
  }

  /**
   * Get state update events for all active animations
   * Used to broadcast current animation states to clients
   * @returns {Array} Array of state event objects
   */
  getStateUpdateEvents() {
    const events = [];
    for (const [puppetId, state] of this.activeAnimations) {
      const current = this.getCurrentState(puppetId);
      if (current) {
        events.push({
          puppetId,
          animationId: state.animationId,
          currentTime: current.currentTime,
          duration: state.animationConfig.duration,
          loop: state.animationConfig.loop,
          isPlaying: state.isPlaying,
        });
      }
    }
    return events;
  }

  /**
   * Handle puppet disconnection - stop all animations for that puppet
   * @param {string} puppetId - The puppet identifier
   */
  onPuppetDisconnected(puppetId) {
    this.activeAnimations.delete(puppetId);
  }

  /**
   * Seek an animation to a specific time
   * Used for synchronization when clients reconnect
   * @param {string} puppetId - The puppet identifier
   * @param {number} time - Target time in milliseconds
   */
  seekAnimation(puppetId, time) {
    const state = this.activeAnimations.get(puppetId);
    if (!state) return;

    const clampedTime = Math.max(0, Math.min(time, state.animationConfig.duration));
    state.elapsedTime = clampedTime;
    state.startTime = Date.now() - clampedTime;
  }
}

export default AnimationSync;