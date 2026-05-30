/** PuppetPals Socket Event Handler
 * Manages all socket.io events for player join, disconnect, and broadcasts
 */

import SocketEvents from '../shared/protocols.js';
import AssetManager from './asset-manager.js';

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
    if (!player) return;

    // Remove player from auth manager
    this.authManager.removePlayer(socket.id);

    // Broadcast disconnection to all remaining clients
    this.io.emit(SocketEvents.PLAYER_DISCONNECTED, {
      sessionId: player.sessionId,
      nickname: player.nickname,
      players: this.authManager.getPlayers(),
    });

    console.log(`[SocketHandler] ${player.nickname} removed from session`);
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
