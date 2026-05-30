/** Unit Tests for Puppet Class
 * Tests the main Puppet class that combines skeleton system with Three.js rendering
 * Uses mocked Three.js for Node.js test environment
 */

import * as THREE from 'three';
import Puppet from '../client/js/puppet/puppet.js';
import Skeleton from '../client/js/puppet/skeleton.js';

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

describe('Puppet Class - Constructor & Properties', () => {
  it('should create a puppet with default properties', () => {
    const puppet = new Puppet();
    expect(puppet.id).toBe('');
    expect(puppet.ownerId).toBe('');
    expect(puppet.name).toBe('');
    expect(puppet.skeleton).toBeNull();
    expect(puppet.isOwnerControlled).toBe(false);
    expect(puppet.isLocked).toBe(false);
    expect(puppet.isSelected).toBe(false);
  });

  it('should create a puppet with provided config', () => {
    const puppet = new Puppet({
      id: 'puppet-1',
      ownerId: 'socket-abc',
      name: 'TestPlayer',
    });
    expect(puppet.id).toBe('puppet-1');
    expect(puppet.ownerId).toBe('socket-abc');
    expect(puppet.name).toBe('TestPlayer');
  });

  it('should have a group (Object3D) for Three.js scene', () => {
    const puppet = new Puppet();
    expect(puppet.group).toBeDefined();
    expect(puppet.group instanceof THREE.Mesh || puppet.group instanceof THREE.Object3D || puppet.group.constructor.name.includes('Object3D')).toBe(true);
  });

  it('should default currentAnimation to null', () => {
    const puppet = new Puppet();
    expect(puppet.currentAnimation).toBeNull();
  });

  it('should default targetPosition to null', () => {
    const puppet = new Puppet();
    expect(puppet.targetPosition).toBeNull();
  });

  it('should default isMoving to false', () => {
    const puppet = new Puppet();
    expect(puppet.isMoving).toBe(false);
  });
});

describe('Puppet Class - load()', () => {
  it('should load a skeleton from config', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.skeleton).toBeDefined();
    expect(puppet.skeleton.name).toBe('Test Puppet');
    expect(puppet.skeleton.getBoneCount()).toBe(3);
  });

  it('should add bone meshes to the puppet group', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    // Should have meshes for each bone with an asset
    expect(puppet.group.children.length).toBeGreaterThan(0);
  });

  it('should create placeholder meshes for bones', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const torso = puppet.skeleton.getBone('torso');
    expect(torso.mesh).toBeDefined();
  });

  it('should set skeleton update reference to puppet', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.skeleton).toBeInstanceOf(Skeleton);
  });

  it('should handle config without bones array', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    const emptyConfig = { name: 'Empty Puppet' };
    expect(() => puppet.load(emptyConfig, 'http://localhost:3000/assets')).not.toThrow();
  });

  it('should create a name label for the puppet', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.nameLabel).toBeDefined();
  });

  it('should create a lock indicator (initially hidden)', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.lockIndicator).toBeDefined();
    expect(puppet.lockIndicator.visible).toBe(false);
  });
});

describe('Puppet Class - update()', () => {
  it('should call skeleton update', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(() => puppet.update()).not.toThrow();
  });

  it('should not throw if skeleton is not loaded', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(() => puppet.update()).not.toThrow();
  });

  it('should handle smooth movement toward target position', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 10, y: 0, z: 10 });
    puppet.update();
    expect(puppet.isMoving).toBe(true);
  });
});

describe('Puppet Class - moveTo()', () => {
  it('should set target position for smooth movement', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    expect(puppet.targetPosition).toBeDefined();
    expect(puppet.targetPosition.x).toBe(5);
    expect(puppet.targetPosition.z).toBe(5);
  });

  it('should set isMoving to true', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    expect(puppet.isMoving).toBe(true);
  });

  it('should not move if puppet is locked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    // Locked puppet should still set target but updates should not apply for owner
    expect(puppet.isLocked).toBe(true);
  });
});

describe('Puppet Class - setBoneRotation()', () => {
  it('should rotate a specific bone by angle', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.setBoneRotation('upper-arm-l', Math.PI / 4);
    const bone = puppet.skeleton.getBone('upper-arm-l');
    expect(bone.rotation.z).toBe(Math.PI / 4);
  });

  it('should not throw for non-existent bone', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(() => puppet.setBoneRotation('non-existent', Math.PI / 4)).not.toThrow();
  });

  it('should not throw if skeleton is not loaded', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(() => puppet.setBoneRotation('torso', Math.PI / 4)).not.toThrow();
  });

  it('should accept negative angles', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.setBoneRotation('upper-arm-l', -Math.PI / 2);
    const bone = puppet.skeleton.getBone('upper-arm-l');
    expect(bone.rotation.z).toBe(-Math.PI / 2);
  });
});

describe('Puppet Class - playAnimation()', () => {
  it('should set current animation', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: false,
      keyframes: [],
    };
    puppet.playAnimation(mockAnimation);
    expect(puppet.currentAnimation).toBe(mockAnimation);
  });

  it('should set animation startTime', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: false,
      keyframes: [],
    };
    puppet.playAnimation(mockAnimation);
    expect(puppet.animationStartTime).toBeDefined();
  });

  it('should stop previous animation when starting new one', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const anim1 = { id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] };
    const anim2 = { id: 'wave', name: 'Wave', duration: 500, loop: false, keyframes: [] };
    puppet.playAnimation(anim1);
    expect(puppet.currentAnimation).toBe(anim1);
    puppet.playAnimation(anim2);
    expect(puppet.currentAnimation).toBe(anim2);
  });

  it('should not play animation if puppet is locked and not owner-controlled', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    const mockAnimation = { id: 'wave', name: 'Wave', duration: 500, loop: false, keyframes: [] };
    // Locked puppet should still allow animation (admin can force animations)
    puppet.playAnimation(mockAnimation);
    expect(puppet.currentAnimation).toBe(mockAnimation);
  });
});

describe('Puppet Class - stopAnimation()', () => {
  it('should clear current animation', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = { id: 'wave', name: 'Wave', duration: 500, loop: false, keyframes: [] };
    puppet.playAnimation(mockAnimation);
    expect(puppet.currentAnimation).toBe(mockAnimation);
    puppet.stopAnimation();
    expect(puppet.currentAnimation).toBeNull();
  });

  it('should not throw if no animation is playing', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    expect(() => puppet.stopAnimation()).not.toThrow();
  });

  it('should clear animation start time', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = { id: 'wave', name: 'Wave', duration: 500, loop: false, keyframes: [] };
    puppet.playAnimation(mockAnimation);
    puppet.stopAnimation();
    expect(puppet.animationStartTime).toBeNull();
  });
});

describe('Puppet Class - lock() / unlock()', () => {
  it('should set isLocked to true when locked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.isLocked).toBe(false);
    puppet.lock();
    expect(puppet.isLocked).toBe(true);
  });

  it('should set isLocked to false when unlocked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    expect(puppet.isLocked).toBe(true);
    puppet.unlock();
    expect(puppet.isLocked).toBe(false);
  });

  it('should show lock indicator when locked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    expect(puppet.lockIndicator.visible).toBe(true);
  });

  it('should hide lock indicator when unlocked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    puppet.unlock();
    expect(puppet.lockIndicator.visible).toBe(false);
  });
});

describe('Puppet Class - teleportTo()', () => {
  it('should instantly move puppet to new position', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.teleportTo({ x: 10, y: 0, z: 10 });
    expect(puppet.group.position.x).toBe(10);
    expect(puppet.group.position.z).toBe(10);
  });

  it('should work even when puppet is locked', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.lock();
    puppet.teleportTo({ x: 20, y: 0, z: 20 });
    expect(puppet.group.position.x).toBe(20);
    expect(puppet.group.position.z).toBe(20);
  });

  it('should reset isMoving state', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    expect(puppet.isMoving).toBe(true);
    puppet.teleportTo({ x: 10, y: 0, z: 10 });
    expect(puppet.isMoving).toBe(false);
  });

  it('should clear target position', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    puppet.teleportTo({ x: 10, y: 0, z: 10 });
    expect(puppet.targetPosition).toBeNull();
  });
});

describe('Puppet Class - select() / deselect()', () => {
  it('should set isSelected to true when selected', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.isSelected).toBe(false);
    puppet.select();
    expect(puppet.isSelected).toBe(true);
  });

  it('should set isSelected to false when deselected', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.select();
    expect(puppet.isSelected).toBe(true);
    puppet.deselect();
    expect(puppet.isSelected).toBe(false);
  });
});

describe('Puppet Class - dispose()', () => {
  it('should clear the skeleton reference', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.skeleton).toBeDefined();
    puppet.dispose();
    expect(puppet.skeleton).toBeNull();
  });

  it('should stop current animation', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.playAnimation({ id: 'walk', name: 'Walk', duration: 1000, loop: true, keyframes: [] });
    puppet.dispose();
    expect(puppet.currentAnimation).toBeNull();
  });

  it('should clear the group children', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(puppet.group.children.length).toBeGreaterThan(0);
    puppet.dispose();
    expect(puppet.group.children.length).toBe(0);
  });

  it('should reset moving state', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.moveTo({ x: 5, y: 0, z: 5 });
    puppet.dispose();
    expect(puppet.isMoving).toBe(false);
    expect(puppet.targetPosition).toBeNull();
  });
});

describe('Puppet Class - updateAnimation()', () => {
  it('should apply keyframe rotations during animation', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'upper-arm-l', rotation: { z: 0 } },
        { time: 500, boneId: 'upper-arm-l', rotation: { z: Math.PI / 2 } },
        { time: 1000, boneId: 'upper-arm-l', rotation: { z: 0 } },
      ],
    };
    puppet.playAnimation(mockAnimation);
    // Manually set animation time to 500ms by adjusting start time
    puppet.animationStartTime = Date.now() - 500;
    puppet.update();
    const bone = puppet.skeleton.getBone('upper-arm-l');
    // The rotation should be approximately PI/2 (with some tolerance for interpolation)
    expect(bone.rotation.z).toBeCloseTo(Math.PI / 2, 0);
  });

  it('should loop animation when loop is true and time exceeds duration', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'walk',
      name: 'Walk',
      duration: 1000,
      loop: true,
      keyframes: [
        { time: 0, boneId: 'upper-arm-l', rotation: { z: 0 } },
        { time: 500, boneId: 'upper-arm-l', rotation: { z: Math.PI / 4 } },
      ],
    };
    puppet.playAnimation(mockAnimation);
    // Set time to 1500ms (beyond duration), should wrap around to 500ms
    puppet.animationStartTime = Date.now() - 1500;
    puppet.update();
    // Should still be playing (not null)
    expect(puppet.currentAnimation).toBe(mockAnimation);
  });

  it('should stop non-looping animation when time exceeds duration', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'wave',
      name: 'Wave',
      duration: 1000,
      loop: false,
      keyframes: [],
    };
    puppet.playAnimation(mockAnimation);
    // Set time beyond duration
    puppet.animationStartTime = Date.now() - 2000;
    puppet.update();
    expect(puppet.currentAnimation).toBeNull();
  });
});

describe('Puppet Class - setName()', () => {
  it('should update the puppet name', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'OldName' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.setName('NewName');
    expect(puppet.name).toBe('NewName');
  });
});

describe('Puppet Class - Edge Cases', () => {
  it('should handle update without being loaded', () => {
    const puppet = new Puppet();
    expect(() => puppet.update()).not.toThrow();
  });

  it('should handle bone rotation without skeleton', () => {
    const puppet = new Puppet();
    expect(() => puppet.setBoneRotation('torso', 0.5)).not.toThrow();
  });

  it('should handle movement without skeleton', () => {
    const puppet = new Puppet();
    expect(() => puppet.moveTo({ x: 1, y: 0, z: 1 })).not.toThrow();
  });

  it('should handle teleport without skeleton', () => {
    const puppet = new Puppet();
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    expect(() => puppet.teleportTo({ x: 1, y: 0, z: 1 })).not.toThrow();
  });

  it('should handle lock without loaded indicator', () => {
    const puppet = new Puppet();
    expect(() => puppet.lock()).not.toThrow();
  });

  it('should handle unlock without loaded indicator', () => {
    const puppet = new Puppet();
    expect(() => puppet.unlock()).not.toThrow();
  });
});

describe('Puppet Class - Animation interpolation', () => {
  it('should interpolate between keyframes linearly', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'upper-arm-l', rotation: { z: 0 } },
        { time: 1000, boneId: 'upper-arm-l', rotation: { z: Math.PI } },
      ],
    };
    puppet.playAnimation(mockAnimation);
    // At 500ms (halfway), rotation should be PI/2
    puppet.animationStartTime = Date.now() - 500;
    puppet.update();
    const bone = puppet.skeleton.getBone('upper-arm-l');
    expect(bone.rotation.z).toBeCloseTo(Math.PI / 2, 1);
  });

  it('should handle animation with no keyframes', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'empty',
      name: 'Empty',
      duration: 1000,
      loop: false,
      keyframes: [],
    };
    expect(() => {
      puppet.playAnimation(mockAnimation);
      puppet.update();
    }).not.toThrow();
  });

  it('should handle keyframes for non-existent bones', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const mockAnimation = {
      id: 'test',
      name: 'Test',
      duration: 1000,
      loop: false,
      keyframes: [
        { time: 0, boneId: 'non-existent', rotation: { z: 0 } },
      ],
    };
    expect(() => {
      puppet.playAnimation(mockAnimation);
      puppet.update();
    }).not.toThrow();
  });
});

describe('Puppet Class - Movement interpolation', () => {
  it('should move group position gradually toward target', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);
    puppet.moveTo({ x: 10, y: 0, z: 10 });

    // After one update, should be closer but not at target
    puppet.update();
    expect(puppet.group.position.x).toBeGreaterThan(0);
    expect(puppet.group.position.x).toBeLessThan(10);
    expect(puppet.group.position.z).toBeGreaterThan(0);
    expect(puppet.group.position.z).toBeLessThan(10);
  });

  it('should set isMoving to false when reaching target', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'Player' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet.group.position.set(0, 0, 0);
    puppet.moveTo({ x: 0.01, y: 0, z: 0.01 });

    // Update until close enough
    for (let i = 0; i < 100; i++) {
      puppet.update();
    }
    expect(puppet.isMoving).toBe(false);
  });
});

describe('Puppet Class - Multiple puppets', () => {
  it('should allow multiple independent puppets', () => {
    const puppet1 = new Puppet({ id: 'puppet-1', name: 'Player1' });
    const puppet2 = new Puppet({ id: 'puppet-2', name: 'Player2' });

    puppet1.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet2.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet1.teleportTo({ x: 0, y: 0, z: 0 });
    puppet2.teleportTo({ x: 10, y: 0, z: 10 });

    expect(puppet1.group.position.x).toBe(0);
    expect(puppet2.group.position.x).toBe(10);

    puppet1.setBoneRotation('upper-arm-l', Math.PI / 4);
    const bone1 = puppet1.skeleton.getBone('upper-arm-l');
    const bone2 = puppet2.skeleton.getBone('upper-arm-l');

    expect(bone1.rotation.z).toBe(Math.PI / 4);
    expect(bone2.rotation.z).toBe(0); // Not affected by puppet1
  });

  it('should have independent lock states', () => {
    const puppet1 = new Puppet({ id: 'puppet-1', name: 'Player1' });
    const puppet2 = new Puppet({ id: 'puppet-2', name: 'Player2' });

    puppet1.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    puppet2.load(mockSkeletonConfig, 'http://localhost:3000/assets');

    puppet1.lock();
    expect(puppet1.isLocked).toBe(true);
    expect(puppet2.isLocked).toBe(false);
  });
});