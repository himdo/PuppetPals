/** Unit Tests for client/js/ui/admin-panel.js
 * Tests client-side admin panel UI for server owner master controls
 */

import AdminPanel from '../client/js/ui/admin-panel.js';

// ============================================================
// Helper: create mock socket client
// ============================================================
function createMockSocket() {
  const emitted = [];
  const listeners = {};
  return {
    emit: (event, data) => {
      emitted.push({ event, data });
    },
    on: (event, handler) => {
      listeners[event] = handler;
    },
    off: (event) => {
      delete listeners[event];
    },
    getEmitted: () => emitted,
    getListener: (event) => listeners[event] || null,
    triggerEvent: (event, data) => {
      if (listeners[event]) listeners[event](data);
    },
    clearEmitted: () => emitted.length = 0,
  };
}

// ============================================================
// Helper: create mock DOM elements
// ============================================================
function createMockDOM() {
  const elements = {};
  const styles = {};

  return {
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        textContent: '',
        children: [],
        attributes: {},
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false,
        },
        appendChild: function(child) {
          this.children.push(child);
        },
        setAttribute: (key, value) => {
          this.attributes[key] = value;
        },
        getAttribute: (key) => this.attributes[key],
        addEventListener: () => {},
        click: () => {},
      };
      return el;
    },
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = {
          id,
          className: '',
          innerHTML: '',
          children: [],
          style: {},
          appendChild: function(child) {
            this.children.push(child);
          },
          querySelector: () => null,
          querySelectorAll: () => [],
        };
      }
      return elements[id];
    },
    getElements: () => elements,
  };
}

// ============================================================
// AdminPanel construction
// ============================================================
describe('AdminPanel construction', () => {
  it('should create an instance', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    expect(admin).toBeTruthy();
  });

  it('should store the socket client', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    expect(admin.socket).toBe(socket);
  });

  it('should initialize playerList as empty array', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    expect(Array.isArray(admin.playerList)).toBe(true);
    expect(admin.playerList.length).toBe(0);
  });

  it('should initialize isVisible as false', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    expect(admin.isVisible).toBe(false);
  });

  it('should initialize currentBackground', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    expect(admin.currentBackground).toBe('default');
  });
});

// ============================================================
// AdminPanel initializeEventListeners
// ============================================================
describe('AdminPanel initializeEventListeners', () => {
  it('should set up socket event listeners', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    expect(socket.getListener('admin-player-list')).toBeTruthy();
    expect(socket.getListener('state-update')).toBeTruthy();
    expect(socket.getListener('background-changed')).toBeTruthy();
  });

  it('should handle admin-player-list event', () => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };

    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    const playerData = {
      players: [
        { sessionId: 's1', nickname: 'Admin', role: 'owner', isLocked: false },
        { sessionId: 's2', nickname: 'Player1', role: 'client', isLocked: true },
      ],
    };

    socket.triggerEvent('admin-player-list', playerData);

    expect(admin.playerList.length).toBe(2);
    expect(admin.playerList[0].nickname).toBe('Admin');
    expect(admin.playerList[1].isLocked).toBe(true);

    delete global.document;
  });

  it('should update player state on state-update event', () => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };

    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    // Pre-populate player list
    admin.playerList = [
      { sessionId: 's1', nickname: 'Admin', role: 'owner', isLocked: false },
      { sessionId: 's2', nickname: 'Player1', role: 'client', isLocked: false },
    ];

    socket.triggerEvent('state-update', {
      playerId: 's2',
      isLocked: true,
    });

    expect(admin.playerList[1].isLocked).toBe(true);

    delete global.document;
  });

  it('should update background on background-changed event', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    socket.triggerEvent('background-changed', {
      background: 'beach-stage.png',
    });

    expect(admin.currentBackground).toBe('beach-stage.png');
  });
});

// ============================================================
// AdminPanel show / hide
// ============================================================
describe('AdminPanel show / hide', () => {
  it('should show the admin panel', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.show();

    expect(admin.isVisible).toBe(true);
  });

  it('should hide the admin panel', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.show();
    admin.hide();

    expect(admin.isVisible).toBe(false);
  });

  it('should toggle visibility', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);

    admin.toggle();
    expect(admin.isVisible).toBe(true);

    admin.toggle();
    expect(admin.isVisible).toBe(false);
  });
});

// ============================================================
// AdminPanel requestPlayerList
// ============================================================
describe('AdminPanel requestPlayerList', () => {
  it('should emit admin-get-players event', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.requestPlayerList();

    const emitted = socket.getEmitted();
    const req = emitted.find(e => e.event === 'admin-get-players');
    expect(req).toBeTruthy();
  });
});

// ============================================================
// AdminPanel lockPlayer / unlockPlayer
// ============================================================
describe('AdminPanel lockPlayer / unlockPlayer', () => {
  it('should emit admin-lock-puppet with lock=true', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.lockPlayer('session-target');

    const emitted = socket.getEmitted();
    const lock = emitted.find(e => e.event === 'admin-lock-puppet');
    expect(lock).toBeTruthy();
    expect(lock.data.playerId).toBe('session-target');
    expect(lock.data.lock).toBe(true);
  });

  it('should emit admin-lock-puppet with lock=false for unlock', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.unlockPlayer('session-target');

    const emitted = socket.getEmitted();
    const unlock = emitted.find(e => e.event === 'admin-lock-puppet');
    expect(unlock).toBeTruthy();
    expect(unlock.data.playerId).toBe('session-target');
    expect(unlock.data.lock).toBe(false);
  });
});

// ============================================================
// AdminPanel movePlayer
// ============================================================
describe('AdminPanel movePlayer', () => {
  it('should emit admin-move-puppet with location', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.movePlayer('session-target', 'center');

    const emitted = socket.getEmitted();
    const move = emitted.find(e => e.event === 'admin-move-puppet');
    expect(move).toBeTruthy();
    expect(move.data.playerId).toBe('session-target');
    expect(move.data.location).toBe('center');
  });

  it('should emit admin-move-puppet with coordinates', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.movePlayer('session-target', null, 5, -3);

    const emitted = socket.getEmitted();
    const move = emitted.find(e => e.event === 'admin-move-puppet');
    expect(move).toBeTruthy();
    expect(move.data.x).toBe(5);
    expect(move.data.z).toBe(-3);
  });
});

// ============================================================
// AdminPanel forceAnimation
// ============================================================
describe('AdminPanel forceAnimation', () => {
  it('should emit admin-force-animation', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    const animation = { id: 'dance', name: 'Dance', duration: 2000, loop: true };
    admin.forceAnimation('session-target', animation);

    const emitted = socket.getEmitted();
    const anim = emitted.find(e => e.event === 'admin-force-animation');
    expect(anim).toBeTruthy();
    expect(anim.data.playerId).toBe('session-target');
    expect(anim.data.animation.id).toBe('dance');
  });
});

// ============================================================
// AdminPanel stopAnimation
// ============================================================
describe('AdminPanel stopAnimation', () => {
  it('should emit admin-stop-animation-puppet', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.stopAnimation('session-target');

    const emitted = socket.getEmitted();
    const stop = emitted.find(e => e.event === 'admin-stop-animation-puppet');
    expect(stop).toBeTruthy();
    expect(stop.data.playerId).toBe('session-target');
  });
});

// ============================================================
// AdminPanel ejectPlayer
// ============================================================
describe('AdminPanel ejectPlayer', () => {
  it('should emit admin-eject-player', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.ejectPlayer('session-target');

    const emitted = socket.getEmitted();
    const eject = emitted.find(e => e.event === 'admin-eject-player');
    expect(eject).toBeTruthy();
    expect(eject.data.playerId).toBe('session-target');
  });
});

// ============================================================
// AdminPanel moveOffStage
// ============================================================
describe('AdminPanel moveOffStage', () => {
  it('should emit admin-offstage-puppet', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.moveOffStage('session-target');

    const emitted = socket.getEmitted();
    const off = emitted.find(e => e.event === 'admin-offstage-puppet');
    expect(off).toBeTruthy();
    expect(off.data.playerId).toBe('session-target');
  });
});

// ============================================================
// AdminPanel changeBackground
// ============================================================
describe('AdminPanel changeBackground', () => {
  it('should emit admin-change-background', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.changeBackground('beach-stage.png');

    const emitted = socket.getEmitted();
    const bg = emitted.find(e => e.event === 'admin-change-background');
    expect(bg).toBeTruthy();
    expect(bg.data.background).toBe('beach-stage.png');
  });
});

// ============================================================
// AdminPanel pauseAllAnimations
// ============================================================
describe('AdminPanel pauseAllAnimations', () => {
  it('should emit admin-pause-all', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.pauseAllAnimations();

    const emitted = socket.getEmitted();
    const pause = emitted.find(e => e.event === 'admin-pause-all');
    expect(pause).toBeTruthy();
  });
});

// ============================================================
// AdminPanel resetAllPositions
// ============================================================
describe('AdminPanel resetAllPositions', () => {
  it('should emit admin-reset-all', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.resetAllPositions();

    const emitted = socket.getEmitted();
    const reset = emitted.find(e => e.event === 'admin-reset-all');
    expect(reset).toBeTruthy();
  });
});

// ============================================================
// AdminPanel kickAllPlayers
// ============================================================
describe('AdminPanel kickAllPlayers', () => {
  it('should emit admin-kick-all', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.kickAllPlayers();

    const emitted = socket.getEmitted();
    const kick = emitted.find(e => e.event === 'admin-kick-all');
    expect(kick).toBeTruthy();
  });
});

// ============================================================
// AdminPanel getPlayerById
// ============================================================
describe('AdminPanel getPlayerById', () => {
  it('should find a player by session ID', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.playerList = [
      { sessionId: 's1', nickname: 'Admin' },
      { sessionId: 's2', nickname: 'Player1' },
    ];

    const player = admin.getPlayerById('s2');
    expect(player).toBeTruthy();
    expect(player.nickname).toBe('Player1');
  });

  it('should return null for non-existent player', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.playerList = [];

    const player = admin.getPlayerById('nonexistent');
    expect(player).toBeNull();
  });
});

// ============================================================
// AdminPanel getStageLocations
// ============================================================
describe('AdminPanel getStageLocations', () => {
  it('should return predefined stage locations', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    const locations = admin.getStageLocations();

    expect(locations).toBeTruthy();
    expect(locations.length).toBeGreaterThan(0);
    expect(locations[0]).toHaveProperty('key');
    expect(locations[0]).toHaveProperty('label');
  });

  it('should include center location', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    const locations = admin.getStageLocations();

    const center = locations.find(l => l.key === 'center');
    expect(center).toBeTruthy();
  });
});

// ============================================================
// AdminPanel slot management methods
// ============================================================
describe('AdminPanel setOnScreenSlotCount', () => {
  it('should emit admin-set-slot-count with the count', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.setOnScreenSlotCount(7);

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-set-slot-count');
    expect(evt).toBeTruthy();
    expect(evt.data.count).toBe(7);
  });

  it('should clamp count to minimum of 2', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.setOnScreenSlotCount(1);

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-set-slot-count');
    expect(evt.data.count).toBe(2);
  });

  it('should clamp count to maximum of 10', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.setOnScreenSlotCount(15);

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-set-slot-count');
    expect(evt.data.count).toBe(10);
  });
});

describe('AdminPanel movePuppetDirection', () => {
  it('should emit admin-move-direction with targetPlayerId and direction', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.movePuppetDirection('session-target', 'right');

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-move-direction');
    expect(evt).toBeTruthy();
    expect(evt.data.targetPlayerId).toBe('session-target');
    expect(evt.data.direction).toBe('right');
  });

  it('should emit admin-move-direction for left direction', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.movePuppetDirection('session-target', 'left');

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-move-direction');
    expect(evt.data.direction).toBe('left');
  });
});

describe('AdminPanel movePuppetToSlot', () => {
  it('should emit admin-move-to-slot with targetPlayerId and slotIndex', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.movePuppetToSlot('session-target', 5);

    const emitted = socket.getEmitted();
    const evt = emitted.find(e => e.event === 'admin-move-to-slot');
    expect(evt).toBeTruthy();
    expect(evt.data.targetPlayerId).toBe('session-target');
    expect(evt.data.slotIndex).toBe(5);
  });
});

describe('AdminPanel getSlotLabel', () => {
  it('should return "Off-screen (far left)" for slot index 0', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    const label = admin.getSlotLabel(0);
    expect(label).toBe('Off-screen (far left)');
  });

  it('should return "Off-screen (left)" for slot index 1', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    const label = admin.getSlotLabel(1);
    expect(label).toBe('Off-screen (left)');
  });

  it('should return a slot label for on-screen slots', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.onScreenSlotCount = 5;
    const label = admin.getSlotLabel(2);
    expect(label).toBeTruthy();
    expect(label).toContain('Slot');
  });

  it('should return "Center" label for the center slot when onScreenSlotCount is odd', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.onScreenSlotCount = 5;
    // With 5 on-screen slots, center is at index 2 (onScreenIndex=2, slotIndex=4)
    const label = admin.getSlotLabel(4);
    expect(label).toContain('Center');
  });
});

describe('AdminPanel getSlotOptions', () => {
  it('should return all slot options including off-screen', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.onScreenSlotCount = 5;
    const options = admin.getSlotOptions();

    expect(options.length).toBe(7); // 2 off-screen + 5 on-screen
  });

  it('should include off-screen options', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.onScreenSlotCount = 5;
    const options = admin.getSlotOptions();

    const offscreenFarLeft = options.find(o => o.value === '0');
    expect(offscreenFarLeft).toBeTruthy();
    expect(offscreenFarLeft.label).toContain('Off-screen');
  });

  it('should have correct number of options for different slot counts', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.onScreenSlotCount = 3;
    const options = admin.getSlotOptions();

    expect(options.length).toBe(5); // 2 off-screen + 3 on-screen
  });
});

describe('AdminPanel handleStageConfigUpdate', () => {
  it('should update onScreenSlotCount on stage-config-update event', () => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };

    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    socket.triggerEvent('stage-config-update', {
      onScreenSlotCount: 7,
      totalSlots: 9,
    });

    expect(admin.onScreenSlotCount).toBe(7);

    delete global.document;
  });
});

describe('AdminPanel handleSlotMoved', () => {
  it('should update player slot index on slot-moved event', () => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };

    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    admin.playerList = [
      { sessionId: 's1', nickname: 'Admin', role: 'owner', currentSlotIndex: 2 },
      { sessionId: 's2', nickname: 'Player1', role: 'client', currentSlotIndex: 3 },
    ];

    socket.triggerEvent('slot-moved', {
      playerId: 's2',
      toIndex: 5,
    });

    expect(admin.playerList[1].currentSlotIndex).toBe(5);

    delete global.document;
  });
});

// ============================================================
// AdminPanel cleanup
// ============================================================
describe('AdminPanel cleanup', () => {
  it('should remove socket listeners on cleanup', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.initializeEventListeners();

    expect(socket.getListener('admin-player-list')).toBeTruthy();

    admin.cleanup();

    expect(socket.getListener('admin-player-list')).toBeNull();
  });

  it('should hide the panel on cleanup', () => {
    const socket = createMockSocket();
    const admin = new AdminPanel(socket);
    admin.show();
    admin.cleanup();

    expect(admin.isVisible).toBe(false);
  });
});