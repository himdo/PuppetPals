/** Unit Tests for Request 21: Movement Synchronization & State Updates
 * Tests slot-based movement sync, facing direction, transition blocking,
 * stage config updates, state sync, and delta updates
 */

import GameState from '../server/game-state.js';
import SocketHandler from '../server/socket-handler.js';
import AuthManager from '../server/auth-manager.js';
import AppState from '../client/js/app-state.js';

// ============================================================
// Helper: create mock socket
// ============================================================
function createMockSocket(id) {
  const emitted = [];
  const handlers = {};
  return {
    id: id || 'socket-1',
    emit: (event, data) => { emitted.push({ event, data }); },
    on: (event, handler) => { handlers[event] = handler; },
    getEmitted: () => emitted,
    getHandler: (event) => handlers[event] || null,
    triggerEvent: (event, data) => {
      if (handlers[event]) handlers[event](data);
    },
    clearEmitted: () => { emitted.length = 0; },
  };
}

// ============================================================
// Helper: create mock io
// ============================================================
function createMockIO() {
  const broadcastLogs = [];
  const connectionHandlers = [];
  return {
    emit: (event, data) => { broadcastLogs.push({ event, data, broadcast: true }); },
    on: (event, handler) => {
      if (event === 'connection') connectionHandlers.push(handler);
    },
    getSockets: () => ({ fetchSockets: async () => [] }),
    getBroadcastLogs: () => broadcastLogs,
    clearBroadcastLogs: () => { broadcastLogs.length = 0; },
    triggerConnection: (socket) => {
      for (const handler of connectionHandlers) handler(socket);
    },
  };
}

// ============================================================
// GameState - facingDirection and isTransitioning
// ============================================================
describe('GameState - facingDirection and isTransitioning', () => {
  it('should have facingDirection in default player state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    const playerState = state.getPlayerState('player-1');
    expect(playerState.facingDirection).toBe('right');
  });

  it('should have isTransitioning in default player state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    const playerState = state.getPlayerState('player-1');
    expect(playerState.isTransitioning).toBe(false);
  });

  it('should set facingDirection when moving right', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerDirection('player-1', 'right');
    const playerState = state.getPlayerState('player-1');
    expect(playerState.facingDirection).toBe('right');
  });

  it('should set facingDirection when moving left', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerDirection('player-1', 'left');
    const playerState = state.getPlayerState('player-1');
    expect(playerState.facingDirection).toBe('left');
  });

  it('should set isTransitioning to true during move', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerDirection('player-1', 'right');
    const playerState = state.getPlayerState('player-1');
    expect(playerState.isTransitioning).toBe(true);
  });

  it('should not move if already transitioning', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerDirection('player-1', 'right');
    expect(state.getPlayerSlotIndex('player-1')).toBe(3);

    // Try to move again while transitioning
    const result = state.movePlayerDirection('player-1', 'right');
    expect(result).toBe(false);
    expect(state.getPlayerSlotIndex('player-1')).toBe(3); // Should not change
  });

  it('should completeTransition set isTransitioning to false', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerDirection('player-1', 'right');
    expect(state.getPlayerState('player-1').isTransitioning).toBe(true);

    state.completeTransition('player-1');
    expect(state.getPlayerState('player-1').isTransitioning).toBe(false);
  });

  it('should return false for completeTransition on non-existent player', () => {
    const state = new GameState();
    const result = state.completeTransition('nonexistent');
    expect(result).toBe(false);
  });
});

// ============================================================
// GameState - stage-config-update with slot clamping
// ============================================================
describe('GameState - stage config update with slot clamping', () => {
  it('should clamp player slot indices when slot count decreases', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerToSlot('player-1', 6); // Last slot with 5 on-screen

    state.setOnScreenSlotCount(3); // Now only 5 total slots (0-4)
    const playerState = state.getPlayerState('player-1');
    expect(playerState.currentSlotIndex).toBeLessThan(5);
  });

  it('should getClampedSlotIndex return valid index', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.movePlayerToSlot('player-1', 6);

    const clamped = state.getClampedSlotIndex('player-1');
    expect(clamped).toBeGreaterThanOrEqual(0);
    expect(clamped).toBeLessThan(state.getSlotPositions().length);
  });
});

// ============================================================
// GameState - delta updates for slot changes
// ============================================================
describe('GameState - delta updates for slot-based state', () => {
  it('should include currentSlotIndex in delta when changed', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.updateCachedStates();

    state.movePlayerDirection('player-1', 'right');
    const cached = state.getCachedStates();
    const delta = state.computeDelta('player-1', cached['player-1']);

    expect(delta.currentSlotIndex).toBeTruthy();
  });

  it('should include facingDirection in delta when changed', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.updateCachedStates();

    state.movePlayerDirection('player-1', 'left');
    const cached = state.getCachedStates();
    // Need to re-cache before computing delta
    const cachedBefore = state.getCachedStates();
    state.updateCachedStates();
    state.movePlayerDirection('player-1', 'right');
    const delta = state.computeDelta('player-1', cachedBefore['player-1']);

    expect(delta.facingDirection).toBeTruthy();
  });

  it('should include isTransitioning in delta when changed', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.updateCachedStates();

    state.movePlayerDirection('player-1', 'right');
    const cached = state.getCachedStates();
    const delta = state.computeDelta('player-1', cached['player-1']);

    expect(delta.isTransitioning).toBeTruthy();
  });
});

// ============================================================
// SocketHandler - move-direction event for regular players
// ============================================================
describe('SocketHandler - move-direction event', () => {
  let io, auth, handler, socket;

  beforeEach(() => {
    io = createMockIO();
    auth = new AuthManager(10);
    handler = new SocketHandler(io, auth);
    handler.registerEvents(); // Register all socket event handlers
    socket = createMockSocket('socket-1');
    io.triggerConnection(socket); // Trigger connection to register socket handlers
  });

  it('should handle move-direction from authenticated player', () => {
    // Authenticate the socket by adding player directly to auth's players Map
    auth.players.set('socket-1', { sessionId: 'player-1', nickname: 'Alice', role: 'owner', socketId: 'socket-1' });
    auth.ownerSessionId = 'player-1';

    // Register player in game state
    handler.gameState.registerPlayer('player-1', 'puppet-1', 'Alice');

    // Clear previous broadcasts
    io.clearBroadcastLogs();

    // Trigger move-direction
    const moveHandler = socket.getHandler('move-direction');
    expect(moveHandler).toBeTruthy();
    moveHandler({ direction: 'right' });

    // Check that slot-moved was broadcast
    const logs = io.getBroadcastLogs();
    const slotMoved = logs.find(l => l.event === 'slot-moved');
    expect(slotMoved).toBeTruthy();
    expect(slotMoved.data.direction).toBe('right');
  });

  it('should not move if player is transitioning', () => {
    auth.players.set('socket-1', { sessionId: 'player-1', nickname: 'Alice', role: 'owner', socketId: 'socket-1' });
    auth.ownerSessionId = 'player-1';
    handler.gameState.registerPlayer('player-1', 'puppet-1', 'Alice');

    const moveHandler = socket.getHandler('move-direction');

    // First move (starts transition)
    moveHandler({ direction: 'right' });

    io.clearBroadcastLogs();

    // Second move while transitioning should be rejected
    moveHandler({ direction: 'right' });

    const logs = io.getBroadcastLogs();
    const slotMoved = logs.find(l => l.event === 'slot-moved');
    expect(slotMoved).toBeFalsy();
  });

  it('should include timestamp in slot-moved broadcast', () => {
    auth.players.set('socket-1', { sessionId: 'player-1', nickname: 'Alice', role: 'owner', socketId: 'socket-1' });
    auth.ownerSessionId = 'player-1';
    handler.gameState.registerPlayer('player-1', 'puppet-1', 'Alice');

    const moveHandler = socket.getHandler('move-direction');
    moveHandler({ direction: 'right' });

    const logs = io.getBroadcastLogs();
    const slotMoved = logs.find(l => l.event === 'slot-moved');
    expect(slotMoved.data.timestamp).toBeDefined();
    expect(typeof slotMoved.data.timestamp).toBe('number');
  });

  it('should emit movement-error for unauthenticated player', () => {
    const moveHandler = socket.getHandler('move-direction');
    moveHandler({ direction: 'right' });

    const emitted = socket.getEmitted();
    const error = emitted.find(e => e.event === 'movement-error');
    expect(error).toBeTruthy();
  });

  it('should emit movement-error for invalid direction', () => {
    auth.players.set('socket-1', { sessionId: 'player-1', nickname: 'Alice', role: 'owner', socketId: 'socket-1' });
    auth.ownerSessionId = 'player-1';
    handler.gameState.registerPlayer('player-1', 'puppet-1', 'Alice');

    const moveHandler = socket.getHandler('move-direction');
    moveHandler({ direction: 'up' });

    const emitted = socket.getEmitted();
    const error = emitted.find(e => e.event === 'movement-error');
    expect(error).toBeTruthy();
  });
});

// ============================================================
// SocketHandler - state-sync includes slot info
// ============================================================
describe('SocketHandler - state-sync includes slot info', () => {
  it('should include slotIndex and facingDirection in state-sync', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1', 'Alice');
    state.movePlayerDirection('player-1', 'right');

    const allStates = state.getAllPlayerStates();
    expect(allStates['player-1'].currentSlotIndex).toBeDefined();
    expect(allStates['player-1'].facingDirection).toBeDefined();
  });
});

// ============================================================
// AppState - slot-moved with transition data
// ============================================================
describe('AppState - slot-moved with transition data', () => {
  function createMockSocket() {
    const emitted = [];
    const listeners = {};
    return {
      emit: (event, data) => { emitted.push({ event, data }); },
      on: (event, handler) => { listeners[event] = handler; },
      off: (event) => { delete listeners[event]; },
      getEmitted: () => emitted,
      getListener: (event) => listeners[event] || null,
      triggerEvent: (event, data) => {
        if (listeners[event]) listeners[event](data);
      },
      clearEmitted: () => { emitted.length = 0; },
    };
  }

  it('should emit slotMoved event with transition data', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    const onSlotMoved = jest.fn();
    state.on('slotMoved', onSlotMoved);

    state.setupSocketListeners();

    mockSocket.triggerEvent('slot-moved', {
      playerId: 'player-1',
      fromIndex: 2,
      toIndex: 3,
      direction: 'right',
      timestamp: Date.now(),
    });

    expect(onSlotMoved).toHaveBeenCalledWith(expect.objectContaining({
      playerId: 'player-1',
      fromIndex: 2,
      toIndex: 3,
      direction: 'right',
    }));
  });

  it('should update facingDirection from slot-moved event', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.setupSocketListeners();

    mockSocket.triggerEvent('slot-moved', {
      playerId: 'player-1',
      fromIndex: 3,
      toIndex: 2,
      direction: 'left',
    });

    expect(state.players['player-1'].facingDirection).toBe('left');
  });

  it('should handle stage-config-update event', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);

    const onConfigUpdate = jest.fn();
    state.on('stageConfigUpdated', onConfigUpdate);

    state.setupSocketListeners();

    mockSocket.triggerEvent('stage-config-update', {
      onScreenSlotCount: 3,
      totalSlots: 5,
    });

    expect(state.onScreenSlotCount).toBe(3);
    expect(onConfigUpdate).toHaveBeenCalled();
  });
});

// ============================================================
// Integration - Full movement sync flow
// ============================================================
describe('Integration - Movement sync flow', () => {
  it('should sync movement from server to all clients', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1', 'Alice');

    // Server-side move
    const result = state.movePlayerDirection('player-1', 'right');
    expect(result).toBeTruthy();
    expect(result.fromIndex).toBe(2);
    expect(result.toIndex).toBe(3);

    // Verify state is updated
    const playerState = state.getPlayerState('player-1');
    expect(playerState.currentSlotIndex).toBe(3);
    expect(playerState.facingDirection).toBe('right');
    expect(playerState.isTransitioning).toBe(true);

    // Complete transition
    state.completeTransition('player-1');
    const updatedState = state.getPlayerState('player-1');
    expect(updatedState.isTransitioning).toBe(false);
  });

  it('should handle slot count change and clamp positions', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.registerPlayer('player-2', 'puppet-2');

    // Move player-2 to a far slot
    state.movePlayerToSlot('player-2', 6);

    // Reduce slot count
    state.setOnScreenSlotCount(3);

    // player-2's slot should be clamped
    const player2State = state.getPlayerState('player-2');
    const totalSlots = state.getSlotPositions().length;
    expect(player2State.currentSlotIndex).toBeLessThan(totalSlots);
  });
});
