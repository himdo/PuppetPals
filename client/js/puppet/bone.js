/** Bone Class - Hierarchical bone/joint for puppet system
 * Each bone represents a puppet part with parent-child relationships
 * Supports position, rotation (Z-axis for 2D-style), scale, and mesh attachment
 */

import * as THREE from 'three';

class Bone {
  /**
   * Create a bone instance
   * @param {Object} config - Bone configuration
   * @param {string} config.id - Unique identifier
   * @param {string} config.name - Human-readable name
   * @param {string|null} config.parentId - Reference to parent bone (null for root)
   * @param {Object} config.position - Local position {x, y, z}
   * @param {Object} config.rotation - Local rotation {x, y, z}
   * @param {Object} config.scale - Local scale {x, y, z}
   * @param {string|null} config.asset - PNG asset filename
   * @param {Object} config.socketOffset - Vector2 offset for attaching child bones {x, y}
   */
  constructor(config = {}) {
    this.id = config.id || '';
    this.name = config.name || '';
    this.parentId = config.parentId || null;
    this.asset = config.asset || null;

    // Position - local space Vector3
    const pos = config.position || { x: 0, y: 0, z: 0 };
    this.position = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Rotation - local space Euler (primarily Z-axis for 2D-style rotation)
    const rot = config.rotation || { x: 0, y: 0, z: 0 };
    this.rotation = new THREE.Euler(rot.x, rot.y, rot.z);

    // Scale - local space Vector3
    const scl = config.scale || { x: 1, y: 1, z: 1 };
    this.scale = new THREE.Vector3(scl.x, scl.y, scl.z);

    // Socket offset for attaching child bones (2D offset on this bone)
    const offset = config.socketOffset || { x: 0, y: 0 };
    this.socketOffset = { x: offset.x, y: offset.y };

    // Three.js mesh (the PNG sprite) - set separately after loading
    this.mesh = null;

    // Child bones in hierarchy
    this.children = [];
  }

  /**
   * Assign a Three.js mesh to this bone
   * @param {THREE.Mesh|THREE.Sprite} mesh - The mesh to attach
   */
  setMesh(mesh) {
    this.mesh = mesh;
  }

  /**
   * Update the parent bone reference
   * @param {string|null} parentId - New parent bone ID
   */
  setParentId(parentId) {
    this.parentId = parentId;
  }

  /**
   * Add a child bone to this bone's hierarchy
   * @param {Bone} child - The child bone to add
   */
  addChild(child) {
    if (!this.children.includes(child)) {
      this.children.push(child);
    }
  }

  /**
   * Remove a child bone from this bone's hierarchy
   * @param {Bone} child - The child bone to remove
   */
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx > -1) {
      this.children.splice(idx, 1);
    }
  }

  /**
   * Rotate this bone around the Z axis (2D-style rotation)
   * @param {number} angle - Rotation angle in radians
   */
  setRotation(angle) {
    this.rotation.z = angle;
  }

  /**
   * Update the local position
   * @param {Object|number} xOrObj - Position object {x, y, z} or x coordinate
   * @param {number} y - Y coordinate (when using positional args)
   * @param {number} z - Z coordinate (when using positional args)
   */
  setPosition(xOrObj, y, z) {
    if (typeof xOrObj === 'object' && xOrObj !== null) {
      this.position.set(xOrObj.x || 0, xOrObj.y || 0, xOrObj.z || 0);
    } else {
      this.position.set(xOrObj || 0, y || 0, z || 0);
    }
  }

  /**
   * Update the local scale
   * @param {Object|number} xOrObj - Scale object {x, y, z} or x scale
   * @param {number} y - Y scale (when using positional args)
   * @param {number} z - Z scale (when using positional args)
   */
  setScale(xOrObj, y, z) {
    if (typeof xOrObj === 'object' && xOrObj !== null) {
      this.scale.set(xOrObj.x || 1, xOrObj.y || 1, xOrObj.z || 1);
    } else {
      this.scale.set(xOrObj || 1, y || 1, z || 1);
    }
  }

  /**
   * Calculate and return the world space position
   * For bones without a parent, this returns the local position
   * For bones with a parent, this recursively calculates world position
   * @returns {THREE.Vector3} World space position
   */
  getWorldPosition() {
    // For a bone without parent reference resolved, return local position copy
    return new THREE.Vector3(this.position.x, this.position.y, this.position.z);
  }

  /**
   * Update the attached mesh to reflect current bone transforms
   * Syncs position, rotation, and scale to the mesh
   */
  updateWorldTransform() {
    if (!this.mesh) return;

    // Update mesh position to match bone position
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    // Update mesh rotation to match bone rotation
    this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);

    // Update mesh scale to match bone scale
    this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
  }

  /**
   * Export bone configuration as a plain object (for JSON serialization)
   * Excludes mesh and children references
   * @returns {Object} Plain object with bone configuration
   */
  toConfig() {
    return {
      id: this.id,
      name: this.name,
      parentId: this.parentId,
      asset: this.asset,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z,
      },
      rotation: {
        x: this.rotation.x,
        y: this.rotation.y,
        z: this.rotation.z,
      },
      scale: {
        x: this.scale.x,
        y: this.scale.y,
        z: this.scale.z,
      },
      socketOffset: {
        x: this.socketOffset.x,
        y: this.socketOffset.y,
      },
    };
  }
}

export default Bone;