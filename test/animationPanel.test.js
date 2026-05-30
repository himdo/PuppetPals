/** Unit Tests for client/js/ui/animation-panel.js
 * Tests animation browser UI panel
 */

import AnimationPanel from '../client/js/ui/animation-panel.js';

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
        textContent: '',
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
// AnimationPanel construction
// ============================================================
describe('AnimationPanel construction', () => {
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
    const panel = new AnimationPanel(socket);
    expect(panel).toBeTruthy();
  });

  it('should store the socket client', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    expect(panel.socket).toBe(socket);
  });

  it('should initialize isVisible as false', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    expect(panel.isVisible).toBe(false);
  });

  it('should initialize animations as empty array', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    expect(Array.isArray(panel.animations)).toBe(true);
    expect(panel.animations.length).toBe(0);
  });

  it('should initialize currentlyPlaying as null', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    expect(panel.currentlyPlaying).toBeNull();
  });

  it('should initialize favorites as empty array', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    expect(Array.isArray(panel.favorites)).toBe(true);
    expect(panel.favorites.length).toBe(0);
  });
});

// ============================================================
// AnimationPanel show / hide / toggle
// ============================================================
describe('AnimationPanel show / hide / toggle', () => {
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
    const panel = new AnimationPanel(socket);
    panel.show();
    expect(panel.isVisible).toBe(true);
  });

  it('should hide the panel', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.show();
    panel.hide();
    expect(panel.isVisible).toBe(false);
  });

  it('should toggle visibility', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.toggle();
    expect(panel.isVisible).toBe(true);
    panel.toggle();
    expect(panel.isVisible).toBe(false);
  });
});

// ============================================================
// AnimationPanel initializeEventListeners
// ============================================================
describe('AnimationPanel initializeEventListeners', () => {
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
    const panel = new AnimationPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('animation-started')).toBeTruthy();
    expect(socket.getListener('animation-stopped')).toBeTruthy();
  });

  it('should update currentlyPlaying on animation-started', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.initializeEventListeners();

    socket.triggerEvent('animation-started', {
      puppetId: 'p1',
      animationId: 'dance',
    });

    expect(panel.currentlyPlaying).toBe('dance');
  });

  it('should clear currentlyPlaying on animation-stopped', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.initializeEventListeners();
    panel.currentlyPlaying = 'dance';

    socket.triggerEvent('animation-stopped', {
      puppetId: 'p1',
    });

    expect(panel.currentlyPlaying).toBeNull();
  });
});

// ============================================================
// AnimationPanel setAnimations
// ============================================================
describe('AnimationPanel setAnimations', () => {
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

  it('should set the animations list', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    const anims = [
      { id: 'idle', name: 'Idle', duration: 2000, loop: true },
      { id: 'walk', name: 'Walk', duration: 1000, loop: true },
    ];
    panel.setAnimations(anims);
    expect(panel.animations.length).toBe(2);
    expect(panel.animations[0].id).toBe('idle');
  });
});

// ============================================================
// AnimationPanel playAnimation
// ============================================================
describe('AnimationPanel playAnimation', () => {
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

  it('should emit start-animation event', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [{ id: 'dance', name: 'Dance', duration: 1000 }];
    panel.playAnimation('dance');
    const emitted = socket.getEmitted();
    const start = emitted.find(e => e.event === 'start-animation');
    expect(start).toBeTruthy();
    expect(start.data.animationId).toBe('dance');
  });

  it('should set currentlyPlaying', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [{ id: 'dance', name: 'Dance', duration: 1000 }];
    panel.playAnimation('dance');
    expect(panel.currentlyPlaying).toBe('dance');
  });

  it('should not play invalid animation', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
    ];
    panel.playAnimation('nonexistent');
    expect(panel.currentlyPlaying).toBeNull();
  });
});

// ============================================================
// AnimationPanel stopAnimation
// ============================================================
describe('AnimationPanel stopAnimation', () => {
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

  it('should emit stop-animation event', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.stopAnimation();
    const emitted = socket.getEmitted();
    const stop = emitted.find(e => e.event === 'stop-animation');
    expect(stop).toBeTruthy();
  });

  it('should clear currentlyPlaying', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.currentlyPlaying = 'dance';
    panel.stopAnimation();
    expect(panel.currentlyPlaying).toBeNull();
  });
});

// ============================================================
// AnimationPanel favorites
// ============================================================
describe('AnimationPanel favorites', () => {
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

  it('should add animation to favorites', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
      { id: 'dance', name: 'Dance' },
    ];
    panel.toggleFavorite('dance');
    expect(panel.favorites).toContain('dance');
  });

  it('should remove animation from favorites', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
      { id: 'dance', name: 'Dance' },
    ];
    panel.favorites = ['dance'];
    panel.toggleFavorite('dance');
    expect(panel.favorites).not.toContain('dance');
  });

  it('should not toggle invalid animation', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
    ];
    panel.toggleFavorite('nonexistent');
    expect(panel.favorites.length).toBe(0);
  });

  it('should get favorite animations', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
      { id: 'dance', name: 'Dance' },
    ];
    panel.favorites = ['dance'];
    const favs = panel.getFavoriteAnimations();
    expect(favs.length).toBe(1);
    expect(favs[0].id).toBe('dance');
  });

  it('should check if animation is playing', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.currentlyPlaying = 'dance';
    expect(panel.isAnimationPlaying('dance')).toBe(true);
    expect(panel.isAnimationPlaying('idle')).toBe(false);
    expect(panel.isAnimationPlaying(null)).toBe(false);
  });
});

// ============================================================
// AnimationPanel getAnimationById
// ============================================================
describe('AnimationPanel getAnimationById', () => {
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

  it('should find animation by ID', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [
      { id: 'idle', name: 'Idle' },
      { id: 'dance', name: 'Dance' },
    ];
    const anim = panel.getAnimationById('dance');
    expect(anim).toBeTruthy();
    expect(anim.name).toBe('Dance');
  });

  it('should return null for non-existent animation', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [];
    const anim = panel.getAnimationById('nonexistent');
    expect(anim).toBeNull();
  });
});

// ============================================================
// AnimationPanel cleanup
// ============================================================
describe('AnimationPanel cleanup', () => {
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
    const panel = new AnimationPanel(socket);
    panel.initializeEventListeners();
    expect(socket.getListener('animation-started')).toBeTruthy();
    panel.cleanup();
    expect(socket.getListener('animation-started')).toBeNull();
  });

  it('should hide panel on cleanup', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.show();
    panel.cleanup();
    expect(panel.isVisible).toBe(false);
  });

  it('should clear animations on cleanup', () => {
    const socket = createMockSocket();
    const panel = new AnimationPanel(socket);
    panel.animations = [{ id: 'test', name: 'Test' }];
    panel.cleanup();
    expect(panel.animations.length).toBe(0);
  });
});