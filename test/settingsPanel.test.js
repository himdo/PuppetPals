/** Unit Tests for client/js/ui/settings-panel.js
 * Tests settings/configuration UI panel
 */

import SettingsPanel from '../client/js/ui/settings-panel.js';

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
// Helper: create mock DOM
// ============================================================
function createMockDOM() {
  const elements = {};

  return {
    elements,
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = {
          id,
          className: '',
          innerHTML: '',
          children: [],
          style: {},
          value: '',
          checked: false,
          appendChild: function(child) { this.children.push(child); },
          querySelector: () => null,
          querySelectorAll: () => [],
        };
      }
      return elements[id];
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        innerHTML: '',
        children: [],
        style: {},
        attributes: {},
        appendChild: function(child) { this.children.push(child); },
        setAttribute: (key, value) => { el.attributes[key] = value; },
        getAttribute: (key) => el.attributes[key],
        addEventListener: () => {},
      };
      return el;
    },
  };
}

// ============================================================
// SettingsPanel construction
// ============================================================
describe('SettingsPanel construction', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should create an instance', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel).toBeTruthy();
  });

  it('should store the socket client', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.socket).toBe(socket);
  });

  it('should initialize isVisible as false', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.isVisible).toBe(false);
  });

  it('should initialize default settings', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.settings).toEqual({
      volume: 80,
      showGrid: true,
      autoSave: true,
      theme: 'light',
      transitionSpeed: 'normal',
      wiggleIntensity: 'medium',
      showSlotMarkers: true,
      showLocationLabels: false,
      autoPlayWalkAnimation: true,
    });
  });
});

// ============================================================
// SettingsPanel show / hide / toggle
// ============================================================
describe('SettingsPanel show / hide / toggle', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should show the panel', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.show();
    expect(panel.isVisible).toBe(true);
  });

  it('should hide the panel', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.show();
    panel.hide();
    expect(panel.isVisible).toBe(false);
  });

  it('should toggle visibility', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.toggle();
    expect(panel.isVisible).toBe(true);
    panel.toggle();
    expect(panel.isVisible).toBe(false);
  });
});

// ============================================================
// SettingsPanel getSetting
// ============================================================
describe('SettingsPanel getSetting', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should return setting value', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('volume')).toBe(80);
    expect(panel.getSetting('showGrid')).toBe(true);
  });

  it('should return undefined for unknown setting', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('nonexistent')).toBeUndefined();
  });
});

// ============================================================
// SettingsPanel setSetting
// ============================================================
describe('SettingsPanel setSetting', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should set a setting value', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('volume', 50);
    expect(panel.getSetting('volume')).toBe(50);
  });

  it('should emit settings-update event', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('volume', 50);
    const emitted = socket.getEmitted();
    const update = emitted.find(e => e.event === 'settings-update');
    expect(update).toBeTruthy();
    expect(update.data.settings).toEqual({
      volume: 50,
      showGrid: true,
      autoSave: true,
      theme: 'light',
      transitionSpeed: 'normal',
      wiggleIntensity: 'medium',
      showSlotMarkers: true,
      showLocationLabels: false,
      autoPlayWalkAnimation: true,
    });
  });

  it('should set new settings', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('fontSize', 14);
    expect(panel.getSetting('fontSize')).toBe(14);
  });
});

// ============================================================
// SettingsPanel resetToDefaults
// ============================================================
describe('SettingsPanel resetToDefaults', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should reset settings to defaults', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('volume', 10);
    panel.setSetting('showGrid', false);
    panel.resetToDefaults();
    expect(panel.getSetting('volume')).toBe(80);
    expect(panel.getSetting('showGrid')).toBe(true);
  });

  it('should emit settings-update event on reset', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('volume', 10);
    panel.resetToDefaults();
    const emitted = socket.getEmitted();
    const update = emitted.find(e => e.event === 'settings-update');
    expect(update).toBeTruthy();
  });
});

// ============================================================
// SettingsPanel initializeEventListeners
// ============================================================
describe('SettingsPanel initializeEventListeners', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should set up socket listeners', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('settings-sync')).toBeTruthy();
  });

  it('should update settings on settings-sync event', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.initializeEventListeners();

    socket.triggerEvent('settings-sync', {
      volume: 60,
      showGrid: false,
      autoSave: false,
      theme: 'dark',
    });

    expect(panel.getSetting('volume')).toBe(60);
    expect(panel.getSetting('showGrid')).toBe(false);
    expect(panel.getSetting('autoSave')).toBe(false);
    expect(panel.getSetting('theme')).toBe('dark');
  });
});

// ============================================================
// SettingsPanel cleanup
// ============================================================
describe('SettingsPanel cleanup', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should remove socket listeners', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('settings-sync')).toBeTruthy();
    panel.cleanup();
    expect(socket.getListener('settings-sync')).toBeNull();
  });

  it('should hide panel on cleanup', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.show();
    panel.cleanup();
    expect(panel.isVisible).toBe(false);
  });
});

// ============================================================
// SettingsPanel - Stage Polish Settings (Request 22)
// ============================================================
describe('SettingsPanel stage polish settings', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should have transitionSpeed setting defaulting to normal', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('transitionSpeed')).toBe('normal');
  });

  it('should have wiggleIntensity setting defaulting to medium', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('wiggleIntensity')).toBe('medium');
  });

  it('should have showSlotMarkers setting defaulting to true', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('showSlotMarkers')).toBe(true);
  });

  it('should have showLocationLabels setting defaulting to false', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('showLocationLabels')).toBe(false);
  });

  it('should have autoPlayWalkAnimation setting defaulting to true', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    expect(panel.getSetting('autoPlayWalkAnimation')).toBe(true);
  });

  it('should allow setting transitionSpeed to fast', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('transitionSpeed', 'fast');
    expect(panel.getSetting('transitionSpeed')).toBe('fast');
  });

  it('should allow setting transitionSpeed to slow', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('transitionSpeed', 'slow');
    expect(panel.getSetting('transitionSpeed')).toBe('slow');
  });

  it('should allow setting wiggleIntensity to none', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('wiggleIntensity', 'none');
    expect(panel.getSetting('wiggleIntensity')).toBe('none');
  });

  it('should allow setting wiggleIntensity to low', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('wiggleIntensity', 'low');
    expect(panel.getSetting('wiggleIntensity')).toBe('low');
  });

  it('should allow setting wiggleIntensity to high', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('wiggleIntensity', 'high');
    expect(panel.getSetting('wiggleIntensity')).toBe('high');
  });

  it('should allow toggling showSlotMarkers', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('showSlotMarkers', false);
    expect(panel.getSetting('showSlotMarkers')).toBe(false);
  });

  it('should allow toggling showLocationLabels', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('showLocationLabels', true);
    expect(panel.getSetting('showLocationLabels')).toBe(true);
  });

  it('should allow toggling autoPlayWalkAnimation', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('autoPlayWalkAnimation', false);
    expect(panel.getSetting('autoPlayWalkAnimation')).toBe(false);
  });

  it('should include new settings in settings-update event', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('showSlotMarkers', false);
    const emitted = socket.getEmitted();
    const update = emitted.find(e => e.event === 'settings-update');
    expect(update).toBeTruthy();
    expect(update.data.settings.showSlotMarkers).toBe(false);
    expect(update.data.settings.transitionSpeed).toBe('normal');
    expect(update.data.settings.wiggleIntensity).toBe('medium');
    expect(update.data.settings.showLocationLabels).toBe(false);
    expect(update.data.settings.autoPlayWalkAnimation).toBe(true);
  });

  it('should reset new settings to defaults on resetToDefaults', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.setSetting('transitionSpeed', 'fast');
    panel.setSetting('wiggleIntensity', 'high');
    panel.setSetting('showSlotMarkers', false);
    panel.setSetting('showLocationLabels', true);
    panel.setSetting('autoPlayWalkAnimation', false);
    panel.resetToDefaults();
    expect(panel.getSetting('transitionSpeed')).toBe('normal');
    expect(panel.getSetting('wiggleIntensity')).toBe('medium');
    expect(panel.getSetting('showSlotMarkers')).toBe(true);
    expect(panel.getSetting('showLocationLabels')).toBe(false);
    expect(panel.getSetting('autoPlayWalkAnimation')).toBe(true);
  });

  it('should update stage polish settings on settings-sync event', () => {
    const socket = createMockSocket();
    const panel = new SettingsPanel(socket);
    panel.initializeEventListeners();

    socket.triggerEvent('settings-sync', {
      transitionSpeed: 'fast',
      wiggleIntensity: 'low',
      showSlotMarkers: false,
      showLocationLabels: true,
      autoPlayWalkAnimation: false,
    });

    expect(panel.getSetting('transitionSpeed')).toBe('fast');
    expect(panel.getSetting('wiggleIntensity')).toBe('low');
    expect(panel.getSetting('showSlotMarkers')).toBe(false);
    expect(panel.getSetting('showLocationLabels')).toBe(true);
    expect(panel.getSetting('autoPlayWalkAnimation')).toBe(false);
  });
});

// ============================================================
// SettingsPanel - getTransitionDuration / getWiggleConfig
// ============================================================
describe('SettingsPanel transition and wiggle config helpers', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      createElement: mockDOM.createElement.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  describe('getTransitionDuration', () => {
    it('should return 200ms for fast transition speed', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      panel.setSetting('transitionSpeed', 'fast');
      expect(panel.getTransitionDuration()).toBe(200);
    });

    it('should return 400ms for normal transition speed', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      expect(panel.getTransitionDuration()).toBe(400);
    });

    it('should return 800ms for slow transition speed', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      panel.setSetting('transitionSpeed', 'slow');
      expect(panel.getTransitionDuration()).toBe(800);
    });
  });

  describe('getWiggleConfig', () => {
    it('should return no wiggle for none intensity', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      panel.setSetting('wiggleIntensity', 'none');
      const config = panel.getWiggleConfig();
      expect(config.frequency).toBe(0);
      expect(config.amplitude).toBe(0);
    });

    it('should return low wiggle values for low intensity', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      panel.setSetting('wiggleIntensity', 'low');
      const config = panel.getWiggleConfig();
      expect(config.frequency).toBe(2);
      expect(config.amplitude).toBe(3);
    });

    it('should return medium wiggle values for medium intensity', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      const config = panel.getWiggleConfig();
      expect(config.frequency).toBe(3);
      expect(config.amplitude).toBe(5);
    });

    it('should return high wiggle values for high intensity', () => {
      const socket = createMockSocket();
      const panel = new SettingsPanel(socket);
      panel.setSetting('wiggleIntensity', 'high');
      const config = panel.getWiggleConfig();
      expect(config.frequency).toBe(5);
      expect(config.amplitude).toBe(10);
    });
  });
});