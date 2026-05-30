/** PuppetEditor - In-browser visual editor for puppet customization
 * Allows editing bone positions, rotations, scale, socket offsets,
 * and asset assignment. Supports undo/reset and JSON export.
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
  // Position Manipulation
  // =====================

  /**
   * Set the X component of the selected bone's position
   * @param {number} value - The X position value
   */
  setBonePositionX(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.position.x = value;
  }

  /**
   * Set the Y component of the selected bone's position
   * @param {number} value - The Y position value
   */
  setBonePositionY(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.position.y = value;
  }

  /**
   * Set the Z component of the selected bone's position
   * @param {number} value - The Z position value
   */
  setBonePositionZ(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.position.z = value;
  }

  /**
   * Set the full position of the selected bone
   * @param {Object} pos - Position object {x, y, z}
   */
  setBonePosition(pos) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.position.set(pos.x || 0, pos.y || 0, pos.z || 0);
  }

  // =====================
  // Rotation Manipulation
  // =====================

  /**
   * Set the Z-axis rotation of the selected bone (2D-style rotation)
   * @param {number} angle - Rotation angle in radians
   */
  setBoneRotation(angle) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.rotation.z = angle;
  }

  /**
   * Get the current Z-axis rotation of the selected bone
   * @returns {number|null} The rotation angle in radians, or null
   */
  getBoneRotation() {
    const bone = this.getSelectedBone();
    if (!bone) return null;
    return bone.rotation.z;
  }

  // =====================
  // Scale Manipulation
  // =====================

  /**
   * Set the X component of the selected bone's scale
   * @param {number} value - The X scale value (must be > 0)
   */
  setBoneScaleX(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    if (value <= 0) return;
    bone.scale.x = value;
  }

  /**
   * Set the Y component of the selected bone's scale
   * @param {number} value - The Y scale value (must be > 0)
   */
  setBoneScaleY(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    if (value <= 0) return;
    bone.scale.y = value;
  }

  /**
   * Set the full scale of the selected bone
   * @param {Object} scale - Scale object {x, y, z}, values must be > 0
   */
  setBoneScale(scale) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.scale.set(
      scale.x > 0 ? scale.x : bone.scale.x,
      scale.y > 0 ? scale.y : bone.scale.y,
      scale.z > 0 ? scale.z : bone.scale.z
    );
  }

  /**
   * Get the current scale of the selected bone
   * @returns {Object|null} Scale object {x, y, z}, or null
   */
  getBoneScale() {
    const bone = this.getSelectedBone();
    if (!bone) return null;
    return {
      x: bone.scale.x,
      y: bone.scale.y,
      z: bone.scale.z,
    };
  }

  // =====================
  // Socket Offset Manipulation
  // =====================

  /**
   * Set the X component of the selected bone's socket offset
   * @param {number} value - The X offset value
   */
  setSocketOffsetX(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.socketOffset.x = value;
  }

  /**
   * Set the Y component of the selected bone's socket offset
   * @param {number} value - The Y offset value
   */
  setSocketOffsetY(value) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.socketOffset.y = value;
  }

  /**
   * Set both components of the selected bone's socket offset
   * @param {Object} offset - Offset object {x, y}
   */
  setSocketOffset(offset) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.socketOffset.x = offset.x ?? bone.socketOffset.x;
    bone.socketOffset.y = offset.y ?? bone.socketOffset.y;
  }

  /**
   * Get the current socket offset of the selected bone
   * @returns {Object|null} Offset object {x, y}, or null
   */
  getSocketOffset() {
    const bone = this.getSelectedBone();
    if (!bone) return null;
    return {
      x: bone.socketOffset.x,
      y: bone.socketOffset.y,
    };
  }

  // =====================
  // Asset Manipulation
  // =====================

  /**
   * Change the asset (PNG filename) of the selected bone
   * @param {string|null} asset - The new asset filename, or null to clear
   */
  setBoneAsset(asset) {
    const bone = this.getSelectedBone();
    if (!bone) return;
    bone.asset = asset;
  }

  /**
   * Get the current asset of the selected bone
   * @returns {string|null} The asset filename, or null
   */
  getBoneAsset() {
    const bone = this.getSelectedBone();
    if (!bone) return null;
    return bone.asset;
  }

  // =====================
  // Generic Property Access
  // =====================

  /**
   * Get a named property from the selected bone
   * @param {string} propertyName - Property name: 'position', 'rotation', 'scale', 'socketOffset'
   * @returns {Object|null} The property value, or null
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
      default:
        return null;
    }
  }

  /**
   * Set a named property on the selected bone
   * @param {string} propertyName - Property name: 'position', 'rotation', 'scale', 'socketOffset'
   * @param {Object} value - The property value to set
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
   * @returns {Array<Object>} Array of bone info objects {id, name, parentId}
   */
  getBoneList() {
    if (!this.isActive || !this.skeleton) return [];

    const list = [];
    for (const bone of Object.values(this.skeleton.bones)) {
      list.push({
        id: bone.id,
        name: bone.name,
        parentId: bone.parentId,
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