/** Unit Tests for client/js/ui/ui-manager.js
 * Tests central UI management, panel show/hide, responsive layout, and theme support
 */

import UIManager from '../client/js/ui/ui-manager.js';

// ============================================================
// Helper: create mock panel
// ============================================================
function createMockPanel(name) {
  const shown = [];
  const hidden = [];
  return {
    show: () => { shown.push(name); },
    hide: () => { hidden.push(name); },
    toggle: () => {},
    getShown: () => shown,
    getHidden: () => hidden,
    panelName: name,
  };
}

// ============================================================
// Helper: create mock DOM
// ============================================================
function createMockDOM() {
  const elements = {};
  const queryResults = {};

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
          classList: {
            _classes: new Set(),
            add: (cls) => { elements[id].classList._classes.add(cls); },
            remove: (cls) => { elements[id].classList._classes.delete(cls); },
            toggle: (cls) => {
              if (elements[id].classList._classes.has(cls)) {
                elements[id].classList._classes.delete(cls);
                return false;
              } else {
                elements[id].classList._classes.add(cls);
                return true;
              }
            },
            contains: (cls) => elements[id].classList._classes.has(cls),
          },
          appendChild: function(child) { this.children.push(child); },
          setAttribute: (key, value) => { elements[id][key] = value; },
          getAttribute: (key) => elements[id][key],
          querySelector: (sel) => queryResults[`${id}:${sel}`] || null,
          querySelectorAll: (sel) => queryResults[`${id}:${sel}`] || [],
        };
      }
      return elements[id];
    },
    setQueryResult: (id, selector, result) => {
      queryResults[`${id}:${selector}`] = result;
    },
  };
}

// ============================================================
// UIManager construction
// ============================================================
describe('UIManager construction', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should create an instance', () => {
    const manager = new UIManager();
    expect(manager).toBeTruthy();
  });

  it('should initialize with empty panels registry', () => {
    const manager = new UIManager();
    expect(manager.panels).toBeDefined();
    expect(Object.keys(manager.panels).length).toBe(0);
  });

  it('should initialize theme as light', () => {
    const manager = new UIManager();
    expect(manager.theme).toBe('light');
  });

  it('should initialize advancedMode as false', () => {
    const manager = new UIManager();
    expect(manager.advancedMode).toBe(false);
  });

  it('should initialize uiOpacity as 1', () => {
    const manager = new UIManager();
    expect(manager.uiOpacity).toBe(1);
  });
});

// ============================================================
// UIManager registerPanel / getPanel
// ============================================================
describe('UIManager registerPanel / getPanel', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should register a panel', () => {
    const manager = new UIManager();
    const panel = createMockPanel('test-panel');
    manager.registerPanel('test-panel', panel);
    expect(manager.panels['test-panel']).toBe(panel);
  });

  it('should get a registered panel', () => {
    const manager = new UIManager();
    const panel = createMockPanel('test-panel');
    manager.registerPanel('test-panel', panel);
    expect(manager.getPanel('test-panel')).toBe(panel);
  });

  it('should return null for unregistered panel', () => {
    const manager = new UIManager();
    expect(manager.getPanel('nonexistent')).toBeNull();
  });

  it('should allow replacing a registered panel', () => {
    const manager = new UIManager();
    const panel1 = createMockPanel('test-panel');
    const panel2 = createMockPanel('test-panel-v2');
    manager.registerPanel('test-panel', panel1);
    manager.registerPanel('test-panel', panel2);
    expect(manager.panels['test-panel']).toBe(panel2);
  });
});

// ============================================================
// UIManager showPanel / hidePanel / togglePanel
// ============================================================
describe('UIManager showPanel / hidePanel / togglePanel', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should show a registered panel', () => {
    const manager = new UIManager();
    const panel = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('test', panel);
    manager.showPanel('test');
    expect(panel.show).toHaveBeenCalled();
  });

  it('should not throw when showing unregistered panel', () => {
    const manager = new UIManager();
    expect(() => manager.showPanel('nonexistent')).not.toThrow();
  });

  it('should hide a registered panel', () => {
    const manager = new UIManager();
    const panel = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('test', panel);
    manager.hidePanel('test');
    expect(panel.hide).toHaveBeenCalled();
  });

  it('should not throw when hiding unregistered panel', () => {
    const manager = new UIManager();
    expect(() => manager.hidePanel('nonexistent')).not.toThrow();
  });

  it('should toggle a panel that has toggle method', () => {
    const manager = new UIManager();
    const panel = { show: jest.fn(), hide: jest.fn(), toggle: jest.fn() };
    manager.registerPanel('test', panel);
    manager.togglePanel('test');
    expect(panel.toggle).toHaveBeenCalled();
  });

  it('should fallback to show/hide when panel has no toggle', () => {
    const manager = new UIManager();
    const panel = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('test', panel);
    manager.togglePanel('test');
    // First toggle should show
    expect(panel.show).toHaveBeenCalled();
  });
});

// ============================================================
// UIManager showAllPanels / hideAllPanels
// ============================================================
describe('UIManager showAllPanels / hideAllPanels', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should show all registered panels', () => {
    const manager = new UIManager();
    const panel1 = { show: jest.fn(), hide: jest.fn() };
    const panel2 = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('p1', panel1);
    manager.registerPanel('p2', panel2);
    manager.showAllPanels();
    expect(panel1.show).toHaveBeenCalled();
    expect(panel2.show).toHaveBeenCalled();
  });

  it('should hide all registered panels', () => {
    const manager = new UIManager();
    const panel1 = { show: jest.fn(), hide: jest.fn() };
    const panel2 = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('p1', panel1);
    manager.registerPanel('p2', panel2);
    manager.hideAllPanels();
    expect(panel1.hide).toHaveBeenCalled();
    expect(panel2.hide).toHaveBeenCalled();
  });
});

// ============================================================
// UIManager theme management
// ============================================================
describe('UIManager theme management', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    const body = mockDOM.getElementById('ui-overlay');
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should set theme to dark', () => {
    const manager = new UIManager();
    manager.setTheme('dark');
    expect(manager.theme).toBe('dark');
  });

  it('should set theme to light', () => {
    const manager = new UIManager();
    manager.setTheme('dark');
    manager.setTheme('light');
    expect(manager.theme).toBe('light');
  });

  it('should not set invalid theme', () => {
    const manager = new UIManager();
    manager.setTheme('invalid');
    expect(manager.theme).toBe('light');
  });

  it('should get current theme', () => {
    const manager = new UIManager();
    manager.setTheme('dark');
    expect(manager.getTheme()).toBe('dark');
  });

  it('should toggle theme from light to dark', () => {
    const manager = new UIManager();
    manager.toggleTheme();
    expect(manager.theme).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    const manager = new UIManager();
    manager.setTheme('dark');
    manager.toggleTheme();
    expect(manager.theme).toBe('light');
  });
});

// ============================================================
// UIManager advanced mode
// ============================================================
describe('UIManager advanced mode', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    const overlay = mockDOM.getElementById('ui-overlay');
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      querySelectorAll: () => [],
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should enable advanced mode', () => {
    const manager = new UIManager();
    manager.enableAdvancedMode();
    expect(manager.advancedMode).toBe(true);
  });

  it('should disable advanced mode', () => {
    const manager = new UIManager();
    manager.enableAdvancedMode();
    manager.disableAdvancedMode();
    expect(manager.advancedMode).toBe(false);
  });

  it('should toggle advanced mode', () => {
    const manager = new UIManager();
    manager.toggleAdvancedMode();
    expect(manager.advancedMode).toBe(true);
    manager.toggleAdvancedMode();
    expect(manager.advancedMode).toBe(false);
  });

  it('should check if advanced mode is enabled', () => {
    const manager = new UIManager();
    expect(manager.isAdvancedMode()).toBe(false);
    manager.enableAdvancedMode();
    expect(manager.isAdvancedMode()).toBe(true);
  });
});

// ============================================================
// UIManager UI opacity
// ============================================================
describe('UIManager UI opacity', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should set UI opacity', () => {
    const manager = new UIManager();
    manager.setUiOpacity(0.5);
    expect(manager.uiOpacity).toBe(0.5);
  });

  it('should clamp opacity to minimum 0', () => {
    const manager = new UIManager();
    manager.setUiOpacity(-0.5);
    expect(manager.uiOpacity).toBe(0);
  });

  it('should clamp opacity to maximum 1', () => {
    const manager = new UIManager();
    manager.setUiOpacity(1.5);
    expect(manager.uiOpacity).toBe(1);
  });

  it('should get current opacity', () => {
    const manager = new UIManager();
    manager.setUiOpacity(0.75);
    expect(manager.getUiOpacity()).toBe(0.75);
  });
});

// ============================================================
// UIManager event management
// ============================================================
describe('UIManager event management', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    const overlay = mockDOM.getElementById('ui-overlay');
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
      querySelectorAll: () => [],
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should emit and listen to panelVisible event', () => {
    const manager = new UIManager();
    const callback = jest.fn();
    manager.on('panelVisible', callback);
    manager.emit('panelVisible', 'test-panel');
    expect(callback).toHaveBeenCalledWith('test-panel');
  });

  it('should emit and listen to panelHidden event', () => {
    const manager = new UIManager();
    const callback = jest.fn();
    manager.on('panelHidden', callback);
    manager.emit('panelHidden', 'test-panel');
    expect(callback).toHaveBeenCalledWith('test-panel');
  });

  it('should remove event listener', () => {
    const manager = new UIManager();
    const callback = jest.fn();
    manager.on('panelVisible', callback);
    manager.off('panelVisible', callback);
    manager.emit('panelVisible', 'test-panel');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should emit themeChanged when theme is set', () => {
    const manager = new UIManager();
    const callback = jest.fn();
    manager.on('themeChanged', callback);
    manager.setTheme('dark');
    expect(callback).toHaveBeenCalledWith('dark');
  });

  it('should emit advancedModeToggled when mode changes', () => {
    const manager = new UIManager();
    const callback = jest.fn();
    manager.on('advancedModeToggled', callback);
    manager.toggleAdvancedMode();
    expect(callback).toHaveBeenCalledWith(true);
  });
});

// ============================================================
// UIManager getRegisteredPanelNames
// ============================================================
describe('UIManager getRegisteredPanelNames', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should return array of registered panel names', () => {
    const manager = new UIManager();
    manager.registerPanel('admin', {});
    manager.registerPanel('chat', {});
    const names = manager.getRegisteredPanelNames();
    expect(names).toContain('admin');
    expect(names).toContain('chat');
    expect(names.length).toBe(2);
  });

  it('should return empty array when no panels registered', () => {
    const manager = new UIManager();
    expect(manager.getRegisteredPanelNames().length).toBe(0);
  });
});

// ============================================================
// UIManager cleanup
// ============================================================
describe('UIManager cleanup', () => {
  beforeEach(() => {
    const mockDOM = createMockDOM();
    global.document = {
      getElementById: mockDOM.getElementById.bind(mockDOM),
    };
  });

  afterEach(() => {
    delete global.document;
  });

  it('should clear all panels on cleanup', () => {
    const manager = new UIManager();
    manager.registerPanel('test', {});
    manager.cleanup();
    expect(Object.keys(manager.panels).length).toBe(0);
  });

  it('should hide all panels before cleanup', () => {
    const manager = new UIManager();
    const panel = { show: jest.fn(), hide: jest.fn() };
    manager.registerPanel('test', panel);
    manager.cleanup();
    expect(panel.hide).toHaveBeenCalled();
  });
});