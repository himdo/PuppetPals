/** Unit Tests for server/socket-handler.js
 * Tests socket event handling for join, disconnect, and broadcast
 */

import SocketHandler from '../server/socket-handler.js';
import AuthManager from '../server/auth-manager.js';
import SocketEvents from '../shared/protocols.js';

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
    expect(handler).toBeTruthy();
    expect(handler.io).toBe(io);
    expect(handler.authManager).toBe(auth);
  });
});

describe('SocketHandler registerEvents', () => {
  it('should set up connection listener on io', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();
    expect(typeof io._connection).toBe('function');
  });

  it('should handle request-join with valid nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('test-socket-1');
    io.getSockets().set('test-socket-1', mockSocket);

    io._connection(mockSocket);

    const joinHandler = mockSocket.getHandler(SocketEvents.REQUEST_JOIN);
    expect(joinHandler).toBeTruthy();
    joinHandler({ nickname: 'Alice' });

    const emitted = mockSocket.getEmitted(SocketEvents.JOIN_CONFIRMED);
    expect(emitted).toBeTruthy();
    expect(emitted.role).toBe('owner');
    expect(emitted.nickname).toBe('Alice');
    expect(emitted.sessionId).toBeTruthy();
    expect(Array.isArray(emitted.players)).toBe(true);
  });

  it('should reject duplicate nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket1 = createMockSocket('sock-1');
    io.getSockets().set('sock-1', socket1);
    io._connection(socket1);
    socket1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const socket2 = createMockSocket('sock-2');
    io.getSockets().set('sock-2', socket2);
    io._connection(socket2);
    socket2.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const errorEmitted = socket2.getEmitted(SocketEvents.NICKNAME_TAKEN);
    expect(errorEmitted).toBeTruthy();
    expect(errorEmitted.message).toBeTruthy();
  });

  it('should reject invalid nickname', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('sock-3');
    io.getSockets().set('sock-3', mockSocket);
    io._connection(mockSocket);
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'ab' });

    const errorEmitted = mockSocket.getEmitted(SocketEvents.NICKNAME_TAKEN);
    expect(errorEmitted).toBeTruthy();
  });

  it('should assign client role to second player', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket1 = createMockSocket('s1');
    io.getSockets().set('s1', socket1);
    io._connection(socket1);
    socket1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const socket2 = createMockSocket('s2');
    io.getSockets().set('s2', socket2);
    io._connection(socket2);
    socket2.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Bob' });

    const emitted = socket2.getEmitted(SocketEvents.JOIN_CONFIRMED);
    expect(emitted.role).toBe('client');
    expect(emitted.players.length).toBe(2);
  });

  it('should handle disconnect and broadcast player-disconnected', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('d-sock');
    io.getSockets().set('d-sock', mockSocket);
    io._connection(mockSocket);

    const disconnectHandler = mockSocket.getHandler('disconnect');
    expect(disconnectHandler).toBeTruthy();

    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });
    expect(auth.getPlayerCount()).toBe(1);

    disconnectHandler('io client disconnect');

    expect(auth.getPlayerCount()).toBe(0);
    const logs = io.getBroadcastLogs();
    const disconnectBroadcast = logs.find(l => l.event === SocketEvents.PLAYER_DISCONNECTED);
    expect(disconnectBroadcast).toBeTruthy();
    expect(disconnectBroadcast.data.nickname).toBe('Alice');
  });

  it('should handle disconnect for player who never joined', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('no-join-sock');
    io.getSockets().set('no-join-sock', mockSocket);
    io._connection(mockSocket);

    const disconnectHandler = mockSocket.getHandler('disconnect');
    disconnectHandler('io client disconnect');

    expect(auth.getPlayerCount()).toBe(0);
  });

  it('should broadcast current players to new player on join', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const s1 = createMockSocket('p1');
    io.getSockets().set('p1', s1);
    io._connection(s1);
    s1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const s2 = createMockSocket('p2');
    io.getSockets().set('p2', s2);
    io._connection(s2);
    s2.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Bob' });

    const emitted = s2.getEmitted(SocketEvents.JOIN_CONFIRMED);
    expect(emitted.players.length).toBe(2);
    const playerNames = emitted.players.map(p => p.nickname);
    expect(playerNames).toContain('Alice');
    expect(playerNames).toContain('Bob');
  });

  it('should include sessionId in join-confirmed', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('session-sock');
    io.getSockets().set('session-sock', mockSocket);
    io._connection(mockSocket);
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'TestUser' });

    const emitted = mockSocket.getEmitted(SocketEvents.JOIN_CONFIRMED);
    expect(emitted.sessionId).toBeTruthy();
    expect(typeof emitted.sessionId).toBe('string');
    expect(emitted.sessionId.length).toBeGreaterThan(0);
  });
});