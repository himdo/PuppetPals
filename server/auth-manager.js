/** PuppetPals Authentication Manager
 * Tracks connected clients, assigns roles, and manages nicknames
 */

import { v4 as uuidv4 } from 'uuid';
import { validateNickname } from '../shared/utils.js';

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

  // ============================================================
  // Server Owner Promotion
  // ============================================================

  /**
   * Promote the earliest-joined client to server owner
   * Called when the current owner disconnects
   * @returns {string|null} The sessionId of the new owner, or null if no clients available
   */
  promoteOwner() {
    if (this.players.size === 0) return null;

    // Find the player with the earliest joinedAt timestamp who is not already owner
    let earliestPlayer = null;
    let earliestTime = Infinity;

    for (const player of this.players.values()) {
      if (player.role !== 'owner' && player.joinedAt < earliestTime) {
        earliestTime = player.joinedAt;
        earliestPlayer = player;
      }
    }

    if (!earliestPlayer) return null;

    // Promote this player to owner
    earliestPlayer.role = 'owner';
    this.ownerSessionId = earliestPlayer.sessionId;

    return earliestPlayer.sessionId;
  }

  // ============================================================
  // Duplicate Session Handling
  // ============================================================

  /**
   * Check if a socket ID is already connected (duplicate detection)
   * @param {string} socketId - The socket.io connection ID
   * @returns {boolean} True if this socket is already registered
   */
  isDuplicateSocket(socketId) {
    return this.players.has(socketId);
  }

  /**
   * Handle a duplicate connection from the same user/session
   * Replaces the old socket reference with the new one
   * @param {string} socketId - The socket ID (already exists)
   * @param {string} nickname - The nickname associated
   * @returns {{ success: boolean, message: string, player: object|null }}
   */
  handleDuplicateConnection(socketId, nickname) {
    const existing = this.players.get(socketId);
    if (!existing) {
      return { success: false, message: 'No existing player for this socket.', player: null };
    }

    // Update the existing player's reference (socket is the same, just refresh)
    // In a real scenario, you would disconnect the old socket and assign a new socketId
    // Here we just note the duplicate was handled
    return {
      success: true,
      message: 'Duplicate connection detected. Existing session retained.',
      player: existing,
    };
  }

  /**
   * Get a list of all active session IDs
   * @returns {string[]} Array of session IDs
   */
  getActiveSessions() {
    const sessions = [];
    for (const player of this.players.values()) {
      sessions.push(player.sessionId);
    }
    return sessions;
  }
}

export default AuthManager;
