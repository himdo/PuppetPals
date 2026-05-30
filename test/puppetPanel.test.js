/** Unit Tests for client/js/ui/puppet-panel.js
 * Tests puppet selection panel UI
 */

import PuppetPanel from '../client/js/ui/puppet-panel.js';

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
// PuppetPanel construction
// ============================================================
describe('PuppetPanel construction', () => {
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
    const panel = new PuppetPanel(socket);
    expect(panel).toBeTruthy();
  });

  it('should store the socket client', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    expect(panel.socket).toBe(socket);
  });

  it('should initialize isVisible as false', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    expect(panel.isVisible).toBe(false);
  });

  it('should initialize availablePuppets as empty array', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    expect(Array.isArray(panel.availablePuppets)).toBe(true);
    expect(panel.availablePuppets.length).toBe(0);
  });

  it('should initialize selectedPuppet as null', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    expect(panel.selectedPuppet).toBeNull();
  });

  it('should initialize editorCallback as null', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    expect(panel.editorCallback).toBeNull();
  });
});

// ============================================================
// PuppetPanel show / hide / toggle
// ============================================================
describe('PuppetPanel show / hide / toggle', () => {
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
    const panel = new PuppetPanel(socket);
    panel.show();
    expect(panel.isVisible).toBe(true);
  });

  it('should hide the panel', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.show();
    panel.hide();
    expect(panel.isVisible).toBe(false);
  });

  it('should toggle visibility', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.toggle();
    expect(panel.isVisible).toBe(true);
    panel.toggle();
    expect(panel.isVisible).toBe(false);
  });

  it('should request puppet list on show', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.show();
    const emitted = socket.getEmitted();
    const req = emitted.find(e => e.event === 'request-puppet-list');
    expect(req).toBeTruthy();
  });
});

// ============================================================
// PuppetPanel setEditorCallback
// ============================================================
describe('PuppetPanel setEditorCallback', () => {
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

  it('should set the editor callback', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    const cb = jest.fn();
    panel.setEditorCallback(cb);
    expect(panel.editorCallback).toBe(cb);
  });
});

// ============================================================
// PuppetPanel initializeEventListeners
// ============================================================
describe('PuppetPanel initializeEventListeners', () => {
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
    const panel = new PuppetPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('puppet-list')).toBeTruthy();
  });

  it('should handle puppet-list event', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.initializeEventListeners();

    const puppetData = {
      puppets: [
        { id: 'basic', name: 'Basic Puppet', thumbnail: 'basic-thumb.png' },
        { id: 'robot', name: 'Robot Puppet', thumbnail: 'robot-thumb.png' },
      ],
    };

    socket.triggerEvent('puppet-list', puppetData);

    expect(panel.availablePuppets.length).toBe(2);
    expect(panel.availablePuppets[0].id).toBe('basic');
  });
});

// ============================================================
// PuppetPanel selectPuppet
// ============================================================
describe('PuppetPanel selectPuppet', () => {
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

  it('should select a puppet from available list', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [
      { id: 'basic', name: 'Basic Puppet' },
      { id: 'robot', name: 'Robot Puppet' },
    ];
    panel.selectPuppet('robot');
    expect(panel.selectedPuppet).toBe('robot');
  });

  it('should emit select-puppet event', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [
      { id: 'basic', name: 'Basic Puppet' },
      { id: 'robot', name: 'Robot Puppet' },
    ];
    panel.selectPuppet('robot');
    const emitted = socket.getEmitted();
    const select = emitted.find(e => e.event === 'select-puppet');
    expect(select).toBeTruthy();
    expect(select.data.puppetId).toBe('robot');
  });

  it('should not select invalid puppet', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [
      { id: 'basic', name: 'Basic Puppet' },
    ];
    panel.selectPuppet('nonexistent');
    expect(panel.selectedPuppet).toBeNull();
  });
});

// ============================================================
// PuppetPanel openEditor
// ============================================================
describe('PuppetPanel openEditor', () => {
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

  it('should call the editor callback with selected puppet', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    const cb = jest.fn();
    panel.setEditorCallback(cb);
    panel.selectedPuppet = 'basic';
    panel.openEditor();
    expect(cb).toHaveBeenCalledWith('basic');
  });

  it('should not call callback when no editor callback set', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.selectedPuppet = 'basic';
    expect(() => panel.openEditor()).not.toThrow();
  });

  it('should not call callback when no puppet selected', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    const cb = jest.fn();
    panel.setEditorCallback(cb);
    panel.openEditor();
    expect(cb).not.toHaveBeenCalled();
  });
});

// ============================================================
// PuppetPanel savePuppet
// ============================================================
describe('PuppetPanel savePuppet', () => {
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

  it('should emit save-puppet event', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    const config = { name: 'My Custom Puppet', bones: [] };
    panel.savePuppet(config);
    const emitted = socket.getEmitted();
    const save = emitted.find(e => e.event === 'save-puppet');
    expect(save).toBeTruthy();
    expect(save.data.config).toBe(config);
  });
});

// ============================================================
// PuppetPanel getPuppetById
// ============================================================
describe('PuppetPanel getPuppetById', () => {
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

  it('should find puppet by ID', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [
      { id: 'basic', name: 'Basic Puppet' },
      { id: 'robot', name: 'Robot Puppet' },
    ];
    const puppet = panel.getPuppetById('robot');
    expect(puppet).toBeTruthy();
    expect(puppet.name).toBe('Robot Puppet');
  });

  it('should return null for non-existent puppet', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [];
    const puppet = panel.getPuppetById('nonexistent');
    expect(puppet).toBeNull();
  });
});

// ============================================================
// PuppetPanel cleanup
// ============================================================
describe('PuppetPanel cleanup', () => {
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
    const panel = new PuppetPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('puppet-list')).toBeTruthy();
    panel.cleanup();
    expect(socket.getListener('puppet-list')).toBeNull();
  });

  it('should hide panel on cleanup', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.show();
    panel.cleanup();
    expect(panel.isVisible).toBe(false);
  });

  it('should clear available puppets', () => {
    const socket = createMockSocket();
    const panel = new PuppetPanel(socket);
    panel.availablePuppets = [{ id: 'test', name: 'Test' }];
    panel.cleanup();
    expect(panel.availablePuppets.length).toBe(0);
  });
});