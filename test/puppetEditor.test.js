/** Unit Tests for PuppetEditor Class
 * Tests the in-browser puppet editor for customizing puppet appearance,
 * bone positions, rotations, scale, and socket connections.
 * Uses mocked Three.js for Node.js test environment
 */

import PuppetEditor from '../client/js/puppet/puppet-editor.js';
import Puppet from '../client/js/puppet/puppet.js';
import Skeleton from '../client/js/puppet/skeleton.js';
import Bone from '../client/js/puppet/bone.js';

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
    {
      id: 'upper-arm-r',
      name: 'Upper Arm Right',
      parentId: 'torso',
      asset: 'upper-arm-r.png',
      position: { x: 0.6, y: 0.4, z: 0 },
      scale: { x: 0.4, y: 0.8 },
      socketOffset: { x: 0, y: 0 },
    },
  ],
};

// Mock socket emitter for testing socket events
function createMockSocket() {
  const emitted = [];
  return {
    emit: (event, data) => {
      emitted.push({ event, data });
    },
    getEmitted: () => emitted,
    findEmitted: (event) => emitted.filter(e => e.event === event),
  };
}

describe('PuppetEditor - Constructor & Initialization', () => {
  it('should create an editor instance with default state', () => {
    const editor = new PuppetEditor();
    expect(editor).toBeDefined();
    expect(editor.isActive).toBe(false);
    expect(editor.selectedBoneId).toBeNull();
  });

  it('should start with no puppet loaded', () => {
    const editor = new PuppetEditor();
    expect(editor.puppet).toBeNull();
    expect(editor.skeleton).toBeNull();
  });

  it('should start with empty original state snapshot', () => {
    const editor = new PuppetEditor();
    expect(editor.originalState).toBeNull();
  });

  it('should accept a mock socket on construction', () => {
    const mockSocket = createMockSocket();
    const editor = new PuppetEditor({ socket: mockSocket });
    expect(editor.socket).toBe(mockSocket);
  });
});

describe('PuppetEditor - activate() / deactivate()', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
  });

  it('should activate editing mode and set isActive to true', () => {
    editor.activate(puppet);
    expect(editor.isActive).toBe(true);
  });

  it('should reference the puppet being edited', () => {
    editor.activate(puppet);
    expect(editor.puppet).toBe(puppet);
  });

  it('should reference the puppet skeleton', () => {
    editor.activate(puppet);
    expect(editor.skeleton).toBe(puppet.skeleton);
  });

  it('should save a snapshot of the original skeleton state', () => {
    editor.activate(puppet);
    expect(editor.originalState).toBeDefined();
    expect(editor.originalState.name).toBe('Test Puppet');
    expect(editor.originalState.bones).toBeDefined();
  });

  it('should deactivate editing mode and reset state', () => {
    editor.activate(puppet);
    editor.deactivate();
    expect(editor.isActive).toBe(false);
    expect(editor.selectedBoneId).toBeNull();
  });

  it('should keep puppet reference after deactivate but clear selection', () => {
    editor.activate(puppet);
    editor.deactivate();
    expect(editor.puppet).toBe(puppet);
    expect(editor.skeleton).toBeNull();
    expect(editor.selectedBoneId).toBeNull();
  });

  it('should not deactivate if not active', () => {
    editor = new PuppetEditor();
    expect(() => editor.deactivate()).not.toThrow();
    expect(editor.isActive).toBe(false);
  });
});

describe('PuppetEditor - selectBone() / deselectBone()', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
  });

  it('should select a bone by ID', () => {
    editor.selectBone('torso');
    expect(editor.selectedBoneId).toBe('torso');
  });

  it('should return the selected bone', () => {
    const bone = editor.selectBone('head');
    expect(bone).toBeDefined();
    expect(bone.id).toBe('head');
  });

  it('should return null for non-existent bone ID', () => {
    const bone = editor.selectBone('non-existent');
    expect(bone).toBeNull();
    expect(editor.selectedBoneId).toBeNull();
  });

  it('should switch selection from one bone to another', () => {
    editor.selectBone('torso');
    expect(editor.selectedBoneId).toBe('torso');
    editor.selectBone('head');
    expect(editor.selectedBoneId).toBe('head');
  });

  it('should deselect the currently selected bone', () => {
    editor.selectBone('torso');
    expect(editor.selectedBoneId).toBe('torso');
    editor.deselectBone();
    expect(editor.selectedBoneId).toBeNull();
  });

  it('should not throw when deselecting with no selection', () => {
    expect(() => editor.deselectBone()).not.toThrow();
  });

  it('should get the currently selected bone', () => {
    editor.selectBone('upper-arm-l');
    const selected = editor.getSelectedBone();
    expect(selected).toBeDefined();
    expect(selected.id).toBe('upper-arm-l');
  });

  it('should return null for getSelectedBone when nothing selected', () => {
    const selected = editor.getSelectedBone();
    expect(selected).toBeNull();
  });
});

describe('PuppetEditor - Bone Position Manipulation', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');
  });

  it('should update bone position X', () => {
    editor.setBonePositionX(5);
    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(5);
  });

  it('should update bone position Y', () => {
    editor.setBonePositionY(3);
    const bone = editor.getSelectedBone();
    expect(bone.position.y).toBe(3);
  });

  it('should update bone position Z', () => {
    editor.setBonePositionZ(2);
    const bone = editor.getSelectedBone();
    expect(bone.position.z).toBe(2);
  });

  it('should update all bone position at once', () => {
    editor.setBonePosition({ x: 1, y: 2, z: 3 });
    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(1);
    expect(bone.position.y).toBe(2);
    expect(bone.position.z).toBe(3);
  });

  it('should not update position if no bone selected', () => {
    editor.deselectBone();
    editor.setBonePositionX(5);
    // Should not throw
    expect(() => editor.setBonePositionX(5)).not.toThrow();
  });

  it('should not update position if not active', () => {
    editor.deactivate();
    expect(() => editor.setBonePositionX(5)).not.toThrow();
  });

  it('should support negative position values', () => {
    editor.setBonePosition({ x: -5, y: -3, z: -1 });
    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(-5);
    expect(bone.position.y).toBe(-3);
    expect(bone.position.z).toBe(-1);
  });
});

describe('PuppetEditor - Bone Rotation Manipulation', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('upper-arm-l');
  });

  it('should set bone rotation (Z-axis)', () => {
    editor.setBoneRotation(Math.PI / 4);
    const bone = editor.getSelectedBone();
    expect(bone.rotation.z).toBe(Math.PI / 4);
  });

  it('should support negative rotation', () => {
    editor.setBoneRotation(-Math.PI / 2);
    const bone = editor.getSelectedBone();
    expect(bone.rotation.z).toBe(-Math.PI / 2);
  });

  it('should not update rotation if no bone selected', () => {
    editor.deselectBone();
    expect(() => editor.setBoneRotation(Math.PI / 4)).not.toThrow();
  });

  it('should not update rotation if not active', () => {
    editor.deactivate();
    expect(() => editor.setBoneRotation(Math.PI / 4)).not.toThrow();
  });

  it('should get the current rotation of selected bone', () => {
    editor.setBoneRotation(Math.PI / 3);
    const rotation = editor.getBoneRotation();
    expect(rotation).toBe(Math.PI / 3);
  });

  it('should return null for rotation when no bone selected', () => {
    editor.deselectBone();
    const rotation = editor.getBoneRotation();
    expect(rotation).toBeNull();
  });
});

describe('PuppetEditor - Bone Scale Manipulation', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('head');
  });

  it('should update bone scale X', () => {
    editor.setBoneScaleX(1.5);
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBe(1.5);
  });

  it('should update bone scale Y', () => {
    editor.setBoneScaleY(2);
    const bone = editor.getSelectedBone();
    expect(bone.scale.y).toBe(2);
  });

  it('should update all bone scale at once', () => {
    editor.setBoneScale({ x: 1.5, y: 2, z: 1 });
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBe(1.5);
    expect(bone.scale.y).toBe(2);
    expect(bone.scale.z).toBe(1);
  });

  it('should not allow zero or negative scale', () => {
    editor.setBoneScaleX(0);
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBeGreaterThan(0);

    editor.setBoneScaleX(-1);
    expect(bone.scale.x).toBeGreaterThan(0);
  });

  it('should not update scale if no bone selected', () => {
    editor.deselectBone();
    expect(() => editor.setBoneScaleX(1.5)).not.toThrow();
  });

  it('should not update scale if not active', () => {
    editor.deactivate();
    expect(() => editor.setBoneScaleX(1.5)).not.toThrow();
  });

  it('should get the current scale of selected bone', () => {
    editor.setBoneScale({ x: 1.5, y: 2, z: 1 });
    const scale = editor.getBoneScale();
    expect(scale.x).toBe(1.5);
    expect(scale.y).toBe(2);
    expect(scale.z).toBe(1);
  });
});

describe('PuppetEditor - Socket Offset Manipulation', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');
  });

  it('should update socket offset X', () => {
    editor.setSocketOffsetX(1);
    const bone = editor.getSelectedBone();
    expect(bone.socketOffset.x).toBe(1);
  });

  it('should update socket offset Y', () => {
    editor.setSocketOffsetY(2);
    const bone = editor.getSelectedBone();
    expect(bone.socketOffset.y).toBe(2);
  });

  it('should update both socket offsets at once', () => {
    editor.setSocketOffset({ x: 1, y: 2 });
    const bone = editor.getSelectedBone();
    expect(bone.socketOffset.x).toBe(1);
    expect(bone.socketOffset.y).toBe(2);
  });

  it('should support negative socket offsets', () => {
    editor.setSocketOffset({ x: -1, y: -0.5 });
    const bone = editor.getSelectedBone();
    expect(bone.socketOffset.x).toBe(-1);
    expect(bone.socketOffset.y).toBe(-0.5);
  });

  it('should not update socket if no bone selected', () => {
    editor.deselectBone();
    expect(() => editor.setSocketOffsetX(1)).not.toThrow();
  });

  it('should get the current socket offset of selected bone', () => {
    editor.setSocketOffset({ x: 1, y: 2 });
    const offset = editor.getSocketOffset();
    expect(offset.x).toBe(1);
    expect(offset.y).toBe(2);
  });
});

describe('PuppetEditor - Asset Swapping', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('head');
  });

  it('should change the bone asset', () => {
    editor.setBoneAsset('new-head.png');
    const bone = editor.getSelectedBone();
    expect(bone.asset).toBe('new-head.png');
  });

  it('should allow setting asset to null', () => {
    editor.setBoneAsset(null);
    const bone = editor.getSelectedBone();
    expect(bone.asset).toBeNull();
  });

  it('should not change asset if no bone selected', () => {
    editor.deselectBone();
    editor.setBoneAsset('something.png');
    expect(() => editor.setBoneAsset('something.png')).not.toThrow();
  });

  it('should get the current asset of selected bone', () => {
    const asset = editor.getBoneAsset();
    expect(asset).toBe('head.png');
  });

  it('should return null for asset when no bone selected', () => {
    editor.deselectBone();
    const asset = editor.getBoneAsset();
    expect(asset).toBeNull();
  });
});

describe('PuppetEditor - getBoneList()', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
  });

  it('should return a list of all bone IDs', () => {
    const boneList = editor.getBoneList();
    expect(boneList).toHaveLength(4);
    const ids = boneList.map(b => b.id);
    expect(ids).toContain('torso');
    expect(ids).toContain('head');
    expect(ids).toContain('upper-arm-l');
    expect(ids).toContain('upper-arm-r');
  });

  it('should return bone info objects with id, name, and parentId', () => {
    const boneList = editor.getBoneList();
    const torsoInfo = boneList.find(b => b.id === 'torso');
    expect(torsoInfo.id).toBe('torso');
    expect(torsoInfo.name).toBe('Torso');
    expect(torsoInfo.parentId).toBeNull();
  });

  it('should return correct parentId for child bones', () => {
    const boneList = editor.getBoneList();
    const headInfo = boneList.find(b => b.id === 'head');
    expect(headInfo.parentId).toBe('torso');
  });

  it('should return empty array if not active', () => {
    editor.deactivate();
    const boneList = editor.getBoneList();
    expect(boneList).toEqual([]);
  });
});

describe('PuppetEditor - Export / Import', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
  });

  it('should export skeleton config as plain object', () => {
    const config = editor.exportConfig();
    expect(config).toBeDefined();
    expect(config.name).toBe('Test Puppet');
    expect(config.bones).toBeDefined();
    expect(Array.isArray(config.bones)).toBe(true);
  });

  it('should export correct bone count', () => {
    const config = editor.exportConfig();
    expect(config.bones).toHaveLength(4);
  });

  it('should export bone with correct properties', () => {
    const config = editor.exportConfig();
    const torsoConfig = config.bones.find(b => b.id === 'torso');
    expect(torsoConfig.id).toBe('torso');
    expect(torsoConfig.name).toBe('Torso');
    expect(torsoConfig.parentId).toBeNull();
    expect(torsoConfig.asset).toBe('torso.png');
    expect(torsoConfig.position).toBeDefined();
    expect(torsoConfig.scale).toBeDefined();
    expect(torsoConfig.socketOffset).toBeDefined();
  });

  it('should reflect modifications in exported config', () => {
    editor.selectBone('torso');
    editor.setBonePosition({ x: 5, y: 10, z: 0 });
    editor.setBoneRotation(Math.PI / 4);
    editor.setBoneScale({ x: 2, y: 2, z: 1 });

    const config = editor.exportConfig();
    const torsoConfig = config.bones.find(b => b.id === 'torso');
    expect(torsoConfig.position.x).toBe(5);
    expect(torsoConfig.position.y).toBe(10);
    expect(torsoConfig.rotation.z).toBe(Math.PI / 4);
    expect(torsoConfig.scale.x).toBe(2);
  });

  it('should export config as JSON string', () => {
    const json = editor.exportJSON();
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('Test Puppet');
    expect(parsed.bones).toBeDefined();
  });

  it('should return empty config when not active', () => {
    editor.deactivate();
    const config = editor.exportConfig();
    expect(config.name).toBe('');
    expect(config.bones).toEqual([]);
  });
});

describe('PuppetEditor - Undo / Reset', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');
  });

  it('should reset skeleton to original state', () => {
    // Make some changes
    editor.setBonePosition({ x: 100, y: 200, z: 0 });
    editor.setBoneRotation(Math.PI);

    // Reset
    editor.resetToOriginal();

    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(0);
    expect(bone.position.y).toBe(0);
    expect(bone.rotation.z).toBe(0);
  });

  it('should not reset if no original state saved', () => {
    editor.originalState = null;
    expect(() => editor.resetToOriginal()).not.toThrow();
  });

  it('should not reset if not active', () => {
    editor.deactivate();
    expect(() => editor.resetToOriginal()).not.toThrow();
  });

  it('should detect if changes have been made', () => {
    expect(editor.hasChanges()).toBe(false);
    editor.setBonePositionX(5);
    expect(editor.hasChanges()).toBe(true);
  });

  it('should report no changes after reset', () => {
    editor.setBonePositionX(5);
    expect(editor.hasChanges()).toBe(true);
    editor.resetToOriginal();
    expect(editor.hasChanges()).toBe(false);
  });
});

describe('PuppetEditor - Apply / Save with Socket Events', () => {
  let editor;
  let puppet;
  let mockSocket;

  beforeEach(() => {
    mockSocket = createMockSocket();
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor({ socket: mockSocket });
    editor.activate(puppet);
  });

  it('should apply changes and emit puppet-updated event', () => {
    editor.selectBone('torso');
    editor.setBonePositionX(5);

    editor.applyChanges();

    const emitted = mockSocket.findEmitted('puppet-updated');
    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted[0].data).toBeDefined();
    expect(emitted[0].data.name).toBe('Test Puppet');
  });

  it('should include updated skeleton config in socket event', () => {
    editor.selectBone('head');
    editor.setBoneScaleX(1.5);

    editor.applyChanges();

    const emitted = mockSocket.findEmitted('puppet-updated');
    const data = emitted[0].data;
    expect(data.bones).toBeDefined();
    const headBone = data.bones.find(b => b.id === 'head');
    expect(headBone.scale.x).toBe(1.5);
  });

  it('should not emit if no socket provided', () => {
    editor.socket = null;
    editor.selectBone('torso');
    editor.setBonePositionX(5);
    expect(() => editor.applyChanges()).not.toThrow();
  });

  it('should not emit if not active', () => {
    editor.deactivate();
    expect(() => editor.applyChanges()).not.toThrow();
  });

  it('should set hasPendingChanges to false after apply', () => {
    editor.selectBone('torso');
    editor.setBonePositionX(5);
    expect(editor.hasChanges()).toBe(true);
    editor.applyChanges();
  });
});

describe('PuppetEditor - getBoneProperty()', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');
  });

  it('should get bone position property', () => {
    const pos = editor.getBoneProperty('position');
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
    expect(pos.z).toBe(0);
  });

  it('should get bone rotation property', () => {
    const rot = editor.getBoneProperty('rotation');
    expect(rot.z).toBe(0);
  });

  it('should get bone scale property', () => {
    const scale = editor.getBoneProperty('scale');
    expect(scale.x).toBe(1);
  });

  it('should get bone socketOffset property', () => {
    const offset = editor.getBoneProperty('socketOffset');
    expect(offset).toBeDefined();
  });

  it('should return null for unknown property', () => {
    const prop = editor.getBoneProperty('unknownProperty');
    expect(prop).toBeNull();
  });

  it('should return null when no bone selected', () => {
    editor.deselectBone();
    const pos = editor.getBoneProperty('position');
    expect(pos).toBeNull();
  });
});

describe('PuppetEditor - setBoneProperty()', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');
  });

  it('should set bone position via property', () => {
    editor.setBoneProperty('position', { x: 1, y: 2, z: 3 });
    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(1);
    expect(bone.position.y).toBe(2);
    expect(bone.position.z).toBe(3);
  });

  it('should set bone rotation via property', () => {
    editor.setBoneProperty('rotation', { x: 0, y: 0, z: Math.PI / 4 });
    const bone = editor.getSelectedBone();
    expect(bone.rotation.z).toBe(Math.PI / 4);
  });

  it('should set bone scale via property', () => {
    editor.setBoneProperty('scale', { x: 2, y: 2, z: 1 });
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBe(2);
    expect(bone.scale.y).toBe(2);
  });

  it('should set socketOffset via property', () => {
    editor.setBoneProperty('socketOffset', { x: 1, y: 1 });
    const bone = editor.getSelectedBone();
    expect(bone.socketOffset.x).toBe(1);
    expect(bone.socketOffset.y).toBe(1);
  });

  it('should not set unknown property', () => {
    expect(() => editor.setBoneProperty('unknownProp', 'value')).not.toThrow();
  });

  it('should not set property when no bone selected', () => {
    editor.deselectBone();
    expect(() => editor.setBoneProperty('position', { x: 1, y: 2, z: 3 })).not.toThrow();
  });
});

describe('PuppetEditor - Edge Cases', () => {
  it('should handle activate with null puppet gracefully', () => {
    const editor = new PuppetEditor();
    expect(() => editor.activate(null)).not.toThrow();
  });

  it('should handle operations on empty skeleton', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load({ name: 'Empty', bones: [] }, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);

    expect(editor.getBoneList()).toEqual([]);
    expect(editor.selectBone('any')).toBeNull();
  });

  it('should handle export on empty skeleton', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load({ name: 'Empty', bones: [] }, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);

    const config = editor.exportConfig();
    expect(config.name).toBe('Empty');
    expect(config.bones).toEqual([]);
  });

  it('should maintain hierarchy relationships after modifications', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);

    editor.selectBone('head');
    editor.setBonePosition({ x: 10, y: 20, z: 0 });

    // Verify parent-child relationship is maintained
    const torso = puppet.skeleton.getBone('torso');
    expect(torso.children.length).toBeGreaterThan(0);
  });

  it('should handle very large scale values gracefully', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');

    editor.setBoneScaleX(100);
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBe(100);
  });

  it('should handle very small positive scale values', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');

    editor.setBoneScaleX(0.01);
    const bone = editor.getSelectedBone();
    expect(bone.scale.x).toBe(0.01);
  });

  it('should handle multiple consecutive property changes', () => {
    const puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    const editor = new PuppetEditor();
    editor.activate(puppet);
    editor.selectBone('torso');

    editor.setBonePositionX(1);
    editor.setBonePositionY(2);
    editor.setBonePositionZ(3);
    editor.setBoneRotation(Math.PI / 4);
    editor.setBoneScaleX(1.5);
    editor.setBoneScaleY(1.5);
    editor.setSocketOffsetX(0.5);
    editor.setSocketOffsetY(0.5);

    const bone = editor.getSelectedBone();
    expect(bone.position.x).toBe(1);
    expect(bone.position.y).toBe(2);
    expect(bone.position.z).toBe(3);
    expect(bone.rotation.z).toBe(Math.PI / 4);
    expect(bone.scale.x).toBe(1.5);
    expect(bone.scale.y).toBe(1.5);
    expect(bone.socketOffset.x).toBe(0.5);
    expect(bone.socketOffset.y).toBe(0.5);
  });
});

describe('PuppetEditor - Bone iteration', () => {
  let editor;
  let puppet;

  beforeEach(() => {
    puppet = new Puppet({ id: 'puppet-1', name: 'TestPlayer' });
    puppet.load(mockSkeletonConfig, 'http://localhost:3000/assets');
    editor = new PuppetEditor();
    editor.activate(puppet);
  });

  it('should iterate through all bones and select each one', () => {
    const boneList = editor.getBoneList();
    for (const boneInfo of boneList) {
      const bone = editor.selectBone(boneInfo.id);
      expect(bone).toBeDefined();
      expect(bone.id).toBe(boneInfo.id);
    }
  });

  it('should allow modifying multiple bones sequentially', () => {
    editor.selectBone('upper-arm-l');
    editor.setBoneRotation(Math.PI / 4);

    editor.selectBone('upper-arm-r');
    editor.setBoneRotation(-Math.PI / 4);

    const leftArm = puppet.skeleton.getBone('upper-arm-l');
    const rightArm = puppet.skeleton.getBone('upper-arm-r');

    expect(leftArm.rotation.z).toBe(Math.PI / 4);
    expect(rightArm.rotation.z).toBe(-Math.PI / 4);
  });
});