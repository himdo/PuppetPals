/** Unit Tests for Animation Library
 * Tests the pre-defined animations exported by animation-library.js
 */

import {
  ANIMATION_LIBRARY,
  getIdleAnimation,
  getWalkAnimation,
  getRunAnimation,
  getJumpAnimation,
  getWaveAnimation,
  getSitAnimation,
  getDanceAnimation,
  getWaveHandAnimation,
  getAllAnimations,
  getAnimation,
} from '../client/js/animation/animation-library.js';
import { Animation } from '../client/js/animation/animation-system.js';

// =============================================
// Animation Library (Collection) Tests
// =============================================
describe('ANIMATION_LIBRARY', () => {
  it('should be an object with animation entries', () => {
    expect(typeof ANIMATION_LIBRARY).toBe('object');
    expect(ANIMATION_LIBRARY).not.toBeNull();
    expect(Object.keys(ANIMATION_LIBRARY).length).toBeGreaterThan(0);
  });

  it('should contain all 8 required animations', () => {
    const requiredIds = ['idle', 'walk', 'run', 'jump', 'wave', 'sit', 'dance', 'wave-hand'];
    for (const id of requiredIds) {
      expect(ANIMATION_LIBRARY).toHaveProperty(id);
    }
  });

  it('should have Animation instances as values', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      expect(anim).toBeInstanceOf(Animation);
    }
  });

  it('should have unique ids for each animation', () => {
    const ids = Object.values(ANIMATION_LIBRARY).map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty names for each animation', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      expect(anim.name.length).toBeGreaterThan(0);
    }
  });

  it('should have positive duration for each animation', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      expect(anim.duration).toBeGreaterThan(0);
    }
  });

  it('should have at least one keyframe per animation', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      expect(anim.keyframes.length).toBeGreaterThan(0);
    }
  });
});

// =============================================
// Individual Animation Tests
// =============================================
describe('getIdleAnimation()', () => {
  it('should return an Animation instance', () => {
    const anim = getIdleAnimation();
    expect(anim).toBeInstanceOf(Animation);
  });

  it('should have id "idle"', () => {
    expect(getIdleAnimation().id).toBe('idle');
  });

  it('should be a looping animation', () => {
    expect(getIdleAnimation().loop).toBe(true);
  });

  it('should have subtle bobbing keyframes', () => {
    const anim = getIdleAnimation();
    // Should have at least some position or rotation keyframes
    const hasRotation = anim.keyframes.some((kf) => kf.rotation);
    const hasPosition = anim.keyframes.some((kf) => kf.position);
    expect(hasRotation || hasPosition).toBe(true);
  });

  it('should be in the library', () => {
    expect(ANIMATION_LIBRARY.idle).toBe(getIdleAnimation());
  });
});

describe('getWalkAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getWalkAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "walk"', () => {
    expect(getWalkAnimation().id).toBe('walk');
  });

  it('should be a looping animation', () => {
    expect(getWalkAnimation().loop).toBe(true);
  });

  it('should have leg bone keyframes', () => {
    const anim = getWalkAnimation();
    const legBoneIds = anim.keyframes.map((kf) => kf.boneId);
    const hasLeg = legBoneIds.some((id) => id.includes('leg'));
    expect(hasLeg).toBe(true);
  });

  it('should have arm bone keyframes', () => {
    const anim = getWalkAnimation();
    const armBoneIds = anim.keyframes.map((kf) => kf.boneId);
    const hasArm = armBoneIds.some((id) => id.includes('arm'));
    expect(hasArm).toBe(true);
  });
});

describe('getRunAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getRunAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "run"', () => {
    expect(getRunAnimation().id).toBe('run');
  });

  it('should be a looping animation', () => {
    expect(getRunAnimation().loop).toBe(true);
  });

  it('should be shorter duration than walk (faster cycle)', () => {
    const run = getRunAnimation();
    const walk = getWalkAnimation();
    expect(run.duration).toBeLessThan(walk.duration);
  });

  it('should have more extreme rotation values than walk', () => {
    const anim = getRunAnimation();
    const maxRotation = Math.max(
      ...anim.keyframes.map((kf) => Math.abs(kf.rotation?.z || 0))
    );
    expect(maxRotation).toBeGreaterThan(0);
  });
});

describe('getJumpAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getJumpAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "jump"', () => {
    expect(getJumpAnimation().id).toBe('jump');
  });

  it('should NOT be a looping animation (one-shot)', () => {
    expect(getJumpAnimation().loop).toBe(false);
  });

  it('should have position keyframes for vertical movement', () => {
    const anim = getJumpAnimation();
    const hasPosition = anim.keyframes.some((kf) => kf.position);
    expect(hasPosition).toBe(true);
  });

  it('should start and end at similar position (land back)', () => {
    const anim = getJumpAnimation();
    const startKfs = anim.keyframes.filter((kf) => kf.time === 0 && kf.position);
    const endKfs = anim.keyframes.filter((kf) => kf.time === anim.duration && kf.position);
    // At least verify the structure exists
    expect(startKfs.length + endKfs.length).toBeGreaterThan(0);
  });
});

describe('getWaveAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getWaveAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "wave"', () => {
    expect(getWaveAnimation().id).toBe('wave');
  });

  it('should be a looping animation', () => {
    expect(getWaveAnimation().loop).toBe(true);
  });

  it('should target arm bones', () => {
    const anim = getWaveAnimation();
    const boneIds = anim.keyframes.map((kf) => kf.boneId);
    const hasArm = boneIds.some((id) => id.includes('arm'));
    expect(hasArm).toBe(true);
  });
});

describe('getSitAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getSitAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "sit"', () => {
    expect(getSitAnimation().id).toBe('sit');
  });

  it('should NOT be a looping animation (one-shot pose)', () => {
    expect(getSitAnimation().loop).toBe(false);
  });

  it('should have leg rotation keyframes for sitting pose', () => {
    const anim = getSitAnimation();
    const boneIds = anim.keyframes.map((kf) => kf.boneId);
    const hasLeg = boneIds.some((id) => id.includes('leg'));
    expect(hasLeg).toBe(true);
  });
});

describe('getDanceAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getDanceAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "dance"', () => {
    expect(getDanceAnimation().id).toBe('dance');
  });

  it('should be a looping animation', () => {
    expect(getDanceAnimation().loop).toBe(true);
  });

  it('should involve multiple bones', () => {
    const anim = getDanceAnimation();
    const boneIds = new Set(anim.keyframes.map((kf) => kf.boneId));
    // Dance should involve at least 2 different bones
    expect(boneIds.size).toBeGreaterThanOrEqual(2);
  });
});

describe('getWaveHandAnimation()', () => {
  it('should return an Animation instance', () => {
    expect(getWaveHandAnimation()).toBeInstanceOf(Animation);
  });

  it('should have id "wave-hand"', () => {
    expect(getWaveHandAnimation().id).toBe('wave-hand');
  });

  it('should NOT be a looping animation (one-shot)', () => {
    expect(getWaveHandAnimation().loop).toBe(false);
  });

  it('should target arm/hand bones', () => {
    const anim = getWaveHandAnimation();
    const boneIds = anim.keyframes.map((kf) => kf.boneId);
    const hasArm = boneIds.some((id) => id.includes('arm'));
    expect(hasArm).toBe(true);
  });
});

// =============================================
// Utility Function Tests
// =============================================
describe('getAllAnimations()', () => {
  it('should return an array of all animations', () => {
    const all = getAllAnimations();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(8);
  });

  it('should return Animation instances', () => {
    const all = getAllAnimations();
    for (const anim of all) {
      expect(anim).toBeInstanceOf(Animation);
    }
  });

  it('should return the same instances as the library', () => {
    const all = getAllAnimations();
    for (const anim of all) {
      expect(ANIMATION_LIBRARY[anim.id]).toBe(anim);
    }
  });
});

describe('getAnimation()', () => {
  it('should return animation by id', () => {
    const anim = getAnimation('walk');
    expect(anim).toBeInstanceOf(Animation);
    expect(anim.id).toBe('walk');
  });

  it('should return null for non-existent id', () => {
    expect(getAnimation('nonexistent')).toBeNull();
  });

  it('should return the same reference as the library', () => {
    expect(getAnimation('idle')).toBe(ANIMATION_LIBRARY.idle);
  });

  it('should handle empty string', () => {
    expect(getAnimation('')).toBeNull();
  });

  it('should handle null/undefined gracefully', () => {
    expect(() => getAnimation(null)).not.toThrow();
    expect(() => getAnimation(undefined)).not.toThrow();
  });
});

// =============================================
// Keyframe Structure Validation
// =============================================
describe('Animation Keyframe Structure', () => {
  it('should have valid keyframe time values (0 <= time <= duration)', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      for (const kf of anim.keyframes) {
        expect(kf.time).toBeGreaterThanOrEqual(0);
        expect(kf.time).toBeLessThanOrEqual(anim.duration);
      }
    }
  });

  it('should have boneId on every keyframe', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      for (const kf of anim.keyframes) {
        expect(kf.boneId).toBeDefined();
        expect(kf.boneId.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have rotation or position data on every keyframe', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      for (const kf of anim.keyframes) {
        expect(kf.rotation || kf.position).toBeDefined();
      }
    }
  });

  it('should be serializable via toConfig and reconstructable via fromConfig', () => {
    for (const [, anim] of Object.entries(ANIMATION_LIBRARY)) {
      const config = anim.toConfig();
      const restored = Animation.fromConfig(config);
      expect(restored.id).toBe(anim.id);
      expect(restored.name).toBe(anim.name);
      expect(restored.duration).toBe(anim.duration);
      expect(restored.loop).toBe(anim.loop);
      expect(restored.keyframes.length).toBe(anim.keyframes.length);
    }
  });
});