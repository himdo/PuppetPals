/** PuppetPals Socket Event Handler
 * Manages all socket.io events for player join, disconnect, animations, and broadcasts
 */

import SocketEvents from '../shared/protocols.js';
import AssetManager from './asset-manager.js';
import AnimationSync from './animation-sync.js';
import GameState from './game-state.js';
import AdminController from './admin-controller.js';

class SocketHandler {
  /**
   * @param {import('socket.io').Server} io - The Socket.io server instance
   * @param {import('./auth-manager')} authManager - The authentication manager
   * @param {AssetManager} [assetManager] - Optional asset manager instance
   */
  constructor(io, authManager, assetManager = null) {
    this.io = io;
    this.authManager = authManager;
    this.assetManager = assetManager || new AssetManager();
    this.animationSync = new AnimationSync();
    this.gameState = new GameState();
    /** @type {Map<string, Object>} Store of custom animations keyed by animation id */
    this.customAnimations = new Map();
    /** @type {AdminController} Admin controller for master controls */
    this.adminController = new AdminController(io, authManager, this.gameState, this.animationSync);
  }

  /**
   * Register all socket event listeners on the io server
   */
  registerEvents() {
    this.io.on('connection', (socket) => {
      console.log(`[SocketHandler] Client connected: ${socket.id}`);

      // Handle join request
      socket.on(SocketEvents.REQUEST_JOIN, (data) => {
        this.handleJoinRequest(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        this.handleDisconnect(socket, reason);
      });

      // ---- Asset Management Events ----
      socket.on(SocketEvents.UPLOAD_ASSET, (data) => {
        this.handleUploadAsset(socket, data);
      });

      socket.on(SocketEvents.ASSET_MANIFEST, (data) => {
        this.handleAssetManifest(socket, data);
      });

      socket.on(SocketEvents.DELETE_ASSET, (data) => {
        this.handleDeleteAsset(socket, data);
      });

      // ---- Animation Events ----
      socket.on(SocketEvents.START_ANIMATION, (data) => {
        this.handleStartAnimation(socket, data);
      });

      socket.on(SocketEvents.STOP_ANIMATION, (data) => {
        this.handleStopAnimation(socket, data);
      });

      socket.on(SocketEvents.ADMIN_START_ANIMATION, (data) => {
        this.handleAdminStartAnimation(socket, data);
      });

      socket.on(SocketEvents.ADMIN_STOP_ANIMATION, (data) => {
        this.handleAdminStopAnimation(socket, data);
      });

      // ---- Keyframe Animation Editor Events ----
      socket.on(SocketEvents.SAVE_ANIMATION, (data) => {
        this.handleSaveAnimation(socket, data);
      });

      socket.on(SocketEvents.LOAD_ANIMATION, (data) => {
        this.handleLoadAnimation(socket, data);
      });

      socket.on(SocketEvents.DELETE_ANIMATION, (data) => {
        this.handleDeleteAnimation(socket, data);
      });

      socket.on(SocketEvents.LIST_ANIMATIONS, (data) => {
        this.handleListAnimations(socket, data);
      });

      // ---- Game State / Movement Events ----
      socket.on(SocketEvents.MOVE_PUPPET, (data) => {
        this.handleMovePuppet(socket, data);
      });

      // ---- Admin Control Events ----
      socket.on(SocketEvents.ADMIN_MOVE_PUPPET, (data) => {
        this.handleAdminMovePuppet(socket, data);
      });

      socket.on(SocketEvents.ADMIN_LOCK_PUPPET, (data) => {
        this.handleAdminLockPuppet(socket, data);
      });

      socket.on(SocketEvents.ADMIN_FORCE_ANIMATION, (data) => {
        this.handleAdminForceAnimation(socket, data);
      });

      socket.on(SocketEvents.ADMIN_STOP_ANIMATION_PUPPET, (data) => {
        this.handleAdminStopAnimationPuppet(socket, data);
      });

      socket.on(SocketEvents.ADMIN_EJECT_PLAYER, (data) => {
        this.handleAdminEjectPlayer(socket, data);
      });

      socket.on(SocketEvents.ADMIN_CHANGE_BACKGROUND, (data) => {
        this.handleAdminChangeBackground(socket, data);
      });

      socket.on(SocketEvents.ADMIN_OFFSTAGE_PUPPET, (data) => {
        this.handleAdminOffstagePuppet(socket, data);
      });

      socket.on(SocketEvents.ADMIN_OVERRIDE_PUPPET, (data) => {
        this.handleAdminOverridePuppet(socket, data);
      });

      socket.on(SocketEvents.ADMIN_PAUSE_ALL, (data) => {
        this.handleAdminPauseAll(socket, data);
      });

      socket.on(SocketEvents.ADMIN_RESET_ALL, (data) => {
        this.handleAdminResetAll(socket, data);
      });

      socket.on(SocketEvents.ADMIN_KICK_ALL, (data) => {
        this.handleAdminKickAll(socket, data);
      });

      socket.on(SocketEvents.ADMIN_GET_PLAYERS, (data) => {
        this.handleAdminGetPlayers(socket, data);
      });

      socket.on(SocketEvents.ADMIN_SET_SLOT_COUNT, (data) => {
        this.handleAdminSetSlotCount(socket, data);
      });

      socket.on(SocketEvents.ADMIN_MOVE_DIRECTION, (data) => {
        this.handleAdminMoveDirection(socket, data);
      });

      socket.on(SocketEvents.ADMIN_MOVE_TO_SLOT, (data) => {
        this.handleAdminMoveToSlot(socket, data);
      });
    });
  }

  /**
   * Handle a client's request to join with a nickname
   * @param {import('socket.io').Socket} socket
   * @param {{ nickname: string }} data
   */
  handleJoinRequest(socket, data) {
    const { nickname } = data || {};

    if (!nickname) {
      socket.emit(SocketEvents.NICKNAME_TAKEN, {
        message: 'Nickname is required.',
      });
      return;
    }

    const result = this.authManager.addPlayer(socket.id, nickname);

    if (!result.success) {
      socket.emit(SocketEvents.NICKNAME_TAKEN, {
        message: result.error,
      });
      return;
    }

    // Send join confirmation to the joining player
    socket.emit(SocketEvents.JOIN_CONFIRMED, {
      sessionId: result.sessionId,
      role: result.role,
      nickname: result.players.find(p => p.sessionId === result.sessionId)?.nickname || nickname,
      players: result.players,
    });

    // Notify all other players about the new player
    this.io.emit(SocketEvents.PLAYER_DISCONNECTED, {
      _type: 'player_joined',
      sessionId: result.sessionId,
      nickname: nickname.trim(),
      role: result.role,
      players: result.players,
    });

    console.log(`[SocketHandler] ${nickname.trim()} joined as ${result.role} (session: ${result.sessionId})`);
  }

  /**
   * Handle a client disconnecting
   * @param {import('socket.io').Socket} socket
   * @param {string} reason
   */
  handleDisconnect(socket, reason) {
    console.log(`[SocketHandler] Client disconnected: ${socket.id} (${reason})`);

    const player = this.authManager.getPlayerInfo(socket.id);

    // Clean up animations for this player's puppet
    if (player) {
      const puppetId = `puppet-${player.sessionId}`;
      this.animationSync.onPuppetDisconnected(puppetId);
    }

    // Remove player from auth manager
    this.authManager.removePlayer(socket.id);

    // Broadcast disconnection to all remaining clients
    this.io.emit(SocketEvents.PLAYER_DISCONNECTED, {
      sessionId: player?.sessionId,
      nickname: player?.nickname,
      players: this.authManager.getPlayers(),
    });

    if (player) {
      console.log(`[SocketHandler] ${player.nickname} removed from session`);
    }
  }

  /**
   * Check if a socket belongs to an authenticated owner
   * @param {import('socket.io').Socket} socket
   * @returns {{ authenticated: boolean, player: object | null }}
   */
  getPlayerFromSocket(socket) {
    const player = this.authManager.getPlayerBySocket(socket.id);
    if (!player) return { authenticated: false, player: null };
    return { authenticated: true, player };
  }

  // ============================================================
  // Animation Handlers
  // ============================================================

  /**
   * Handle start-animation request from authenticated user
   * @param {import('socket.io').Socket} socket
   * @param {{ puppetId: string, animation: Object }} data
   */
  handleStartAnimation(socket, data) {
    const { puppetId, animation } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to control animations.',
      });
      return;
    }

    if (!puppetId || !animation) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'puppetId and animation are required.',
      });
      return;
    }

    this.animationSync.startAnimation(puppetId, player.sessionId, animation, true);

    this.io.emit(SocketEvents.ANIMATION_STARTED, {
      puppetId,
      animation,
      serverTime: Date.now(),
      currentTime: 0,
    });

    console.log(`[SocketHandler] ${player.nickname} started animation ${animation.id} on ${puppetId}`);
  }

  /**
   * Handle stop-animation request from authenticated user
   * @param {import('socket.io').Socket} socket
   * @param {{ puppetId: string }} data
   */
  handleStopAnimation(socket, data) {
    const { puppetId } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to control animations.',
      });
      return;
    }

    if (!puppetId) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'puppetId is required.',
      });
      return;
    }

    this.animationSync.stopAnimation(puppetId);

    this.io.emit(SocketEvents.ANIMATION_STOPPED, {
      puppetId,
    });

    console.log(`[SocketHandler] ${player.nickname} stopped animation on ${puppetId}`);
  }

  /**
   * Handle admin-start-animation (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ puppetId: string, animation: Object }} data
   */
  handleAdminStartAnimation(socket, data) {
    const { puppetId, animation } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to use admin controls.',
      });
      return;
    }

    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'Only the server owner can force animations on other puppets.',
      });
      return;
    }

    if (!puppetId || !animation) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'puppetId and animation are required.',
      });
      return;
    }

    this.animationSync.startAnimation(puppetId, player.sessionId, animation, false);

    this.io.emit(SocketEvents.ANIMATION_STARTED, {
      puppetId,
      animation,
      serverTime: Date.now(),
      currentTime: 0,
    });

    console.log(`[SocketHandler] ADMIN ${player.nickname} forced animation ${animation.id} on ${puppetId}`);
  }

  /**
   * Handle admin-stop-animation (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ puppetId: string }} data
   */
  handleAdminStopAnimation(socket, data) {
    const { puppetId } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to use admin controls.',
      });
      return;
    }

    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'Only the server owner can force stop animations.',
      });
      return;
    }

    if (!puppetId) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'puppetId is required.',
      });
      return;
    }

    this.animationSync.stopAnimation(puppetId);

    this.io.emit(SocketEvents.ANIMATION_STOPPED, {
      puppetId,
    });

    console.log(`[SocketHandler] ADMIN ${player.nickname} forced stop animation on ${puppetId}`);
  }

  // ============================================================
  // Game State / Movement Handlers
  // ============================================================

  /**
   * Handle move-puppet request from authenticated user
   * @param {import('socket.io').Socket} socket
   * @param {{ puppetId: string, location?: string, x?: number, z?: number }} data
   */
  handleMovePuppet(socket, data) {
    const { puppetId, location, x, z } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit('movement-error', {
        message: 'You must be authenticated to move a puppet.',
      });
      return;
    }

    if (!puppetId) {
      socket.emit('movement-error', {
        message: 'puppetId is required.',
      });
      return;
    }

    const existingState = this.gameState.getPlayerState(player.sessionId);
    if (!existingState) {
      this.gameState.registerPlayer(player.sessionId, puppetId, player.nickname);
    }

    const playerState = this.gameState.getPlayerState(player.sessionId);
    if (playerState && playerState.isLocked) {
      socket.emit('movement-error', {
        message: 'Your puppet has been locked by the server owner.',
      });
      return;
    }

    if (location) {
      const success = this.gameState.movePlayer(player.sessionId, location);
      if (!success) {
        socket.emit('movement-error', {
          message: `Invalid stage location: ${location}`,
        });
        return;
      }
    } else if (x !== undefined && z !== undefined) {
      const success = this.gameState.movePlayerTo(player.sessionId, x, z);
      if (!success) {
        socket.emit('movement-error', {
          message: 'Failed to move player.',
        });
        return;
      }
    } else {
      socket.emit('movement-error', {
        message: 'Either location or (x, z) coordinates are required.',
      });
      return;
    }

    const updatedState = this.gameState.getPlayerState(player.sessionId);
    const newPosition = updatedState ? updatedState.position : { x: 0, y: 0, z: 0 };

    this.io.emit(SocketEvents.PUPPET_MOVED, {
      playerId: player.sessionId,
      puppetId,
      position: newPosition,
    });

    this.io.emit(SocketEvents.STATE_UPDATE, {
      playerId: player.sessionId,
      puppetId,
      position: newPosition,
    });

    console.log(`[SocketHandler] ${player.nickname} moved ${puppetId} to (${newPosition.x}, ${newPosition.z})`);
  }

  // ============================================================
  // Keyframe Animation Editor Handlers
  // ============================================================

  /**
   * Handle save-animation request
   * @param {import('socket.io').Socket} socket
   * @param {{ animation: Object }} data
   */
  handleSaveAnimation(socket, data) {
    const { animation } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to save animations.',
      });
      return;
    }

    if (!animation || !animation.id) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'animation with id is required.',
      });
      return;
    }

    const stored = JSON.parse(JSON.stringify(animation));
    stored.savedBy = player.nickname;
    stored.savedAt = Date.now();
    this.customAnimations.set(animation.id, stored);

    console.log(`[SocketHandler] ${player.nickname} saved animation: ${animation.id}`);

    this.io.emit(SocketEvents.ANIMATION_SAVED, {
      animation: stored,
      savedBy: player.nickname,
    });
  }

  /**
   * Handle load-animation request
   * @param {import('socket.io').Socket} socket
   * @param {{ animationId: string }} data
   */
  handleLoadAnimation(socket, data) {
    const { animationId } = data || {};

    const { authenticated } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to load animations.',
      });
      return;
    }

    if (!animationId) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'animationId is required.',
      });
      return;
    }

    const animation = this.customAnimations.get(animationId);
    if (!animation) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: `Animation '${animationId}' not found.`,
      });
      return;
    }

    socket.emit(SocketEvents.ANIMATION_LOADED, {
      animationId,
      animation,
    });
  }

  /**
   * Handle delete-animation request
   * @param {import('socket.io').Socket} socket
   * @param {{ animationId: string }} data
   */
  handleDeleteAnimation(socket, data) {
    const { animationId } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to delete animations.',
      });
      return;
    }

    if (!animationId) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'animationId is required.',
      });
      return;
    }

    const deleted = this.customAnimations.delete(animationId);
    if (!deleted) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: `Animation '${animationId}' not found.`,
      });
      return;
    }

    console.log(`[SocketHandler] ${player.nickname} deleted animation: ${animationId}`);

    this.io.emit(SocketEvents.ANIMATION_DELETED, {
      animationId,
      deletedBy: player.nickname,
    });
  }

  /**
   * Handle list-animations request
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleListAnimations(socket, data) {
    const { authenticated } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to list animations.',
      });
      return;
    }

    const list = [];
    for (const [id, anim] of this.customAnimations) {
      list.push({
        id: anim.id,
        name: anim.name,
        duration: anim.duration,
        loop: anim.loop,
        keyframeCount: (anim.keyframes || []).length,
        savedBy: anim.savedBy,
        savedAt: anim.savedAt,
      });
    }

    socket.emit(SocketEvents.ANIMATION_LIST, { animations: list });
  }

  // ============================================================
  // Admin Control Handlers
  // ============================================================

  /**
   * Handle admin-move-puppet (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string, location?: string, x?: number, z?: number }} data
   */
  handleAdminMovePuppet(socket, data) {
    const { playerId, location, x, z } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can move puppets.',
      });
      return;
    }

    if (!playerId) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId is required.',
      });
      return;
    }

    const result = this.adminController.forceMovePuppet(playerId, location || null, x, z);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to move puppet.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} moved puppet of ${playerId}`);
  }

  /**
   * Handle admin-lock-puppet (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string, lock: boolean }} data
   */
  handleAdminLockPuppet(socket, data) {
    const { playerId, lock } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can lock/unlock puppets.',
      });
      return;
    }

    if (!playerId) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId is required.',
      });
      return;
    }

    const result = lock
      ? this.adminController.lockPuppet(playerId)
      : this.adminController.unlockPuppet(playerId);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to lock/unlock puppet.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} ${lock ? 'locked' : 'unlocked'} puppet of ${playerId}`);
  }

  /**
   * Handle admin-force-animation (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string, animation: Object }} data
   */
  handleAdminForceAnimation(socket, data) {
    const { playerId, animation } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can force animations.',
      });
      return;
    }

    if (!playerId || !animation) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId and animation are required.',
      });
      return;
    }

    const result = this.adminController.forceAnimation(playerId, animation);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to force animation.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} forced animation on ${playerId}`);
  }

  /**
   * Handle admin-stop-animation-puppet (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string }} data
   */
  handleAdminStopAnimationPuppet(socket, data) {
    const { playerId } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can stop animations.',
      });
      return;
    }

    if (!playerId) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId is required.',
      });
      return;
    }

    const result = this.adminController.stopAnimation(playerId);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to stop animation.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} stopped animation on ${playerId}`);
  }

  /**
   * Handle admin-eject-player (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string }} data
   */
  handleAdminEjectPlayer(socket, data) {
    const { playerId } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can eject players.',
      });
      return;
    }

    if (!playerId) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId is required.',
      });
      return;
    }

    const result = this.adminController.ejectPlayer(playerId);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to eject player.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} ejected ${playerId}`);
  }

  /**
   * Handle admin-change-background (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ background: string }} data
   */
  handleAdminChangeBackground(socket, data) {
    const { background } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can change the background.',
      });
      return;
    }

    const result = this.adminController.changeBackground(background);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to change background.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} changed background to ${background}`);
  }

  /**
   * Handle admin-offstage-puppet (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string }} data
   */
  handleAdminOffstagePuppet(socket, data) {
    const { playerId } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can move puppets off-stage.',
      });
      return;
    }

    if (!playerId) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId is required.',
      });
      return;
    }

    const result = this.adminController.moveOffStage(playerId);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to move puppet off-stage.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} moved ${playerId} off-stage`);
  }

  /**
   * Handle admin-override-puppet (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ playerId: string, config: Object }} data
   */
  handleAdminOverridePuppet(socket, data) {
    const { playerId, config } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can override puppet configs.',
      });
      return;
    }

    if (!playerId || !config) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'playerId and config are required.',
      });
      return;
    }

    const result = this.adminController.overridePuppetConfig(playerId, config);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to override puppet config.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} overridden puppet config for ${playerId}`);
  }

  /**
   * Handle admin-pause-all (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleAdminPauseAll(socket, data) {
    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can pause all animations.',
      });
      return;
    }

    const result = this.adminController.pauseAllAnimations();

    console.log(`[SocketHandler] ADMIN ${player.nickname} paused all animations (${result.stoppedCount} puppets)`);
  }

  /**
   * Handle admin-reset-all (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleAdminResetAll(socket, data) {
    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can reset all positions.',
      });
      return;
    }

    const result = this.adminController.resetAllPositions();

    console.log(`[SocketHandler] ADMIN ${player.nickname} reset all positions (${result.resetCount} puppets)`);
  }

  /**
   * Handle admin-kick-all (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleAdminKickAll(socket, data) {
    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can kick all players.',
      });
      return;
    }

    const result = this.adminController.kickAllPlayers();

    console.log(`[SocketHandler] ADMIN ${player.nickname} kicked all players (${result.kickedCount} removed)`);
  }

  /**
   * Handle admin-get-players (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleAdminGetPlayers(socket, data) {
    const { authorized } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can get the player list.',
      });
      return;
    }

    const playerList = this.adminController.getPlayerList();

    socket.emit('admin-player-list', { players: playerList });
  }

  /**
   * Handle admin-set-slot-count (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ count: number }} data
   */
  handleAdminSetSlotCount(socket, data) {
    const { count } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can change slot count.',
      });
      return;
    }

    const result = this.adminController.setOnScreenSlotCount(count);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to set slot count.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} set slot count to ${count}`);
  }

  /**
   * Handle admin-move-direction (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ targetPlayerId: string, direction: string }} data
   */
  handleAdminMoveDirection(socket, data) {
    const { targetPlayerId, direction } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can move puppets.',
      });
      return;
    }

    if (!targetPlayerId || !direction) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'targetPlayerId and direction are required.',
      });
      return;
    }

    const result = this.adminController.movePuppetDirection(targetPlayerId, direction);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to move puppet.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} moved ${targetPlayerId} ${direction}`);
  }

  /**
   * Handle admin-move-to-slot (owner only)
   * @param {import('socket.io').Socket} socket
   * @param {{ targetPlayerId: string, slotIndex: number }} data
   */
  handleAdminMoveToSlot(socket, data) {
    const { targetPlayerId, slotIndex } = data || {};

    const { authorized, player } = this.adminController.verifyOwner(socket);
    if (!authorized) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'Only the server owner can move puppets.',
      });
      return;
    }

    if (!targetPlayerId || slotIndex === undefined) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: 'targetPlayerId and slotIndex are required.',
      });
      return;
    }

    const result = this.adminController.movePuppetToSlot(targetPlayerId, slotIndex);

    if (!result.success) {
      socket.emit(SocketEvents.ADMIN_ERROR, {
        message: result.error || 'Failed to move puppet to slot.',
      });
      return;
    }

    console.log(`[SocketHandler] ADMIN ${player.nickname} moved ${targetPlayerId} to slot ${slotIndex}`);
  }

  // ============================================================
  // Asset Handlers (existing)
  // ============================================================

  /**
   * Handle asset upload request
   * @param {import('socket.io').Socket} socket
   * @param {{ fileName: string, data: string, category: string, subGroup?: string }} data
   */
  handleUploadAsset(socket, data) {
    const { fileName, data: fileData, category, subGroup } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'You must be authenticated to upload assets.',
      });
      return;
    }

    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'Only the server owner can upload assets.',
      });
      return;
    }

    if (!fileName || !fileData || !category) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'fileName, data, and category are required.',
      });
      return;
    }

    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch (e) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'Invalid file data encoding.',
      });
      return;
    }

    const result = this.assetManager.addAsset(fileName, buffer, category, subGroup || null);

    if (!result.success) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: result.error || 'Failed to upload asset.',
      });
      return;
    }

    console.log(`[SocketHandler] ${player.nickname} uploaded asset: ${fileName} to ${category}`);

    this.io.emit(SocketEvents.ASSET_UPLOADED, {
      success: true,
      assetId: result.assetId,
      path: result.path,
      name: result.name,
      category,
      size: result.size,
      uploadedAt: result.uploadedAt,
      uploadedBy: player.nickname,
    });
  }

  /**
   * Handle asset manifest request
   * @param {import('socket.io').Socket} socket
   * @param {object} data
   */
  handleAssetManifest(socket, data) {
    const manifest = this.assetManager.getAssetManifest();
    socket.emit(SocketEvents.ASSET_MANIFEST_RESPONSE, manifest);
  }

  /**
   * Handle asset deletion request
   * @param {import('socket.io').Socket} socket
   * @param {{ assetId: string, category: string }} data
   */
  handleDeleteAsset(socket, data) {
    const { assetId, category } = data || {};

    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'You must be authenticated to delete assets.',
      });
      return;
    }

    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'Only the server owner can delete assets.',
      });
      return;
    }

    if (!assetId || !category) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'assetId and category are required.',
      });
      return;
    }

    const result = this.assetManager.deleteAsset(assetId, category);

    if (!result.success) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: result.error || 'Failed to delete asset.',
      });
      return;
    }

    console.log(`[SocketHandler] ${player.nickname} deleted asset: ${assetId} from ${category}`);

    socket.emit(SocketEvents.DELETE_RESULT, {
      success: true,
      assetId,
      category,
    });

    this.io.emit(SocketEvents.ASSET_DELETED, {
      assetId,
      category,
      deletedBy: player.nickname,
    });
  }
}

export default SocketHandler;