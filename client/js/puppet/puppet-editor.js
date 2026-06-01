/** PuppetEditor - In-browser visual editor for puppet customization
 * Allows editing bone positions, rotations, scale, socket offsets,
 * and asset assignment. Supports undo/reset and JSON export.
 * Extended with Z-depth control for 2D layering (Request 17).
 */

import Skeleton from './skeleton.js';
import Bone from './bone.js';

class PuppetEditor {
  /**
   * Create a puppet editor instance
   * @param {Object} options - Editor options
   * @param {Object} options.socket - Optional socket instance for sending updates
   */
  constructor(options = {}) {
    // Socket for emitting changes to server
    this.socket = options.socket || null;

    // Editing state
    this.isActive = false;
    this.puppet = null;
    this.skeleton = null;
    this.selectedBoneId = null;

    // Original state snapshot for undo/reset
    this.originalState = null;

    // Selection order for manual Z-depth reordering
    this.selectionOrder = [];

    // Z-depth range constants
    this.Z_DEPTH_MIN = -10;
    this.Z_DEPTH_MAX = 10;
  }

  /**
   * Activate editing mode for a puppet
   * Saves a snapshot of the current skeleton state for undo
   * @param {import('./puppet.js').Puppet|null} puppet - The puppet to edit
   */
  activate(puppet) {
    if (!puppet || !puppet.skeleton) {
      this.isActive = false;
      this.puppet = puppet || null;
      this.skeleton = null;
      this.selectedBoneId = null;
      this.originalState = null;
      return;
    }

    this.puppet = puppet;
    this.skeleton = puppet.skeleton;
    this.isActive = true;
    this.selectedBoneId = null;

    // Save a deep snapshot of the original skeleton config for reset
    this.originalState = this._deepCloneConfig(this.skeleton.toConfig());
  }

  /**
   * Deactivate editing mode
   * Clears selection but keeps puppet reference
   */
  deactivate() {
    if (!this.isActive) return;

    this.isActive = false;
    this.selectedBoneId = null;
    this.skeleton = null;
    // Keep puppet reference for potential re-activation
  }

  /**
   * Select a bone by ID for editing
   * @param {string} boneId - The bone ID to select
   * @returns {Bone|null} The selected bone, or null if not found
   */
  selectBone(boneId) {
    if (!this.isActive || !this.skeleton) return null;

    const bone = this.skeleton.getBone(boneId);
    if (!bone) {
      this.selectedBoneId = null;
      return null;
    }

    this.selectedBoneId = boneId;
    return bone;
  }

  /**
   * Deselect the currently selected bone
   */
  deselectBone() {
    this.selectedBoneId = null;
  }

  /**
   * Get the currently selected bone
   * @returns {Bone|null} The selected bone, or null
   */
  getSelectedBone() {
    if (!this.selectedBoneId || !this.skeleton) return null;
    return this.skeleton.getBone(this.selectedBoneId);
  }

  // =====================
  // Helper: Resolve bone from optional boneId or selection
  // =====================

  /**
   * Get bone by ID, or fall back to currently selected bone
   * @param {string} [boneId] - Optional bone ID
   * @returns {Bone|null}
   */
  _resolveBone(boneId) {
    if (boneId && this.skeleton) return this.skeleton.getBone(boneId);
    return this.getSelectedBone();
  }

  /**
   * Parse setter args that support both old API (value) and new API (boneId, value)
   * @param {string|number} arg1 - boneId (new) or value (old)
   * @param {number} [arg2] - value (new API only)
   * @returns {{ boneId: string|null, value: number }}
   */
  _parseSetterArgs(arg1, arg2) {
    if (typeof arg1 === 'string') {
      // New API: setBonePositionX(boneId, value)
      return { boneId: arg1, value: arg2 };
    } else {
      // Old API: setBonePositionX(value)
      return { boneId: null, value: arg1 };
    }
  }

  /**
   * Parse object setter args: old API (obj) vs new API (boneId, obj)
   * @param {string|Object} arg1 - boneId (new) or object (old)
   * @param {Object} [arg2] - object (new API only)
   * @returns {{ boneId: string|null, value: Object }}
   */
  _parseObjectSetterArgs(arg1, arg2) {
    if (typeof arg1 === 'string') {
      return { boneId: arg1, value: arg2 };
    } else {
      return { boneId: null, value: arg1 };
    }
  }

  // =====================
  // Position Manipulation
  // =====================

  /**
   * Get the position of a bone
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {Object|null} Position {x, y, z} or null
   */
  getBonePosition(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    return { x: bone.position.x, y: bone.position.y, z: bone.position.z };
  }

  /**
   * Set the X component of a bone's position
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The X position value (required if boneId provided)
   * @deprecated Use setBonePositionX(boneId, value) instead
   */
  setBonePositionX(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.position.x = parsed.value;
  }

  /**
   * Set the Y component of a bone's position
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The Y position value (required if boneId provided)
   * @deprecated Use setBonePositionY(boneId, value) instead
   */
  setBonePositionY(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.position.y = parsed.value;
  }

  /**
   * Set the Z component of a bone's position
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The Z position value (required if boneId provided)
   * @deprecated Use setBonePositionZ(boneId, value) instead
   */
  setBonePositionZ(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.position.z = parsed.value;
  }

  /**
   * Set the full position of a bone
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {Object} [pos] - Position object {x, y, z} (required if boneId provided)
   * @deprecated Use setBonePosition(boneId, pos) instead
   */
  setBonePosition(boneId, pos) {
    const parsed = this._parseObjectSetterArgs(boneId, pos);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.position.set(parsed.value.x || 0, parsed.value.y || 0, parsed.value.z || 0);
  }

  // =====================
  // Rotation Manipulation
  // =====================

  /**
   * Get the rotation of a bone
   * When called without boneId, returns Z rotation in radians (backward compat)
   * When called with boneId, returns {x, y, z} in degrees
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {number|Object|null} Rotation value or null
   */
  getBoneRotation(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    // Backward compat: when no boneId provided, return Z rotation in radians
    if (boneId === undefined || boneId === null) {
      return bone.rotation.z;
    }
    // New API: return all axes in degrees
    return {
      x: bone.rotation.x * (180 / Math.PI),
      y: bone.rotation.y * (180 / Math.PI),
      z: bone.rotation.z * (180 / Math.PI),
    };
  }

  /**
   * Set the Z-axis rotation of the selected bone (radians, backward compat)
   * Also supports new API: setBoneRotation(boneId, angleInDegrees)
   * @param {string|number} [boneIdOrAngle] - boneId (new) or angle in radians (old)
   * @param {number} [angle] - Rotation angle in degrees (new API only)
   */
  setBoneRotation(boneIdOrAngle, angle) {
    if (typeof boneIdOrAngle === 'string') {
      // New API: setBoneRotation(boneId, angleInDegrees)
      const bone = this._resolveBone(boneIdOrAngle);
      if (!bone) return;
      bone.rotation.z = angle * (Math.PI / 180);
    } else {
      // Old API: setBoneRotation(angleInRadians)
      const bone = this.getSelectedBone();
      if (!bone) return;
      bone.rotation.z = boneIdOrAngle;
    }
  }

  /**
   * Set the X-axis rotation of a bone (degrees)
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [angle] - Rotation angle in degrees (required if boneId provided)
   */
  setBoneRotationX(boneId, angle) {
    const parsed = this._parseSetterArgs(boneId, angle);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.rotation.x = parsed.value * (Math.PI / 180);
  }

  /**
   * Set the Y-axis rotation of a bone (degrees)
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [angle] - Rotation angle in degrees (required if boneId provided)
   */
  setBoneRotationY(boneId, angle) {
    const parsed = this._parseSetterArgs(boneId, angle);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.rotation.y = parsed.value * (Math.PI / 180);
  }

  /**
   * Set the Z-axis rotation of a bone (degrees)
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [angle] - Rotation angle in degrees (required if boneId provided)
   */
  setBoneRotationZ(boneId, angle) {
    const parsed = this._parseSetterArgs(boneId, angle);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.rotation.z = parsed.value * (Math.PI / 180);
  }

  // =====================
  // Scale Manipulation
  // =====================

  /**
   * Get the scale of a bone
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {Object|null} Scale {x, y, z} or null
   */
  getBoneScale(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    return {
      x: bone.scale.x,
      y: bone.scale.y,
      z: bone.scale.z,
    };
  }

  /**
   * Set the X component of a bone's scale
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The X scale value (must be > 0, required if boneId provided)
   */
  setBoneScaleX(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    if (parsed.value <= 0) return;
    bone.scale.x = parsed.value;
  }

  /**
   * Set the Y component of a bone's scale
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The Y scale value (must be > 0, required if boneId provided)
   */
  setBoneScaleY(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    if (parsed.value <= 0) return;
    bone.scale.y = parsed.value;
  }

  /**
   * Set the full scale of a bone
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {Object} [scale] - Scale object {x, y}, values must be > 0 (required if boneId provided)
   */
  setBoneScale(boneId, scale) {
    const parsed = this._parseObjectSetterArgs(boneId, scale);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.scale.set(
      parsed.value.x > 0 ? parsed.value.x : bone.scale.x,
      parsed.value.y > 0 ? parsed.value.y : bone.scale.y,
      bone.scale.z
    );
  }

  // =====================
  // Socket Offset Manipulation
  // =====================

  /**
   * Get the socket offset of a bone
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {Object|null} Offset {x, y} or null
   */
  getSocketOffset(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    return {
      x: bone.socketOffset.x,
      y: bone.socketOffset.y,
    };
  }

  /**
   * Set the X component of a bone's socket offset
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The X offset value (required if boneId provided)
   */
  setSocketOffsetX(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.socketOffset.x = parsed.value;
  }

  /**
   * Set the Y component of a bone's socket offset
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The Y offset value (required if boneId provided)
   */
  setSocketOffsetY(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.socketOffset.y = parsed.value;
  }

  /**
   * Set both components of a bone's socket offset
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {Object} [offset] - Offset object {x, y} (required if boneId provided)
   */
  setSocketOffset(boneId, offset) {
    const parsed = this._parseObjectSetterArgs(boneId, offset);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;
    bone.socketOffset.x = parsed.value.x ?? bone.socketOffset.x;
    bone.socketOffset.y = parsed.value.y ?? bone.socketOffset.y;
  }

  // =====================
  // Asset Manipulation
  // =====================

  /**
   * Get the current asset of a bone
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {string|null} The asset filename, or null
   */
  getBoneAsset(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    return bone.asset;
  }

  /**
   * Change the asset (PNG filename) of a bone
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {string|null} [asset] - The new asset filename, or null to clear (required if boneId provided)
   */
  setBoneAsset(boneId, asset) {
    // Old API: setBoneAsset(asset)
    if (arguments.length === 1) {
      asset = boneId;
      boneId = null;
    }

    const bone = this._resolveBone(boneId);
    if (!bone) return;
    bone.asset = asset;
  }

  // =====================
  // Z-Depth Manipulation (Request 17)
  // =====================

  /**
   * Get the current Z-depth of a bone
   * @param {string} [boneId] - Optional bone ID (defaults to selected)
   * @returns {number|null} The Z-depth value, or null
   */
  getBoneZDepth(boneId) {
    const bone = this._resolveBone(boneId);
    if (!bone) return null;
    return bone.zDepth;
  }

  /**
   * Set the Z-depth of a bone for 2D layer control
   * Clamps value to range [-10, 10]
   * @param {string} [boneId] - The bone ID (optional, defaults to selected)
   * @param {number} [value] - The Z-depth value (-10 to 10, required if boneId provided)
   */
  setBoneZDepth(boneId, value) {
    const parsed = this._parseSetterArgs(boneId, value);
    const bone = this._resolveBone(parsed.boneId);
    if (!bone) return;

    // Validate: must be a number (Infinity/NaN handled by clamping)
    if (typeof parsed.value !== 'number') return;
    if (Number.isNaN(parsed.value)) return;

    // Clamp to allowed range (Infinity will be clamped to max/min)
    const clamped = Math.max(this.Z_DEPTH_MIN, Math.min(this.Z_DEPTH_MAX, parsed.value));
    bone.zDepth = clamped;
  }

  // =====================
  // Z-Depth Reordering (Request 17)
  // =====================

  /**
   * Add the currently selected bone to the selection order for manual reordering
   * Duplicates are ignored (bone kept at its first position)
   */
  addToSelectionOrder() {
    const bone = this.getSelectedBone();
    if (!bone) return;

    // Only add if not already in the list (preserves first-insert position)
    if (!this.selectionOrder.includes(bone.id)) {
      this.selectionOrder.push(bone.id);
    }
  }

  /**
   * Auto-assign Z-depth values based on bone Y position
   * Higher Y position = higher Z-depth (renders in front)
   * Bones at the same Y position get the same Z-depth
   * Z-depth values are assigned sequentially starting from 0
   */
  sortByYPosition() {
    if (!this.isActive || !this.skeleton) return;

    // Collect all bones with their Y positions
    const bonesWithY = [];
    for (const bone of Object.values(this.skeleton.bones)) {
      bonesWithY.push({ bone, y: bone.position.y });
    }

    // Sort by Y position ascending (lowest Y first gets lowest depth)
    bonesWithY.sort((a, b) => a.y - b.y);

    // Assign sequential Z-depth values; bones at same Y get same depth
    // Lowest Y gets depth 0, highest Y gets highest depth
    let depth = 0;
    if (bonesWithY.length > 0) {
      bonesWithY[0].bone.zDepth = depth;
    }

    for (let i = 1; i < bonesWithY.length; i++) {
      // Compare Y positions with a small epsilon for floating point
      if (Math.abs(bonesWithY[i].y - bonesWithY[i - 1].y) < 0.0001) {
        // Same Y position: same Z-depth
        bonesWithY[i].bone.zDepth = bonesWithY[i - 1].bone.zDepth;
      } else {
        // Different Y: increment depth (higher Y = higher depth)
        depth++;
        bonesWithY[i].bone.zDepth = depth;
      }
    }
  }

  /**
   * Assign Z-depth values based on the manual selection order
   * First added bone gets Z-depth 0 (back), last added gets highest (front)
   * Bones not in the selection order are untouched
   */
  sortBySelectionOrder() {
    if (!this.isActive || !this.skeleton) return;
    if (this.selectionOrder.length === 0) return;

    for (let i = 0; i < this.selectionOrder.length; i++) {
      const bone = this.skeleton.getBone(this.selectionOrder[i]);
      if (bone) {
        bone.zDepth = i;
      }
    }
  }

  /**
   * Clear the selection order list
   */
  clearSelectionOrder() {
    this.selectionOrder = [];
  }

  // =====================
  // Generic Property Access
  // =====================

  /**
   * Get a named property from the selected bone
   * @param {string} propertyName - Property name: 'position', 'rotation', 'scale', 'socketOffset', 'zDepth'
   * @returns {Object|number|null} The property value, or null
   */
  getBoneProperty(propertyName) {
    const bone = this.getSelectedBone();
    if (!bone) return null;

    switch (propertyName) {
      case 'position':
        return { x: bone.position.x, y: bone.position.y, z: bone.position.z };
      case 'rotation':
        return { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z };
      case 'scale':
        return { x: bone.scale.x, y: bone.scale.y, z: bone.scale.z };
      case 'socketOffset':
        return { x: bone.socketOffset.x, y: bone.socketOffset.y };
      case 'zDepth':
        return bone.zDepth;
      default:
        return null;
    }
  }

  /**
   * Set a named property on the selected bone
   * @param {string} propertyName - Property name: 'position', 'rotation', 'scale', 'socketOffset', 'zDepth'
   * @param {Object|number} value - The property value to set
   */
  setBoneProperty(propertyName, value) {
    const bone = this.getSelectedBone();
    if (!bone) return;

    switch (propertyName) {
      case 'position':
        this.setBonePosition(value);
        break;
      case 'rotation':
        bone.rotation.set(value.x || 0, value.y || 0, value.z || 0);
        break;
      case 'scale':
        this.setBoneScale(value);
        break;
      case 'socketOffset':
        this.setSocketOffset(value);
        break;
      case 'zDepth':
        this.setBoneZDepth(value);
        break;
      // Unknown property: silently ignore
      default:
        break;
    }
  }

  // =====================
  // Bone List
  // =====================

  /**
   * Get a list of all bones with their metadata for the UI bone list panel
   * @returns {Array<Object>} Array of bone info objects {id, name, parentId, zDepth}
   */
  getBoneList() {
    if (!this.isActive || !this.skeleton) return [];

    const list = [];
    for (const bone of Object.values(this.skeleton.bones)) {
      list.push({
        id: bone.id,
        name: bone.name,
        parentId: bone.parentId,
        zDepth: bone.zDepth,
      });
    }
    return list;
  }

  // =====================
  // Export
  // =====================

  /**
   * Export the current skeleton configuration as a plain object
   * @returns {Object} Skeleton configuration object with name and bones array
   */
  exportConfig() {
    if (!this.isActive || !this.skeleton) {
      return { name: '', bones: [] };
    }
    return this.skeleton.toConfig();
  }

  /**
   * Export the current skeleton configuration as a JSON string
   * @returns {string} JSON string of the skeleton configuration
   */
  exportJSON() {
    return JSON.stringify(this.exportConfig(), null, 2);
  }

  // =====================
  // Reset / Undo
  // =====================

  /**
   * Reset the skeleton to the original state saved when editing was activated
   */
  resetToOriginal() {
    if (!this.isActive || !this.originalState || !this.skeleton) return;

    // Reload the original config into the skeleton
    this.skeleton.loadFromConfig(this.originalState);

    // Re-assign meshes from the puppet to the newly created bones
    if (this.puppet) {
      for (const bone of Object.values(this.skeleton.bones)) {
        // The puppet's group contains meshes named by bone id
        const mesh = this.puppet.group.getObjectByName(bone.id);
        if (mesh) {
          bone.setMesh(mesh);
        }
      }
    }

    // Update the original state snapshot to reflect the reset
    this.originalState = this._deepCloneConfig(this.skeleton.toConfig());
  }

  /**
   * Check if the current skeleton state differs from the original
   * @returns {boolean} True if changes have been made since activation or last reset
   */
  hasChanges() {
    if (!this.isActive || !this.originalState || !this.skeleton) return false;

    const current = this.skeleton.toConfig();
    return JSON.stringify(current) !== JSON.stringify(this.originalState);
  }

  // =====================
  // Apply / Save
  // =====================

  /**
   * Apply changes by sending the updated skeleton config to the server
   * via the socket connection
   */
  applyChanges() {
    if (!this.isActive || !this.skeleton) return;
    if (!this.socket) return;

    const config = this.exportConfig();
    this.socket.emit('puppet-updated', config);

    // Update the original state snapshot so hasChanges() returns false
    this.originalState = this._deepCloneConfig(config);
  }

  // =====================
  // Internal Helpers
  // =====================

  /**
   * Deep clone a skeleton configuration object
   * @param {Object} config - The configuration to clone
   * @returns {Object} A deep copy of the configuration
   */
  _deepCloneConfig(config) {
    return JSON.parse(JSON.stringify(config));
  }
}

export default PuppetEditor;