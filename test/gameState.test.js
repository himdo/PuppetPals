/** Unit Tests for server/game-state.js
 * Tests server-side game state management and puppet movement
 */

import GameState from '../server/game-state.js';

describe('GameState construction', () => {
  it('should create an instance', () => {
    const state = new GameState();
    expect(state).toBeTruthy();
  });

  it('should start with no player states', () => {
    const state = new GameState();
    expect(state.getAllPlayerStates()).toEqual({});
  });

  it('should have predefined stage locations', () => {
    const state = new GameState();
    expect(state.getStageLocations()).toBeTruthy();
    expect(Object.keys(state.getStageLocations())).toContain('center');
    expect(Object.keys(state.getStageLocations())).toContain('stageLeft');
    expect(Object.keys(state.getStageLocations())).toContain('stageRight');
    expect(Object.keys(state.getStageLocations())).toContain('upstageLeft');
    expect(Object.keys(state.getStageLocations())).toContain('upstageRight');
    expect(Object.keys(state.getStageLocations())).toContain('downstageLeft');
    expect(Object.keys(state.getStageLocations())).toContain('downstageRight');
  });
});

describe('GameState registerPlayer', () => {
  it('should register a new player with default state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const playerState = state.getPlayerState('player-1');
    expect(playerState).toBeTruthy();
    expect(playerState.puppetId).toBe('puppet-1');
    expect(playerState.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(playerState.isLocked).toBe(false);
    expect(playerState.currentAnimation).toBeNull();
  });

  it('should allow setting nickname on registration', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1', 'Alice');

    const playerState = state.getPlayerState('player-1');
    expect(playerState.nickname).toBe('Alice');
  });

  it('should update an existing player registration', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.registerPlayer('player-1', 'puppet-2', 'Bob');

    const playerState = state.getPlayerState('player-1');
    expect(playerState.puppetId).toBe('puppet-2');
    expect(playerState.nickname).toBe('Bob');
  });
});

describe('GameState unregisterPlayer', () => {
  it('should remove a player from state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    expect(state.getPlayerState('player-1')).toBeTruthy();

    state.unregisterPlayer('player-1');
    expect(state.getPlayerState('player-1')).toBeNull();
  });

  it('should return false when unregistering non-existent player', () => {
    const state = new GameState();
    const result = state.unregisterPlayer('nonexistent');
    expect(result).toBe(false);
  });

  it('should not affect other players when one is unregistered', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.registerPlayer('player-2', 'puppet-2');

    state.unregisterPlayer('player-1');
    expect(state.getPlayerState('player-1')).toBeNull();
    expect(state.getPlayerState('player-2')).toBeTruthy();
  });
});

describe('GameState movePlayer (predefined location)', () => {
  it('should move a player to a predefined stage location', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.movePlayer('player-1', 'center');

    const playerState = state.getPlayerState('player-1');
    const centerLoc = state.getStageLocations().center;
    expect(playerState.position.x).toBe(centerLoc.x);
    expect(playerState.position.z).toBe(centerLoc.z);
  });

  it('should move a player to stageLeft', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.movePlayer('player-1', 'stageLeft');

    const playerState = state.getPlayerState('player-1');
    const loc = state.getStageLocations().stageLeft;
    expect(playerState.position.x).toBe(loc.x);
    expect(playerState.position.z).toBe(loc.z);
  });

  it('should return false for non-existent player', () => {
    const state = new GameState();
    const result = state.movePlayer('nonexistent', 'center');
    expect(result).toBe(false);
  });

  it('should return false for invalid location', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    const result = state.movePlayer('player-1', 'invalidLocation');
    expect(result).toBe(false);
  });
});

describe('GameState movePlayerTo (exact coordinates)', () => {
  it('should move a player to exact coordinates', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.movePlayerTo('player-1', 5, -3);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.position.x).toBe(5);
    expect(playerState.position.z).toBe(-3);
  });

  it('should return false for non-existent player', () => {
    const state = new GameState();
    const result = state.movePlayerTo('nonexistent', 5, -3);
    expect(result).toBe(false);
  });

  it('should allow negative coordinates', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.movePlayerTo('player-1', -10, -10);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.position.x).toBe(-10);
    expect(playerState.position.z).toBe(-10);
  });

  it('should allow decimal coordinates', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.movePlayerTo('player-1', 2.5, -1.75);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.position.x).toBe(2.5);
    expect(playerState.position.z).toBe(-1.75);
  });
});

describe('GameState setAnimation', () => {
  it('should set current animation for a player', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const anim = { id: 'walk', name: 'Walk Cycle', duration: 1000, loop: true };
    state.setAnimation('player-1', anim);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.currentAnimation).toEqual(anim);
  });

  it('should clear animation when passing null', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const anim = { id: 'walk', name: 'Walk Cycle', duration: 1000, loop: true };
    state.setAnimation('player-1', anim);
    state.setAnimation('player-1', null);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.currentAnimation).toBeNull();
  });

  it('should return false for non-existent player', () => {
    const state = new GameState();
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true };
    const result = state.setAnimation('nonexistent', anim);
    expect(result).toBe(false);
  });
});

describe('GameState lockPlayer / unlockPlayer', () => {
  it('should lock a player puppet', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.lockPlayer('player-1');

    const playerState = state.getPlayerState('player-1');
    expect(playerState.isLocked).toBe(true);
  });

  it('should unlock a player puppet', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    state.lockPlayer('player-1');
    state.unlockPlayer('player-1');

    const playerState = state.getPlayerState('player-1');
    expect(playerState.isLocked).toBe(false);
  });

  it('should return false when locking non-existent player', () => {
    const state = new GameState();
    const result = state.lockPlayer('nonexistent');
    expect(result).toBe(false);
  });

  it('should return false when unlocking non-existent player', () => {
    const state = new GameState();
    const result = state.unlockPlayer('nonexistent');
    expect(result).toBe(false);
  });
});

describe('GameState getPlayerState', () => {
  it('should return null for non-existent player', () => {
    const state = new GameState();
    expect(state.getPlayerState('nonexistent')).toBeNull();
  });

  it('should return a copy of player state (not direct reference)', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const playerState = state.getPlayerState('player-1');
    playerState.position.x = 999;

    const playerState2 = state.getPlayerState('player-1');
    expect(playerState2.position.x).not.toBe(999);
  });
});

describe('GameState getAllPlayerStates', () => {
  it('should return empty object when no players', () => {
    const state = new GameState();
    expect(state.getAllPlayerStates()).toEqual({});
  });

  it('should return all player states keyed by playerId', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');
    state.registerPlayer('player-2', 'puppet-2');

    const allStates = state.getAllPlayerStates();
    expect(Object.keys(allStates)).toContain('player-1');
    expect(Object.keys(allStates)).toContain('player-2');
  });

  it('should include puppetId in state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1', 'Alice');

    const allStates = state.getAllPlayerStates();
    expect(allStates['player-1'].puppetId).toBe('puppet-1');
    expect(allStates['player-1'].nickname).toBe('Alice');
  });
});

describe('GameState setPuppetConfig', () => {
  it('should set puppet configuration for a player', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const config = { name: 'Basic Puppet', bones: [] };
    state.setPuppetConfig('player-1', config);

    const playerState = state.getPlayerState('player-1');
    expect(playerState.puppetConfig).toEqual(config);
  });

  it('should return false for non-existent player', () => {
    const state = new GameState();
    const config = { name: 'Basic Puppet', bones: [] };
    const result = state.setPuppetConfig('nonexistent', config);
    expect(result).toBe(false);
  });
});

describe('GameState createStateSnapshot', () => {
  it('should create a deep copy of all state', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1', 'Alice');
    state.movePlayerTo('player-1', 3, 4);

    const snapshot = state.createStateSnapshot();
    expect(snapshot['player-1']).toBeTruthy();
    expect(snapshot['player-1'].position.x).toBe(3);
    expect(snapshot['player-1'].position.z).toBe(4);
  });

  it('should return empty object when no players', () => {
    const state = new GameState();
    const snapshot = state.createStateSnapshot();
    expect(snapshot).toEqual({});
  });
});

describe('GameState getPlayerByPuppetId', () => {
  it('should find a player by their puppetId', () => {
    const state = new GameState();
    state.registerPlayer('player-1', 'puppet-1');

    const playerId = state.getPlayerByPuppetId('puppet-1');
    expect(playerId).toBe('player-1');
  });

  it('should return null for non-existent puppetId', () => {
    const state = new GameState();
    const playerId = state.getPlayerByPuppetId('nonexistent');
    expect(playerId).toBeNull();
  });
});

describe('GameState default stage locations', () => {
  it('should have center at origin', () => {
    const state = new GameState();
    const locations = state.getStageLocations();
    expect(locations.center.x).toBe(0);
    expect(locations.center.z).toBe(0);
  });

  it('should have stage locations with reasonable coordinates', () => {
    const state = new GameState();
    const locations = state.getStageLocations();

    // Stage left should be negative x
    expect(locations.stageLeft.x).toBeLessThan(0);
    // Stage right should be positive x
    expect(locations.stageRight.x).toBeGreaterThan(0);
  });
});