/** PuppetPals Socket Event Handler
 * Manages all socket.io events for player join, disconnect, and broadcasts
 */

const SocketEvents = require('../shared/protocols');

class SocketHandler {
  /**
   * @param {import('socket.io').Server} io - The Socket.io server instance
   * @param {import('./auth-manager')} authManager - The authentication manager
   */
  constructor(io, authManager) {
    this.io = io;
    this.authManager = authManager;
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
}

module.exports = SocketHandler;