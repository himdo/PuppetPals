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