/** Unit Tests for server/animation-sync.js
 * Tests server-side animation state tracking and synchronization
 */

import AnimationSync from '../server/animation-sync.js';

describe('AnimationSync construction', () => {
  it('should create an instance', () => {
    const sync = new AnimationSync();
    expect(sync).toBeTruthy();
  });

  it('should start with no active animations', () => {
    const sync = new AnimationSync();
    expect(sync.getActiveAnimations()).toEqual({});
  });
});

describe('AnimationSync startAnimation', () => {
  it('should track an animation when started', () => {
    const sync = new AnimationSync();
    const anim = {
      id: 'walk',
      name: 'Walk Cycle',
      duration: 1000,
      loop: true,
      keyframes: [],
    };

    const result = sync.startAnimation('puppet-1', 'player-1', anim, true);
    expect(result).toBeTruthy();

    const active = sync.getActiveAnimations();
    expect(active['puppet-1']).toBeTruthy();
    expect(active['puppet-1'].animationId).toBe('walk');
    expect(active['puppet-1'].ownerId).toBe('player-1');
    expect(active['puppet-1'].isOwnerControlled).toBe(true);
  });

  it('should replace a currently playing animation', () => {
    const sync = new AnimationSync();
    const anim1 = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    const anim2 = { id: 'run', name: 'Run', duration: 800, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim1, true);
    sync.startAnimation('puppet-1', 'player-1', anim2, true);

    const active = sync.getActiveAnimations();
    expect(active['puppet-1'].animationId).toBe('run');
  });

  it('should record start time', () => {
    const sync = new AnimationSync();
    const anim = { id: 'wave', name: 'Wave', duration: 2000, loop: false, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    const active = sync.getActiveAnimations();
    expect(active['puppet-1'].startTime).toBeGreaterThan(0);
  });

  it('should store animation config', () => {
    const sync = new AnimationSync();
    const anim = {
      id: 'dance',
      name: 'Dance',
      duration: 3000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'head', rotation: { z: 0 } },
        { time: 1500, boneId: 'head', rotation: { z: 45 } },
      ],
    };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    const active = sync.getActiveAnimations();
    expect(active['puppet-1'].animationConfig).toEqual(anim);
  });

  it('should handle admin-controlled animations', () => {
    const sync = new AnimationSync();
    const anim = { id: 'sit', name: 'Sit', duration: 500, loop: false, keyframes: [] };

    sync.startAnimation('puppet-2', 'admin-player', anim, false);

    const active = sync.getActiveAnimations();
    expect(active['puppet-2'].isOwnerControlled).toBe(false);
  });
});

describe('AnimationSync stopAnimation', () => {
  it('should stop and remove an animation', () => {
    const sync = new AnimationSync();
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim, true);
    expect(sync.getActiveAnimations()['puppet-1']).toBeTruthy();

    sync.stopAnimation('puppet-1');
    expect(sync.getActiveAnimations()['puppet-1']).toBeUndefined();
  });

  it('should do nothing when stopping a non-existent animation', () => {
    const sync = new AnimationSync();
    expect(() => sync.stopAnimation('nonexistent')).not.toThrow();
    expect(sync.getActiveAnimations()).toEqual({});
  });
});

describe('AnimationSync getCurrentState', () => {
  it('should return current playback state for a puppet', () => {
    const sync = new AnimationSync();
    const anim = {
      id: 'walk',
      name: 'Walk Cycle',
      duration: 1000,
      loop: true,
      keyframes: [],
    };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    const state = sync.getCurrentState('puppet-1');
    expect(state).toBeTruthy();
    expect(state.animationId).toBe('walk');
    expect(state.isPlaying).toBe(true);
    expect(state.currentTime).toBeGreaterThanOrEqual(0);
    expect(state.duration).toBe(1000);
    expect(state.loop).toBe(true);
  });

  it('should return null for a puppet with no animation', () => {
    const sync = new AnimationSync();
    const state = sync.getCurrentState('puppet-1');
    expect(state).toBeNull();
  });
});

describe('AnimationSync update', () => {
  it('should advance animation time for looping animations', () => {
    jest.useFakeTimers();

    const sync = new AnimationSync();
    const anim = {
      id: 'walk',
      name: 'Walk',
      duration: 1000,
      loop: true,
      keyframes: [],
    };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    // Advance time
    jest.advanceTimersByTime(400);
    sync.update();

    const state = sync.getCurrentState('puppet-1');
    expect(state.currentTime).toBeCloseTo(400, 0);

    jest.useRealTimers();
  });

  it('should wrap around for looping animations', () => {
    jest.useFakeTimers();

    const sync = new AnimationSync();
    const anim = {
      id: 'walk',
      name: 'Walk',
      duration: 500,
      loop: true,
      keyframes: [],
    };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    jest.advanceTimersByTime(1200); // More than 2 cycles
    sync.update();

    const state = sync.getCurrentState('puppet-1');
    expect(state.currentTime).toBeLessThan(500);
    expect(state.isPlaying).toBe(true);

    jest.useRealTimers();
  });

  it('should end non-looping animations when time exceeds duration', () => {
    jest.useFakeTimers();

    const sync = new AnimationSync();
    const anim = {
      id: 'jump',
      name: 'Jump',
      duration: 600,
      loop: false,
      keyframes: [],
    };

    sync.startAnimation('puppet-1', 'player-1', anim, true);

    jest.advanceTimersByTime(700);
    sync.update();

    const state = sync.getCurrentState('puppet-1');
    expect(state).toBeNull(); // Animation should have ended

    jest.useRealTimers();
  });
});

describe('AnimationSync getStateUpdateEvents', () => {
  it('should return events for all active animations', () => {
    const sync = new AnimationSync();
    const anim1 = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    const anim2 = { id: 'wave', name: 'Wave', duration: 2000, loop: false, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim1, true);
    sync.startAnimation('puppet-2', 'player-2', anim2, true);

    const events = sync.getStateUpdateEvents();
    expect(events.length).toBe(2);

    const puppet1Event = events.find(e => e.puppetId === 'puppet-1');
    expect(puppet1Event).toBeTruthy();
    expect(puppet1Event.animationId).toBe('walk');

    const puppet2Event = events.find(e => e.puppetId === 'puppet-2');
    expect(puppet2Event).toBeTruthy();
    expect(puppet2Event.animationId).toBe('wave');
  });

  it('should return empty array when no animations active', () => {
    const sync = new AnimationSync();
    const events = sync.getStateUpdateEvents();
    expect(events).toEqual([]);
  });
});

describe('AnimationSync cleanup on disconnect', () => {
  it('should stop animations for a disconnected puppet', () => {
    const sync = new AnimationSync();
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim, true);
    sync.onPuppetDisconnected('puppet-1');

    const state = sync.getCurrentState('puppet-1');
    expect(state).toBeNull();
  });

  it('should not affect other puppets when one disconnects', () => {
    const sync = new AnimationSync();
    const anim1 = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    const anim2 = { id: 'run', name: 'Run', duration: 800, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim1, true);
    sync.startAnimation('puppet-2', 'player-2', anim2, true);

    sync.onPuppetDisconnected('puppet-1');

    expect(sync.getCurrentState('puppet-1')).toBeNull();
    expect(sync.getCurrentState('puppet-2')).toBeTruthy();
  });
});

describe('AnimationSync admin override', () => {
  it('should allow admin to force animation on any puppet', () => {
    const sync = new AnimationSync();
    const anim1 = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    const anim2 = { id: 'dance', name: 'Dance', duration: 2000, loop: true, keyframes: [] };

    // Player starts walking
    sync.startAnimation('puppet-1', 'player-1', anim1, true);

    // Admin forces dance
    sync.startAnimation('puppet-1', 'admin', anim2, false);

    const state = sync.getCurrentState('puppet-1');
    expect(state.animationId).toBe('dance');
    expect(state.isOwnerControlled).toBe(false);
  });
});

describe('AnimationSync seek', () => {
  it('should seek to a specific time', () => {
    const sync = new AnimationSync();
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim, true);
    sync.seekAnimation('puppet-1', 500);

    const state = sync.getCurrentState('puppet-1');
    expect(state.currentTime).toBe(500);
  });

  it('should clamp seek time to duration', () => {
    const sync = new AnimationSync();
    const anim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };

    sync.startAnimation('puppet-1', 'player-1', anim, true);
    sync.seekAnimation('puppet-1', 2000);

    const state = sync.getCurrentState('puppet-1');
    expect(state.currentTime).toBe(1000);
  });

  it('should do nothing when seeking a non-existent animation', () => {
    const sync = new AnimationSync();
    expect(() => sync.seekAnimation('nonexistent', 500)).not.toThrow();
  });
});