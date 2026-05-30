/** PuppetPals Socket Event Handler
 * Manages all socket.io events for player join, disconnect, animations, and broadcasts
 */

import SocketEvents from '../shared/protocols.js';
import AssetManager from './asset-manager.js';
import AnimationSync from './animation-sync.js';

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
    /** @type {Map<string, Object>} Store of custom animations keyed by animation id */
    this.customAnimations = new Map();
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
    // We track puppet IDs by session ID; stop all for this session
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

    // Check authentication
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

    // Start animation on server
    this.animationSync.startAnimation(puppetId, player.sessionId, animation, true);

    // Broadcast to all clients
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

    // Check authentication
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

    // Stop animation on server
    this.animationSync.stopAnimation(puppetId);

    // Broadcast to all clients
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

    // Check authentication
    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to use admin controls.',
      });
      return;
    }

    // Check owner role
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

    // Start animation on server (admin override)
    this.animationSync.startAnimation(puppetId, player.sessionId, animation, false);

    // Broadcast to all clients
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

    // Check authentication
    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.ANIMATION_ERROR, {
        message: 'You must be authenticated to use admin controls.',
      });
      return;
    }

    // Check owner role
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

    // Stop animation on server
    this.animationSync.stopAnimation(puppetId);

    // Broadcast to all clients
    this.io.emit(SocketEvents.ANIMATION_STOPPED, {
      puppetId,
    });

    console.log(`[SocketHandler] ADMIN ${player.nickname} forced stop animation on ${puppetId}`);
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

    // Check authentication
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

    // Store the animation (deep copy to avoid reference issues)
    const stored = JSON.parse(JSON.stringify(animation));
    stored.savedBy = player.nickname;
    stored.savedAt = Date.now();
    this.customAnimations.set(animation.id, stored);

    console.log(`[SocketHandler] ${player.nickname} saved animation: ${animation.id}`);

    // Broadcast to all clients
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

    // Check authentication
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

    // Check authentication
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

    // Broadcast to all clients
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
    // Check authentication
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
  // Asset Handlers (existing)
  // ============================================================

  /**
   * Handle asset upload request
   * @param {import('socket.io').Socket} socket
   * @param {{ fileName: string, data: string, category: string, subGroup?: string }} data
   */
  handleUploadAsset(socket, data) {
    const { fileName, data: fileData, category, subGroup } = data || {};

    // Check authentication
    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'You must be authenticated to upload assets.',
      });
      return;
    }

    // Check owner role
    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'Only the server owner can upload assets.',
      });
      return;
    }

    // Validate required fields
    if (!fileName || !fileData || !category) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'fileName, data, and category are required.',
      });
      return;
    }

    // Decode base64 data
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch (e) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: 'Invalid file data encoding.',
      });
      return;
    }

    // Add asset via AssetManager
    const result = this.assetManager.addAsset(fileName, buffer, category, subGroup || null);

    if (!result.success) {
      socket.emit(SocketEvents.UPLOAD_ERROR, {
        message: result.error || 'Failed to upload asset.',
      });
      return;
    }

    console.log(`[SocketHandler] ${player.nickname} uploaded asset: ${fileName} to ${category}`);

    // Broadcast to all clients (including uploader) - single emit
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

    // Check authentication
    const { authenticated, player } = this.getPlayerFromSocket(socket);
    if (!authenticated) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'You must be authenticated to delete assets.',
      });
      return;
    }

    // Check owner role
    if (!this.authManager.isOwner(player.sessionId)) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'Only the server owner can delete assets.',
      });
      return;
    }

    // Validate required fields
    if (!assetId || !category) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: 'assetId and category are required.',
      });
      return;
    }

    // Delete asset via AssetManager
    const result = this.assetManager.deleteAsset(assetId, category);

    if (!result.success) {
      socket.emit(SocketEvents.DELETE_ERROR, {
        message: result.error || 'Failed to delete asset.',
      });
      return;
    }

    console.log(`[SocketHandler] ${player.nickname} deleted asset: ${assetId} from ${category}`);

    // Send success response to requester
    socket.emit(SocketEvents.DELETE_RESULT, {
      success: true,
      assetId,
      category,
    });

    // Broadcast deletion to all clients
    this.io.emit(SocketEvents.ASSET_DELETED, {
      assetId,
      category,
      deletedBy: player.nickname,
    });
  }
}

export default SocketHandler;