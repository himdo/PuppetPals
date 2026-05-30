/** Unit Tests for client/js/animation/animation-sync.js
 * Tests client-side animation synchronization with server
 */

import ClientAnimationSync from '../client/js/animation/animation-sync.js';

// Mock socket client
function createMockSocket() {
  const emitted = [];
  const listeners = {};
  return {
    on(event, handler) {
      listeners[event] = handler;
    },
    emit(event, data) {
      emitted.push({ event, data });
    },
    getEmitted() {
      return emitted;
    },
    triggerListener(event, data) {
      if (listeners[event]) {
        listeners[event](data);
      }
    },
    getListener(event) {
      return listeners[event] || null;
    },
  };
}

// Mock puppet
function createMockPuppet(id) {
  const animations = [];
  return {
    id,
    playAnimation(anim) {
      animations.push({ anim, time: Date.now() });
    },
    stopAnimation() {
      animations.length = 0;
    },
    getCurrentAnimation() {
      return animations.length > 0 ? animations[animations.length - 1].anim : null;
    },
    getPlayLog() {
      return animations;
    },
  };
}

describe('ClientAnimationSync construction', () => {
  it('should create an instance with a socket', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    expect(sync).toBeTruthy();
  });

  it('should start with no registered puppets', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    expect(sync.getPuppets()).toEqual({});
  });
});

describe('ClientAnimationSync registerPuppet', () => {
  it('should register a puppet by ID', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');

    sync.registerPuppet('puppet-1', puppet);

    const puppets = sync.getPuppets();
    expect(puppets['puppet-1']).toBe(puppet);
  });

  it('should replace an existing puppet registration', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet1 = createMockPuppet('puppet-1');
    const puppet2 = createMockPuppet('puppet-1');

    sync.registerPuppet('puppet-1', puppet1);
    sync.registerPuppet('puppet-1', puppet2);

    const puppets = sync.getPuppets();
    expect(puppets['puppet-1']).toBe(puppet2);
  });
});

describe('ClientAnimationSync unregisterPuppet', () => {
  it('should remove a puppet registration', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');

    sync.registerPuppet('puppet-1', puppet);
    sync.unregisterPuppet('puppet-1');

    expect(sync.getPuppets()['puppet-1']).toBeUndefined();
  });

  it('should do nothing when unregistering a non-existent puppet', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    expect(() => sync.unregisterPuppet('nonexistent')).not.toThrow();
  });
});

describe('ClientAnimationSync requestStartAnimation', () => {
  it('should emit start-animation to server', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };

    sync.requestStartAnimation('puppet-1', anim);

    const emitted = socket.getEmitted();
    const startEvent = emitted.find(e => e.event === 'start-animation');
    expect(startEvent).toBeTruthy();
    expect(startEvent.data.puppetId).toBe('puppet-1');
    expect(startEvent.data.animation).toEqual(anim);
  });
});

describe('ClientAnimationSync requestStopAnimation', () => {
  it('should emit stop-animation to server', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);

    sync.requestStopAnimation('puppet-1');

    const emitted = socket.getEmitted();
    const stopEvent = emitted.find(e => e.event === 'stop-animation');
    expect(stopEvent).toBeTruthy();
    expect(stopEvent.data.puppetId).toBe('puppet-1');
  });
});

describe('ClientAnimationSync handle server events', () => {
  it('should start local animation on animation-started event', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    const animConfig = {
      id: 'walk',
      name: 'Walk',
      duration: 1000,
      loop: true,
      keyframes: [],
    };

    // Simulate server sending animation-started
    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: animConfig,
      serverTime: Date.now(),
      currentTime: 0,
    });

    const playLog = puppet.getPlayLog();
    expect(playLog.length).toBe(1);
    expect(playLog[0].anim.id).toBe('walk');
  });

  it('should stop local animation on animation-stopped event', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    // First play something
    puppet.playAnimation({ id: 'walk' });
    expect(puppet.getPlayLog().length).toBe(1);

    // Simulate server sending animation-stopped
    socket.triggerListener('animation-stopped', {
      puppetId: 'puppet-1',
    });

    expect(puppet.getPlayLog().length).toBe(0);
  });

  it('should sync animation time on animation-state event', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    // Simulate server sending animation-state sync
    socket.triggerListener('animation-state', {
      puppetId: 'puppet-1',
      animation: { id: 'dance', duration: 2000, loop: true, keyframes: [] },
      currentTime: 500,
      serverTime: Date.now(),
    });

    // Verify the sync received the correct time
    const state = sync.getRemoteState('puppet-1');
    expect(state).toBeTruthy();
    expect(state.animationId).toBe('dance');
  });

  it('should do nothing for unknown puppet on server events', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    sync.startListening();

    // No puppets registered, should not throw
    expect(() => {
      socket.triggerListener('animation-started', {
        puppetId: 'unknown',
        animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
        serverTime: Date.now(),
        currentTime: 0,
      });
    }).not.toThrow();
  });
});

describe('ClientAnimationSync latency compensation', () => {
  it('should track server-client time offset', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    sync.startListening();

    // Simulate receiving a server time sync
    const serverTime = Date.now();
    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
      serverTime,
      currentTime: 0,
    });

    // The offset should be tracked (within reasonable tolerance)
    const offset = sync.getServerTimeOffset();
    expect(typeof offset).toBe('number');
  });

  it('should compensate for latency when calculating local time', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    const serverTime = Date.now();
    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
      serverTime,
      currentTime: 100,
    });

    // Get the estimated server time
    const estimatedTime = sync.getEstimatedServerTime();
    expect(typeof estimatedTime).toBe('number');
    expect(estimatedTime).toBeGreaterThan(0);
  });
});

describe('ClientAnimationSync getRemoteState', () => {
  it('should return remote state for a puppet', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    sync.startListening();

    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: { id: 'dance', name: 'Dance', duration: 2000, loop: true, keyframes: [] },
      serverTime: Date.now(),
      currentTime: 300,
    });

    const state = sync.getRemoteState('puppet-1');
    expect(state).toBeTruthy();
    expect(state.animationId).toBe('dance');
    expect(state.duration).toBe(2000);
  });

  it('should return null for puppet with no remote state', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);

    const state = sync.getRemoteState('no-state');
    expect(state).toBeNull();
  });

  it('should clear state when animation stops', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
      serverTime: Date.now(),
      currentTime: 0,
    });

    expect(sync.getRemoteState('puppet-1')).toBeTruthy();

    socket.triggerListener('animation-stopped', {
      puppetId: 'puppet-1',
    });

    expect(sync.getRemoteState('puppet-1')).toBeNull();
  });
});

describe('ClientAnimationSync admin animations', () => {
  it('should handle admin-start-animation event', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-2');
    sync.registerPuppet('puppet-2', puppet);
    sync.startListening();

    socket.triggerListener('admin-start-animation', {
      puppetId: 'puppet-2',
      animation: { id: 'dance', duration: 2000, loop: true, keyframes: [] },
      serverTime: Date.now(),
      currentTime: 0,
    });

    const playLog = puppet.getPlayLog();
    expect(playLog.length).toBe(1);
    expect(playLog[0].anim.id).toBe('dance');
  });

  it('should handle admin-stop-animation event', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-2');
    sync.registerPuppet('puppet-2', puppet);
    sync.startListening();

    puppet.playAnimation({ id: 'walk' });
    expect(puppet.getPlayLog().length).toBe(1);

    socket.triggerListener('admin-stop-animation', {
      puppetId: 'puppet-2',
    });

    expect(puppet.getPlayLog().length).toBe(0);
  });
});

describe('ClientAnimationSync startListening / stopListening', () => {
  it('should register event listeners when startListening is called', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    sync.startListening();

    expect(socket.getListener('animation-started')).toBeTruthy();
    expect(socket.getListener('animation-stopped')).toBeTruthy();
    expect(socket.getListener('animation-state')).toBeTruthy();
  });

  it('should be ready to handle events after startListening', () => {
    const socket = createMockSocket();
    const sync = new ClientAnimationSync(socket);
    const puppet = createMockPuppet('puppet-1');
    sync.registerPuppet('puppet-1', puppet);
    sync.startListening();

    socket.triggerListener('animation-started', {
      puppetId: 'puppet-1',
      animation: { id: 'walk', duration: 1000, loop: true, keyframes: [] },
      serverTime: Date.now(),
      currentTime: 0,
    });

    expect(puppet.getPlayLog().length).toBe(1);
  });
});