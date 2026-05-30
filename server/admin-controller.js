/** PuppetPals Admin Controller
 * Server-side master controls for the server owner
 * Provides force move, lock/unlock, eject, background change, and global controls
 */

class AdminController {
  /**
   * @param {import('socket.io').Server} io - The Socket.io server instance
   * @param {import('./auth-manager')} authManager - The authentication manager
   * @param {import('./game-state')} gameState - The game state manager
   * @param {import('./animation-sync')} animationSync - The animation sync manager
   */
  constructor(io, authManager, gameState, animationSync) {
    this.io = io;
    this.authManager = authManager;
    this.gameState = gameState;
    this.animationSync = animationSync;
    this.currentBackground = 'default';
  }

  /**
   * Verify that a socket belongs to the server owner
   * @param {import('socket.io').Socket} socket - The socket to verify
   * @returns {{ authorized: boolean, player: object|null }}
   */
  verifyOwner(socket) {
    const player = this.authManager.getPlayerBySocket(socket.id);
    if (!player) {
      return { authorized: false, player: null };
    }

    if (!this.authManager.isOwner(player.sessionId)) {
      return { authorized: false, player: null };
    }

    return { authorized: true, player };
  }

  /**
   * Force move any puppet to a predefined location or exact coordinates
   * @param {string} playerId - The target player's session ID
   * @param {string|null} location - Predefined stage location (or null for coordinates)
   * @param {number} [x] - X coordinate (when location is null)
   * @param {number} [z] - Z coordinate (when location is null)
   * @returns {{ success: boolean, error?: string }}
   */
  forceMovePuppet(playerId, location, x, z) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    let success = false;

    if (location) {
      success = this.gameState.movePlayer(playerId, location);
    } else if (x !== undefined && z !== undefined) {
      success = this.gameState.movePlayerTo(playerId, x, z);
    } else {
      return { success: false, error: 'Invalid parameters: provide location or (x, z).' };
    }

    if (!success) {
      return { success: false, error: 'Failed to move puppet.' };
    }

    const updatedState = this.gameState.getPlayerState(playerId);

    // Broadcast movement to all clients
    this.io.emit('puppet-moved', {
      playerId,
      puppetId: playerState.puppetId,
      position: updatedState.position,
    });

    console.log(`[AdminController] Force moved ${playerId} to (${updatedState.position.x}, ${updatedState.position.z})`);

    return { success: true };
  }

  /**
   * Lock a player's puppet (prevent owner control)
   * @param {string} playerId - The target player's session ID
   * @returns {{ success: boolean, error?: string }}
   */
  lockPuppet(playerId) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    const success = this.gameState.lockPlayer(playerId);

    if (success) {
      this.io.emit('state-update', {
        playerId,
        puppetId: playerState.puppetId,
        isLocked: true,
      });

      console.log(`[AdminController] Locked puppet for ${playerId}`);
    }

    return { success };
  }

  /**
   * Unlock a player's puppet (restore owner control)
   * @param {string} playerId - The target player's session ID
   * @returns {{ success: boolean, error?: string }}
   */
  unlockPuppet(playerId) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    const success = this.gameState.unlockPlayer(playerId);

    if (success) {
      this.io.emit('state-update', {
        playerId,
        puppetId: playerState.puppetId,
        isLocked: false,
      });

      console.log(`[AdminController] Unlocked puppet for ${playerId}`);
    }

    return { success };
  }

  /**
   * Force start an animation on any puppet
   * @param {string} playerId - The target player's session ID
   * @param {Object} animation - The animation object
   * @returns {{ success: boolean, error?: string }}
   */
  forceAnimation(playerId, animation) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    if (!animation) {
      return { success: false, error: 'Animation is required.' };
    }

    const puppetId = playerState.puppetId;

    // Start animation via animation sync (admin override)
    this.animationSync.startAnimation(puppetId, playerId, animation, false);

    // Broadcast to all clients
    this.io.emit('animation-started', {
      puppetId,
      animation,
      serverTime: Date.now(),
      currentTime: 0,
      isAdmin: true,
    });

    console.log(`[AdminController] Forced animation ${animation.id} on ${puppetId}`);

    return { success: true };
  }

  /**
   * Force stop animation on any puppet
   * @param {string} playerId - The target player's session ID
   * @returns {{ success: boolean, error?: string }}
   */
  stopAnimation(playerId) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    const puppetId = playerState.puppetId;

    // Stop animation via animation sync
    this.animationSync.stopAnimation(puppetId);

    // Broadcast to all clients
    this.io.emit('animation-stopped', {
      puppetId,
      isAdmin: true,
    });

    console.log(`[AdminController] Stopped animation on ${puppetId}`);

    return { success: true };
  }

  /**
   * Eject a player from the server
   * @param {string} playerId - The target player's session ID
   * @returns {{ success: boolean, error?: string }}
   */
  ejectPlayer(playerId) {
    // Prevent ejecting yourself
    const ownerId = this.authManager.getOwnerId();
    if (playerId === ownerId) {
      return { success: false, error: 'You cannot eject yourself.' };
    }

    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    const nickname = playerState.nickname || 'Unknown';

    // Remove from game state
    this.gameState.unregisterPlayer(playerId);

    // Find the player's socket ID and disconnect
    const authPlayer = this.authManager.getPlayers().find(p => p.sessionId === playerId);
    if (authPlayer) {
      // Disconnect the socket
      this.io.sockets.deleteSocket?.(authPlayer.socketId);

      // Remove from auth
      this.authManager.removePlayer(authPlayer.socketId);
    }

    // Broadcast disconnection
    this.io.emit('player-disconnected', {
      sessionId: playerId,
      nickname,
      reason: 'ejected',
      players: this.authManager.getPlayers(),
    });

    console.log(`[AdminController] Ejected player ${nickname} (${playerId})`);

    return { success: true };
  }

  /**
   * Move a puppet off-stage (hidden position)
   * @param {string} playerId - The target player's session ID
   * @returns {{ success: boolean, error?: string }}
   */
  moveOffStage(playerId) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    const offStagePos = this.getOffStagePosition();

    // Move to off-stage position
    this.gameState.movePlayerTo(playerId, offStagePos.x, offStagePos.z);

    // Broadcast movement
    this.io.emit('puppet-moved', {
      playerId,
      puppetId: playerState.puppetId,
      position: offStagePos,
      offStage: true,
    });

    console.log(`[AdminController] Moved ${playerId} off-stage`);

    return { success: true };
  }

  /**
   * Change the stage background for all clients
   * @param {string} background - The background image filename or 'default'
   * @returns {{ success: boolean, error?: string }}
   */
  changeBackground(background) {
    if (!background || background.trim() === '') {
      return { success: false, error: 'Background is required.' };
    }

    this.currentBackground = background;

    // Broadcast to all clients
    this.io.emit('background-changed', {
      background,
      timestamp: Date.now(),
    });

    console.log(`[AdminController] Changed background to ${background}`);

    return { success: true };
  }

  /**
   * Override a player's puppet configuration
   * @param {string} playerId - The target player's session ID
   * @param {Object} config - The new puppet skeleton configuration
   * @returns {{ success: boolean, error?: string }}
   */
  overridePuppetConfig(playerId, config) {
    const playerState = this.gameState.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found.' };
    }

    this.gameState.setPuppetConfig(playerId, config);

    // Broadcast to all clients
    this.io.emit('puppet-config-overridden', {
      playerId,
      puppetId: playerState.puppetId,
      config,
    });

    console.log(`[AdminController] Overridden puppet config for ${playerId}`);

    return { success: true };
  }

  /**
   * Pause (stop) all animations for all players
   * @returns {{ success: boolean, stoppedCount: number }}
   */
  pauseAllAnimations() {
    const allStates = this.gameState.getAllPlayerStates();
    let stoppedCount = 0;

    for (const [playerId, state] of Object.entries(allStates)) {
      this.animationSync.stopAnimation(state.puppetId);

      this.io.emit('animation-stopped', {
        puppetId: state.puppetId,
        playerId,
        isAdmin: true,
        isGlobal: true,
      });

      stoppedCount++;
    }

    console.log(`[AdminController] Paused all animations (${stoppedCount} puppets)`);

    return { success: true, stoppedCount };
  }

  /**
   * Reset all puppet positions to center stage
   * @returns {{ success: boolean, resetCount: number }}
   */
  resetAllPositions() {
    const allStates = this.gameState.getAllPlayerStates();
    let resetCount = 0;

    for (const [playerId, state] of Object.entries(allStates)) {
      this.gameState.movePlayerTo(playerId, 0, 0);

      this.io.emit('puppet-moved', {
        playerId,
        puppetId: state.puppetId,
        position: { x: 0, y: 0, z: 0 },
        isAdmin: true,
        isGlobal: true,
      });

      resetCount++;
    }

    console.log(`[AdminController] Reset all positions (${resetCount} puppets)`);

    return { success: true, resetCount };
  }

  /**
   * Kick all players except the server owner
   * @returns {{ success: boolean, kickedCount: number }}
   */
  kickAllPlayers() {
    const ownerId = this.authManager.getOwnerId();
    const allStates = this.gameState.getAllPlayerStates();
    let kickedCount = 0;

    for (const [playerId, state] of Object.entries(allStates)) {
      if (playerId === ownerId) continue;

      const nickname = state.nickname || 'Unknown';

      // Remove from game state
      this.gameState.unregisterPlayer(playerId);

      // Find and disconnect socket
      const authPlayer = this.authManager.getPlayers().find(p => p.sessionId === playerId);
      if (authPlayer) {
        this.io.sockets.deleteSocket?.(authPlayer.socketId);
        this.authManager.removePlayer(authPlayer.socketId);
      }

      this.io.emit('player-disconnected', {
        sessionId: playerId,
        nickname,
        reason: 'kicked',
        players: this.authManager.getPlayers(),
      });

      kickedCount++;
    }

    console.log(`[AdminController] Kicked all players (${kickedCount} removed)`);

    return { success: true, kickedCount };
  }

  /**
   * Get a list of all players with their game state info
   * @returns {Array<Object>} List of player info with state
   */
  getPlayerList() {
    const authPlayers = this.authManager.getPlayers();
    const allStates = this.gameState.getAllPlayerStates();

    return authPlayers.map(p => ({
      sessionId: p.sessionId,
      socketId: p.socketId,
      nickname: p.nickname,
      role: p.role,
      joinedAt: p.joinedAt,
      puppetId: allStates[p.sessionId]?.puppetId || null,
      position: allStates[p.sessionId]?.position || null,
      isLocked: allStates[p.sessionId]?.isLocked || false,
      currentAnimation: allStates[p.sessionId]?.currentAnimation || null,
    }));
  }

  /**
   * Get the off-stage position (hidden from view)
   * @returns {{ x: number, y: number, z: number }}
   */
  getOffStagePosition() {
    return { x: 999, y: 0, z: 0 };
  }
}

export default AdminController;