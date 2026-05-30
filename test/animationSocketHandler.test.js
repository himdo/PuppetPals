/** Integration Tests for SocketHandler animation events
 * Tests that SocketHandler correctly wires up animation sync events
 */

import SocketHandler from '../server/socket-handler.js';
import AuthManager from '../server/auth-manager.js';
import AnimationSync from '../server/animation-sync.js';
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

describe('SocketHandler animation events', () => {
  it('should handle start-animation from authenticated user', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('sock-1');
    io.getSockets().set('sock-1', mockSocket);
    io._connection(mockSocket);

    // Join first (becomes owner)
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Alice' });
    const sessionId = auth.getPlayerBySocket('sock-1').sessionId;

    // Clear broadcast logs
    io.clearBroadcastLogs();

    // Emit start-animation
    const animConfig = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    mockSocket.getHandler(SocketEvents.START_ANIMATION)({
      puppetId: 'puppet-1',
      animation: animConfig,
    });

    // Check broadcast
    const logs = io.getBroadcastLogs();
    const startedEvent = logs.find(l => l.event === SocketEvents.ANIMATION_STARTED);
    expect(startedEvent).toBeTruthy();
    expect(startedEvent.data.puppetId).toBe('puppet-1');
    expect(startedEvent.data.animation).toEqual(animConfig);
  });

  it('should reject start-animation from unauthenticated user', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('sock-2');
    io.getSockets().set('sock-2', mockSocket);
    io._connection(mockSocket);

    // Do NOT join - try to start animation
    mockSocket.getHandler(SocketEvents.START_ANIMATION)({
      puppetId: 'puppet-1',
      animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
    });

    const errorEmitted = mockSocket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(errorEmitted).toBeTruthy();
    expect(errorEmitted.message).toContain('authenticated');
  });

  it('should handle stop-animation from authenticated user', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('sock-3');
    io.getSockets().set('sock-3', mockSocket);
    io._connection(mockSocket);

    // Join
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Bob' });

    io.clearBroadcastLogs();

    // Emit stop-animation
    mockSocket.getHandler(SocketEvents.STOP_ANIMATION)({
      puppetId: 'puppet-1',
    });

    const logs = io.getBroadcastLogs();
    const stoppedEvent = logs.find(l => l.event === SocketEvents.ANIMATION_STOPPED);
    expect(stoppedEvent).toBeTruthy();
    expect(stoppedEvent.data.puppetId).toBe('puppet-1');
  });

  it('should handle admin-start-animation from owner only', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    // Owner joins
    const ownerSocket = createMockSocket('owner-sock');
    io.getSockets().set('owner-sock', ownerSocket);
    io._connection(ownerSocket);
    ownerSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Owner' });

    io.clearBroadcastLogs();

    // Admin starts animation on puppet-2
    const animConfig = { id: 'dance', name: 'Dance', duration: 2000, loop: true, keyframes: [] };
    ownerSocket.getHandler(SocketEvents.ADMIN_START_ANIMATION)({
      puppetId: 'puppet-2',
      animation: animConfig,
    });

    const logs = io.getBroadcastLogs();
    const startedEvent = logs.find(l => l.event === SocketEvents.ANIMATION_STARTED);
    expect(startedEvent).toBeTruthy();
    expect(startedEvent.data.puppetId).toBe('puppet-2');
  });

  it('should reject admin-start-animation from non-owner', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    // Owner joins first
    const ownerSocket = createMockSocket('owner-sock');
    io.getSockets().set('owner-sock', ownerSocket);
    io._connection(ownerSocket);
    ownerSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Owner' });

    // Client joins second
    const clientSocket = createMockSocket('client-sock');
    io.getSockets().set('client-sock', clientSocket);
    io._connection(clientSocket);
    clientSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Client' });

    // Non-owner tries admin animation
    clientSocket.getHandler(SocketEvents.ADMIN_START_ANIMATION)({
      puppetId: 'puppet-1',
      animation: { id: 'dance', duration: 2000, loop: true, keyframes: [] },
    });

    const errorEmitted = clientSocket.getEmitted(SocketEvents.ANIMATION_ERROR);
    expect(errorEmitted).toBeTruthy();
    expect(errorEmitted.message).toContain('owner');
  });

  it('should handle admin-stop-animation from owner only', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const ownerSocket = createMockSocket('admin-sock');
    io.getSockets().set('admin-sock', ownerSocket);
    io._connection(ownerSocket);
    ownerSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Admin' });

    io.clearBroadcastLogs();

    ownerSocket.getHandler(SocketEvents.ADMIN_STOP_ANIMATION)({
      puppetId: 'puppet-3',
    });

    const logs = io.getBroadcastLogs();
    const stoppedEvent = logs.find(l => l.event === SocketEvents.ANIMATION_STOPPED);
    expect(stoppedEvent).toBeTruthy();
    expect(stoppedEvent.data.puppetId).toBe('puppet-3');
  });

  it('should clean up animations when player disconnects', () => {
    const io = createMockIO();
    const auth = new AuthManager(10);
    const handler = new SocketHandler(io, auth);
    handler.registerEvents();

    const mockSocket = createMockSocket('disconnect-sock');
    io.getSockets().set('disconnect-sock', mockSocket);
    io._connection(mockSocket);

    // Join
    mockSocket.getHandler(SocketEvents.REQUEST_JOIN)({ nickname: 'Leaver' });
    const sessionId = auth.getPlayerBySocket('disconnect-sock').sessionId;
    const puppetId = `puppet-${sessionId}`;

    // Start an animation using the same puppetId the disconnect handler will look up
    io.clearBroadcastLogs();
    mockSocket.getHandler(SocketEvents.START_ANIMATION)({
      puppetId,
      animation: { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] },
    });

    // Verify animation is tracked
    const state = handler.animationSync.getCurrentState(puppetId);
    expect(state).toBeTruthy();

    // Disconnect
    io.clearBroadcastLogs();
    mockSocket.getHandler('disconnect')('io client disconnect');

    // Animation should be cleaned up
    const afterState = handler.animationSync.getCurrentState(puppetId);
    expect(afterState).toBeNull();
  });
});