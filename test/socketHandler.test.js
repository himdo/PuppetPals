/** Unit Tests for server/socket-handler.js
 * Tests socket event handling for join, disconnect, and broadcast
 */

const assert = require('node:assert');
const { describe, it } = require('node:test');
const SocketHandler = require('../server/socket-handler');
const AuthManager = require('../server/auth-manager');

// Mock socket object for testing
function createMockSocket(id) {
  const emitted = {};
  const handlers = {};
  return {
    id,
    emit(event, data) {
      emitted[event] = data;
      emitted._lastEvent = event;
    },
    getEmitted(event) {
      return emitted[event] || null;
    },
    getLastEvent() {
      return emitted._lastEvent || null;
    },
    on(event, handler) {
      handlers[event] = handler;
    },
    getHandler(event) {
      return handlers[event] || null;
    },
    to: function() { return this; },
    emitTo: function(event, data) {
      return this;
    },
  };
}

// Mock io object for testing
function createMockIO() {
  const sockets = new Map();
  const broadcastLogs = [];
  return {
    sockets: {
      fetchSockets: async () => [],
    },
    to: (room) => ({
      emit: (event, data) => {
        broadcastLogs.push({ event, data, room });
      },
    }),
    emit(event, data) {
      broadcastLogs.push({ event, data, broadcast: true });
    },
    on: function(event, handler) {
      this['_' + event] = handler;
    },
    getSockets() {
      return sockets;
    },
    getBroadcastLogs() {
      return broadcastLogs;
    },
    clearBroadcastLogs() {
      broadcastLogs.length = 0;
    },
  };
}

describe('SocketHandler construction', () => {
  it('should create an instance with io and authManager', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    assert.ok(handler);
    assert.strictEqual(handler.io, io);
    assert.strictEqual(handler.authManager, auth);
  });
});

describe('SocketHandler registerEvents', () => {
  it('should set up connection listener on io', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();
    assert.ok(typeof io._connection === 'function');
  });

  it('should handle request-join with valid nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('test-socket-1');
    io.getSockets().set('test-socket-1', mockSocket);

    // Trigger connection handler
    io._connection(mockSocket);

    // Simulate request-join event
    const joinHandler = mockSocket.getHandler('request-join');
    assert.ok(joinHandler, 'request-join listener should be registered');
    joinHandler({ nickname: 'Alice' });

    const emitted = mockSocket.getEmitted('join-confirmed');
    assert.ok(emitted, 'Should emit join-confirmed');
    assert.strictEqual(emitted.role, 'owner');
    assert.strictEqual(emitted.nickname, 'Alice');
    assert.ok(emitted.sessionId);
    assert.ok(Array.isArray(emitted.players));
  });

  it('should reject duplicate nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    // First player joins
    const socket1 = createMockSocket('sock-1');
    io.getSockets().set('sock-1', socket1);
    io._connection(socket1);
    socket1.getHandler('request-join')({ nickname: 'Alice' });

    // Second player tries same nickname
    const socket2 = createMockSocket('sock-2');
    io.getSockets().set('sock-2', socket2);
    io._connection(socket2);
    socket2.getHandler('request-join')({ nickname: 'Alice' });

    const errorEmitted = socket2.getEmitted('nickname-taken');
    assert.ok(errorEmitted, 'Should emit nickname-taken');
    assert.ok(errorEmitted.message);
  });

  it('should reject invalid nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('sock-3');
    io.getSockets().set('sock-3', mockSocket);
    io._connection(mockSocket);
    mockSocket.getHandler('request-join')({ nickname: 'ab' });

    const errorEmitted = mockSocket.getEmitted('nickname-taken');
    assert.ok(errorEmitted, 'Should emit nickname-taken for short nickname');
  });

  it('should assign client role to second player', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    // First player
    const socket1 = createMockSocket('s1');
    io.getSockets().set('s1', socket1);
    io._connection(socket1);
    socket1.getHandler('request-join')({ nickname: 'Alice' });

    // Second player
    const socket2 = createMockSocket('s2');
    io.getSockets().set('s2', socket2);
    io._connection(socket2);
    socket2.getHandler('request-join')({ nickname: 'Bob' });

    const emitted = socket2.getEmitted('join-confirmed');
    assert.strictEqual(emitted.role, 'client');
    assert.strictEqual(emitted.players.length, 2);
  });

  it('should handle disconnect and broadcast player-disconnected', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('d-sock');
    io.getSockets().set('d-sock', mockSocket);
    io._connection(mockSocket);

    // Get the disconnect handler
    const disconnectHandler = mockSocket.getHandler('disconnect');
    assert.ok(disconnectHandler, 'disconnect listener should be registered');

    // Join first
    mockSocket.getHandler('request-join')({ nickname: 'Alice' });
    assert.strictEqual(auth.getPlayerCount(), 1);

    // Trigger disconnect
    disconnectHandler('io client disconnect');

    assert.strictEqual(auth.getPlayerCount(), 0);
    const logs = io.getBroadcastLogs();
    const disconnectBroadcast = logs.find(l => l.event === 'player-disconnected');
    assert.ok(disconnectBroadcast, 'Should broadcast player-disconnected');
    assert.strictEqual(disconnectBroadcast.data.nickname, 'Alice');
  });

  it('should handle disconnect for player who never joined', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('no-join-sock');
    io.getSockets().set('no-join-sock', mockSocket);
    io._connection(mockSocket);

    // Disconnect without joining
    const disconnectHandler = mockSocket.getHandler('disconnect');
    disconnectHandler('io client disconnect');

    // Should not crash, player count should remain 0
    assert.strictEqual(auth.getPlayerCount(), 0);
  });

  it('should broadcast current players to new player on join', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    // Player 1 joins
    const s1 = createMockSocket('p1');
    io.getSockets().set('p1', s1);
    io._connection(s1);
    s1.getHandler('request-join')({ nickname: 'Alice' });

    // Player 2 joins
    const s2 = createMockSocket('p2');
    io.getSockets().set('p2', s2);
    io._connection(s2);
    s2.getHandler('request-join')({ nickname: 'Bob' });

    const emitted = s2.getEmitted('join-confirmed');
    assert.strictEqual(emitted.players.length, 2);
    const playerNames = emitted.players.map(p => p.nickname);
    assert.ok(playerNames.includes('Alice'));
    assert.ok(playerNames.includes('Bob'));
  });

  it('should include sessionId in join-confirmed', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('session-sock');
    io.getSockets().set('session-sock', mockSocket);
    io._connection(mockSocket);
    mockSocket.getHandler('request-join')({ nickname: 'TestUser' });

    const emitted = mockSocket.getEmitted('join-confirmed');
    assert.ok(emitted.sessionId);
    assert.ok(typeof emitted.sessionId === 'string');
    assert.ok(emitted.sessionId.length > 0);
  });
});