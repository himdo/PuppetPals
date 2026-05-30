/** Unit Tests for MeshLoader Class
 * Tests PNG mesh loading for puppet parts
 * Uses mocked Three.js for Node.js test environment
 */

import * as THREE from 'three';
import MeshLoader from '../client/js/puppet/mesh-loader.js';

describe('MeshLoader Class - Constructor', () => {
  it('should create a MeshLoader instance', () => {
    const loader = new MeshLoader();
    expect(loader).toBeTruthy();
  });

  it('should track loaded meshes', () => {
    const loader = new MeshLoader();
    expect(loader.loadedMeshes).toEqual({});
  });
});

describe('MeshLoader Class - createSpriteMesh()', () => {
  it('should create a sprite mesh from texture and scale', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createSpriteMesh(mockTexture, 1, 2);
    expect(mesh).toBeTruthy();
    expect(mesh.material).toBeTruthy();
    expect(mesh.material.map).toBe(mockTexture);
  });

  it('should apply dimensions to the mesh geometry', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createSpriteMesh(mockTexture, 0.5, 1.5);
    expect(mesh.geometry.width).toBe(0.5);
    expect(mesh.geometry.height).toBe(1.5);
  });

  it('should name the mesh with asset name', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createSpriteMesh(mockTexture, 1, 1, 'head');
    expect(mesh.name).toBe('head');
  });

  it('should use default name when not provided', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createSpriteMesh(mockTexture, 1, 1);
    expect(mesh.name).toBe('');
  });

  it('should create mesh with transparent material support', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createSpriteMesh(mockTexture, 1, 1, 'part');
    expect(mesh.material.transparent).toBe(true);
  });
});

describe('MeshLoader Class - createPlaneMesh()', () => {
  it('should create a plane mesh from texture and dimensions', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createPlaneMesh(mockTexture, 1, 2);
    expect(mesh).toBeTruthy();
    expect(mesh.geometry).toBeTruthy();
    expect(mesh.material).toBeTruthy();
  });

  it('should apply correct geometry dimensions', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createPlaneMesh(mockTexture, 1.5, 2.5);
    expect(mesh.geometry.width).toBe(1.5);
    expect(mesh.geometry.height).toBe(2.5);
  });

  it('should assign texture to material', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createPlaneMesh(mockTexture, 1, 1);
    expect(mesh.material.map).toBe(mockTexture);
  });

  it('should enable transparency on material', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createPlaneMesh(mockTexture, 1, 1);
    expect(mesh.material.transparent).toBe(true);
  });

  it('should name the mesh', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const mesh = loader.createPlaneMesh(mockTexture, 1, 1, 'torso');
    expect(mesh.name).toBe('torso');
  });
});

describe('MeshLoader Class - loadBoneMesh()', () => {
  it('should load a mesh for a bone and cache it', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'torso', scale: { x: 1, y: 2 } };
    
    loader.loadBoneMesh(bone, mockTexture, 'plane');
    expect(bone.mesh).toBeTruthy();
    expect(loader.loadedMeshes['torso']).toBe(bone.mesh);
  });

  it('should create sprite type mesh when specified', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'head', scale: { x: 0.5, y: 0.5 } };
    
    loader.loadBoneMesh(bone, mockTexture, 'sprite');
    expect(bone.mesh).toBeTruthy();
  });

  it('should default to plane mesh type', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'arm', scale: { x: 1, y: 1 } };
    
    loader.loadBoneMesh(bone, mockTexture);
    expect(bone.mesh).toBeTruthy();
    expect(bone.mesh.geometry).toBeTruthy();
  });

  it('should use bone scale for mesh dimensions', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'torso', scale: { x: 2, y: 3 } };
    
    loader.loadBoneMesh(bone, mockTexture, 'plane');
    expect(bone.mesh.geometry.width).toBe(2);
    expect(bone.mesh.geometry.height).toBe(3);
  });

  it('should default bone scale to 1,1 when not provided', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'bone' };
    
    loader.loadBoneMesh(bone, mockTexture, 'plane');
    expect(bone.mesh.geometry.width).toBe(1);
    expect(bone.mesh.geometry.height).toBe(1);
  });

  it('should name mesh after bone id', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    const bone = { id: 'lower-leg-l', scale: { x: 0.5, y: 0.7 } };
    
    loader.loadBoneMesh(bone, mockTexture, 'plane');
    expect(bone.mesh.name).toBe('lower-leg-l');
  });
});

describe('MeshLoader Class - loadSkeletonMeshes()', () => {
  it('should load meshes for all bones in a skeleton', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    
    const skeleton = {
      bones: {
        torso: { id: 'torso', asset: 'torso.png', scale: { x: 1, y: 2 } },
        head: { id: 'head', asset: 'head.png', scale: { x: 0.5, y: 0.5 } },
      },
    };

    const textureMap = {
      'torso.png': mockTexture,
      'head.png': mockTexture,
    };

    loader.loadSkeletonMeshes(skeleton, textureMap);
    expect(skeleton.bones.torso.mesh).toBeTruthy();
    expect(skeleton.bones.head.mesh).toBeTruthy();
  });

  it('should skip bones without asset defined', () => {
    const loader = new MeshLoader();
    
    const skeleton = {
      bones: {
        torso: { id: 'torso', asset: null, scale: { x: 1, y: 1 } },
        head: { id: 'head', asset: 'head.png', scale: { x: 0.5, y: 0.5 } },
      },
    };

    const textureMap = {
      'head.png': { width: 50, height: 50 },
    };

    loader.loadSkeletonMeshes(skeleton, textureMap);
    expect(skeleton.bones.torso.mesh).toBeUndefined();
    expect(skeleton.bones.head.mesh).toBeTruthy();
  });

  it('should skip bones without texture in map', () => {
    const loader = new MeshLoader();
    
    const skeleton = {
      bones: {
        head: { id: 'head', asset: 'missing.png', scale: { x: 1, y: 1 } },
      },
    };

    const textureMap = {};

    loader.loadSkeletonMeshes(skeleton, textureMap);
    expect(skeleton.bones.head.mesh).toBeUndefined();
  });

  it('should handle empty skeleton', () => {
    const loader = new MeshLoader();
    const skeleton = { bones: {} };
    const textureMap = {};
    
    expect(() => loader.loadSkeletonMeshes(skeleton, textureMap)).not.toThrow();
  });
});

describe('MeshLoader Class - createPlaceholderMesh()', () => {
  it('should create a colored placeholder mesh', () => {
    const loader = new MeshLoader();
    const mesh = loader.createPlaceholderMesh(1, 1, 'torso');
    expect(mesh).toBeTruthy();
    expect(mesh.name).toBe('torso');
    expect(mesh.geometry.width).toBe(1);
    expect(mesh.geometry.height).toBe(1);
  });

  it('should apply custom dimensions', () => {
    const loader = new MeshLoader();
    const mesh = loader.createPlaceholderMesh(2, 3, 'arm');
    expect(mesh.geometry.width).toBe(2);
    expect(mesh.geometry.height).toBe(3);
  });

  it('should create mesh without texture', () => {
    const loader = new MeshLoader();
    const mesh = loader.createPlaceholderMesh(1, 1, 'placeholder');
    expect(mesh.material.map).toBeUndefined();
  });
});

describe('MeshLoader Class - disposeMesh()', () => {
  it('should remove a mesh from cache', () => {
    const loader = new MeshLoader();
    loader.loadedMeshes['test'] = { dispose: jest.fn() };
    loader.disposeMesh('test');
    expect(loader.loadedMeshes['test']).toBeUndefined();
  });

  it('should not throw for non-existent mesh', () => {
    const loader = new MeshLoader();
    expect(() => loader.disposeMesh('nonexistent')).not.toThrow();
  });
});

describe('MeshLoader Class - disposeAll()', () => {
  it('should clear all loaded meshes', () => {
    const loader = new MeshLoader();
    loader.loadedMeshes['a'] = {};
    loader.loadedMeshes['b'] = {};
    loader.disposeAll();
    expect(loader.loadedMeshes).toEqual({});
  });
});

describe('MeshLoader Class - Integration', () => {
  it('should support full bone mesh loading workflow', () => {
    const loader = new MeshLoader();
    const mockTexture = { width: 100, height: 200 };
    
    // Load mesh for a bone
    const bone = {
      id: 'torso',
      scale: { x: 1, y: 2 },
    };
    
    loader.loadBoneMesh(bone, mockTexture, 'plane');
    
    // Verify mesh is assigned
    expect(bone.mesh).toBeTruthy();
    expect(bone.mesh.name).toBe('torso');
    expect(bone.mesh.geometry.width).toBe(1);
    expect(bone.mesh.geometry.height).toBe(2);
    
    // Verify cached
    expect(loader.loadedMeshes['torso']).toBe(bone.mesh);
    
    // Verify material properties
    expect(bone.mesh.material.map).toBe(mockTexture);
    expect(bone.mesh.material.transparent).toBe(true);
  });
});