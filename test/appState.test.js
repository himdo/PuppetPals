/** Unit Tests for client/js/app-state.js
 * Tests client-side state mirror and synchronization
 */

import AppState from '../client/js/app-state.js';

describe('AppState construction', () => {
  it('should create an instance', () => {
    const state = new AppState();
    expect(state).toBeTruthy();
  });

  it('should start with no player states', () => {
    const state = new AppState();
    expect(state.getAllPlayers()).toEqual({});
  });

  it('should start with no local playerId', () => {
    const state = new AppState();
    expect(state.localPlayerId).toBeNull();
  });

  it('should start with no socket client', () => {
    const state = new AppState();
    expect(state.socketClient).toBeNull();
  });
});

describe('AppState setSocketClient', () => {
  it('should store the socket client reference', () => {
    const state = new AppState();
    const mockSocket = { on: jest.fn(), emit: jest.fn() };
    state.setSocketClient(mockSocket);
    expect(state.socketClient).toBe(mockSocket);
  });
});

describe('AppState setLocalPlayer', () => {
  it('should set the local player ID and puppet ID', () => {
    const state = new AppState();
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    expect(state.localPlayerId).toBe('player-1');
    expect(state.localPuppetId).toBe('puppet-1');
    expect(state.localNickname).toBe('Alice');
  });
});

describe('AppState applyFullStateSync', () => {
  it('should replace all player states with the sync data', () => {
    const state = new AppState();
    const syncData = {
      'player-1': {
        playerId: 'player-1',
        puppetId: 'puppet-1',
        position: { x: 0, y: 0, z: 0 },
        isLocked: false,
      },
      'player-2': {
        playerId: 'player-2',
        puppetId: 'puppet-2',
        position: { x: 5, y: 0, z: 0 },
        isLocked: true,
      },
    };

    state.applyFullStateSync(syncData);

    const players = state.getAllPlayers();
    expect(players['player-1']).toEqual(syncData['player-1']);
    expect(players['player-2']).toEqual(syncData['player-2']);
  });

  it('should clear existing state before applying sync', () => {
    const state = new AppState();
    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
    });

    state.applyFullStateSync({
      'player-2': { playerId: 'player-2', puppetId: 'puppet-2', position: { x: 5, y: 0, z: 0 } },
    });

    const players = state.getAllPlayers();
    expect(players['player-1']).toBeUndefined();
    expect(players['player-2']).toBeTruthy();
  });
});

describe('AppState applyStateUpdate', () => {
  it('should update a single player state', () => {
    const state = new AppState();
    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
    });

    state.applyStateUpdate({
      playerId: 'player-1',
      position: { x: 3, y: 0, z: 4 },
    });

    const player = state.getPlayer('player-1');
    expect(player.position.x).toBe(3);
    expect(player.position.z).toBe(4);
  });

  it('should add a new player if not in state', () => {
    const state = new AppState();

    state.applyStateUpdate({
      playerId: 'player-1',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const player = state.getPlayer('player-1');
    expect(player).toBeTruthy();
    expect(player.puppetId).toBe('puppet-1');
  });

  it('should handle remove action', () => {
    const state = new AppState();
    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
    });

    state.applyStateUpdate({
      playerId: 'player-1',
      _remove: true,
    });

    const player = state.getPlayer('player-1');
    expect(player).toBeNull();
  });
});

describe('AppState getPlayer', () => {
  it('should return null for non-existent player', () => {
    const state = new AppState();
    expect(state.getPlayer('nonexistent')).toBeNull();
  });

  it('should return a copy of player data', () => {
    const state = new AppState();
    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
    });

    const player = state.getPlayer('player-1');
    player.position.x = 999;

    const player2 = state.getPlayer('player-1');
    expect(player2.position.x).toBe(0);
  });
});

describe('AppState getAllPlayers', () => {
  it('should return deep copies of all players', () => {
    const state = new AppState();
    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
    });

    const all = state.getAllPlayers();
    expect(all['player-1']).toBeTruthy();
    expect(all['player-1'].puppetId).toBe('puppet-1');
  });
});

describe('AppState getLocalPlayerState', () => {
  it('should return null when local player not set', () => {
    const state = new AppState();
    expect(state.getLocalPlayerState()).toBeNull();
  });

  it('should return the local player state from sync data', () => {
    const state = new AppState();
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 3, y: 0, z: 4 }, isLocked: false },
    });

    const localState = state.getLocalPlayerState();
    expect(localState).toBeTruthy();
    expect(localState.position.x).toBe(3);
  });
});

describe('AppState isLocalPlayerLocked', () => {
  it('should return false when local player not set', () => {
    const state = new AppState();
    expect(state.isLocalPlayerLocked()).toBe(false);
  });

  it('should return lock status of local player', () => {
    const state = new AppState();
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.applyFullStateSync({
      'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 }, isLocked: true },
    });

    expect(state.isLocalPlayerLocked()).toBe(true);
  });
});

describe('AppState requestMove', () => {
  it('should emit move-puppet event via socket', () => {
    const state = new AppState();
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.requestMove('center');

    expect(mockSocket.emit).toHaveBeenCalledWith('move-puppet', {
      puppetId: 'puppet-1',
      location: 'center',
    });
  });

  it('should emit move-puppet with exact coordinates', () => {
    const state = new AppState();
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    state.requestMoveTo(3, 4);

    expect(mockSocket.emit).toHaveBeenCalledWith('move-puppet', {
      puppetId: 'puppet-1',
      x: 3,
      z: 4,
    });
  });

  it('should do nothing when socket client not set', () => {
    const state = new AppState();
    state.setLocalPlayer('player-1', 'puppet-1', 'Alice');

    expect(() => state.requestMove('center')).not.toThrow();
  });

  it('should do nothing when local player not set', () => {
    const state = new AppState();
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);

    expect(() => state.requestMove('center')).not.toThrow();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe('AppState setupSocketListeners', () => {
  it('should register socket event listeners', () => {
    const state = new AppState();
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);

    state.setupSocketListeners();

    // Check that socket.on was called for state events
    expect(mockSocket.on).toHaveBeenCalledWith('state-sync', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('state-update', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('puppet-moved', expect.any(Function));
  });

  it('should handle state-sync event', () => {
    const state = new AppState();
    const mockSocket = {
      on: jest.fn((event, handler) => {
        if (event === 'state-sync') {
          handler({
            'player-1': { playerId: 'player-1', puppetId: 'puppet-1', position: { x: 0, y: 0, z: 0 } },
          });
        }
      }),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);
    state.setupSocketListeners();

    const players = state.getAllPlayers();
    expect(players['player-1']).toBeTruthy();
  });

  it('should handle state-update event', () => {
    const state = new AppState();
    const onUpdate = jest.fn();
    state.on('playerUpdated', onUpdate);

    const mockSocket = {
      on: jest.fn((event, handler) => {
        if (event === 'state-update') {
          handler({
            playerId: 'player-1',
            puppetId: 'puppet-1',
            position: { x: 5, y: 0, z: 0 },
          });
        }
      }),
      emit: jest.fn(),
    };
    state.setSocketClient(mockSocket);
    state.setupSocketListeners();

    expect(onUpdate).toHaveBeenCalledWith('player-1');
  });
});

describe('AppState event emitter', () => {
  it('should allow registering and emitting custom events', () => {
    const state = new AppState();
    const callback = jest.fn();
    state.on('testEvent', callback);

    state.emit('testEvent', 'arg1', 'arg2');

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should support multiple listeners for the same event', () => {
    const state = new AppState();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    state.on('testEvent', cb1);
    state.on('testEvent', cb2);

    state.emit('testEvent', 'data');

    expect(cb1).toHaveBeenCalledWith('data');
    expect(cb2).toHaveBeenCalledWith('data');
  });

  it('should support removing listeners', () => {
    const state = new AppState();
    const callback = jest.fn();
    state.on('testEvent', callback);
    state.off('testEvent', callback);

    state.emit('testEvent', 'data');

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('AppState getStageLocations', () => {
  it('should return predefined stage locations', () => {
    const state = new AppState();
    const locations = state.getStageLocations();

    expect(locations).toHaveProperty('center');
    expect(locations).toHaveProperty('stageLeft');
    expect(locations).toHaveProperty('stageRight');
  });
});