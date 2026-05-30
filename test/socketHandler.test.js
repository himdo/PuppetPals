/** Unit Tests for server/socket-handler.js
 * Tests socket event handling for join, disconnect, animations, and keyframe editor
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

// ============================================================
// Helper: authenticate a socket so handler can find the player
// ============================================================
function authenticateSocket(io, socket, auth) {
  io._connection(socket);
  socket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: socket.nick || 'Tester' });
}

// ============================================================
// SocketHandler construction
// ============================================================
describe('SocketHandler construction', () => {
  it('should create an instance with io and authManager', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    expect(handler).toBeTruthy();
    expect(handler.io).toBe(io);
    expect(handler.authManager).toBe(auth);
  });

  it('should initialize customAnimations as empty Map', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    expect(handler.customAnimations).toBeInstanceOf(Map);
    expect(handler.customAnimations.size).toBe(0);
  });
});

// ============================================================
// SocketHandler registerEvents
// ============================================================
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
    mockSocket.nick = 'Alice';
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
    socket1.nick = 'Alice';
    io.getSockets().set('sock-1', socket1);
    io._connection(socket1);
    socket1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const socket2 = createMockSocket('sock-2');
    socket2.nick = 'Alice2';
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
    mockSocket.nick = 'Test';
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
    socket1.nick = 'Alice';
    io.getSockets().set('s1', socket1);
    io._connection(socket1);
    socket1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const socket2 = createMockSocket('s2');
    socket2.nick = 'Bob';
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
    mockSocket.nick = 'Alice';
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
    s1.nick = 'Alice';
    io.getSockets().set('p1', s1);
    io._connection(s1);
    s1.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });

    const s2 = createMockSocket('p2');
    s2.nick = 'Bob';
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
    mockSocket.nick = 'TestUser';
    io.getSockets().set('session-sock', mockSocket);
    io._connection(mockSocket);
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'TestUser' });

    const emitted = mockSocket.getEmitted(SocketEvents.JOIN_CONFIRMED);
    expect(emitted.sessionId).toBeTruthy();
    expect(typeof emitted.sessionId).toBe('string');
    expect(emitted.sessionId.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Keyframe Editor Socket Handlers
// ============================================================
describe('SocketHandler - handleSaveAnimation', () => {
  it('should save animation and broadcast to all clients', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('save-sock');
    socket.nick = 'Alice';
    io.getSockets().set('save-sock', socket);
    authenticateSocket(io, socket, auth);

    const animation = {
      id: 'walk',
      name: 'Walk Cycle',
      duration: 1000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
      ],
    };

    socket.getHandler(SocketEvents.SAVE_ANIMATION)({ animation });

    // Check stored
    expect(handler.customAnimations.size).toBe(1);
    const stored = handler.customAnimations.get('walk');
    expect(stored.id).toBe('walk');
    expect(stored.name).toBe('Walk Cycle');
    expect(stored.savedBy).toBe('Alice');
    expect(stored.savedAt).toBeDefined();

    // Check broadcast
    const logs = io.getBroadcastLogs();
    const savedLog = logs.find(l => l.event === SocketEvents.ANIMATION_SAVED);
    expect(savedLog).toBeTruthy();
    expect(savedLog.data.savedBy).toBe('Alice');
    expect(savedLog.data.animation.id).toBe('walk');
  });

  it('should return error when not authenticated', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('unauth-sock');
    io.getSockets().set('unauth-sock', socket);
    io._connection(socket);
    // Do NOT authenticate

    socket.getHandler(SocketEvents.SAVE_ANIMATION)({
      animation: { id: 'test', name: 'Test', duration: 100, keyframes: [] },
    });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
    expect(error.message).toContain('authenticated');
  });

  it('should return error when animation is missing id', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('no-id-sock');
    socket.nick = 'Alice';
    io.getSockets().set('no-id-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.SAVE_ANIMATION)({ animation: { name: 'No ID' } });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
    expect(error.message).toContain('id');
  });

  it('should return error when animation is null', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('null-anim-sock');
    socket.nick = 'Alice';
    io.getSockets().set('null-anim-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.SAVE_ANIMATION)({});

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
  });

  it('should deep copy the animation (stored object is independent)', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('deep-sock');
    socket.nick = 'Alice';
    io.getSockets().set('deep-sock', socket);
    authenticateSocket(io, socket, auth);

    const animation = {
      id: 'deep',
      name: 'Deep',
      duration: 500,
      loop: false,
      keyframes: [{ time: 0, boneId: 'arm', rotation: { z: 0 } }],
    };

    socket.getHandler(SocketEvents.SAVE_ANIMATION)({ animation });

    // Mutate original
    animation.keyframes.push({ time: 999, boneId: 'phantom', rotation: { z: 0 } });

    const stored = handler.customAnimations.get('deep');
    expect(stored.keyframes.length).toBe(1);
  });
});

describe('SocketHandler - handleLoadAnimation', () => {
  it('should return animation data when it exists', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('load-sock');
    socket.nick = 'Alice';
    io.getSockets().set('load-sock', socket);
    authenticateSocket(io, socket, auth);

    // Pre-save an animation
    handler.customAnimations.set('dance', {
      id: 'dance',
      name: 'Dance',
      duration: 2000,
      loop: true,
      keyframes: [],
      savedBy: 'Alice',
      savedAt: Date.now(),
    });

    socket.getHandler(SocketEvents.LOAD_ANIMATION)({ animationId: 'dance' });

    const loaded = socket.getEmitted(SocketEvents.ANIMATION_LOADED);
    expect(loaded).toBeTruthy();
    expect(loaded.animationId).toBe('dance');
    expect(loaded.animation.name).toBe('Dance');
  });

  it('should return error when animation not found', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('load-miss-sock');
    socket.nick = 'Alice';
    io.getSockets().set('load-miss-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.LOAD_ANIMATION)({ animationId: 'nonexistent' });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
    expect(error.message).toContain('not found');
  });

  it('should return error when animationId is missing', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('load-no-id-sock');
    socket.nick = 'Alice';
    io.getSockets().set('load-no-id-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.LOAD_ANIMATION)({});

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
    expect(error.message).toContain('animationId');
  });

  it('should return error when not authenticated', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('load-unauth-sock');
    io.getSockets().set('load-unauth-sock', socket);
    io._connection(socket);

    socket.getHandler(SocketEvents.LOAD_ANIMATION)({ animationId: 'test' });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
  });
});

describe('SocketHandler - handleDeleteAnimation', () => {
  it('should delete animation and broadcast to all clients', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('del-sock');
    socket.nick = 'Alice';
    io.getSockets().set('del-sock', socket);
    authenticateSocket(io, socket, auth);

    // Pre-save
    handler.customAnimations.set('to-delete', {
      id: 'to-delete',
      name: 'Delete Me',
      duration: 100,
      loop: false,
      keyframes: [],
      savedBy: 'Alice',
      savedAt: Date.now(),
    });

    socket.getHandler(SocketEvents.DELETE_ANIMATION)({ animationId: 'to-delete' });

    expect(handler.customAnimations.has('to-delete')).toBe(false);

    const logs = io.getBroadcastLogs();
    const delLog = logs.find(l => l.event === SocketEvents.ANIMATION_DELETED);
    expect(delLog).toBeTruthy();
    expect(delLog.data.animationId).toBe('to-delete');
    expect(delLog.data.deletedBy).toBe('Alice');
  });

  it('should return error when trying to delete nonexistent animation', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('del-miss-sock');
    socket.nick = 'Alice';
    io.getSockets().set('del-miss-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.DELETE_ANIMATION)({ animationId: 'nonexistent' });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
    expect(error.message).toContain('not found');
  });

  it('should return error when animationId is missing', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('del-no-id-sock');
    socket.nick = 'Alice';
    io.getSockets().set('del-no-id-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.DELETE_ANIMATION)({});

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
  });

  it('should return error when not authenticated', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('del-unauth-sock');
    io.getSockets().set('del-unauth-sock', socket);
    io._connection(socket);

    socket.getHandler(SocketEvents.DELETE_ANIMATION)({ animationId: 'test' });

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
  });
});

describe('SocketHandler - handleListAnimations', () => {
  it('should return list of all custom animations', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('list-sock');
    socket.nick = 'Alice';
    io.getSockets().set('list-sock', socket);
    authenticateSocket(io, socket, auth);

    // Pre-save 2 animations
    const now = Date.now();
    handler.customAnimations.set('anim-1', {
      id: 'anim-1', name: 'Animation 1', duration: 1000, loop: false,
      keyframes: [{ time: 0, boneId: 'arm', rotation: { z: 0 } }],
      savedBy: 'Alice', savedAt: now,
    });
    handler.customAnimations.set('anim-2', {
      id: 'anim-2', name: 'Animation 2', duration: 2000, loop: true,
      keyframes: [
        { time: 0, boneId: 'leg', rotation: { z: 0 } },
        { time: 500, boneId: 'leg', rotation: { z: 1 } },
      ],
      savedBy: 'Alice', savedAt: now,
    });

    socket.getHandler(SocketEvents.LIST_ANIMATIONS)({});

    const list = socket.getEmitted(SocketEvents.ANIMATION_LIST);
    expect(list).toBeTruthy();
    expect(list.animations.length).toBe(2);

    const ids = list.animations.map((a) => a.id);
    expect(ids).toContain('anim-1');
    expect(ids).toContain('anim-2');

    // Check structure
    const anim1 = list.animations.find((a) => a.id === 'anim-1');
    expect(anim1.name).toBe('Animation 1');
    expect(anim1.duration).toBe(1000);
    expect(anim1.loop).toBe(false);
    expect(anim1.keyframeCount).toBe(1);
    expect(anim1.savedBy).toBe('Alice');
  });

  it('should return empty list when no animations', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('empty-list-sock');
    socket.nick = 'Alice';
    io.getSockets().set('empty-list-sock', socket);
    authenticateSocket(io, socket, auth);

    socket.getHandler(SocketEvents.LIST_ANIMATIONS)({});

    const list = socket.getEmitted(SocketEvents.ANIMATION_LIST);
    expect(list).toBeTruthy();
    expect(list.animations).toEqual([]);
  });

  it('should return error when not authenticated', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('list-unauth-sock');
    io.getSockets().set('list-unauth-sock', socket);
    io._connection(socket);

    socket.getHandler(SocketEvents.LIST_ANIMATIONS)({});

    const error = socket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(error).toBeTruthy();
  });
});

describe('SocketHandler - Keyframe Editor event registration', () => {
  it('should register save-animation handler', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('reg-sock');
    io._connection(socket);

    expect(socket.getHandler(SocketEvents.SAVE_ANIMATION)).toBeTruthy();
  });

  it('should register load-animation handler', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('reg-sock');
    io._connection(socket);

    expect(socket.getHandler(SocketEvents.LOAD_ANIMATION)).toBeTruthy();
  });

  it('should register delete-animation handler', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('reg-sock');
    io._connection(socket);

    expect(socket.getHandler(SocketEvents.DELETE_ANIMATION)).toBeTruthy();
  });

  it('should register list-animations handler', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const socket = createMockSocket('reg-sock');
    io._connection(socket);

    expect(socket.getHandler(SocketEvents.LIST_ANIMATIONS)).toBeTruthy();
  });
});