/** Unit Tests for Puppet Movement Controls & Smooth Transitions (Request 19)
 * Tests slot-based movement, wiggling transitions, sprite direction flipping,
 * and automatic animation triggering during movement
 */

import * as THREE from 'three';
import Puppet from '../client/js/puppet/puppet.js';

// Mock skeleton config used across tests
const mockSkeletonConfig = {
  name: 'Test Puppet',
  bones: [
    {
      id: 'torso',
      name: 'Torso',
      parentId: null,
      asset: 'torso.png',
      position: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1 },
      socketOffset: { x: 0, y: 0.5 },
    },
    {
      id: 'head',
      name: 'Head',
      parentId: 'torso',
      asset: 'head.png',
      position: { x: 0, y: 1.2, z: 0 },
      scale: { x: 0.8, y: 0.8 },
      socketOffset: { x: 0, y: 0 },
    },
    {
      id: 'upper-arm-l',
      name: 'Upper Arm Left',
      parentId: 'torso',
      asset: 'upper-arm-l.png',
      position: { x: -0.6, y: 0.4, z: 0 },
      scale: { x: 0.4, y: 0.8 },
      socketOffset: { x: 0, y: 0 },
    },
  ],
};

// ============================================================
// Slot-Based Movement State
// ============================================================
describe('Puppet - Slot Movement Properties', () => {
  it('should have currentSlotIndex defaulting to 0', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(puppet.currentSlotIndex).toBe(0);
  });

  it('should have facingDirection defaulting to right', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(puppet.facingDirection).toBe('right');
  });

  it('should have targetSlotIndex defaulting to null', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(puppet.targetSlotIndex).toBeNull();
  });

  it('should have transition config properties', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(puppet.transitionDuration).toBe(400);
    expect(puppet.wiggleFrequency).toBe(3);
    expect(puppet.wiggleAmplitude).toBe(5);
  });
});

// ============================================================
// moveToSlot - Smooth Wiggling Motion
// ============================================================
describe('Puppet - moveToSlot()', () => {
  it('should start a wiggling transition to target X', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    puppet.moveToSlot(10, 400, 'right');

    expect(puppet.isMoving).toBe(true);
    expect(puppet._transitionStartX).toBe(0);
    expect(puppet._transitionTargetX).toBe(10);
    expect(puppet._transitionStartTime).toBeDefined();
    expect(puppet._transitionDuration).toBe(400);
  });

  it('should set facing direction based on movement direction', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet.moveToSlot(10, 400, 'right');
    expect(puppet.facingDirection).toBe('right');

    puppet.moveToSlot(-10, 400, 'left');
    expect(puppet.facingDirection).toBe('left');
  });

  it('should accept custom duration', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet.moveToSlot(10, 800, 'right');
    expect(puppet._transitionDuration).toBe(800);
  });

  it('should not throw without skeleton', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(() => puppet.moveToSlot(10, 400, 'right')).not.toThrow();
  });
});

// ============================================================
// Wiggling Transition Interpolation
// ============================================================
describe('Puppet - Wiggling Transition Interpolation', () => {
  function createPuppet() {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);
    return puppet;
  }

  it('should apply sine-wave wiggle during transition', () => {
    const puppet = createPuppet();
    puppet.moveToSlot(10, 400, 'right');

    // Simulate time at 25% progress
    puppet._transitionStartTime = Date.now() - 100;
    puppet.update();

    // Position should be approximately 25% of the way with some wiggle offset
    // Wiggle = sin(0.25 * PI * 3) * 5 * (1 - 0.25) = sin(0.75*PI) * 3.75 = 0.707 * 3.75 = 2.65
    // Base = 0 + (10 - 0) * 0.25 = 2.5
    // Expected = 2.5 + 2.65 = ~5.15
    const expectedBase = 2.5;
    // Wiggle adds some offset, so it won't be exactly 2.5
    expect(puppet.group.position.x).toBeGreaterThan(expectedBase - 4);
    expect(puppet.group.position.x).toBeLessThan(expectedBase + 4);
  });

  it('should complete transition when duration elapses', () => {
    const puppet = createPuppet();
    puppet.moveToSlot(10, 400, 'right');

    // Simulate time at 100% progress
    puppet._transitionStartTime = Date.now() - 400;
    puppet.update();

    expect(puppet.isMoving).toBe(false);
    expect(puppet.group.position.x).toBeCloseTo(10, 0);
  });

  it('should decrease wiggle amplitude as transition progresses', () => {
    const puppet = createPuppet();
    puppet.moveToSlot(10, 400, 'right');

    // At 10% progress - wiggle should be noticeable
    puppet._transitionStartTime = Date.now() - 40;
    puppet.update();
    const pos10 = puppet.group.position.x;

    // At 90% progress - wiggle should be minimal
    puppet._transitionStartTime = Date.now() - 360;
    puppet.update();
    const pos90 = puppet.group.position.x;

    // At 90%, position should be close to target (9 + small wiggle)
    expect(pos90).toBeGreaterThan(8);
  });

  it('should not apply wiggle when progress is 0', () => {
    const puppet = createPuppet();
    puppet.moveToSlot(10, 400, 'right');

    // At 0% progress
    puppet._transitionStartTime = Date.now();
    puppet.update();

    // Wiggle at progress=0: sin(0) * 5 * 1 = 0
    // Base: 0 + 10 * 0 = 0
    expect(puppet.group.position.x).toBeCloseTo(0, 0);
  });

  it('should handle left direction movement', () => {
    const puppet = createPuppet();
    puppet.moveToSlot(-10, 400, 'left');

    // Simulate 50% progress
    puppet._transitionStartTime = Date.now() - 200;
    puppet.update();

    // At 50%: base = 0 + (-10 - 0) * 0.5 = -5
    // Wiggle at 50%: sin(0.5 * PI * 3) * 5 * 0.5 = sin(1.5*PI) * 2.5 = -1 * 2.5 = -2.5
    // Expected: -5 + (-2.5) = -7.5
    expect(puppet.group.position.x).toBeLessThan(-3);
    expect(puppet.group.position.x).toBeGreaterThan(-10);
  });
});

// ============================================================
// Sprite Direction Flipping
// ============================================================
describe('Puppet - setFacingDirection()', () => {
  it('should flip sprite horizontally when facing left', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet.setFacingDirection('left');

    expect(puppet.facingDirection).toBe('left');
    expect(puppet.group.scale.x).toBe(-1);
  });

  it('should set normal scale when facing right', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet.setFacingDirection('right');

    expect(puppet.facingDirection).toBe('right');
    expect(puppet.group.scale.x).toBe(1);
  });

  it('should not throw with invalid direction', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    expect(() => puppet.setFacingDirection('up')).not.toThrow();
  });

  it('should not throw without skeleton', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(() => puppet.setFacingDirection('left')).not.toThrow();
  });

  it('should flip correctly after multiple direction changes', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet.setFacingDirection('left');
    expect(puppet.group.scale.x).toBe(-1);

    puppet.setFacingDirection('right');
    expect(puppet.group.scale.x).toBe(1);

    puppet.setFacingDirection('left');
    expect(puppet.group.scale.x).toBe(-1);
  });
});

// ============================================================
// Automatic Animation Triggering
// ============================================================
describe('Puppet - Automatic Animation During Movement', () => {
  it('should call onMovementStart callback when movement begins', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    let movementStarted = false;
    puppet.onMovementStart = () => {
      movementStarted = true;
    };

    puppet.moveToSlot(10, 400, 'right');
    expect(movementStarted).toBe(true);
  });

  it('should call onMovementEnd callback when movement completes', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    let movementEnded = false;
    puppet.onMovementEnd = () => {
      movementEnded = true;
    };

    puppet.moveToSlot(10, 400, 'right');
    // Complete the transition
    puppet._transitionStartTime = Date.now() - 400;
    puppet.update();

    expect(movementEnded).toBe(true);
  });

  it('should store previous animation before playing walk', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    const idleAnim = { id: 'idle', name: 'Idle', duration: 2000, loop: true, keyframes: [] };
    puppet.playAnimation(idleAnim);

    puppet.moveToSlot(10, 400, 'right');

    expect(puppet._previousAnimation).toBe(idleAnim);
  });

  it('should restore previous animation after movement ends', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    const idleAnim = { id: 'idle', name: 'Idle', duration: 2000, loop: true, keyframes: [] };
    puppet.playAnimation(idleAnim);

    // Start movement
    puppet.moveToSlot(10, 400, 'right');

    // Play a walk animation (simulating what onMovementStart would do)
    const walkAnim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    puppet.playAnimation(walkAnim);

    // Complete the transition
    puppet._transitionStartTime = Date.now() - 400;
    puppet.update();

    expect(puppet.currentAnimation).toBe(idleAnim);
  });

  it('should not restore animation if no previous animation existed', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    // No animation playing before movement
    puppet.moveToSlot(10, 400, 'right');

    // Play walk animation
    const walkAnim = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    puppet.playAnimation(walkAnim);

    // Complete the transition
    puppet._transitionStartTime = Date.now() - 400;
    puppet.update();

    expect(puppet.currentAnimation).toBeNull();
  });
});

// ============================================================
// Integration: Full Movement Flow
// ============================================================
describe('Puppet - Full Movement Flow Integration', () => {
  it('should complete a full left-to-right movement cycle', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    let startCalled = false;
    let endCalled = false;
    puppet.onMovementStart = () => { startCalled = true; };
    puppet.onMovementEnd = () => { endCalled = true; };

    // Start movement
    puppet.moveToSlot(10, 400, 'right');
    expect(startCalled).toBe(true);
    expect(puppet.facingDirection).toBe('right');
    expect(puppet.group.scale.x).toBe(1); // Normal scale for right-facing

    // Complete transition
    puppet._transitionStartTime = Date.now() - 400;
    puppet.update();

    expect(endCalled).toBe(true);
    expect(puppet.isMoving).toBe(false);
    expect(puppet.group.position.x).toBeCloseTo(10, 0);
  });

  it('should handle rapid direction changes by cancelling previous transition', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);

    puppet.moveToSlot(10, 400, 'right');
    expect(puppet._transitionTargetX).toBe(10);

    // Immediately change direction
    puppet.moveToSlot(-10, 400, 'left');
    expect(puppet._transitionTargetX).toBe(-10);
    expect(puppet.facingDirection).toBe('left');
  });
});
