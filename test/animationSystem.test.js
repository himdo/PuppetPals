/** Unit Tests for Animation System
 * Tests the Animation class and AnimationPlayer class
 * Keyframe-based animation engine with interpolation support
 */

import { Animation, AnimationPlayer } from '../client/js/animation/animation-system.js';

// ---- Helper: create a mock bone object ----
function createMockBone(id) {
  return {
    id,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    setRotation: function (angle) { this.rotation.z = angle; },
    _setPosition: function (x, y, z) { this.position.x = x; this.position.y = y; this.position.z = z; },
  };
}

// ---- Helper: create a mock skeleton ----
function createMockSkeleton(bones) {
  const boneMap = {};
  for (const b of bones) {
    boneMap[b.id] = b;
  }
  return {
    getBone: function (id) { return boneMap[id] || null; },
  };
}

// =============================================
// Animation Class Tests
// =============================================
describe('Animation Class - Constructor & Properties', () => {
  it('should create an animation with minimal config', () => {
    const anim = new Animation({ id: 'test', name: 'Test', duration: 1000 });
    expect(anim.id).toBe('test');
    expect(anim.name).toBe('Test');
    expect(anim.duration).toBe(1000);
    expect(anim.loop).toBe(false);
    expect(anim.keyframes).toEqual([]);
  });

  it('should create an animation with all properties', () => {
    const keyframes = [
      { time: 0, boneId: 'arm', rotation: { z: 0 } },
      { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
    ];
    const anim = new Animation({
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: true,
      keyframes,
    });

    expect(anim.id).toBe('wave');
    expect(anim.name).toBe('Wave');
    expect(anim.duration).toBe(1000);
    expect(anim.loop).toBe(true);
    expect(anim.keyframes).toBe(keyframes);
  });

  it('should default loop to false', () => {
    const anim = new Animation({ id: 'a', name: 'A', duration: 500 });
    expect(anim.loop).toBe(false);
  });

  it('should default keyframes to empty array', () => {
    const anim = new Animation({ id: 'a', name: 'A', duration: 500 });
    expect(anim.keyframes).toEqual([]);
  });

  it('should handle empty config object', () => {
    const anim = new Animation({});
    expect(anim.id).toBe('');
    expect(anim.name).toBe('');
    expect(anim.duration).toBe(0);
    expect(anim.loop).toBe(false);
    expect(anim.keyframes).toEqual([]);
  });
});

describe('Animation Class - getKeyframesForBone()', () => {
  it('should return keyframes filtered by boneId', () => {
    const keyframes = [
      { time: 0, boneId: 'arm', rotation: { z: 0 } },
      { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
      { time: 0, boneId: 'leg', rotation: { z: 0 } },
      { time: 500, boneId: 'leg', rotation: { z: -1.5 } },
    ];
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      keyframes,
    });

    const armKfs = anim.getKeyframesForBone('arm');
    expect(armKfs).toHaveLength(2);
    expect(armKfs[0].boneId).toBe('arm');
    expect(armKfs[1].boneId).toBe('arm');
  });

  it('should return empty array for non-existent bone', () => {
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
      ],
    });

    const legKfs = anim.getKeyframesForBone('leg');
    expect(legKfs).toEqual([]);
  });

  it('should return keyframes sorted by time', () => {
    const keyframes = [
      { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
      { time: 0, boneId: 'arm', rotation: { z: 0 } },
      { time: 250, boneId: 'arm', rotation: { z: 0.75 } },
    ];
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      keyframes,
    });

    const armKfs = anim.getKeyframesForBone('arm');
    expect(armKfs[0].time).toBe(0);
    expect(armKfs[1].time).toBe(250);
    expect(armKfs[2].time).toBe(500);
  });
});

describe('Animation Class - toConfig() / fromConfig()', () => {
  it('should export animation to plain config object', () => {
    const keyframes = [
      { time: 0, boneId: 'arm', rotation: { z: 0 } },
      { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
    ];
    const anim = new Animation({
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: true,
      keyframes,
    });

    const config = anim.toConfig();
    expect(config.id).toBe('wave');
    expect(config.name).toBe('Wave');
    expect(config.duration).toBe(1000);
    expect(config.loop).toBe(true);
    expect(config.keyframes).toEqual(keyframes);
  });

  it('should create animation from config object', () => {
    const config = {
      id: 'walk',
      name: 'Walk Cycle',
      duration: 1000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'leg', rotation: { z: 0.5 } },
        { time: 500, boneId: 'leg', rotation: { z: -0.5 } },
      ],
    };

    const anim = Animation.fromConfig(config);
    expect(anim.id).toBe('walk');
    expect(anim.name).toBe('Walk Cycle');
    expect(anim.duration).toBe(1000);
    expect(anim.loop).toBe(true);
    expect(anim.keyframes).toHaveLength(2);
  });

  it('should round-trip toConfig -> fromConfig', () => {
    const original = new Animation({
      id: 'dance',
      name: 'Dance',
      duration: 2000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'torso', rotation: { z: 0 }, position: { x: 0, y: 0, z: 0 } },
      ],
    });

    const config = original.toConfig();
    const restored = Animation.fromConfig(config);

    expect(restored.id).toBe(original.id);
    expect(restored.name).toBe(original.name);
    expect(restored.duration).toBe(original.duration);
    expect(restored.loop).toBe(original.loop);
    expect(restored.keyframes).toEqual(original.keyframes);
  });
});

// =============================================
// AnimationPlayer Class Tests
// =============================================
describe('AnimationPlayer Class - Constructor & State', () => {
  it('should create a player with a skeleton', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    expect(player.skeleton).toBe(skeleton);
    expect(player.currentAnimation).toBeNull();
    expect(player.currentTime).toBe(0);
    expect(player.isPlaying).toBe(false);
    expect(player.isPaused).toBe(false);
  });

  it('should default playback speed to 1', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(player.speed).toBe(1);
  });
});

describe('AnimationPlayer Class - play()', () => {
  it('should start playing an animation', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI / 2 } },
      ],
    });

    player.play(anim);
    expect(player.currentAnimation).toBe(anim);
    expect(player.isPlaying).toBe(true);
    expect(player.isPaused).toBe(false);
  });

  it('should stop previous animation when playing new one', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim1 = new Animation({ id: 'a1', name: 'A1', duration: 1000, keyframes: [] });
    const anim2 = new Animation({ id: 'a2', name: 'A2', duration: 500, keyframes: [] });

    player.play(anim1);
    expect(player.currentAnimation).toBe(anim1);
    player.play(anim2);
    expect(player.currentAnimation).toBe(anim2);
  });

  it('should reset currentTime to 0 when playing', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.currentTime = 500;
    player.play(anim);
    expect(player.currentTime).toBe(0);
  });

  it('should not play with null animation', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    player.play(null);
    expect(player.isPlaying).toBe(false);
    expect(player.currentAnimation).toBeNull();
  });
});

describe('AnimationPlayer Class - pause()', () => {
  it('should pause a playing animation', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.play(anim);
    player.pause();
    expect(player.isPaused).toBe(true);
    expect(player.isPlaying).toBe(false);
  });

  it('should not throw when pausing without playing', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(() => player.pause()).not.toThrow();
  });
});

describe('AnimationPlayer Class - stop()', () => {
  it('should stop a playing animation', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.play(anim);
    player.stop();
    expect(player.isPlaying).toBe(false);
    expect(player.isPaused).toBe(false);
    expect(player.currentAnimation).toBeNull();
    expect(player.currentTime).toBe(0);
  });

  it('should not throw when stopping without playing', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(() => player.stop()).not.toThrow();
  });
});

describe('AnimationPlayer Class - seek()', () => {
  it('should jump to a specific time', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 2000, keyframes: [] });

    player.play(anim);
    player.seek(500);
    expect(player.currentTime).toBe(500);
  });

  it('should clamp time to animation duration', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.play(anim);
    player.seek(2000);
    expect(player.currentTime).toBe(1000);
  });

  it('should clamp negative time to 0', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.play(anim);
    player.seek(-100);
    expect(player.currentTime).toBe(0);
  });

  it('should not throw when seeking without playing', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(() => player.seek(500)).not.toThrow();
  });
});

describe('AnimationPlayer Class - getCurrentTime()', () => {
  it('should return the current playback time', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({ id: 'a', name: 'A', duration: 1000, keyframes: [] });

    player.play(anim);
    player.currentTime = 350;
    expect(player.getCurrentTime()).toBe(350);
  });

  it('should return 0 when not playing', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(player.getCurrentTime()).toBe(0);
  });
});

describe('AnimationPlayer Class - update() interpolation', () => {
  it('should interpolate rotation between keyframes', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI } },
      ],
    });

    player.play(anim);
    player.currentTime = 500; // halfway
    player.update();

    // At 50% of the animation, rotation should be PI/2
    expect(bones[0].rotation.z).toBeCloseTo(Math.PI / 2, 4);
  });

  it('should apply position keyframes when present', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 }, position: { x: 0, y: 0, z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: 0 }, position: { x: 10, y: 10, z: 10 } },
      ],
    });

    player.play(anim);
    player.currentTime = 500; // halfway
    player.update();

    expect(bones[0].position.x).toBeCloseTo(5, 4);
    expect(bones[0].position.y).toBeCloseTo(5, 4);
    expect(bones[0].position.z).toBeCloseTo(5, 4);
  });

  it('should handle animation at start time (0)', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0.5 } },
        { time: 1000, boneId: 'arm', rotation: { z: 1.5 } },
      ],
    });

    player.play(anim);
    player.currentTime = 0;
    player.update();

    expect(bones[0].rotation.z).toBeCloseTo(0.5, 4);
  });

  it('should handle animation at end time (duration)', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI } },
      ],
    });

    player.play(anim);
    player.currentTime = 1000;
    player.update();

    expect(bones[0].rotation.z).toBeCloseTo(Math.PI, 4);
  });

  it('should handle multiple bones simultaneously', () => {
    const bones = [createMockBone('arm'), createMockBone('leg')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI / 2 } },
        { time: 0, boneId: 'leg', rotation: { z: 0 } },
        { time: 1000, boneId: 'leg', rotation: { z: -Math.PI / 2 } },
      ],
    });

    player.play(anim);
    player.currentTime = 500;
    player.update();

    expect(bones[0].rotation.z).toBeCloseTo(Math.PI / 4, 4);
    expect(bones[1].rotation.z).toBeCloseTo(-Math.PI / 4, 4);
  });

  it('should skip keyframes for non-existent bones without throwing', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'phantom', rotation: { z: 0 } },
        { time: 1000, boneId: 'phantom', rotation: { z: Math.PI } },
      ],
    });

    player.play(anim);
    expect(() => player.update()).not.toThrow();
  });

  it('should handle empty keyframes without throwing', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'empty',
      name: 'Empty',
      duration: 1000,
      loop: false,
      keyframes: [],
    });

    player.play(anim);
    expect(() => player.update()).not.toThrow();
  });
});

describe('AnimationPlayer Class - update() looping', () => {
  it('should wrap currentTime for looping animations', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'loop',
      name: 'Loop',
      duration: 1000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI } },
      ],
    });

    player.play(anim);
    player.currentTime = 1500; // beyond duration, should wrap to 500
    player.update();

    // currentTime should be wrapped to 500 (within duration)
    expect(player.currentTime).toBe(500);
    expect(bones[0].rotation.z).toBeCloseTo(Math.PI / 2, 4);
  });

  it('should not loop when loop is false', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'no-loop',
      name: 'No Loop',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI } },
      ],
    });

    player.play(anim);
    player.currentTime = 1500; // beyond duration
    player.update();

    // Should stop at duration, not loop
    expect(player.currentTime).toBe(1000);
  });
});

describe('AnimationPlayer Class - update() advancement', () => {
  it('should advance currentTime by delta when update called with delta', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 5000,
      loop: false,
      keyframes: [],
    });

    player.play(anim);
    player.currentTime = 0;
    player.update(100);
    expect(player.currentTime).toBe(100);

    player.update(200);
    expect(player.currentTime).toBe(300);
  });

  it('should respect playback speed', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 5000,
      loop: false,
      keyframes: [],
    });

    player.play(anim);
    player.speed = 2;
    player.currentTime = 0;
    player.update(100);
    expect(player.currentTime).toBe(200); // 100 * 2 speed

    player.speed = 0.5;
    player.update(100);
    expect(player.currentTime).toBe(250); // 200 + 100 * 0.5
  });

  it('should stop non-looping animation when elapsed exceeds duration', () => {
    const skeleton = createMockSkeleton([createMockBone('arm')]);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 500,
      loop: false,
      keyframes: [],
    });

    player.play(anim);
    player.currentTime = 400;
    player.update(200); // would go to 600, exceeds 500

    expect(player.isPlaying).toBe(false);
    expect(player.currentAnimation).toBeNull();
  });
});

describe('AnimationPlayer Class - setSpeed()', () => {
  it('should update playback speed', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    player.setSpeed(2);
    expect(player.speed).toBe(2);

    player.setSpeed(0.5);
    expect(player.speed).toBe(0.5);
  });

  it('should clamp negative speed to 0', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    player.setSpeed(-1);
    expect(player.speed).toBe(0);
  });
});

describe('AnimationPlayer Class - Edge Cases', () => {
  it('should handle single keyframe (no interpolation needed)', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'single',
      name: 'Single',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0.75 } },
      ],
    });

    player.play(anim);
    player.currentTime = 500;
    player.update();

    expect(bones[0].rotation.z).toBeCloseTo(0.75, 4);
  });

  it('should not throw when update called without playing', () => {
    const skeleton = createMockSkeleton([]);
    const player = new AnimationPlayer(skeleton);
    expect(() => player.update(100)).not.toThrow();
  });

  it('should handle animation with only x/y rotation (no z)', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { x: 0, y: 0 } },
        { time: 1000, boneId: 'arm', rotation: { x: 1, y: 1 } },
      ],
    });

    player.play(anim);
    player.currentTime = 500;
    expect(() => player.update()).not.toThrow();
  });

  it('should handle mixed keyframe types (some with position, some without)', () => {
    const bones = [createMockBone('arm')];
    const skeleton = createMockSkeleton(bones);
    const player = new AnimationPlayer(skeleton);
    const anim = new Animation({
      id: 'mixed',
      name: 'Mixed',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 }, position: { x: 0, y: 0, z: 0 } },
        { time: 500, boneId: 'arm', rotation: { z: Math.PI / 2 } },
        { time: 1000, boneId: 'arm', rotation: { z: Math.PI }, position: { x: 5, y: 5, z: 0 } },
      ],
    });

    player.play(anim);
    player.currentTime = 250;
    expect(() => player.update()).not.toThrow();
  });
});