/** Unit Tests for server/auth-manager.js
 * Tests nickname authentication, session management, and role assignment
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');
const AuthManager = require('../server/auth-manager');

describe('AuthManager constructor', () => {
  it('should initialize with empty players map', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getPlayers().length, 0);
  });

  it('should accept maxPlayers configuration', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.maxPlayers, 10);
  });

  it('should have no server owner initially', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getOwnerId(), null);
  });
});

describe('AuthManager addPlayer', () => {
  it('should add a player with a valid nickname', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    assert.ok(result);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.role, 'owner');
    assert.ok(result.sessionId);
  });

  it('should assign the first player as owner', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    assert.strictEqual(result.role, 'owner');
    assert.strictEqual(auth.getOwnerId(), result.sessionId);
  });

  it('should assign subsequent players as client', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    assert.strictEqual(result.role, 'client');
  });

  it('should reject duplicate nicknames case-insensitive', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'alice');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('taken'));
  });

  it('should reject duplicate nicknames exact match', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Alice');
    assert.strictEqual(result.success, false);
  });

  it('should reject invalid nicknames', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'ab');
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  it('should reject empty nicknames', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', '');
    assert.strictEqual(result.success, false);
  });

  it('should reject when max players reached', () => {
    const auth = new AuthManager(2);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    const result = auth.addPlayer('socket-3', 'Charlie');
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('full') || result.error.includes('max'));
  });

  it('should return current player list on successful join', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    assert.strictEqual(result.players.length, 2);
  });

  it('should generate a unique sessionId for each player', () => {
    const auth1 = new AuthManager(10);
    const r1 = auth1.addPlayer('socket-1', 'Alice');
    const auth2 = new AuthManager(10);
    const r2 = auth2.addPlayer('socket-1', 'Alice');
    assert.notStrictEqual(r1.sessionId, r2.sessionId);
  });
});

describe('AuthManager removePlayer', () => {
  it('should remove a player by socketId', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.removePlayer('socket-1');
    assert.strictEqual(result, true);
    assert.strictEqual(auth.getPlayers().length, 0);
  });

  it('should return false for non-existent socketId', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.removePlayer('nonexistent'), false);
  });

  it('should release the nickname when player is removed', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.removePlayer('socket-1');
    const result = auth.addPlayer('socket-2', 'Alice');
    assert.strictEqual(result.success, true);
  });

  it('should return player info when removed', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerBySocket('socket-1');
    assert.ok(player);
    assert.strictEqual(player.nickname, 'Alice');
  });

  it('should clear ownerId when owner leaves', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    auth.removePlayer('socket-1');
    assert.strictEqual(auth.getOwnerId(), null);
  });

  it('should get disconnected player info before removal', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const info = auth.getPlayerInfo('socket-1');
    assert.ok(info);
    assert.strictEqual(info.nickname, 'Alice');
    assert.strictEqual(info.role, 'owner');
  });
});

describe('AuthManager getPlayerBySocket', () => {
  it('should return player data for valid socketId', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerBySocket('socket-1');
    assert.ok(player);
    assert.strictEqual(player.nickname, 'Alice');
    assert.strictEqual(player.socketId, 'socket-1');
  });

  it('should return null for invalid socketId', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getPlayerBySocket('nonexistent'), null);
  });
});

describe('AuthManager getPlayerByNickname', () => {
  it('should return player data for valid nickname', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerByNickname('Alice');
    assert.ok(player);
    assert.strictEqual(player.socketId, 'socket-1');
  });

  it('should return null for non-existent nickname', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getPlayerByNickname('Nobody'), null);
  });

  it('should be case-insensitive lookup', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const player = auth.getPlayerByNickname('alice');
    assert.ok(player);
    assert.strictEqual(player.nickname, 'Alice');
  });
});

describe('AuthManager isOwner', () => {
  it('should return true for the owner', () => {
    const auth = new AuthManager(10);
    const result = auth.addPlayer('socket-1', 'Alice');
    assert.strictEqual(auth.isOwner(result.sessionId), true);
  });

  it('should return false for clients', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const result = auth.addPlayer('socket-2', 'Bob');
    assert.strictEqual(auth.isOwner(result.sessionId), false);
  });

  it('should return false for non-existent sessionId', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.isOwner('nonexistent'), false);
  });
});

describe('AuthManager getPlayers', () => {
  it('should return all players', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    auth.addPlayer('socket-3', 'Charlie');
    assert.strictEqual(auth.getPlayers().length, 3);
  });

  it('should return empty array when no players', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getPlayers().length, 0);
  });

  it('should include role in player objects', () => {
    const auth = new AuthManager(10);
    auth.addPlayer('socket-1', 'Alice');
    const players = auth.getPlayers();
    assert.strictEqual(players[0].role, 'owner');
  });
});

describe('AuthManager getPlayerCount', () => {
  it('should return correct player count', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.getPlayerCount(), 0);
    auth.addPlayer('socket-1', 'Alice');
    assert.strictEqual(auth.getPlayerCount(), 1);
    auth.addPlayer('socket-2', 'Bob');
    assert.strictEqual(auth.getPlayerCount(), 2);
  });
});

describe('AuthManager isAtCapacity', () => {
  it('should return false when below max', () => {
    const auth = new AuthManager(10);
    assert.strictEqual(auth.isAtCapacity(), false);
  });

  it('should return true when at max', () => {
    const auth = new AuthManager(2);
    auth.addPlayer('socket-1', 'Alice');
    auth.addPlayer('socket-2', 'Bob');
    assert.strictEqual(auth.isAtCapacity(), true);
  });
});