/** Unit Tests for Bone Class
 * Tests the hierarchical bone system for puppets
 * Uses mocked Three.js for Node.js test environment
 */

import * as THREE from 'three';
import Bone from '../client/js/puppet/bone.js';

describe('Bone Class - Constructor & Properties', () => {
  it('should create a bone with id and name', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.id).toBe('torso');
    expect(bone.name).toBe('Torso');
  });

  it('should default parentId to null', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.parentId).toBeNull();
  });

  it('should accept a custom parentId', () => {
    const bone = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    expect(bone.parentId).toBe('torso');
  });

  it('should initialize position as Vector3 at origin', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.position.x).toBe(0);
    expect(bone.position.y).toBe(0);
    expect(bone.position.z).toBe(0);
  });

  it('should accept custom position values', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      position: { x: 1, y: 2, z: 3 },
    });
    expect(bone.position.x).toBe(1);
    expect(bone.position.y).toBe(2);
    expect(bone.position.z).toBe(3);
  });

  it('should initialize rotation as Euler at zero', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.rotation.x).toBe(0);
    expect(bone.rotation.y).toBe(0);
    expect(bone.rotation.z).toBe(0);
  });

  it('should accept custom rotation values', () => {
    const bone = new Bone({
      id: 'arm',
      name: 'Arm',
      rotation: { x: 0, y: 0, z: Math.PI / 4 },
    });
    expect(bone.rotation.z).toBe(Math.PI / 4);
  });

  it('should initialize scale as Vector3 with 1,1,1', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.scale.x).toBe(1);
    expect(bone.scale.y).toBe(1);
    expect(bone.scale.z).toBe(1);
  });

  it('should accept custom scale values', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      scale: { x: 0.8, y: 0.8, z: 0.8 },
    });
    expect(bone.scale.x).toBe(0.8);
    expect(bone.scale.y).toBe(0.8);
  });

  it('should default mesh to null', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.mesh).toBeNull();
  });

  it('should default socketOffset to {x:0, y:0}', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.socketOffset.x).toBe(0);
    expect(bone.socketOffset.y).toBe(0);
  });

  it('should accept custom socketOffset', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      socketOffset: { x: 0.5, y: 1.2 },
    });
    expect(bone.socketOffset.x).toBe(0.5);
    expect(bone.socketOffset.y).toBe(1.2);
  });

  it('should default children to empty array', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.children).toEqual([]);
    expect(Array.isArray(bone.children)).toBe(true);
  });

  it('should default asset to null', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.asset).toBeNull();
  });

  it('should accept custom asset name', () => {
    const bone = new Bone({
      id: 'torso',
      name: 'Torso',
      asset: 'torso.png',
    });
    expect(bone.asset).toBe('torso.png');
  });
});

describe('Bone Class - setMesh()', () => {
  it('should assign a mesh to the bone', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    const mockMesh = new THREE.Mesh();
    mockMesh.name = 'torso-mesh';
    bone.setMesh(mockMesh);
    expect(bone.mesh).toBe(mockMesh);
  });

  it('should overwrite existing mesh', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    const mesh1 = new THREE.Mesh();
    const mesh2 = new THREE.Mesh();
    bone.setMesh(mesh1);
    expect(bone.mesh).toBe(mesh1);
    bone.setMesh(mesh2);
    expect(bone.mesh).toBe(mesh2);
  });
});

describe('Bone Class - setParentId()', () => {
  it('should update the parentId', () => {
    const bone = new Bone({ id: 'head', name: 'Head' });
    expect(bone.parentId).toBeNull();
    bone.setParentId('torso');
    expect(bone.parentId).toBe('torso');
  });

  it('should allow setting parentId back to null', () => {
    const bone = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    bone.setParentId(null);
    expect(bone.parentId).toBeNull();
  });
});

describe('Bone Class - addChild()', () => {
  it('should add a child bone', () => {
    const parent = new Bone({ id: 'torso', name: 'Torso' });
    const child = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    parent.addChild(child);
    expect(parent.children).toContain(child);
    expect(parent.children.length).toBe(1);
  });

  it('should support multiple children', () => {
    const parent = new Bone({ id: 'torso', name: 'Torso' });
    const child1 = new Bone({ id: 'head', name: 'Head' });
    const child2 = new Bone({ id: 'arm', name: 'Arm' });
    parent.addChild(child1);
    parent.addChild(child2);
    expect(parent.children.length).toBe(2);
  });
});

describe('Bone Class - removeChild()', () => {
  it('should remove a child bone', () => {
    const parent = new Bone({ id: 'torso', name: 'Torso' });
    const child = new Bone({ id: 'head', name: 'Head' });
    parent.addChild(child);
    parent.removeChild(child);
    expect(parent.children).not.toContain(child);
    expect(parent.children.length).toBe(0);
  });

  it('should not throw if child does not exist', () => {
    const parent = new Bone({ id: 'torso', name: 'Torso' });
    const child = new Bone({ id: 'head', name: 'Head' });
    expect(() => parent.removeChild(child)).not.toThrow();
  });
});

describe('Bone Class - setRotation()', () => {
  it('should rotate around Z axis', () => {
    const bone = new Bone({ id: 'arm', name: 'Arm' });
    bone.setRotation(Math.PI / 2);
    expect(bone.rotation.z).toBe(Math.PI / 2);
  });

  it('should accept negative angles', () => {
    const bone = new Bone({ id: 'arm', name: 'Arm' });
    bone.setRotation(-Math.PI / 4);
    expect(bone.rotation.z).toBe(-Math.PI / 4);
  });

  it('should allow full 360 rotation', () => {
    const bone = new Bone({ id: 'arm', name: 'Arm' });
    bone.setRotation(Math.PI * 2);
    expect(bone.rotation.z).toBe(Math.PI * 2);
  });
});

describe('Bone Class - setPosition()', () => {
  it('should update position from object', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    bone.setPosition({ x: 5, y: 10, z: 15 });
    expect(bone.position.x).toBe(5);
    expect(bone.position.y).toBe(10);
    expect(bone.position.z).toBe(15);
  });

  it('should update position from x, y, z arguments', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    bone.setPosition(1, 2, 3);
    expect(bone.position.x).toBe(1);
    expect(bone.position.y).toBe(2);
    expect(bone.position.z).toBe(3);
  });
});

describe('Bone Class - setScale()', () => {
  it('should update scale from object', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    bone.setScale({ x: 2, y: 2, z: 2 });
    expect(bone.scale.x).toBe(2);
    expect(bone.scale.y).toBe(2);
    expect(bone.scale.z).toBe(2);
  });

  it('should update scale from x, y, z arguments', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    bone.setScale(0.5, 0.5, 0.5);
    expect(bone.scale.x).toBe(0.5);
    expect(bone.scale.y).toBe(0.5);
    expect(bone.scale.z).toBe(0.5);
  });
});

describe('Bone Class - getWorldPosition()', () => {
  it('should return local position when no parent', () => {
    const bone = new Bone({
      id: 'torso',
      name: 'Torso',
      position: { x: 1, y: 2, z: 3 },
    });
    const worldPos = bone.getWorldPosition();
    expect(worldPos.x).toBe(1);
    expect(worldPos.y).toBe(2);
    expect(worldPos.z).toBe(3);
  });

  it('should return a new Vector3 each call', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    const pos1 = bone.getWorldPosition();
    const pos2 = bone.getWorldPosition();
    expect(pos1).not.toBe(pos2);
  });
});

describe('Bone Class - updateWorldTransform()', () => {
  it('should update mesh position if mesh exists', () => {
    const bone = new Bone({
      id: 'torso',
      name: 'Torso',
      position: { x: 5, y: 10, z: 0 },
    });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);
    bone.updateWorldTransform();
    expect(mockMesh.position.x).toBe(5);
    expect(mockMesh.position.y).toBe(10);
    expect(mockMesh.position.z).toBe(0);
  });

  it('should update mesh rotation if mesh exists', () => {
    const bone = new Bone({ id: 'arm', name: 'Arm' });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);
    bone.setRotation(Math.PI / 3);
    bone.updateWorldTransform();
    expect(mockMesh.rotation.z).toBe(Math.PI / 3);
  });

  it('should not throw if mesh is null', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(() => bone.updateWorldTransform()).not.toThrow();
  });
});

describe('Bone Class - toConfig()', () => {
  it('should export bone configuration as plain object', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      parentId: 'torso',
      position: { x: 0, y: 1.2, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.8, y: 0.8, z: 0.8 },
      asset: 'head.png',
      socketOffset: { x: 0, y: 0.5 },
    });
    const config = bone.toConfig();
    expect(config.id).toBe('head');
    expect(config.name).toBe('Head');
    expect(config.parentId).toBe('torso');
    expect(config.asset).toBe('head.png');
    expect(config.position).toEqual({ x: 0, y: 1.2, z: 0 });
    expect(config.rotation).toEqual({ x: 0, y: 0, z: 0 });
    expect(config.scale).toEqual({ x: 0.8, y: 0.8, z: 0.8 });
    expect(config.socketOffset).toEqual({ x: 0, y: 0.5 });
  });

  it('should not include children in config', () => {
    const parent = new Bone({ id: 'torso', name: 'Torso' });
    const child = new Bone({ id: 'head', name: 'Head' });
    parent.addChild(child);
    const config = parent.toConfig();
    expect(config.children).toBeUndefined();
  });
});

describe('Bone Class - Hierarchy Integration', () => {
  it('should support parent-child hierarchy', () => {
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const head = new Bone({ id: 'head', name: 'Head', parentId: 'torso' });
    const arm = new Bone({ id: 'arm', name: 'Arm', parentId: 'torso' });

    torso.addChild(head);
    torso.addChild(arm);

    expect(torso.children.length).toBe(2);
    expect(head.parentId).toBe('torso');
    expect(arm.parentId).toBe('torso');
  });

  it('should support deep hierarchy (3 levels)', () => {
    const torso = new Bone({ id: 'torso', name: 'Torso' });
    const upperArm = new Bone({ id: 'upper-arm', name: 'Upper Arm', parentId: 'torso' });
    const lowerArm = new Bone({ id: 'lower-arm', name: 'Lower Arm', parentId: 'upper-arm' });

    torso.addChild(upperArm);
    upperArm.addChild(lowerArm);

    expect(torso.children.length).toBe(1);
    expect(upperArm.children.length).toBe(1);
    expect(lowerArm.children.length).toBe(0);
  });
});

describe('Bone Class - zDepth', () => {
  it('should default zDepth to 0', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.zDepth).toBe(0);
  });

  it('should accept custom zDepth from config', () => {
    const bone = new Bone({ id: 'head', name: 'Head', zDepth: 3 });
    expect(bone.zDepth).toBe(3);
  });

  it('should accept negative zDepth values', () => {
    const bone = new Bone({ id: 'bg', name: 'Background', zDepth: -2 });
    expect(bone.zDepth).toBe(-2);
  });

  it('should accept large zDepth values', () => {
    const bone = new Bone({ id: 'fg', name: 'Foreground', zDepth: 10 });
    expect(bone.zDepth).toBe(10);
  });

  it('should provide getZDepth method', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso', zDepth: 1 });
    expect(bone.getZDepth()).toBe(1);
  });

  it('should provide setZDepth method', () => {
    const bone = new Bone({ id: 'torso', name: 'Torso' });
    expect(bone.zDepth).toBe(0);
    bone.setZDepth(5);
    expect(bone.zDepth).toBe(5);
  });

  it('should allow setZDepth to change from positive to negative', () => {
    const bone = new Bone({ id: 'bone', name: 'Bone', zDepth: 3 });
    bone.setZDepth(-1);
    expect(bone.zDepth).toBe(-1);
  });

  it('should apply zDepth to mesh Z position in updateWorldTransform', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      position: { x: 0, y: 2, z: 0 },
      zDepth: 1,
    });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);
    bone.updateWorldTransform();
    // mesh z should be position.z + zDepth = 0 + 1 = 1
    expect(mockMesh.position.z).toBe(1);
  });

  it('should apply negative zDepth to mesh Z position', () => {
    const bone = new Bone({
      id: 'bg',
      name: 'Background',
      position: { x: 0, y: 0, z: 0 },
      zDepth: -2,
    });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);
    bone.updateWorldTransform();
    expect(mockMesh.position.z).toBe(-2);
  });

  it('should combine position.z and zDepth in updateWorldTransform', () => {
    const bone = new Bone({
      id: 'bone',
      name: 'Bone',
      position: { x: 1, y: 2, z: 3 },
      zDepth: 4,
    });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);
    bone.updateWorldTransform();
    expect(mockMesh.position.x).toBe(1);
    expect(mockMesh.position.y).toBe(2);
    // z should be position.z + zDepth = 3 + 4 = 7
    expect(mockMesh.position.z).toBe(7);
  });

  it('should update mesh Z when zDepth changes at runtime', () => {
    const bone = new Bone({
      id: 'bone',
      name: 'Bone',
      position: { x: 0, y: 0, z: 0 },
      zDepth: 0,
    });
    const mockMesh = new THREE.Mesh();
    bone.setMesh(mockMesh);

    bone.updateWorldTransform();
    expect(mockMesh.position.z).toBe(0);

    bone.setZDepth(3);
    bone.updateWorldTransform();
    expect(mockMesh.position.z).toBe(3);
  });

  it('should include zDepth in toConfig export', () => {
    const bone = new Bone({
      id: 'head',
      name: 'Head',
      zDepth: 3,
    });
    const config = bone.toConfig();
    expect(config.zDepth).toBe(3);
  });

  it('should default zDepth to 0 in toConfig when not set', () => {
    const bone = new Bone({ id: 'bone', name: 'Bone' });
    const config = bone.toConfig();
    expect(config.zDepth).toBe(0);
  });
});

describe('Bone Class - Edge Cases', () => {
  it('should handle zero values for position', () => {
    const bone = new Bone({ id: 'bone', name: 'Bone', position: { x: 0, y: 0, z: 0 } });
    expect(bone.position.x).toBe(0);
    expect(bone.position.y).toBe(0);
    expect(bone.position.z).toBe(0);
  });

  it('should handle negative scale values', () => {
    const bone = new Bone({ id: 'bone', name: 'Bone', scale: { x: -1, y: 1, z: 1 } });
    expect(bone.scale.x).toBe(-1);
  });

  it('should handle large rotation values', () => {
    const bone = new Bone({ id: 'bone', name: 'Bone' });
    bone.setRotation(100 * Math.PI);
    expect(bone.rotation.z).toBe(100 * Math.PI);
  });

  it('should handle empty config object gracefully', () => {
    const bone = new Bone({});
    expect(bone.id).toBe('');
    expect(bone.name).toBe('');
  });
});