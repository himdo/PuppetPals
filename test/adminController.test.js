/** Unit Tests for server/admin-controller.js
 * Tests server-side admin controller for master controls
 */

import AdminController from '../server/admin-controller.js';

// ============================================================
// Helper: create mock dependencies
// ============================================================
function createMockAuthManager(isOwner = true) {
  const players = [
    { sessionId: 'session-1', socketId: 'socket-1', nickname: 'Admin', role: 'owner' },
    { sessionId: 'session-target', socketId: 'socket-target', nickname: 'Player1', role: 'client' },
  ];
  const ownerId = 'session-1';

  return {
    isOwner: (sessionId) => isOwner && sessionId === ownerId,
    getPlayerBySocket: (socketId) => players.find(p => p.socketId === socketId) || null,
    getPlayerByNickname: (nickname) => players.find(p => p.nickname === nickname) || null,
    getPlayers: () => [...players],
    getOwnerId: () => ownerId,
    removePlayer: (socketId) => {
      const idx = players.findIndex(p => p.socketId === socketId);
      if (idx !== -1) players.splice(idx, 1);
    },
  };
}

function createMockGameState() {
  const state = {};
  return {
    getPlayerState: (playerId) => state[playerId] || null,
    getAllPlayerStates: () => ({ ...state }),
    movePlayer: (playerId, location) => {
      if (!state[playerId]) return false;
      const locations = { center: { x: 0, z: 0 }, stageLeft: { x: -5, z: 0 } };
      const target = locations[location];
      if (!target) return false;
      state[playerId].position = { ...target, y: 0 };
      return true;
    },
    movePlayerTo: (playerId, x, z) => {
      if (!state[playerId]) return false;
      state[playerId].position = { x, y: 0, z };
      return true;
    },
    lockPlayer: (playerId) => {
      if (!state[playerId]) return false;
      state[playerId].isLocked = true;
      return true;
    },
    unlockPlayer: (playerId) => {
      if (!state[playerId]) return false;
      state[playerId].isLocked = false;
      return true;
    },
    setAnimation: (playerId, animation) => {
      if (!state[playerId]) return false;
      state[playerId].currentAnimation = animation;
      return true;
    },
    setPuppetConfig: (playerId, config) => {
      if (!state[playerId]) return false;
      state[playerId].puppetConfig = config;
      return true;
    },
    unregisterPlayer: (playerId) => {
      if (!state[playerId]) return false;
      delete state[playerId];
      return true;
    },
    getStageLocations: () => ({
      center: { x: 0, y: 0, z: 0 },
      stageLeft: { x: -5, y: 0, z: 0 },
      stageRight: { x: 5, y: 0, z: 0 },
    }),
    _setState: (playerId, data) => { state[playerId] = data; },
    _getState: () => state,
  };
}

function createMockAnimationSync() {
  const animations = {};
  return {
    startAnimation: (puppetId, sessionId, animation, override) => {
      animations[puppetId] = { sessionId, animation, override };
    },
    stopAnimation: (puppetId) => {
      delete animations[puppetId];
    },
    _getAnimations: () => animations,
  };
}

function createMockIO() {
  const broadcastLogs = [];
  return {
    emit: (event, data) => {
      broadcastLogs.push({ event, data, broadcast: true });
    },
    to: (room) => ({
      emit: (event, data) => {
        broadcastLogs.push({ event, data, room });
      },
    }),
    sockets: {
      deleteSocket: (socketId) => {},
    },
    getBroadcastLogs: () => broadcastLogs,
    clearBroadcastLogs: () => { broadcastLogs.length = 0; },
  };
}

// ============================================================
// AdminController construction
// ============================================================
describe('AdminController construction', () => {
  it('should create an instance with required dependencies', () => {
    const auth = createMockAuthManager();
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    expect(admin).toBeTruthy();
    expect(admin.io).toBe(io);
    expect(admin.authManager).toBe(auth);
    expect(admin.gameState).toBe(game);
    expect(admin.animationSync).toBe(anim);
  });

  it('should initialize background to default', () => {
    const auth = createMockAuthManager();
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    expect(admin.currentBackground).toBe('default');
  });
});

// ============================================================
// verifyOwner - admin authorization check
// ============================================================
describe('AdminController verifyOwner', () => {
  it('should return success when socket belongs to owner', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();
    const admin = new AdminController(io, auth, game, anim);

    const socket = { id: 'socket-1' };
    const result = admin.verifyOwner(socket);

    expect(result.authorized).toBe(true);
    expect(result.player.sessionId).toBe('session-1');
  });

  it('should return failure when socket does not belong to owner', () => {
    const auth = createMockAuthManager(false);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();
    const admin = new AdminController(io, auth, game, anim);

    const socket = { id: 'socket-1' };
    const result = admin.verifyOwner(socket);

    expect(result.authorized).toBe(false);
  });

  it('should return failure when player not found', () => {
    const auth = {
      isOwner: () => false,
      getPlayerBySocket: () => null,
    };
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();
    const admin = new AdminController(io, auth, game, anim);

    const socket = { id: 'unknown-socket' };
    const result = admin.verifyOwner(socket);

    expect(result.authorized).toBe(false);
  });
});

// ============================================================
// forceMovePuppet - admin moves any puppet
// ============================================================
describe('AdminController forceMovePuppet', () => {
  it('should force move a puppet to a predefined location', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.forceMovePuppet('session-target', 'center');

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.position.x).toBe(0);
    expect(state.position.z).toBe(0);
  });

  it('should force move a puppet to exact coordinates', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.forceMovePuppet('session-target', null, 10, -5);

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.position.x).toBe(10);
    expect(state.position.z).toBe(-5);
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.forceMovePuppet('nonexistent', 'center');

    expect(result.success).toBe(false);
  });

  it('should return failure for invalid location without coordinates', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.forceMovePuppet('session-target', 'invalidLocation');

    expect(result.success).toBe(false);
  });

  it('should broadcast puppet-moved to all clients', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.forceMovePuppet('session-target', 'stageLeft');

    const logs = io.getBroadcastLogs();
    const movedLog = logs.find(l => l.event === 'puppet-moved');
    expect(movedLog).toBeTruthy();
    expect(movedLog.data.playerId).toBe('session-target');
  });
});

// ============================================================
// lockPuppet / unlockPuppet - admin locks any puppet
// ============================================================
describe('AdminController lockPuppet / unlockPuppet', () => {
  it('should lock a player puppet', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      isLocked: false,
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.lockPuppet('session-target');

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.isLocked).toBe(true);
  });

  it('should unlock a player puppet', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      isLocked: true,
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.unlockPuppet('session-target');

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.isLocked).toBe(false);
  });

  it('should return failure when locking non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.lockPuppet('nonexistent');

    expect(result.success).toBe(false);
  });

  it('should broadcast state update when locking', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      isLocked: false,
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.lockPuppet('session-target');

    const logs = io.getBroadcastLogs();
    const updateLog = logs.find(l => l.event === 'state-update');
    expect(updateLog).toBeTruthy();
    expect(updateLog.data.isLocked).toBe(true);
  });
});

// ============================================================
// forceAnimation - admin forces animation on any puppet
// ============================================================
describe('AdminController forceAnimation', () => {
  it('should force start animation on a puppet', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    const animation = { id: 'dance', name: 'Dance', duration: 2000, loop: true };
    const result = admin.forceAnimation('session-target', animation);

    expect(result.success).toBe(true);
    const anims = anim._getAnimations();
    expect(anims['puppet-1']).toBeTruthy();
    expect(anims['puppet-1'].animation.id).toBe('dance');
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const animation = { id: 'dance', name: 'Dance', duration: 2000, loop: true };
    const result = admin.forceAnimation('nonexistent', animation);

    expect(result.success).toBe(false);
  });

  it('should return failure when animation is missing', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.forceAnimation('session-target', null);

    expect(result.success).toBe(false);
  });

  it('should broadcast animation-started to all clients', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    const animation = { id: 'wave', name: 'Wave', duration: 1000, loop: false };
    admin.forceAnimation('session-target', animation);

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'animation-started');
    expect(log).toBeTruthy();
    expect(log.data.animation.id).toBe('wave');
  });
});

// ============================================================
// stopAnimation - admin stops animation on any puppet
// ============================================================
describe('AdminController stopAnimation', () => {
  it('should stop animation on a puppet', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.stopAnimation('session-target');

    expect(result.success).toBe(true);
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.stopAnimation('nonexistent');

    expect(result.success).toBe(false);
  });

  it('should broadcast animation-stopped to all clients', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.stopAnimation('session-target');

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'animation-stopped');
    expect(log).toBeTruthy();
    expect(log.data.puppetId).toBe('puppet-1');
  });
});

// ============================================================
// ejectPlayer - admin removes a player
// ============================================================
describe('AdminController ejectPlayer', () => {
  it('should eject a player from the game', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      nickname: 'Player1',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.ejectPlayer('session-target');

    expect(result.success).toBe(true);
    expect(game.getPlayerState('session-target')).toBeNull();
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.ejectPlayer('nonexistent');

    expect(result.success).toBe(false);
  });

  it('should broadcast player-disconnected when ejecting', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      nickname: 'Player1',
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.ejectPlayer('session-target');

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'player-disconnected');
    expect(log).toBeTruthy();
    expect(log.data.nickname).toBe('Player1');
  });

  it('should not allow ejecting self', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-1', {
      playerId: 'session-1',
      puppetId: 'puppet-admin',
      nickname: 'Admin',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.ejectPlayer('session-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('yourself');
  });
});

// ============================================================
// moveOffStage - admin moves puppet off-stage
// ============================================================
describe('AdminController moveOffStage', () => {
  it('should move a puppet off-stage', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.moveOffStage('session-target');

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.position.x).toBe(999);
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.moveOffStage('nonexistent');

    expect(result.success).toBe(false);
  });

  it('should broadcast puppet-moved when moving off-stage', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.moveOffStage('session-target');

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'puppet-moved');
    expect(log).toBeTruthy();
    expect(log.data.offStage).toBe(true);
  });
});

// ============================================================
// changeBackground - admin changes stage background
// ============================================================
describe('AdminController changeBackground', () => {
  it('should change the stage background', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.changeBackground('beach-stage.png');

    expect(result.success).toBe(true);
    expect(admin.currentBackground).toBe('beach-stage.png');
  });

  it('should return failure for empty background', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.changeBackground('');

    expect(result.success).toBe(false);
  });

  it('should broadcast background-changed to all clients', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    admin.changeBackground('forest-stage.png');

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'background-changed');
    expect(log).toBeTruthy();
    expect(log.data.background).toBe('forest-stage.png');
  });

  it('should reset background to default', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    admin.changeBackground('custom.png');
    admin.changeBackground('default');

    expect(admin.currentBackground).toBe('default');
  });
});

// ============================================================
// overridePuppetConfig - admin overrides puppet configuration
// ============================================================
describe('AdminController overridePuppetConfig', () => {
  it('should override a player puppet config', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      puppetConfig: { name: 'Old Puppet' },
    });

    const admin = new AdminController(io, auth, game, anim);
    const newConfig = { name: 'New Puppet', bones: [] };
    const result = admin.overridePuppetConfig('session-target', newConfig);

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.puppetConfig.name).toBe('New Puppet');
  });

  it('should return failure for non-existent player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.overridePuppetConfig('nonexistent', { name: 'New' });

    expect(result.success).toBe(false);
  });

  it('should broadcast puppet-config-overridden to all clients', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      puppetConfig: { name: 'Old' },
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.overridePuppetConfig('session-target', { name: 'New', bones: [] });

    const logs = io.getBroadcastLogs();
    const log = logs.find(l => l.event === 'puppet-config-overridden');
    expect(log).toBeTruthy();
    expect(log.data.playerId).toBe('session-target');
  });
});

// ============================================================
// pauseAllAnimations - admin pauses all animations
// ============================================================
describe('AdminController pauseAllAnimations', () => {
  it('should stop all animations for all players', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });
    game._setState('session-2', {
      playerId: 'session-2',
      puppetId: 'puppet-2',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.pauseAllAnimations();

    expect(result.success).toBe(true);
    expect(result.stoppedCount).toBe(2);
  });

  it('should broadcast animation-stopped for each puppet', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.pauseAllAnimations();

    const logs = io.getBroadcastLogs();
    const stoppedLogs = logs.filter(l => l.event === 'animation-stopped');
    expect(stoppedLogs.length).toBe(1);
    expect(stoppedLogs[0].data.puppetId).toBe('puppet-1');
  });
});

// ============================================================
// resetAllPositions - admin resets all puppet positions
// ============================================================
describe('AdminController resetAllPositions', () => {
  it('should reset all puppets to center stage', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 10, y: 0, z: 10 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.resetAllPositions();

    expect(result.success).toBe(true);
    const state = game.getPlayerState('session-target');
    expect(state.position.x).toBe(0);
    expect(state.position.z).toBe(0);
  });

  it('should broadcast puppet-moved for each player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      position: { x: 10, y: 0, z: 10 },
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.resetAllPositions();

    const logs = io.getBroadcastLogs();
    const movedLogs = logs.filter(l => l.event === 'puppet-moved');
    expect(movedLogs.length).toBe(1);
  });
});

// ============================================================
// kickAllPlayers - admin removes all players
// ============================================================
describe('AdminController kickAllPlayers', () => {
  it('should remove all players except owner', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-1', {
      playerId: 'session-1',
      puppetId: 'puppet-admin',
      nickname: 'Admin',
      role: 'owner',
    });
    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      nickname: 'Player1',
      role: 'client',
    });

    const admin = new AdminController(io, auth, game, anim);
    const result = admin.kickAllPlayers();

    expect(result.success).toBe(true);
    expect(result.kickedCount).toBe(1);
    expect(game.getPlayerState('session-1')).toBeTruthy(); // Owner stays
    expect(game.getPlayerState('session-target')).toBeNull(); // Target removed
  });

  it('should broadcast player-disconnected for each kicked player', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-1', {
      playerId: 'session-1',
      puppetId: 'puppet-admin',
      nickname: 'Admin',
      role: 'owner',
    });
    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      nickname: 'Player1',
      role: 'client',
    });

    const admin = new AdminController(io, auth, game, anim);
    admin.kickAllPlayers();

    const logs = io.getBroadcastLogs();
    const disconnectLogs = logs.filter(l => l.event === 'player-disconnected');
    expect(disconnectLogs.length).toBe(1);
  });
});

// ============================================================
// getPlayerList - get list of all players
// ============================================================
describe('AdminController getPlayerList', () => {
  it('should return list of all players with game state info', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    game._setState('session-target', {
      playerId: 'session-target',
      puppetId: 'puppet-1',
      nickname: 'Player1',
      isLocked: false,
      position: { x: 0, y: 0, z: 0 },
    });

    const admin = new AdminController(io, auth, game, anim);
    const list = admin.getPlayerList();

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    const target = list.find(p => p.sessionId === 'session-target');
    expect(target).toBeTruthy();
    expect(target.nickname).toBe('Player1');
    expect(target.puppetId).toBe('puppet-1');
  });
});

// ============================================================
// getOffStagePosition - returns hidden position
// ============================================================
describe('AdminController getOffStagePosition', () => {
  it('should return a position far off-stage', () => {
    const auth = createMockAuthManager(true);
    const game = createMockGameState();
    const anim = createMockAnimationSync();
    const io = createMockIO();

    const admin = new AdminController(io, auth, game, anim);
    const pos = admin.getOffStagePosition();

    expect(pos.x).toBe(999);
    expect(pos.y).toBe(0);
    expect(pos.z).toBe(0);
  });
});