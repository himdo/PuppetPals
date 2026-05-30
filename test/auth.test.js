/** Unit Tests for server/auth-manager.js
 * Tests nickname authentication, session management, and role assignment
 */

const AuthManager = require('../server/auth-manager');

describe('AuthManager constructor', () => {
  it('should initialize with empty players map', () => {
    const auth = new AuthManager(10);
    expect(auth.getPlayers().length).toBe(0);
  });

  it('should accept maxPlayers configuration', () => {
    const auth = new AuthManager(10);
    expect(auth.maxPlayers).toBe(10);
  });

  it('should have no server owner initially', () => {
    const auth = new AuthManager(10);
    expect(auth.getOwnerId()).toBeNull();
  });
});

describe('AuthManager addPlayer', () => {
  it('should add a player with a valid nickname', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    expect(result).toBeTruthy();
    expect(result.success).toBe(true);
    expect(result.role).toBe('owner');
    expect(result.sessionId).toBeTruthy();
  });

  it('should assign the first player as owner', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    expect(result.role).toBe('owner');
    expect(auth.getOwnerId()).toBe(result.sessionId);
  });

  it('should assign subsequent players as client', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    expect(result.role).toBe('client');
  });

  it('should reject duplicate nicknames case-insensitive', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'alice');
    expect(result.success).toBe(false);
    expect(result.error).toContain('taken');
  });

  it('should reject duplicate nicknames exact match', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Alice');
    expect(result.success).toBe(false);
  });

  it('should reject invalid nicknames', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'ab');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('should reject empty nicknames', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', '');
    expect(result.success).toBe(false);
  });

  it('should reject when max players reached', () => {
    const auth = new AuthManager(2);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    const result = auth.addPlayer('socket-3', 'Charlie');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/full|max/);
  });

  it('should return current player list on successful join', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    expect(result.players.length).toBe(2);
  });

  it('should generate a unique sessionId for each player', () => {
    const auth1 = new AuthManager(10);
    const r1 = auth1.addPlayer('socket-1', 'Alice');
    const auth2 = new AuthManager(10);
    const r2 = auth2.addPlayer('socket-1', 'Alice');
    expect(r1.sessionId).not.toBe(r2.sessionId);
  });
});

describe('AuthManager removePlayer', () => {
  it('should remove a player by socketId', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.removePlayer('socket-1');
    expect(result).toBe(true);
    expect(auth.getPlayers().length).toBe(0);
  });

  it('should return false for non-existent socketId', () => {
    const auth = new AuthManager(10);
    expect(auth.removePlayer('nonexistent')).toBe(false);
  });

  it('should release the nickname when player is removed', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.removePlayer('socket-1');
    const result = auth.addPlayer('socket-2', 'Alice');
    expect(result.success).toBe(true);
  });

  it('should return player info when removed', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerBySocket('socket-1');
    expect(player).toBeTruthy();
    expect(player.nickname).toBe('Alice');
  });

  it('should clear ownerId when owner leaves', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    auth.removePlayer('socket-1');
    expect(auth.getOwnerId()).toBeNull();
  });

  it('should get disconnected player info before removal', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const info = auth.getPlayerInfo('socket-1');
    expect(info).toBeTruthy();
    expect(info.nickname).toBe('Alice');
    expect(info.role).toBe('owner');
  });
});

describe('AuthManager getPlayerBySocket', () => {
  it('should return player data for valid socketId', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerBySocket('socket-1');
    expect(player).toBeTruthy();
    expect(player.nickname).toBe('Alice');
    expect(player.socketId).toBe('socket-1');
  });

  it('should return null for invalid socketId', () => {
    const auth = new AuthManager(10);
    expect(auth.getPlayerBySocket('nonexistent')).toBeNull();
  });
});

describe('AuthManager getPlayerByNickname', () => {
  it('should return player data for valid nickname', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerByNickname('Alice');
    expect(player).toBeTruthy();
    expect(player.socketId).toBe('socket-1');
  });

  it('should return null for non-existent nickname', () => {
    const auth = new AuthManager(10);
    expect(auth.getPlayerByNickname('Nobody')).toBeNull();
  });

  it('should be case-insensitive lookup', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerByNickname('alice');
    expect(player).toBeTruthy();
    expect(player.nickname).toBe('Alice');
  });
});

describe('AuthManager isOwner', () => {
  it('should return true for the owner', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    expect(auth.isOwner(result.sessionId)).toBe(true);
  });

  it('should return false for clients', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    expect(auth.isOwner(result.sessionId)).toBe(false);
  });

  it('should return false for non-existent sessionId', () => {
    const auth = new AuthManager(10);
    expect(auth.isOwner('nonexistent')).toBe(false);
  });
});

describe('AuthManager getPlayers', () => {
  it('should return all players', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    auth.addPlayer('socket-3', 'Charlie');
    expect(auth.getPlayers().length).toBe(3);
  });

  it('should return empty array when no players', () => {
    const auth = new AuthManager(10);
    expect(auth.getPlayers().length).toBe(0);
  });

  it('should include role in player objects', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const players = auth.getPlayers();
    expect(players[0].role).toBe('owner');
  });
});

describe('AuthManager getPlayerCount', () => {
  it('should return correct player count', () => {
    const auth = new AuthManager(10);
    expect(auth.getPlayerCount()).toBe(0);
    auth.addPlayer('socket-1', 'Alice');
    expect(auth.getPlayerCount()).toBe(1);
    auth.addPlayer('socket-2', 'Bob');
    expect(auth.getPlayerCount()).toBe(2);
  });
});

describe('AuthManager isAtCapacity', () => {
  it('should return false when below max', () => {
    const auth = new AuthManager(10);
    expect(auth.isAtCapacity()).toBe(false);
  });

  it('should return true when at max', () => {
    const auth = new AuthManager(2);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    expect(auth.isAtCapacity()).toBe(true);
  });
});