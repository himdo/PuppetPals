/** Unit Tests for client/js/ui/chat-panel.js
 * Tests chat/messaging UI panel
 */

import ChatPanel from '../client/js/ui/chat-panel.js';

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
// ChatPanel construction
// ============================================================
describe('ChatPanel construction', () => {
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
    const panel = new ChatPanel(socket);
    expect(panel).toBeTruthy();
  });

  it('should store the socket client', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    expect(panel.socket).toBe(socket);
  });

  it('should initialize isVisible as false', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    expect(panel.isVisible).toBe(false);
  });

  it('should initialize messages as empty array', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    expect(Array.isArray(panel.messages)).toBe(true);
    expect(panel.messages.length).toBe(0);
  });

  it('should initialize maxMessages as 100', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    expect(panel.maxMessages).toBe(100);
  });
});

// ============================================================
// ChatPanel show / hide / toggle
// ============================================================
describe('ChatPanel show / hide / toggle', () => {
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
    const panel = new ChatPanel(socket);
    panel.show();
    expect(panel.isVisible).toBe(true);
  });

  it('should hide the panel', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.show();
    panel.hide();
    expect(panel.isVisible).toBe(false);
  });

  it('should toggle visibility', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.toggle();
    expect(panel.isVisible).toBe(true);
    panel.toggle();
    expect(panel.isVisible).toBe(false);
  });
});

// ============================================================
// ChatPanel initializeEventListeners
// ============================================================
describe('ChatPanel initializeEventListeners', () => {
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
    const panel = new ChatPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('chat-message')).toBeTruthy();
  });

  it('should add message on chat-message event', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.initializeEventListeners();

    socket.triggerEvent('chat-message', {
      user: 'Alice',
      text: 'Hello!',
      timestamp: Date.now(),
    });

    expect(panel.messages.length).toBe(1);
    expect(panel.messages[0].user).toBe('Alice');
    expect(panel.messages[0].text).toBe('Hello!');
  });
});

// ============================================================
// ChatPanel sendMessage
// ============================================================
describe('ChatPanel sendMessage', () => {
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

  it('should emit chat-message event', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.sendMessage('Hello, world!');
    const emitted = socket.getEmitted();
    const msg = emitted.find(e => e.event === 'chat-message');
    expect(msg).toBeTruthy();
    expect(msg.data.text).toBe('Hello, world!');
  });

  it('should not send empty message', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.sendMessage('');
    const emitted = socket.getEmitted();
    const msg = emitted.find(e => e.event === 'chat-message');
    expect(msg).toBeFalsy();
  });

  it('should not send whitespace-only message', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.sendMessage('   ');
    const emitted = socket.getEmitted();
    const msg = emitted.find(e => e.event === 'chat-message');
    expect(msg).toBeFalsy();
  });
});

// ============================================================
// ChatPanel addMessage
// ============================================================
describe('ChatPanel addMessage', () => {
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

  it('should add a message to the list', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.addMessage('Bob', 'Hi there');
    expect(panel.messages.length).toBe(1);
    expect(panel.messages[0].user).toBe('Bob');
    expect(panel.messages[0].text).toBe('Hi there');
  });

  it('should set timestamp on message', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.addMessage('Bob', 'Hi there');
    expect(panel.messages[0].timestamp).toBeDefined();
  });

  it('should respect maxMessages limit', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.maxMessages = 5;
    for (let i = 0; i < 10; i++) {
      panel.addMessage('User', `Message ${i}`);
    }
    expect(panel.messages.length).toBe(5);
    expect(panel.messages[0].text).toBe('Message 5');
  });
});

// ============================================================
// ChatPanel clearMessages
// ============================================================
describe('ChatPanel clearMessages', () => {
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

  it('should clear all messages', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.addMessage('Alice', 'Hello');
    panel.addMessage('Bob', 'World');
    expect(panel.messages.length).toBe(2);
    panel.clearMessages();
    expect(panel.messages.length).toBe(0);
  });
});

// ============================================================
// ChatPanel cleanup
// ============================================================
describe('ChatPanel cleanup', () => {
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
    const panel = new ChatPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('chat-message')).toBeTruthy();
    panel.cleanup();
    expect(socket.getListener('chat-message')).toBeNull();
  });

  it('should hide panel on cleanup', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.show();
    panel.cleanup();
    expect(panel.isVisible).toBe(false);
  });

  it('should clear messages on cleanup', () => {
    const socket = createMockSocket();
    const panel = new ChatPanel(socket);
    panel.addMessage('Alice', 'Hello');
    panel.cleanup();
    expect(panel.messages.length).toBe(0);
  });
});