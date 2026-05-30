/** Unit Tests for Keyframe Editor
 * Tests the KeyframeEditor class for creating, editing, and managing animations
 * Visual keyframe animation editor with timeline, playback, and export capabilities
 */

import { KeyframeEditor } from '../client/js/animation/keyframe-editor.js';
import { Animation } from '../client/js/animation/animation-system.js';

// ---- Helper: create a mock bone object ----
function createMockBone(id) {
  return {
    id,
    name: id,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    setRotation: function (angle) { this.rotation.z = angle; },
  };
}

// ---- Helper: create a mock skeleton ----
// Accepts either an array of bone IDs (strings) or an array of bone objects
function createMockSkeleton(boneIdsOrBones) {
  let bones;
  if (boneIdsOrBones.length === 0) {
    bones = [];
  } else if (typeof boneIdsOrBones[0] === 'string') {
    bones = boneIdsOrBones.map((id) => createMockBone(id));
  } else {
    // Already bone objects
    bones = boneIdsOrBones;
  }
  const boneMap = {};
  for (const b of bones) {
    boneMap[b.id] = b;
  }
  return {
    bones,
    getBone: function (id) { return boneMap[id] || null; },
    getRootBones: function () { return bones; },
  };
}

// =============================================
// KeyframeEditor - Constructor & Initial State
// =============================================
describe('KeyframeEditor - Constructor & Initial State', () => {
  it('should create an editor with a skeleton', () => {
    const skeleton = createMockSkeleton(['torso', 'head', 'arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.skeleton).toBe(skeleton);
    expect(editor.currentAnimation).toBeNull();
    expect(editor.currentTime).toBe(0);
    expect(editor.isPlaying).toBe(false);
    expect(editor.isPaused).toBe(false);
    expect(editor.boneList).toEqual(['torso', 'head', 'arm']);
  });

  it('should default selectedBone to null', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.selectedBone).toBeNull();
  });

  it('should default speed to 1', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.speed).toBe(1);
  });

  it('should collect bone IDs from skeleton', () => {
    const skeleton = createMockSkeleton(['torso', 'head', 'upper-arm-l', 'lower-leg-r']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.boneList).toContain('torso');
    expect(editor.boneList).toContain('head');
    expect(editor.boneList).toContain('upper-arm-l');
    expect(editor.boneList).toContain('lower-leg-r');
  });
});

// =============================================
// KeyframeEditor - createAnimation()
// =============================================
describe('KeyframeEditor - createAnimation()', () => {
  it('should create a new empty animation', () => {
    const skeleton = createMockSkeleton(['torso', 'arm']);
    const editor = new KeyframeEditor(skeleton);

    const anim = editor.createAnimation('test-anim', 'Test Animation', 2000);

    expect(anim).toBeInstanceOf(Animation);
    expect(anim.id).toBe('test-anim');
    expect(anim.name).toBe('Test Animation');
    expect(anim.duration).toBe(2000);
    expect(anim.loop).toBe(false);
    expect(anim.keyframes).toEqual([]);
    expect(editor.currentAnimation).toBe(anim);
  });

  it('should create an animation with loop enabled', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    const anim = editor.createAnimation('loop-anim', 'Loop', 1000, true);

    expect(anim.loop).toBe(true);
    expect(editor.currentAnimation).toBe(anim);
  });

  it('should return the created animation', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    const result = editor.createAnimation('a', 'A', 500);

    expect(result).toBeDefined();
    expect(result.id).toBe('a');
  });
});

// =============================================
// KeyframeEditor - loadAnimation()
// =============================================
describe('KeyframeEditor - loadAnimation()', () => {
  it('should load an existing animation', () => {
    const skeleton = createMockSkeleton(['torso', 'arm']);
    const editor = new KeyframeEditor(skeleton);

    const anim = new Animation({
      id: 'walk',
      name: 'Walk',
      duration: 1000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 500, boneId: 'arm', rotation: { z: 1.5 } },
      ],
    });

    editor.loadAnimation(anim);

    expect(editor.currentAnimation).toBe(anim);
    expect(editor.currentTime).toBe(0);
    expect(editor.isPlaying).toBe(false);
  });

  it('should stop playback when loading new animation', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    const anim1 = new Animation({ id: 'a1', name: 'A1', duration: 1000, keyframes: [] });
    editor.loadAnimation(anim1);
    editor.play();

    const anim2 = new Animation({ id: 'a2', name: 'A2', duration: 500, keyframes: [] });
    editor.loadAnimation(anim2);

    expect(editor.currentAnimation).toBe(anim2);
    expect(editor.isPlaying).toBe(false);
    expect(editor.currentTime).toBe(0);
  });
});

// =============================================
// KeyframeEditor - selectBone()
// =============================================
describe('KeyframeEditor - selectBone()', () => {
  it('should select a valid bone', () => {
    const skeleton = createMockSkeleton(['torso', 'arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    editor.selectBone('arm');

    expect(editor.selectedBone).toBe('arm');
  });

  it('should return false for non-existent bone', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    const result = editor.selectBone('phantom');

    expect(result).toBe(false);
    expect(editor.selectedBone).toBeNull();
  });

  it('should return true for valid bone', () => {
    const skeleton = createMockSkeleton(['torso', 'arm']);
    const editor = new KeyframeEditor(skeleton);

    const result = editor.selectBone('arm');

    expect(result).toBe(true);
  });
});

// =============================================
// KeyframeEditor - addKeyframe()
// =============================================
describe('KeyframeEditor - addKeyframe()', () => {
  it('should add a keyframe for the selected bone', () => {
    const skeleton = createMockSkeleton(['torso', 'arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');

    const kf = editor.addKeyframe(250, { z: 0.5 });

    expect(kf).toBeDefined();
    expect(kf.time).toBe(250);
    expect(kf.boneId).toBe('arm');
    expect(kf.rotation).toEqual({ z: 0.5 });
    expect(editor.currentAnimation.keyframes).toContain(kf);
  });

  it('should add a keyframe with position data', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('torso');

    const kf = editor.addKeyframe(500, { z: 0 }, { x: 1, y: 2, z: 3 });

    expect(kf.time).toBe(500);
    expect(kf.rotation).toEqual({ z: 0 });
    expect(kf.position).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('should return null when no bone is selected', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);

    const result = editor.addKeyframe(100, { z: 0 });

    expect(result).toBeNull();
  });

  it('should return null when no animation is loaded', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    editor.selectBone('torso');

    const result = editor.addKeyframe(100, { z: 0 });

    expect(result).toBeNull();
  });

  it('should clamp time to animation duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');

    const kf = editor.addKeyframe(1500, { z: 0 });

    expect(kf.time).toBe(1000);
  });

  it('should clamp negative time to 0', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');

    const kf = editor.addKeyframe(-100, { z: 0 });

    expect(kf.time).toBe(0);
  });
});

// =============================================
// KeyframeEditor - deleteKeyframe()
// =============================================
describe('KeyframeEditor - deleteKeyframe()', () => {
  it('should delete a keyframe by index', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });
    editor.addKeyframe(1000, { z: 2 });

    expect(editor.currentAnimation.keyframes).toHaveLength(3);

    const result = editor.deleteKeyframe(1);

    expect(result).toBe(true);
    expect(editor.currentAnimation.keyframes).toHaveLength(2);
  });

  it('should return false for out-of-range index', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });

    expect(editor.deleteKeyframe(5)).toBe(false);
    expect(editor.deleteKeyframe(-1)).toBe(false);
  });

  it('should return false when no animation is loaded', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.deleteKeyframe(0)).toBe(false);
  });
});

// =============================================
// KeyframeEditor - updateKeyframe()
// =============================================
describe('KeyframeEditor - updateKeyframe()', () => {
  it('should update rotation of an existing keyframe', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });

    const result = editor.updateKeyframe(0, { z: 1.5 });

    expect(result).toBe(true);
    expect(editor.currentAnimation.keyframes[0].rotation).toEqual({ z: 1.5 });
  });

  it('should update position of an existing keyframe', () => {
    const skeleton = createMockSkeleton(['torso']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('torso');
    editor.addKeyframe(0, { z: 0 }, { x: 0, y: 0, z: 0 });

    editor.updateKeyframe(0, null, { x: 5, y: 5, z: 5 });

    expect(editor.currentAnimation.keyframes[0].position).toEqual({ x: 5, y: 5, z: 5 });
  });

  it('should update both rotation and position', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });

    editor.updateKeyframe(0, { z: 3 }, { x: 1, y: 2, z: 3 });

    const kf = editor.currentAnimation.keyframes[0];
    expect(kf.rotation).toEqual({ z: 3 });
    expect(kf.position).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('should return false for invalid index', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);

    expect(editor.updateKeyframe(99, { z: 0 })).toBe(false);
  });

  it('should return false when no animation is loaded', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.updateKeyframe(0, { z: 0 })).toBe(false);
  });
});

// =============================================
// KeyframeEditor - getKeyframesForSelectedBone()
// =============================================
describe('KeyframeEditor - getKeyframesForSelectedBone()', () => {
  it('should return keyframes for the selected bone', () => {
    const skeleton = createMockSkeleton(['arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });

    editor.selectBone('leg');
    editor.addKeyframe(0, { z: 0 });

    const kfs = editor.getKeyframesForSelectedBone();

    expect(kfs).toHaveLength(1);
    expect(kfs[0].boneId).toBe('leg');
  });

  it('should return empty array when no bone selected', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });

    editor.selectedBone = null;

    const kfs = editor.getKeyframesForSelectedBone();
    expect(kfs).toEqual([]);
  });

  it('should return empty array when no animation loaded', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.selectBone('arm');
    const kfs = editor.getKeyframesForSelectedBone();
    expect(kfs).toEqual([]);
  });
});

// =============================================
// KeyframeEditor - getAllKeyframes()
// =============================================
describe('KeyframeEditor - getAllKeyframes()', () => {
  it('should return all keyframes sorted by time', () => {
    const skeleton = createMockSkeleton(['arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(500, { z: 1 });
    editor.addKeyframe(0, { z: 0 });

    editor.selectBone('leg');
    editor.addKeyframe(250, { z: 0.5 });

    const allKfs = editor.getAllKeyframes();

    expect(allKfs).toHaveLength(3);
    expect(allKfs[0].time).toBe(0);
    expect(allKfs[1].time).toBe(250);
    expect(allKfs[2].time).toBe(500);
  });

  it('should return empty array when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.getAllKeyframes()).toEqual([]);
  });
});

// =============================================
// KeyframeEditor - setDuration()
// =============================================
describe('KeyframeEditor - setDuration()', () => {
  it('should update animation duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.setDuration(2000);

    expect(editor.currentAnimation.duration).toBe(2000);
  });

  it('should return false when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.setDuration(2000)).toBe(false);
  });

  it('should not accept negative duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.setDuration(-100);

    expect(editor.currentAnimation.duration).toBe(1000); // unchanged
  });
});

// =============================================
// KeyframeEditor - setLoop()
// =============================================
describe('KeyframeEditor - setLoop()', () => {
  it('should toggle loop on', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    expect(editor.currentAnimation.loop).toBe(false);

    editor.setLoop(true);
    expect(editor.currentAnimation.loop).toBe(true);
  });

  it('should toggle loop off', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000, true);
    expect(editor.currentAnimation.loop).toBe(true);

    editor.setLoop(false);
    expect(editor.currentAnimation.loop).toBe(false);
  });
});

// =============================================
// KeyframeEditor - setName()
// =============================================
describe('KeyframeEditor - setName()', () => {
  it('should update animation name', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Original', 1000);
    editor.setName('Updated Name');

    expect(editor.currentAnimation.name).toBe('Updated Name');
  });

  it('should return false when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.setName('New Name')).toBe(false);
  });
});

// =============================================
// KeyframeEditor - Playback Controls
// =============================================
describe('KeyframeEditor - Playback Controls', () => {
  it('should play the current animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.play();

    expect(editor.isPlaying).toBe(true);
    expect(editor.isPaused).toBe(false);
  });

  it('should do nothing when playing without animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.play();
    expect(editor.isPlaying).toBe(false);
  });

  it('should pause the current animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.play();
    editor.pause();

    expect(editor.isPaused).toBe(true);
    expect(editor.isPlaying).toBe(false);
  });

  it('should stop playback', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.play();
    editor.stop();

    expect(editor.isPlaying).toBe(false);
    expect(editor.isPaused).toBe(false);
    expect(editor.currentTime).toBe(0);
  });

  it('should seek to a specific time', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 2000);
    editor.seek(500);

    expect(editor.currentTime).toBe(500);
  });

  it('should clamp seek time to duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.seek(2000);

    expect(editor.currentTime).toBe(1000);
  });

  it('should clamp negative seek to 0', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.seek(-100);

    expect(editor.currentTime).toBe(0);
  });

  it('should do nothing seeking without animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.seek(500);
    expect(editor.currentTime).toBe(0);
  });
});

// =============================================
// KeyframeEditor - setSpeed() / getSpeed()
// =============================================
describe('KeyframeEditor - setSpeed() / getSpeed()', () => {
  it('should set and get playback speed', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.setSpeed(2);
    expect(editor.getSpeed()).toBe(2);

    editor.setSpeed(0.5);
    expect(editor.getSpeed()).toBe(0.5);
  });

  it('should clamp negative speed to 0', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.setSpeed(-1);
    expect(editor.getSpeed()).toBe(0);
  });
});

// =============================================
// KeyframeEditor - update()
// =============================================
describe('KeyframeEditor - update()', () => {
  it('should advance currentTime by delta * speed', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 5000);
    editor.play();
    editor.update(100);

    expect(editor.currentTime).toBe(100);
  });

  it('should respect speed multiplier', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 5000);
    editor.play();
    editor.setSpeed(2);
    editor.update(100);

    expect(editor.currentTime).toBe(200);
  });

  it('should handle looping when time exceeds duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000, true);
    editor.currentTime = 900;
    editor.play();
    editor.update(200); // would go to 1100

    expect(editor.currentTime).toBe(100); // 1100 % 1000
  });

  it('should stop non-looping animation at end', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000, false);
    editor.currentTime = 900;
    editor.play();
    editor.update(200); // would go to 1100

    expect(editor.currentTime).toBe(1000);
  });

  it('should not advance when paused', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 5000);
    editor.play();
    editor.pause();
    editor.update(100);

    expect(editor.currentTime).toBe(0);
  });

  it('should not advance when not playing', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 5000);
    editor.update(100);

    expect(editor.currentTime).toBe(0);
  });

  it('should apply keyframes at current time during update', () => {
    const bone = createMockBone('arm');
    const skeleton = createMockSkeleton([bone]);

    const editor = new KeyframeEditor(skeleton);
    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(1000, { z: Math.PI });

    editor.play();
    editor.currentTime = 500;
    editor.update();

    // The skeleton's internal bone should have the interpolated rotation
    const skeletonBone = skeleton.getBone('arm');
    expect(skeletonBone.rotation.z).toBeCloseTo(Math.PI / 2, 4);
  });
});

// =============================================
// KeyframeEditor - exportAnimation()
// =============================================
describe('KeyframeEditor - exportAnimation()', () => {
  it('should export current animation as config object', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('walk', 'Walk Cycle', 1000, true);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1.5 });

    const config = editor.exportAnimation();

    expect(config.id).toBe('walk');
    expect(config.name).toBe('Walk Cycle');
    expect(config.duration).toBe(1000);
    expect(config.loop).toBe(true);
    expect(config.keyframes).toHaveLength(2);
  });

  it('should return null when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.exportAnimation()).toBeNull();
  });

  it('should export a deep copy (mutations do not affect editor)', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });

    const config = editor.exportAnimation();
    config.keyframes.push({ time: 999, boneId: 'phantom', rotation: { z: 0 } });

    expect(editor.currentAnimation.keyframes).toHaveLength(1);
  });
});

// =============================================
// KeyframeEditor - importAnimation()
// =============================================
describe('KeyframeEditor - importAnimation()', () => {
  it('should import an animation from config object', () => {
    const skeleton = createMockSkeleton(['arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    const config = {
      id: 'run',
      name: 'Run Cycle',
      duration: 500,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'arm', rotation: { z: 0 } },
        { time: 250, boneId: 'arm', rotation: { z: 1 } },
      ],
    };

    const result = editor.importAnimation(config);

    expect(result).toBe(true);
    expect(editor.currentAnimation.id).toBe('run');
    expect(editor.currentAnimation.name).toBe('Run Cycle');
    expect(editor.currentAnimation.keyframes).toHaveLength(2);
  });

  it('should return false for invalid config', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(editor.importAnimation(null)).toBe(false);
    expect(editor.importAnimation({})).toBe(false);
    expect(editor.importAnimation({ id: 'no-duration' })).toBe(false);
  });
});

// =============================================
// KeyframeEditor - clearAnimation()
// =============================================
describe('KeyframeEditor - clearAnimation()', () => {
  it('should clear the current animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.play();

    editor.clearAnimation();

    expect(editor.currentAnimation).toBeNull();
    expect(editor.currentTime).toBe(0);
    expect(editor.isPlaying).toBe(false);
    expect(editor.isPaused).toBe(false);
  });
});

// =============================================
// KeyframeEditor - keyframe management utilities
// =============================================
describe('KeyframeEditor - Keyframe Management Utilities', () => {
  it('should delete all keyframes for a specific bone', () => {
    const skeleton = createMockSkeleton(['arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });

    editor.selectBone('leg');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });

    editor.deleteKeyframesForBone('arm');

    const remaining = editor.getAllKeyframes();
    expect(remaining).toHaveLength(2);
    expect(remaining.every((kf) => kf.boneId === 'leg')).toBe(true);
  });

  it('should handle deleteKeyframesForBone with no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    expect(() => editor.deleteKeyframesForBone('arm')).not.toThrow();
  });

  it('should get keyframe count for a bone', () => {
    const skeleton = createMockSkeleton(['arm', 'leg']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });

    editor.selectBone('leg');
    editor.addKeyframe(0, { z: 0 });

    expect(editor.getKeyframeCountForBone('arm')).toBe(2);
    expect(editor.getKeyframeCountForBone('leg')).toBe(1);
    expect(editor.getKeyframeCountForBone('phantom')).toBe(0);
  });

  it('should getKeyframeCountForBone return 0 when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.getKeyframeCountForBone('arm')).toBe(0);
  });
});

// =============================================
// KeyframeEditor - getCurrentTime() / getDuration()
// =============================================
describe('KeyframeEditor - getCurrentTime() / getDuration()', () => {
  it('should return current time', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 2000);
    editor.currentTime = 750;

    expect(editor.getCurrentTime()).toBe(750);
  });

  it('should return 0 when no animation for getCurrentTime', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.getCurrentTime()).toBe(0);
  });

  it('should return animation duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1500);
    expect(editor.getDuration()).toBe(1500);
  });

  it('should return 0 when no animation for getDuration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.getDuration()).toBe(0);
  });
});

// =============================================
// KeyframeEditor - duplicateKeyframe()
// =============================================
describe('KeyframeEditor - duplicateKeyframe()', () => {
  it('should duplicate a keyframe at a new time', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(250, { z: 0.5 });

    editor.duplicateKeyframe(0, 750);

    expect(editor.currentAnimation.keyframes).toHaveLength(2);
    expect(editor.currentAnimation.keyframes[1].time).toBe(750);
    expect(editor.currentAnimation.keyframes[1].rotation).toEqual({ z: 0.5 });
  });

  it('should return false for invalid index', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    expect(editor.duplicateKeyframe(99, 500)).toBe(false);
  });

  it('should return false when no animation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.duplicateKeyframe(0, 500)).toBe(false);
  });
});

// =============================================
// KeyframeEditor - Edge Cases
// =============================================
describe('KeyframeEditor - Edge Cases', () => {
  it('should handle empty skeleton', () => {
    const skeleton = createMockSkeleton([]);
    const editor = new KeyframeEditor(skeleton);
    expect(editor.boneList).toEqual([]);
  });

  it('should handle adding keyframe with null rotation', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');

    const kf = editor.addKeyframe(0, null);
    expect(kf).toBeDefined();
    expect(kf.rotation).toEqual({});
  });

  it('should handle creating animation with zero duration', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    const anim = editor.createAnimation('zero', 'Zero', 0);
    expect(anim.duration).toBe(0);
  });

  it('should not lose state after stop and restart', () => {
    const skeleton = createMockSkeleton(['arm']);
    const editor = new KeyframeEditor(skeleton);

    editor.createAnimation('test', 'Test', 1000);
    editor.selectBone('arm');
    editor.addKeyframe(0, { z: 0 });
    editor.addKeyframe(500, { z: 1 });

    editor.play();
    editor.stop();

    editor.play();
    expect(editor.isPlaying).toBe(true);
    expect(editor.currentAnimation).not.toBeNull();
    expect(editor.currentAnimation.keyframes).toHaveLength(2);
  });
});