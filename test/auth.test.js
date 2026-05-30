/** Unit Tests for server/auth-manager.js
 * Tests player authentication, nickname management, and role assignment
 */

import AuthManager from '../server/auth-manager.js';

describe('AuthManager', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager(10);
  });

  describe('addPlayer', () => {
    it('should add a player and assign owner role', () => {
      const result = authManager.addPlayer('socket-1', 'Player1');

      expect(result.success).toBe(true);
      expect(result.role).toBe('owner');
      expect(result.sessionId).toBeDefined();
      expect(result.players).toHaveLength(1);
    });

    it('should add a second player with client role', () => {
      authManager.addPlayer('socket-1', 'Player1');
      const result = authManager.addPlayer('socket-2', 'Player2');

      expect(result.success).toBe(true);
      expect(result.role).toBe('client');
      expect(result.players).toHaveLength(2);
    });

    it('should reject duplicate nicknames (case-insensitive)', () => {
      authManager.addPlayer('socket-1', 'Player1');
      const result = authManager.addPlayer('socket-2', 'player1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nickname is already taken.');
    });

    it('should reject nicknames that are too short', () => {
      const result = authManager.addPlayer('socket-1', 'Ab');

      expect(result.success).toBe(false);
      expect(result.error).toContain('3 characters');
    });

    it('should reject nicknames that are too long', () => {
      const result = authManager.addPlayer('socket-1', 'A'.repeat(21));

      expect(result.success).toBe(false);
      expect(result.error).toContain('20 characters');
    });

    it('should reject nicknames with invalid characters', () => {
      const result = authManager.addPlayer('socket-1', 'Player 1!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('letters, numbers');
    });

    it('should reject empty nicknames', () => {
      const result = authManager.addPlayer('socket-1', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nickname is required');
    });

    it('should reject null nicknames', () => {
      const result = authManager.addPlayer('socket-1', null);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nickname is required');
    });

    it('should reject when server is at capacity', () => {
      const smallManager = new AuthManager(2);
      smallManager.addPlayer('socket-1', 'Player1');
      smallManager.addPlayer('socket-2', 'Player2');
      const result = smallManager.addPlayer('socket-3', 'Player3');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server is full. Max players reached.');
    });

    it('should trim whitespace from nicknames', () => {
      const result = authManager.addPlayer('socket-1', '  Player1  ');

      expect(result.success).toBe(true);
      expect(result.players[0].nickname).toBe('Player1');
    });
  });

  describe('removePlayer', () => {
    it('should remove a player and release nickname', () => {
      authManager.addPlayer('socket-1', 'Player1');
      const removed = authManager.removePlayer('socket-1');

      expect(removed).toBe(true);
      expect(authManager.getPlayerByNickname('Player1')).toBeNull();
      expect(authManager.getPlayerCount()).toBe(0);
    });

    it('should return false when removing non-existent player', () => {
      const removed = authManager.removePlayer('non-existent');
      expect(removed).toBe(false);
    });

    it('should clear ownerSessionId when owner leaves', () => {
      authManager.addPlayer('socket-1', 'Owner');
      expect(authManager.getOwnerId()).toBeDefined();

      authManager.removePlayer('socket-1');
      expect(authManager.getOwnerId()).toBeNull();
    });

    it('should not clear ownerSessionId when client leaves', () => {
      authManager.addPlayer('socket-1', 'Owner');
      authManager.addPlayer('socket-2', 'Client');
      const ownerId = authManager.getOwnerId();

      authManager.removePlayer('socket-2');
      expect(authManager.getOwnerId()).toBe(ownerId);
    });
  });

  describe('getPlayerBySocket', () => {
    it('should return player data for valid socket', () => {
      authManager.addPlayer('socket-1', 'Player1');
      const player = authManager.getPlayerBySocket('socket-1');

      expect(player).not.toBeNull();
      expect(player.nickname).toBe('Player1');
      expect(player.role).toBe('owner');
    });

    it('should return null for invalid socket', () => {
      const player = authManager.getPlayerBySocket('non-existent');
      expect(player).toBeNull();
    });
  });

  describe('getPlayerByNickname', () => {
    it('should find player by nickname (case-insensitive)', () => {
      authManager.addPlayer('socket-1', 'Player1');

      expect(authManager.getPlayerByNickname('player1')).not.toBeNull();
      expect(authManager.getPlayerByNickname('PLAYER1')).not.toBeNull();
      expect(authManager.getPlayerByNickname('Player1')).not.toBeNull();
    });

    it('should return null for unknown nickname', () => {
      const player = authManager.getPlayerByNickname('Unknown');
      expect(player).toBeNull();
    });
  });

  describe('getPlayerInfo', () => {
    it('should return player info for valid socket', () => {
      authManager.addPlayer('socket-1', 'Player1');
      const info = authManager.getPlayerInfo('socket-1');

      expect(info).not.toBeNull();
      expect(info.nickname).toBe('Player1');
    });

    it('should return null for invalid socket', () => {
      const info = authManager.getPlayerInfo('non-existent');
      expect(info).toBeNull();
    });
  });

  describe('isOwner', () => {
    it('should return true for owner session', () => {
      const result = authManager.addPlayer('socket-1', 'Owner');
      expect(authManager.isOwner(result.sessionId)).toBe(true);
    });

    it('should return false for client session', () => {
      authManager.addPlayer('socket-1', 'Owner');
      const clientResult = authManager.addPlayer('socket-2', 'Client');
      expect(authManager.isOwner(clientResult.sessionId)).toBe(false);
    });

    it('should return false for non-existent session', () => {
      expect(authManager.isOwner('fake-session')).toBe(false);
    });
  });

  describe('getOwnerId', () => {
    it('should return null before any player joins', () => {
      expect(authManager.getOwnerId()).toBeNull();
    });

    it('should return owner sessionId after first player joins', () => {
      const result = authManager.addPlayer('socket-1', 'Owner');
      expect(authManager.getOwnerId()).toBe(result.sessionId);
    });
  });

  describe('getPlayers', () => {
    it('should return empty list when no players', () => {
      expect(authManager.getPlayers()).toEqual([]);
    });

    it('should return list of all players', () => {
      authManager.addPlayer('socket-1', 'Player1');
      authManager.addPlayer('socket-2', 'Player2');

      const players = authManager.getPlayers();
      expect(players).toHaveLength(2);
      expect(players[0]).toHaveProperty('sessionId');
      expect(players[0]).toHaveProperty('nickname');
      expect(players[0]).toHaveProperty('role');
      expect(players[0]).toHaveProperty('socketId');
      expect(players[0]).toHaveProperty('joinedAt');
    });
  });

  describe('getPlayerCount', () => {
    it('should return 0 initially', () => {
      expect(authManager.getPlayerCount()).toBe(0);
    });

    it('should return correct count after adding players', () => {
      authManager.addPlayer('socket-1', 'Player1');
      authManager.addPlayer('socket-2', 'Player2');
      expect(authManager.getPlayerCount()).toBe(2);
    });

    it('should return correct count after removing players', () => {
      authManager.addPlayer('socket-1', 'Player1');
      authManager.addPlayer('socket-2', 'Player2');
      authManager.removePlayer('socket-1');
      expect(authManager.getPlayerCount()).toBe(1);
    });
  });

  describe('isAtCapacity', () => {
    it('should return false when not at capacity', () => {
      expect(authManager.isAtCapacity()).toBe(false);
    });

    it('should return true when at capacity', () => {
      const smallManager = new AuthManager(2);
      smallManager.addPlayer('socket-1', 'Player1');
      smallManager.addPlayer('socket-2', 'Player2');
      expect(smallManager.isAtCapacity()).toBe(true);
    });
  });
});