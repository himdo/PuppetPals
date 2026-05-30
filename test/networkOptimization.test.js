/** PuppetPals Request 14 - Network Optimization & Final Integration Tests
 * Tests for state delta updates, throttling, batching, connection quality,
 * owner promotion, asset fallbacks, drift correction, and duplicate sessions
 */

import GameState from '../server/game-state.js';
import AuthManager from '../server/auth-manager.js';

// ============================================================
// State Delta Update Tests
// ============================================================

describe('GameState - State Delta Updates', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('computeDelta returns empty object when state has not changed', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const oldState = gameState.getPlayerState('p1');
    const delta = gameState.computeDelta('p1', oldState);
    expect(delta).toEqual({});
  });

  test('computeDelta detects position changes', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const oldState = gameState.getPlayerState('p1');
    gameState.movePlayerTo('p1', 5, 3);
    const delta = gameState.computeDelta('p1', oldState);

    expect(delta.position).toBeDefined();
    expect(delta.position.old).toEqual({ x: 0, y: 0, z: 0 });
    expect(delta.position.new).toEqual({ x: 5, y: 0, z: 3 });
  });

  test('computeDelta detects animation changes', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const oldState = gameState.getPlayerState('p1');
    gameState.setAnimation('p1', { id: 'walk', name: 'Walk' });
    const delta = gameState.computeDelta('p1', oldState);

    expect(delta.currentAnimation).toBeDefined();
    expect(delta.currentAnimation.old).toBeNull();
    expect(delta.currentAnimation.new).toEqual({ id: 'walk', name: 'Walk' });
  });

  test('computeDelta detects lock status changes', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const oldState = gameState.getPlayerState('p1');
    gameState.lockPlayer('p1');
    const delta = gameState.computeDelta('p1', oldState);

    expect(delta.isLocked).toBeDefined();
    expect(delta.isLocked.old).toBe(false);
    expect(delta.isLocked.new).toBe(true);
  });

  test('computeDelta returns null for unknown player', () => {
    const delta = gameState.computeDelta('unknown', {});
    expect(delta).toBeNull();
  });

  test('computeDelta detects multiple changes at once', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const oldState = gameState.getPlayerState('p1');
    gameState.movePlayerTo('p1', 3, 4);
    gameState.lockPlayer('p1');
    const delta = gameState.computeDelta('p1', oldState);

    expect(delta.position).toBeDefined();
    expect(delta.isLocked).toBeDefined();
  });

  test('broadcastDeltaOnly sends updates only for players with changes', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.registerPlayer('p2', 'puppet-2', 'Player2');

    // Store cached states
    gameState.updateCachedStates();

    // Only move p1
    gameState.movePlayerTo('p1', 5, 5);

    const emitted = [];
    const mockSocket = {
      emit: (event, data) => emitted.push({ event, data }),
    };
    const mockIo = {
      emit: (event, data) => emitted.push({ event, data, target: 'all' }),
    };

    gameState.broadcastDeltaOnly(mockIo);

    // Should broadcast delta for p1 only
    const p1Updates = emitted.filter(e => e.data?.playerId === 'p1');
    const p2Updates = emitted.filter(e => e.data?.playerId === 'p2');

    expect(p1Updates.length).toBeGreaterThan(0);
    expect(p2Updates.length).toBe(0);
  });

  test('updateCachedStates captures current state for all players', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.registerPlayer('p2', 'puppet-2', 'Player2');
    gameState.movePlayerTo('p1', 3, 4);

    gameState.updateCachedStates();

    // The cached states should reflect current positions
    const cached = gameState.getCachedStates();
    expect(cached['p1'].position.x).toBe(3);
    expect(cached['p2'].position.x).toBe(0);
  });
});

// ============================================================
// Throttled Position Updates Tests
// ============================================================

describe('GameState - Throttled Position Updates', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('should track last update time per player', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    expect(gameState.getLastUpdateTime('p1')).toBe(0);
  });

  test('should allow update when throttle period has passed', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    // Set last update time to the past
    gameState._lastUpdateTimes = new Map();
    gameState._lastUpdateTimes.set('p1', Date.now() - 1000);

    const canUpdate = gameState.canBroadcastUpdate('p1');
    expect(canUpdate).toBe(true);
  });

  test('should throttle update when within throttle period', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    // Default throttle is 50ms (20Hz)
    // Last update was just now
    gameState._lastUpdateTimes = new Map();
    gameState._lastUpdateTimes.set('p1', Date.now());

    const canUpdate = gameState.canBroadcastUpdate('p1');
    expect(canUpdate).toBe(false);
  });

  test('should allow configurable throttle interval', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.setThrottleInterval(100); // 100ms = 10Hz

    gameState._lastUpdateTimes = new Map();
    gameState._lastUpdateTimes.set('p1', Date.now() - 50); // 50ms ago

    const canUpdate = gameState.canBroadcastUpdate('p1');
    expect(canUpdate).toBe(false);

    // Now simulate 100ms passing
    gameState._lastUpdateTimes.set('p1', Date.now() - 150);
    const canUpdate2 = gameState.canBroadcastUpdate('p1');
    expect(canUpdate2).toBe(true);
  });

  test('should record update time after successful broadcast', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState._lastUpdateTimes = new Map();

    gameState.recordUpdate('p1');
    const lastTime = gameState.getLastUpdateTime('p1');
    expect(lastTime).toBeGreaterThan(0);
  });
});

// ============================================================
// Animation State Batching Tests
// ============================================================

describe('GameState - Animation State Batching', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('should have a batch buffer for animation updates', () => {
    expect(gameState._animationBatch).toBeInstanceOf(Array);
    expect(gameState._animationBatch.length).toBe(0);
  });

  test('should queue animation updates in batch buffer', () => {
    gameState.queueAnimationUpdate('puppet-1', { type: 'start', animationId: 'walk' });
    gameState.queueAnimationUpdate('puppet-2', { type: 'stop' });

    expect(gameState._animationBatch.length).toBe(2);
    expect(gameState._animationBatch[0]).toEqual({
      puppetId: 'puppet-1',
      update: { type: 'start', animationId: 'walk' },
      timestamp: expect.any(Number),
    });
  });

  test('should flush batch and return queued updates', () => {
    gameState.queueAnimationUpdate('puppet-1', { type: 'start', animationId: 'walk' });
    gameState.queueAnimationUpdate('puppet-2', { type: 'stop' });

    const flushed = gameState.flushAnimationBatch();
    expect(flushed.length).toBe(2);
    expect(gameState._animationBatch.length).toBe(0); // Buffer cleared
  });

  test('should deduplicate updates for same puppet in batch', () => {
    gameState.queueAnimationUpdate('puppet-1', { type: 'start', animationId: 'walk' });
    gameState.queueAnimationUpdate('puppet-1', { type: 'stop' });

    const flushed = gameState.flushAnimationBatch();
    // Last update for puppet-1 should be 'stop'
    expect(flushed.length).toBe(1);
    expect(flushed[0].update.type).toBe('stop');
  });
});

// ============================================================
// Connection Quality Indicator Tests
// ============================================================

describe('GameState - Connection Quality Indicator', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('should track ping times per player', () => {
    gameState.recordPing('p1', 25);
    expect(gameState._pingHistory.get('p1')).toBeDefined();
    expect(gameState._pingHistory.get('p1').length).toBe(1);
  });

  test('should calculate average ping for a player', () => {
    gameState.recordPing('p1', 20);
    gameState.recordPing('p1', 30);
    gameState.recordPing('p1', 40);

    const avg = gameState.getAveragePing('p1');
    expect(avg).toBe(30);
  });

  test('should return 0 for unknown player ping', () => {
    const avg = gameState.getAveragePing('unknown');
    expect(avg).toBe(0);
  });

  test('should classify connection quality based on ping', () => {
    gameState.recordPing('p1', 20);
    gameState.recordPing('p1', 30);
    // avg = 25ms -> excellent
    const quality = gameState.getConnectionQuality('p1');
    expect(quality).toBe('excellent');
  });

  test('should classify good connection (50-100ms)', () => {
    gameState.recordPing('p1', 60);
    gameState.recordPing('p1', 80);
    // avg = 70ms -> good
    const quality = gameState.getConnectionQuality('p1');
    expect(quality).toBe('good');
  });

  test('should classify poor connection (100-200ms)', () => {
    gameState.recordPing('p1', 120);
    gameState.recordPing('p1', 180);
    // avg = 150ms -> poor
    const quality = gameState.getConnectionQuality('p1');
    expect(quality).toBe('poor');
  });

  test('should classify critical connection (>200ms)', () => {
    gameState.recordPing('p1', 250);
    gameState.recordPing('p1', 300);
    // avg = 275ms -> critical
    const quality = gameState.getConnectionQuality('p1');
    expect(quality).toBe('critical');
  });

  test('should limit ping history size to prevent memory leaks', () => {
    for (let i = 0; i < 100; i++) {
      gameState.recordPing('p1', i);
    }
    // Default max history is 10
    const history = gameState._pingHistory.get('p1');
    expect(history.length).toBeLessThanOrEqual(10);
  });
});

// ============================================================
// Server Owner Disconnect - Promote New Owner Tests
// ============================================================

describe('AuthManager - Server Owner Promotion', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager(10);
  });

  test('should have no owner initially', () => {
    expect(authManager.getOwnerId()).toBeNull();
  });

  test('first player becomes owner', () => {
    const result = authManager.addPlayer('sock-1', 'FirstPlayer');
    expect(result.role).toBe('owner');
    expect(authManager.getOwnerId()).toBe(result.sessionId);
  });

  test('should promote earliest client to owner when owner leaves', () => {
    authManager.addPlayer('sock-1', 'Owner');
    const client1 = authManager.addPlayer('sock-2', 'Client1');
    const client2 = authManager.addPlayer('sock-3', 'Client2');

    // Remove the owner
    authManager.removePlayer('sock-1');

    // promoteOwner should promote the earliest joined client
    const promotedSessionId = authManager.promoteOwner();

    expect(promotedSessionId).toBe(client1.sessionId);
    expect(authManager.getOwnerId()).toBe(client1.sessionId);
  });

  test('promoteOwner returns null when no clients available', () => {
    authManager.addPlayer('sock-1', 'Owner');
    authManager.removePlayer('sock-1');

    const promoted = authManager.promoteOwner();
    expect(promoted).toBeNull();
  });

  test('promoted player role should be updated to owner', () => {
    authManager.addPlayer('sock-1', 'Owner');
    const client1 = authManager.addPlayer('sock-2', 'Client1');

    authManager.removePlayer('sock-1');
    authManager.promoteOwner();

    const promoted = authManager.getPlayerBySocket('sock-2');
    expect(promoted.role).toBe('owner');
  });
});

// ============================================================
// Animation Sync Drift Correction Tests
// ============================================================

describe('GameState - Animation Sync Drift Correction', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('should detect animation drift exceeding tolerance', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.setAnimationTime('p1', 1000, 1200); // serverTime=1000, clientTime=1200

    const drift = gameState.getAnimationDrift('p1');
    expect(drift).toBe(200);
  });

  test('should return no drift when times match', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.setAnimationTime('p1', 1000, 1000);

    const drift = gameState.getAnimationDrift('p1');
    expect(drift).toBe(0);
  });

  test('should return null for player without animation', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    const drift = gameState.getAnimationDrift('p1');
    expect(drift).toBeNull();
  });

  test('should recommend resync when drift exceeds tolerance', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.setAnimationTime('p1', 1000, 1300); // 300ms drift

    const needsResync = gameState.needsAnimationResync('p1', 200); // 200ms tolerance
    expect(needsResync).toBe(true);
  });

  test('should not recommend resync when drift is within tolerance', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    gameState.setAnimationTime('p1', 1000, 1150); // 150ms drift

    const needsResync = gameState.needsAnimationResync('p1', 200);
    expect(needsResync).toBe(false);
  });
});

// ============================================================
// Duplicate Session Handling Tests
// ============================================================

describe('AuthManager - Duplicate Session Handling', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager(10);
  });

  test('should detect duplicate socket connection', () => {
    authManager.addPlayer('sock-1', 'Player1');

    const isDuplicate = authManager.isDuplicateSocket('sock-1');
    expect(isDuplicate).toBe(true);
  });

  test('should not detect non-existent socket as duplicate', () => {
    const isDuplicate = authManager.isDuplicateSocket('sock-999');
    expect(isDuplicate).toBe(false);
  });

  test('should handle duplicate by disconnecting old socket', () => {
    authManager.addPlayer('sock-1', 'Player1');

    // Simulate a new connection from the same session
    const duplicateResult = authManager.handleDuplicateConnection('sock-1', 'Player1');
    
    // The old socket should be replaced
    const player = authManager.getPlayerBySocket('sock-1');
    expect(player).toBeDefined();
    expect(player.nickname).toBe('Player1');
  });

  test('should track active sessions', () => {
    authManager.addPlayer('sock-1', 'Player1');
    authManager.addPlayer('sock-2', 'Player2');

    const sessions = authManager.getActiveSessions();
    expect(sessions.length).toBe(2);
  });
});

// ============================================================
// Asset Loading Fallback Tests
// ============================================================

describe('GameState - Asset Loading Fallback', () => {
  let gameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  test('should provide a default puppet config', () => {
    const defaultConfig = gameState.getDefaultPuppetConfig();
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.name).toBeDefined();
    expect(defaultConfig.bones).toBeInstanceOf(Array);
  });

  test('should fall back to default config when puppet config is invalid', () => {
    gameState.registerPlayer('p1', 'puppet-1', 'Player1');
    
    const result = gameState.resolvePuppetConfig('p1', null);
    expect(result).toBeDefined();
    expect(result.name).toBeDefined();
  });

  test('should return valid puppet config as-is', () => {
    const validConfig = {
      name: 'Custom Puppet',
      bones: [{ id: 'head', name: 'Head', parentId: null }],
    };

    const result = gameState.resolvePuppetConfig('p1', validConfig);
    expect(result).toBe(validConfig);
  });
});