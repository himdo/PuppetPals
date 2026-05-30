/** Unit Tests for Skeleton Class
 * Tests the skeleton hierarchy manager for puppets
 * Uses mocked Three.js for Node.js test environment
 */

import Skeleton from '../client/js/puppet/skeleton.js';
import Bone from '../client/js/puppet/bone.js';

describe('Skeleton Class - Constructor', () => {
  it('should create an empty skeleton', () => {
    const skeleton = new Skeleton();
    expect(skeleton).toBeTruthy();
    expect(skeleton.name).toBe('');
    expect(skeleton.bones).toEqual({});
  });

  it('should create a skeleton with a name', () => {
    const skeleton = new Skeleton({ name: 'Test Puppet' });
    expect(skeleton.name).toBe('Test Puppet');
  });
});

describe('Skeleton Class - addBone()', () => {
  it('should add a bone to the skeleton', () => {
    const skeleton = new Skeleton();
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    skeleton.addBone(bone);
    expect(skeleton.bones['torso']).toBe(bone);
  });

  it('should add multiple bones', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    skeleton.addBone(torso);
    skeleton.addBone(head);
    expect(Object.keys(skeleton.bones).length).toBe(2);
    expect(skeleton.bones['torso']).toBe(torso);
    expect(skeleton.bones['head']).toBe(head);
  });

  it('should build parent-child relationship when adding bone with parentId', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    skeleton.addBone(torso);
    skeleton.addBone(head);
    expect(torso.children).toContain(head);
  });

  it('should not fail if parent bone does not exist yet', () => {
    const skeleton = new Skeleton();
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'nonexistent' });
    expect(() => skeleton.addBone(head)).not.toThrow();
  });

  it('should support delayed parent linking when parent added after child', () => {
    const skeleton = new Skeleton();
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    skeleton.addBone(head);
    expect(skeleton.bones['head']).toBeTruthy();
    // Parent not yet linked
    // Now add parent
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    skeleton.addBone(torso);
    // Parent-child should now be linked
    expect(torso.children).toContain(head);
  });
});

describe('Skeleton Class - removeBone()', () => {
  it('should remove a bone from the skeleton', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    skeleton.addBone(torso);
    skeleton.removeBone('torso');
    expect(skeleton.bones['torso']).toBeUndefined();
  });

  it('should remove child reference from parent when removing bone', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    skeleton.addBone(torso);
    skeleton.addBone(head);
    skeleton.removeBone('head');
    expect(torso.children).not.toContain(head);
  });

  it('should return false when removing non-existent bone', () => {
    const skeleton = new Skeleton();
    const result = skeleton.removeBone('nonexistent');
    expect(result).toBe(false);
  });

  it('should return true when successfully removing bone', () => {
    const skeleton = new Skeleton();
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    skeleton.addBone(bone);
    const result = skeleton.removeBone('torso');
    expect(result).toBe(true);
  });
});

describe('Skeleton Class - getBone()', () => {
  it('should find a bone by id', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    skeleton.addBone(torso);
    const found = skeleton.getBone('torso');
    expect(found).toBe(torso);
  });

  it('should return null for non-existent bone id', () => {
    const skeleton = new Skeleton();
    const found = skeleton.getBone('nonexistent');
    expect(found).toBeNull();
  });
});

describe('Skeleton Class - getRootBones()', () => {
  it('should return bones with no parent', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    skeleton.addBone(torso);
    skeleton.addBone(head);
    const roots = skeleton.getRootBones();
    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('torso');
  });

  it('should return multiple root bones', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const prop = new Bone({ id: 'prop', name: 'Prop' });
    skeleton.addBone(torso);
    skeleton.addBone(prop);
    const roots = skeleton.getRootBones();
    expect(roots.length).toBe(2);
  });

  it('should return empty array when no bones exist', () => {
    const skeleton = new Skeleton();
    const roots = skeleton.getRootBones();
    expect(roots).toEqual([]);
  });
});

describe('Skeleton Class - getBoneCount()', () => {
  it('should return correct bone count', () => {
    const skeleton = new Skeleton();
    expect(skeleton.getBoneCount()).toBe(0);
    skeleton.addBone(new Bone({ id: 'torso', name: 'Torso' }));
    expect(skeleton.getBoneCount()).toBe(1);
    skeleton.addBone(new Bone({ id: 'head', name: 'Head' }));
    expect(skeleton.getBoneCount()).toBe(2);
  });
});

describe('Skeleton Class - update()', () => {
  it('should call updateWorldTransform on all bones', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    const updateSpy = jest.spyOn(Bone.prototype, 'updateWorldTransform');
    skeleton.addBone(torso);
    skeleton.addBone(head);
    skeleton.update();
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });

  it('should update bones in hierarchy order (parents before children)', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    const updateOrder = [];

    const originalUpdate = Bone.prototype.updateWorldTransform;
    torso.updateWorldTransform = () => { updateOrder.push('torso'); };
    head.updateWorldTransform = () => { updateOrder.push('head'); };

    skeleton.addBone(torso);
    skeleton.addBone(head);
    skeleton.update();

    // Parent should be updated before child
    expect(updateOrder.indexOf('torso')).toBeLessThan(updateOrder.indexOf('head'));
  });

  it('should not throw on empty skeleton', () => {
    const skeleton = new Skeleton();
    expect(() => skeleton.update()).not.toThrow();
  });
});

describe('Skeleton Class - loadFromConfig()', () => {
  it('should load skeleton from JSON config', () => {
    const skeleton = new Skeleton();
    const config = {
      name: 'Basic Puppet',
      bones: [
        {
          id: 'torso',
          name: 'Torso',
          parentId: null,
          asset: 'torso.png',
          position: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1 },
        },
        {
          id: 'head',
          name: 'Head',
          parentId: 'torso',
          asset: 'head.png',
          socketOffset: { x: 0, y: 1.2 },
          scale: { x: 0.8, y: 0.8 },
        },
      ],
    };
    skeleton.loadFromConfig(config);
    expect(skeleton.name).toBe('Basic Puppet');
    expect(skeleton.getBoneCount()).toBe(2);
    expect(skeleton.getBone('torso')).toBeTruthy();
    expect(skeleton.getBone('head')).toBeTruthy();
  });

  it('should set bone properties from config', () => {
    const skeleton = new Skeleton();
    const config = {
      name: 'Test Puppet',
      bones: [
        {
          id: 'head',
          name: 'Head',
          parentId: null,
          asset: 'head.png',
          position: { x: 0, y: 2, z: 0 },
          scale: { x: 0.5, y: 0.5 },
          socketOffset: { x: 0.3, y: 1.0 },
        },
      ],
    };
    skeleton.loadFromConfig(config);
    const head = skeleton.getBone('head');
    expect(head.name).toBe('Head');
    expect(head.asset).toBe('head.png');
    expect(head.position.x).toBe(0);
    expect(head.position.y).toBe(2);
    expect(head.position.z).toBe(0);
    expect(head.scale.x).toBe(0.5);
    expect(head.scale.y).toBe(0.5);
    expect(head.socketOffset.x).toBe(0.3);
    expect(head.socketOffset.y).toBe(1.0);
  });

  it('should build parent-child relationships from config', () => {
    const skeleton = new Skeleton();
    const config = {
      name: 'Test Puppet',
      bones: [
        {
          id: 'torso',
          name: 'Torso',
          parentId: null,
          asset: 'torso.png',
        },
        {
          id: 'head',
          name: 'Head',
          parentId: 'torso',
          asset: 'head.png',
        },
        {
          id: 'upper-arm-l',
          name: 'Upper Arm Left',
          parentId: 'torso',
          asset: 'upper-arm-l.png',
        },
        {
          id: 'lower-arm-l',
          name: 'Lower Arm Left',
          parentId: 'upper-arm-l',
          asset: 'lower-arm-l.png',
        },
      ],
    };
    skeleton.loadFromConfig(config);
    const torso = skeleton.getBone('torso');
    const head = skeleton.getBone('head');
    const upperArm = skeleton.getBone('upper-arm-l');
    expect(torso.children.length).toBe(2);
    expect(torso.children).toContain(head);
    expect(torso.children).toContain(upperArm);
    expect(upperArm.children.length).toBe(1);
  });

  it('should clear existing bones before loading new config', () => {
    const skeleton = new Skeleton();
    skeleton.addBone(new Bone({ id: 'old', name: 'Old' }));
    expect(skeleton.getBoneCount()).toBe(1);

    skeleton.loadFromConfig({
      name: 'New Puppet',
      bones: [
        { id: 'new', name: 'New', parentId: null },
      ],
    });

    expect(skeleton.getBone('old')).toBeNull();
    expect(skeleton.getBone('new')).toBeTruthy();
    expect(skeleton.getBoneCount()).toBe(1);
  });

  it('should handle empty bones array', () => {
    const skeleton = new Skeleton();
    skeleton.addBone(new Bone({ id: 'existing', name: 'Existing' }));
    skeleton.loadFromConfig({ name: 'Empty', bones: [] });
    expect(skeleton.getBoneCount()).toBe(0);
    expect(skeleton.name).toBe('Empty');
  });

  it('should handle missing bones array gracefully', () => {
    const skeleton = new Skeleton();
    expect(() => skeleton.loadFromConfig({ name: 'NoBones' })).not.toThrow();
  });

  it('should use default scale {1,1} when not in config', () => {
    const skeleton = new Skeleton();
    skeleton.loadFromConfig({
      name: 'Test',
      bones: [
        { id: 'bone', name: 'Bone', parentId: null },
      ],
    });
    const bone = skeleton.getBone('bone');
    expect(bone.scale.x).toBe(1);
    expect(bone.scale.y).toBe(1);
  });

  it('should handle 2D scale in config by applying to x and y', () => {
    const skeleton = new Skeleton();
    skeleton.loadFromConfig({
      name: 'Test',
      bones: [
        { id: 'bone', name: 'Bone', parentId: null, scale: { x: 0.5, y: 0.75 } },
      ],
    });
    const bone = skeleton.getBone('bone');
    expect(bone.scale.x).toBe(0.5);
    expect(bone.scale.y).toBe(0.75);
  });
});

describe('Skeleton Class - toConfig()', () => {
  it('should export skeleton configuration as plain object', () => {
    const skeleton = new Skeleton({ name: 'Export Test' });
    const torso = new Bone({
      id: 'torso',
      name: 'Torso',
      parentId: null,
      asset: 'torso.png',
      position: { x: 0, y: 0, z: 0 },
    });
    const head = new Bone({
      id: 'head',
      name: 'Head',
      parentId: 'torso',
      asset: 'head.png',
    });
    skeleton.addBone(torso);
    skeleton.addBone(head);

    const config = skeleton.toConfig();
    expect(config.name).toBe('Export Test');
    expect(config.bones.length).toBe(2);
    expect(config.bones[0].id).toBe('torso');
    expect(config.bones[1].id).toBe('head');
  });

  it('should return empty bones array for empty skeleton', () => {
    const skeleton = new Skeleton({ name: 'Empty' });
    const config = skeleton.toConfig();
    expect(config.name).toBe('Empty');
    expect(config.bones).toEqual([]);
  });
});

describe('Skeleton Class - hasBone()', () => {
  it('should return true for existing bone', () => {
    const skeleton = new Skeleton();
    skeleton.addBone(new Bone({ id: 'torso', name: 'Torso' }));
    expect(skeleton.hasBone('torso')).toBe(true);
  });

  it('should return false for non-existent bone', () => {
    const skeleton = new Skeleton();
    expect(skeleton.hasBone('nonexistent')).toBe(false);
  });
});

describe('Skeleton Class - getDescendants()', () => {
  it('should return all descendant bones of a bone', () => {
    const skeleton = new Skeleton();
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const upperArm = new Bone({ id: 'upper-arm', name: 'Upper Arm', parentId: 'torso' });
    const lowerArm = new Bone({ id: 'lower-arm', name: 'Lower Arm', parentId: 'upper-arm' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });

    skeleton.addBone(torso);
    skeleton.addBone(upperArm);
    skeleton.addBone(lowerArm);
    skeleton.addBone(head);

    const descendants = skeleton.getDescendants('torso');
    expect(descendants.length).toBe(3);
    const ids = descendants.map(d => d.id);
    expect(ids).toContain('upper-arm');
    expect(ids).toContain('lower-arm');
    expect(ids).toContain('head');
  });

  it('should return empty array for bone with no children', () => {
    const skeleton = new Skeleton();
    skeleton.addBone(new Bone({ id: 'leaf', name: 'Leaf' }));
    const descendants = skeleton.getDescendants('leaf');
    expect(descendants).toEqual([]);
  });

  it('should return empty array for non-existent bone', () => {
    const skeleton = new Skeleton();
    const descendants = skeleton.getDescendants('nonexistent');
    expect(descendants).toEqual([]);
  });
});

describe('Skeleton Class - Full Puppet Load Scenario', () => {
  it('should load a complete puppet skeleton configuration', () => {
    const skeleton = new Skeleton();
    const config = {
      name: 'Basic Puppet',
      bones: [
        {
          id: 'torso',
          name: 'Torso',
          parentId: null,
          asset: 'torso.png',
          position: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1 },
        },
        {
          id: 'head',
          name: 'Head',
          parentId: 'torso',
          asset: 'head.png',
          socketOffset: { x: 0, y: 1.2 },
          scale: { x: 0.8, y: 0.8 },
        },
        {
          id: 'upper-arm-l',
          name: 'Upper Arm Left',
          parentId: 'torso',
          asset: 'upper-arm-l.png',
          socketOffset: { x: -0.6, y: 0.8 },
          scale: { x: 0.4, y: 0.6 },
        },
        {
          id: 'lower-arm-l',
          name: 'Lower Arm Left',
          parentId: 'upper-arm-l',
          asset: 'lower-arm-l.png',
          socketOffset: { x: 0, y: -0.7 },
          scale: { x: 0.4, y: 0.6 },
        },
        {
          id: 'upper-arm-r',
          name: 'Upper Arm Right',
          parentId: 'torso',
          asset: 'upper-arm-r.png',
          socketOffset: { x: 0.6, y: 0.8 },
          scale: { x: 0.4, y: 0.6 },
        },
        {
          id: 'lower-arm-r',
          name: 'Lower Arm Right',
          parentId: 'upper-arm-r',
          asset: 'lower-arm-r.png',
          socketOffset: { x: 0, y: -0.7 },
          scale: { x: 0.4, y: 0.6 },
        },
        {
          id: 'upper-leg-l',
          name: 'Upper Leg Left',
          parentId: 'torso',
          asset: 'upper-leg-l.png',
          socketOffset: { x: -0.3, y: -1.0 },
          scale: { x: 0.4, y: 0.7 },
        },
        {
          id: 'lower-leg-l',
          name: 'Lower Leg Left',
          parentId: 'upper-leg-l',
          asset: 'lower-leg-l.png',
          socketOffset: { x: 0, y: -0.8 },
          scale: { x: 0.4, y: 0.7 },
        },
        {
          id: 'upper-leg-r',
          name: 'Upper Leg Right',
          parentId: 'torso',
          asset: 'upper-leg-r.png',
          socketOffset: { x: 0.3, y: -1.0 },
          scale: { x: 0.4, y: 0.7 },
        },
        {
          id: 'lower-leg-r',
          name: 'Lower Leg Right',
          parentId: 'upper-leg-r',
          asset: 'lower-leg-r.png',
          socketOffset: { x: 0, y: -0.8 },
          scale: { x: 0.4, y: 0.7 },
        },
      ],
    };

    skeleton.loadFromConfig(config);

    // Verify all bones loaded
    expect(skeleton.getBoneCount()).toBe(10);
    expect(skeleton.name).toBe('Basic Puppet');

    // Verify root bone
    const roots = skeleton.getRootBones();
    expect(roots.length).toBe(1);
    expect(roots[0].id).toBe('torso');

    // Verify torso has correct children
    const torso = skeleton.getBone('torso');
    expect(torso.children.length).toBe(5); // head, upper-arm-l, upper-arm-r, upper-leg-l, upper-leg-r

    // Verify deep hierarchy
    const upperArmL = skeleton.getBone('upper-arm-l');
    expect(upperArmL.children.length).toBe(1);
    expect(upperArmL.children[0].id).toBe('lower-arm-l');

    // Verify socket offsets
    const head = skeleton.getBone('head');
    expect(head.socketOffset.y).toBe(1.2);
    expect(upperArmL.socketOffset.x).toBe(-0.6);

    // Verify update works
    expect(() => skeleton.update()).not.toThrow();
  });
});