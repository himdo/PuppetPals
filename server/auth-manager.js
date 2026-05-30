/** PuppetPals Authentication Manager
 * Tracks connected clients, assigns roles, and manages nicknames
 */

const { v4: uuidv4 } = require('uuid');
const { validateNickname } = require('../shared/utils');

class AuthManager {
  /**
   * @param {number} maxPlayers - Maximum number of allowed players
   */
  constructor(maxPlayers = 10) {
    this.maxPlayers = maxPlayers;
    // Map<socketId, playerData>
    this.players = new Map();
    // Map<nicknameLowerCase, socketId> for quick duplicate lookup
    this.nicknameIndex = new Map();
    // sessionId of the server owner (first joined player)
    this.ownerSessionId = null;
  }

  /**
   * Add a new player with the given nickname
   * @param {string} socketId - The socket.io connection ID
   * @param {string} nickname - Desired display name
   * @returns {{ success: boolean, sessionId?: string, role?: string, players?: Array, error?: string }}
   */
  addPlayer(socketId, nickname) {
    // Check capacity
    if (this.players.size >= this.maxPlayers) {
      return { success: false, error: 'Server is full. Max players reached.' };
    }

    // Validate nickname format
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = nickname.trim();

    // Check for duplicate nicknames (case-insensitive)
    if (this.nicknameIndex.has(trimmed.toLowerCase())) {
      return { success: false, error: 'Nickname is already taken.' };
    }

    // Generate a unique session ID
    const sessionId = uuidv4();

    // First player becomes owner
    const role = this.ownerSessionId === null ? 'owner' : 'client';

    const player = {
      sessionId,
      socketId,
      nickname: trimmed,
      role,
      joinedAt: Date.now(),
    };

    this.players.set(socketId, player);
    this.nicknameIndex.set(trimmed.toLowerCase(), socketId);

    if (role === 'owner') {
      this.ownerSessionId = sessionId;
    }

    return {
      success: true,
      sessionId,
      role,
      players: this.getPlayers(),
    };
  }

  /**
   * Remove a player by socketId and release their nickname
   * @param {string} socketId
   * @returns {boolean} True if a player was removed
   */
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return false;

    // Release nickname
    this.nicknameIndex.delete(player.nickname.toLowerCase());

    // If the owner leaves, clear ownerSessionId
    if (this.ownerSessionId === player.sessionId) {
      this.ownerSessionId = null;
    }

    this.players.delete(socketId);
    return true;
  }

  /**
   * Get player data by socketId
   * @param {string} socketId
   * @returns {object|null}
   */
  getPlayerBySocket(socketId) {
    return this.players.get(socketId) || null;
  }

  /**
   * Get player data by nickname (case-insensitive)
   * @param {string} nickname
   * @returns {object|null}
   */
  getPlayerByNickname(nickname) {
    const socketId = this.nicknameIndex.get(nickname.toLowerCase());
    if (!socketId) return null;
    return this.players.get(socketId) || null;
  }

  /**
   * Get player info (alias for getPlayerBySocket, used on disconnect)
   * @param {string} socketId
   * @returns {object|null}
   */
  getPlayerInfo(socketId) {
    return this.getPlayerBySocket(socketId);
  }

  /**
   * Check if a sessionId belongs to the server owner
   * @param {string} sessionId
   * @returns {boolean}
   */
  isOwner(sessionId) {
    return this.ownerSessionId === sessionId;
  }

  /**
   * Get the owner's sessionId
   * @returns {string|null}
   */
  getOwnerId() {
    return this.ownerSessionId;
  }

  /**
   * Get a simplified list of all players
   * @returns {Array<{ sessionId: string, nickname: string, role: string, socketId: string, joinedAt: number }>}
   */
  getPlayers() {
    const list = [];
    for (const player of this.players.values()) {
      list.push({
        sessionId: player.sessionId,
        socketId: player.socketId,
        nickname: player.nickname,
        role: player.role,
        joinedAt: player.joinedAt,
      });
    }
    return list;
  }

  /**
   * Get the number of connected players
   * @returns {number}
   */
  getPlayerCount() {
    return this.players.size;
  }

  /**
   * Check if the server has reached maximum capacity
   * @returns {boolean}
   */
  isAtCapacity() {
    return this.players.size >= this.maxPlayers;
  }
}

module.exports = AuthManager;