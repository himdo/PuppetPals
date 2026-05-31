/** Unit Tests for AppState Direction Movement (Request 19)
 * Tests slot-based directional movement, button cooldown,
 * and off-screen detection
 */

import AppState from '../client/js/app-state.js';

// ============================================================
// Helper: create mock socket
// ============================================================
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

// ============================================================
// Direction Movement State
// ============================================================
describe('AppState - Direction Movement Properties', () => {
  it('should have buttonCooldownMs defaulting to 500', () => {
    const state = new AppState();
    expect(state.buttonCooldownMs).toBe(500);
  });

  it('should have buttonsEnabled defaulting to true', () => {
    const state = new AppState();
    expect(state.buttonsEnabled).toBe(true);
  });

  it('should have currentSlotIndex defaulting to null', () => {
    const state = new AppState();
    expect(state.currentSlotIndex).toBeNull();
  });
});

// ============================================================
// requestMoveDirection
// ============================================================
describe('AppState - requestMoveDirection()', () => {
  it('should emit move-direction event with direction', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.requestMoveDirection('right');

    const emitted = mockSocket.getEmitted();
    expect(emitted.length).toBe(1);
    expect(emitted[0].event).toBe('move-direction');
    expect(emitted[0].data.direction).toBe('right');
  });

  it('should emit move-direction event for left direction', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.requestMoveDirection('left');

    const emitted = mockSocket.getEmitted();
    expect(emitted[0].data.direction).toBe('left');
  });

  it('should not emit if buttons are disabled (cooldown)', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');
    state.buttonsEnabled = false;

    state.requestMoveDirection('right');

    expect(mockSocket.getEmitted().length).toBe(0);
  });

  it('should not emit if no socket client', () => {
    const state = new AppState();
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    expect(() => state.requestMoveDirection('right')).not.toThrow();
  });

  it('should not emit if no local player', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);

    state.requestMoveDirection('right');

    expect(mockSocket.getEmitted().length).toBe(0);
  });

  it('should disable buttons during cooldown', (done) => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');
    state.buttonCooldownMs = 100; // Short cooldown for testing

    state.requestMoveDirection('right');

    expect(state.buttonsEnabled).toBe(false);

    setTimeout(() => {
      expect(state.buttonsEnabled).toBe(true);
      done();
    }, 150);
  });
});

// ============================================================
// Off-Screen Detection
// ============================================================
describe('AppState - Off-Screen Detection', () => {
  it('should return false when slot index is on-screen (2-6)', () => {
    const state = new AppState();
    state.currentSlotIndex = 4; // Center slot

    expect(state.isOffScreen()).toBe(false);
  });

  it('should return true when slot index is off-screen (0-1)', () => {
    const state = new AppState();
    state.currentSlotIndex = 0; // offscreen-far-left

    expect(state.isOffScreen()).toBe(true);
  });

  it('should return true for offscreen-left (index 1)', () => {
    const state = new AppState();
    state.currentSlotIndex = 1; // offscreen-left

    expect(state.isOffScreen()).toBe(true);
  });

  it('should return false when slot index is null', () => {
    const state = new AppState();
    state.currentSlotIndex = null;

    expect(state.isOffScreen()).toBe(false);
  });
});

// ============================================================
// Nearest On-Screen Slot
// ============================================================
describe('AppState - getNearestOnScreenSlot()', () => {
  it('should return slot 2 (first on-screen) when at offscreen-far-left', () => {
    const state = new AppState();
    state.currentSlotIndex = 0;

    expect(state.getNearestOnScreenSlot()).toBe(2);
  });

  it('should return slot 2 when at offscreen-left', () => {
    const state = new AppState();
    state.currentSlotIndex = 1;

    expect(state.getNearestOnScreenSlot()).toBe(2);
  });

  it('should return current slot when already on-screen', () => {
    const state = new AppState();
    state.currentSlotIndex = 4;

    expect(state.getNearestOnScreenSlot()).toBe(4);
  });
});

// ============================================================
// requestMoveOnStage
// ============================================================
describe('AppState - requestMoveOnStage()', () => {
  it('should emit move-direction events to reach nearest on-screen slot', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');
    state.currentSlotIndex = 0; // offscreen-far-left
    state.buttonsEnabled = true;

    state.requestMoveOnStage();

    // Should emit 'right' direction to move toward on-screen
    const emitted = mockSocket.getEmitted();
    expect(emitted.length).toBe(1);
    expect(emitted[0].event).toBe('move-direction');
    expect(emitted[0].data.direction).toBe('right');
  });

  it('should not emit when already on-screen', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');
    state.currentSlotIndex = 4; // on-screen

    state.requestMoveOnStage();

    expect(mockSocket.getEmitted().length).toBe(0);
  });
});

// ============================================================
// Slot-Moved Event Handling
// ============================================================
describe('AppState - slot-moved event handling', () => {
  it('should update currentSlotIndex when receiving slot-moved for local player', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.setupSocketListeners();

    // Trigger slot-moved event
    mockSocket.triggerEvent('slot-moved', {
      playerId: 'player-1',
      fromIndex: 2,
      toIndex: 3,
      direction: 'right',
    });

    expect(state.currentSlotIndex).toBe(3);
  });

  it('should update player state when receiving slot-moved', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.setupSocketListeners();

    // Trigger slot-moved event
    mockSocket.triggerEvent('slot-moved', {
      playerId: 'player-1',
      fromIndex: 2,
      toIndex: 4,
      direction: 'right',
    });

    const player = state.getPlayer('player-1');
    expect(player.currentSlotIndex).toBe(4);
  });
});

// ============================================================
// Stage Config Update Handling
// ============================================================
describe('AppState - stage-config-update event handling', () => {
  it('should update onScreenSlotCount when receiving stage-config-update', () => {
    const state = new AppState();
    const mockSocket = createMockSocket();
    state.setSocketClient(mockSocket);

    state.setupSocketListeners();

    mockSocket.triggerEvent('stage-config-update', {
      onScreenSlotCount: 7,
      slotPositions: [],
    });

    expect(state.onScreenSlotCount).toBe(7);
  });
});
