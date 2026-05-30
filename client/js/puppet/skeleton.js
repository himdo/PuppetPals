/** Skeleton Class - Manages bone hierarchy for puppets
 * Loads bone hierarchy from JSON configuration, builds parent-child relationships,
 * and provides methods to traverse and update the skeleton
 */

import Bone from './bone.js';

class Skeleton {
  /**
   * Create a skeleton instance
   * @param {Object} config - Optional configuration
   * @param {string} config.name - Skeleton/puppet name
   */
  constructor(config = {}) {
    this.name = config.name || '';
    // Map of boneId -> Bone instance
    this.bones = {};
  }

  /**
   * Add a bone to the skeleton and link parent-child relationship
   * @param {Bone} bone - The bone to add
   */
  addBone(bone) {
    this.bones[bone.id] = bone;

    // Link to parent if it exists
    if (bone.parentId && this.bones[bone.parentId]) {
      this.bones[bone.parentId].addChild(bone);
    }

    // If this bone is a parent of existing bones, link them
    for (const existingBone of Object.values(this.bones)) {
      if (existingBone.parentId === bone.id && !bone.children.includes(existingBone)) {
        bone.addChild(existingBone);
      }
    }
  }

  /**
   * Remove a bone from the skeleton
   * @param {string} boneId - ID of the bone to remove
   * @returns {boolean} True if bone was removed, false if not found
   */
  removeBone(boneId) {
    const bone = this.bones[boneId];
    if (!bone) return false;

    // Remove from parent's children list
    if (bone.parentId && this.bones[bone.parentId]) {
      this.bones[bone.parentId].removeChild(bone);
    }

    delete this.bones[boneId];
    return true;
  }

  /**
   * Find a bone by its ID
   * @param {string} boneId - The bone ID to search for
   * @returns {Bone|null} The bone if found, null otherwise
   */
  getBone(boneId) {
    return this.bones[boneId] || null;
  }

  /**
   * Check if a bone exists in the skeleton
   * @param {string} boneId - The bone ID to check
   * @returns {boolean} True if bone exists
   */
  hasBone(boneId) {
    return boneId in this.bones;
  }

  /**
   * Get all root bones (bones with no parent)
   * @returns {Bone[]} Array of root bones
   */
  getRootBones() {
    return Object.values(this.bones).filter(bone => !bone.parentId);
  }

  /**
   * Get the total number of bones in the skeleton
   * @returns {number} Bone count
   */
  getBoneCount() {
    return Object.keys(this.bones).length;
  }

  /**
   * Get all descendant bones (children, grandchildren, etc.) of a given bone
   * @param {string} boneId - The parent bone ID
   * @returns {Bone[]} Array of all descendant bones
   */
  getDescendants(boneId) {
    const bone = this.bones[boneId];
    if (!bone) return [];

    const descendants = [];
    const stack = [...bone.children];

    while (stack.length > 0) {
      const child = stack.pop();
      descendants.push(child);
      stack.push(...child.children);
    }

    return descendants;
  }

  /**
   * Update all bone transforms in hierarchy order (parents before children)
   * Traverses from root bones down through the hierarchy
   */
  update() {
    const updateBone = (bone) => {
      bone.updateWorldTransform();
      for (const child of bone.children) {
        updateBone(child);
      }
    };

    for (const root of this.getRootBones()) {
      updateBone(root);
    }
  }

  /**
   * Load skeleton from JSON configuration
   * Clears existing bones first, then builds new hierarchy
   * @param {Object} config - Skeleton configuration object
   * @param {string} config.name - Puppet name
   * @param {Array} config.bones - Array of bone configurations
   */
  loadFromConfig(config) {
    // Clear existing bones
    this.bones = {};
    this.name = config.name || '';

    const boneConfigs = config.bones || [];

    // First pass: create all bones
    const createdBones = [];
    for (const boneConfig of boneConfigs) {
      const boneConfigWithDefaults = {
        id: boneConfig.id,
        name: boneConfig.name,
        parentId: boneConfig.parentId || null,
        asset: boneConfig.asset || null,
        position: boneConfig.position || { x: 0, y: 0, z: 0 },
        rotation: boneConfig.rotation || { x: 0, y: 0, z: 0 },
        scale: boneConfig.scale || { x: 1, y: 1, z: 1 },
        socketOffset: boneConfig.socketOffset || { x: 0, y: 0 },
      };

      // Handle 2D scale (x, y only) by adding z: 1
      const scale = boneConfigWithDefaults.scale;
      if (typeof scale.z === 'undefined') {
        scale.z = 1;
      }

      const bone = new Bone(boneConfigWithDefaults);
      createdBones.push(bone);
    }

    // Second pass: add bones and build hierarchy
    for (const bone of createdBones) {
      this.addBone(bone);
    }
  }

  /**
   * Export skeleton configuration as a plain object (for JSON serialization)
   * @returns {Object} Plain object with skeleton configuration
   */
  toConfig() {
    const boneConfigs = [];
    for (const bone of Object.values(this.bones)) {
      boneConfigs.push(bone.toConfig());
    }

    return {
      name: this.name,
      bones: boneConfigs,
    };
  }
}

export default Skeleton;