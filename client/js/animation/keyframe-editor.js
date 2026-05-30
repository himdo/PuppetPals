/** Keyframe Editor - Visual animation creation and editing
 * Provides KeyframeEditor class for creating, editing, and managing animations
 * Supports timeline scrubbing, keyframe CRUD, playback preview, and import/export
 */

import { Animation } from './animation-system.js';

/**
 * KeyframeEditor class for creating and editing keyframe animations
 * Provides animation creation, keyframe management, playback preview,
 * and import/export functionality
 */
class KeyframeEditor {
  /**
   * Create a keyframe editor bound to a skeleton
   * @param {Object} skeleton - Skeleton instance with getBone(id) and getRootBones() methods
   */
  constructor(skeleton) {
    this.skeleton = skeleton;
    this.currentAnimation = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = 1;
    this.selectedBone = null;

    // Collect bone IDs from the skeleton
    this.boneList = this._collectBoneIds();
  }

  /**
   * Collect all bone IDs from the skeleton
   * @returns {string[]} Array of bone IDs
   * @private
   */
  _collectBoneIds() {
    const roots = this.skeleton.getRootBones();
    if (!roots || !Array.isArray(roots)) return [];
    return roots.map((b) => b.id);
  }

  // =============================================
  // Animation Creation & Loading
  // =============================================

  /**
   * Create a new empty animation
   * @param {string} id - Unique animation identifier
   * @param {string} name - Human-readable name
   * @param {number} duration - Duration in milliseconds
   * @param {boolean} [loop=false] - Whether the animation loops
   * @returns {Animation} The created animation
   */
  createAnimation(id, name, duration, loop = false) {
    const anim = new Animation({
      id,
      name,
      duration,
      loop,
      keyframes: [],
    });
    this.currentAnimation = anim;
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    return anim;
  }

  /**
   * Load an existing animation into the editor
   * @param {Animation} animation - The animation to load
   */
  loadAnimation(animation) {
    this.stop();
    this.currentAnimation = animation;
    this.currentTime = 0;
  }

  /**
   * Clear the current animation and reset state
   */
  clearAnimation() {
    this.currentAnimation = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
  }

  // =============================================
  // Bone Selection
  // =============================================

  /**
   * Select a bone for keyframe editing
   * @param {string} boneId - The bone identifier
   * @returns {boolean} True if bone was found and selected, false otherwise
   */
  selectBone(boneId) {
    if (!this.boneList.includes(boneId)) {
      this.selectedBone = null;
      return false;
    }
    this.selectedBone = boneId;
    return true;
  }

  // =============================================
  // Keyframe CRUD Operations
  // =============================================

  /**
   * Add a keyframe at the current time for the selected bone
   * @param {number} time - Time in milliseconds (clamped to [0, duration])
   * @param {Object|null} [rotation=null] - Rotation values {x, y, z}
   * @param {Object|null} [position=null] - Position values {x, y, z}
   * @returns {Object|null} The created keyframe, or null if prerequisites not met
   */
  addKeyframe(time, rotation = null, position = null) {
    if (!this.currentAnimation || !this.selectedBone) return null;

    const duration = this.currentAnimation.duration;
    const clampedTime = Math.max(0, Math.min(time, duration));

    const keyframe = {
      time: clampedTime,
      boneId: this.selectedBone,
      rotation: rotation || {},
    };

    if (position) {
      keyframe.position = position;
    }

    this.currentAnimation.keyframes.push(keyframe);
    return keyframe;
  }

  /**
   * Delete a keyframe by its index in the keyframes array
   * @param {number} index - Index of the keyframe to delete
   * @returns {boolean} True if deleted, false if index invalid or no animation
   */
  deleteKeyframe(index) {
    if (!this.currentAnimation) return false;

    const { keyframes } = this.currentAnimation;
    if (index < 0 || index >= keyframes.length) return false;

    keyframes.splice(index, 1);
    return true;
  }

  /**
   * Update an existing keyframe's rotation and/or position
   * @param {number} index - Index of the keyframe to update
   * @param {Object|null} [rotation=null] - New rotation values, or null to leave unchanged
   * @param {Object|null} [position=null] - New position values, or null to leave unchanged
   * @returns {boolean} True if updated, false if index invalid or no animation
   */
  updateKeyframe(index, rotation = null, position = null) {
    if (!this.currentAnimation) return false;

    const { keyframes } = this.currentAnimation;
    if (index < 0 || index >= keyframes.length) return false;

    const kf = keyframes[index];
    if (rotation !== null) {
      kf.rotation = rotation;
    }
    if (position !== null) {
      kf.position = position;
    }

    return true;
  }

  /**
   * Duplicate a keyframe at a new time
   * @param {number} index - Index of the keyframe to duplicate
   * @param {number} newTime - New time for the duplicated keyframe
   * @returns {boolean} True if duplicated, false if index invalid or no animation
   */
  duplicateKeyframe(index, newTime) {
    if (!this.currentAnimation) return false;

    const { keyframes } = this.currentAnimation;
    if (index < 0 || index >= keyframes.length) return false;

    const original = keyframes[index];
    const duration = this.currentAnimation.duration;
    const clampedTime = Math.max(0, Math.min(newTime, duration));

    const duplicate = {
      time: clampedTime,
      boneId: original.boneId,
      rotation: { ...original.rotation },
    };

    if (original.position) {
      duplicate.position = { ...original.position };
    }

    keyframes.push(duplicate);
    return true;
  }

  /**
   * Delete all keyframes for a specific bone
   * @param {string} boneId - The bone identifier
   */
  deleteKeyframesForBone(boneId) {
    if (!this.currentAnimation) return;

    this.currentAnimation.keyframes = this.currentAnimation.keyframes.filter(
      (kf) => kf.boneId !== boneId
    );
  }

  // =============================================
  // Keyframe Queries
  // =============================================

  /**
   * Get all keyframes for the currently selected bone
   * @returns {Array} Sorted array of keyframes for the selected bone
   */
  getKeyframesForSelectedBone() {
    if (!this.currentAnimation || !this.selectedBone) return [];
    return this.currentAnimation.getKeyframesForBone(this.selectedBone);
  }

  /**
   * Get all keyframes sorted by time
   * @returns {Array} Sorted array of all keyframes
   */
  getAllKeyframes() {
    if (!this.currentAnimation) return [];
    return [...this.currentAnimation.keyframes].sort((a, b) => a.time - b.time);
  }

  /**
   * Get the number of keyframes for a specific bone
   * @param {string} boneId - The bone identifier
   * @returns {number} Keyframe count
   */
  getKeyframeCountForBone(boneId) {
    if (!this.currentAnimation) return 0;
    return this.currentAnimation.getKeyframesForBone(boneId).length;
  }

  // =============================================
  // Animation Properties
  // =============================================

  /**
   * Set the animation duration
   * @param {number} duration - New duration in milliseconds
   * @returns {boolean} True if updated, false if no animation or invalid
   */
  setDuration(duration) {
    if (!this.currentAnimation) return false;
    if (duration < 0) return false;
    this.currentAnimation.duration = duration;
    return true;
  }

  /**
   * Set whether the animation loops
   * @param {boolean} loop - Loop flag
   */
  setLoop(loop) {
    if (this.currentAnimation) {
      this.currentAnimation.loop = loop;
    }
  }

  /**
   * Set the animation name
   * @param {string} name - New name
   * @returns {boolean} True if updated, false if no animation
   */
  setName(name) {
    if (!this.currentAnimation) return false;
    this.currentAnimation.name = name;
    return true;
  }

  /**
   * Get the current playback time
   * @returns {number} Current time in milliseconds
   */
  getCurrentTime() {
    return this.currentAnimation ? this.currentTime : 0;
  }

  /**
   * Get the animation duration
   * @returns {number} Duration in milliseconds
   */
  getDuration() {
    return this.currentAnimation ? this.currentAnimation.duration : 0;
  }

  // =============================================
  // Playback Controls
  // =============================================

  /**
   * Start playing the current animation
   */
  play() {
    if (!this.currentAnimation) return;
    this.isPlaying = true;
    this.isPaused = false;
  }

  /**
   * Pause the currently playing animation
   */
  pause() {
    if (!this.currentAnimation) return;
    this.isPaused = true;
    this.isPlaying = false;
  }

  /**
   * Stop playback and reset time
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentTime = 0;
  }

  /**
   * Seek to a specific time
   * @param {number} time - Target time in milliseconds
   */
  seek(time) {
    if (!this.currentAnimation) return;
    this.currentTime = Math.max(0, Math.min(time, this.currentAnimation.duration));
  }

  /**
   * Set the playback speed multiplier
   * @param {number} speed - Speed multiplier (clamped to >= 0)
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed);
  }

  /**
   * Get the current playback speed
   * @returns {number} Current speed multiplier
   */
  getSpeed() {
    return this.speed;
  }

  // =============================================
  // Update / Preview
  // =============================================

  /**
   * Update the editor playback state
   * Advances time, handles looping, and applies keyframes to bones for preview
   * @param {number} [delta=0] - Time elapsed since last update in milliseconds
   */
  update(delta = 0) {
    if (!this.currentAnimation || !this.isPlaying || this.isPaused) return;

    const anim = this.currentAnimation;

    // Advance time
    if (delta > 0) {
      this.currentTime += delta * this.speed;
    }

    // Handle loop/end
    if (this.currentTime >= anim.duration) {
      if (anim.loop && anim.duration > 0) {
        this.currentTime = this.currentTime % anim.duration;
      } else {
        this.currentTime = anim.duration;
      }
    }

    // Apply keyframes to bones for preview
    this._applyKeyframes(anim, this.currentTime);
  }

  /**
   * Apply keyframe interpolation to bones at the given time
   * @param {Animation} anim - The animation to apply
   * @param {number} time - Current animation time in milliseconds
   * @private
   */
  _applyKeyframes(anim, time) {
    if (!anim || anim.keyframes.length === 0) return;

    const boneIds = new Set();
    for (const kf of anim.keyframes) {
      boneIds.add(kf.boneId);
    }

    for (const boneId of boneIds) {
      const bone = this.skeleton.getBone(boneId);
      if (!bone) continue;

      const kfs = anim.getKeyframesForBone(boneId);
      if (kfs.length === 0) continue;

      const { prevKf, nextKf } = this._findSurroundingKeyframes(kfs, time);
      const timeRange = nextKf.time - prevKf.time;
      const t = timeRange > 0 ? (time - prevKf.time) / timeRange : 0;

      this._interpolateRotation(bone, prevKf, nextKf, t);

      if (prevKf.position && nextKf.position) {
        this._interpolatePosition(bone, prevKf, nextKf, t);
      }
    }
  }

  /**
   * Find surrounding keyframes that bracket the given time
   * @param {Array} kfs - Sorted keyframes for a bone
   * @param {number} time - Current animation time
   * @returns {{prevKf: Object, nextKf: Object}}
   * @private
   */
  _findSurroundingKeyframes(kfs, time) {
    let prevKf = kfs[0];
    let nextKf = kfs[kfs.length - 1];

    if (time <= kfs[0].time) {
      return { prevKf: kfs[0], nextKf: kfs[0] };
    }

    if (time >= kfs[kfs.length - 1].time) {
      return { prevKf: kfs[kfs.length - 1], nextKf: kfs[kfs.length - 1] };
    }

    for (let i = 0; i < kfs.length - 1; i++) {
      if (time >= kfs[i].time && time <= kfs[i + 1].time) {
        prevKf = kfs[i];
        nextKf = kfs[i + 1];
        break;
      }
    }

    return { prevKf, nextKf };
  }

  /**
   * Interpolate rotation between two keyframes and apply to bone
   * @param {Object} bone - Bone with setRotation method
   * @param {Object} prevKf - Previous keyframe
   * @param {Object} nextKf - Next keyframe
   * @param {number} t - Interpolation factor [0, 1]
   * @private
   */
  _interpolateRotation(bone, prevKf, nextKf, t) {
    const prevRot = prevKf.rotation || {};
    const nextRot = nextKf.rotation || {};

    const x = (prevRot.x || 0) + ((nextRot.x || 0) - (prevRot.x || 0)) * t;
    const y = (prevRot.y || 0) + ((nextRot.y || 0) - (prevRot.y || 0)) * t;
    const z = (prevRot.z || 0) + ((nextRot.z || 0) - (prevRot.z || 0)) * t;

    if ('z' in prevRot || 'z' in nextRot) {
      bone.setRotation(z);
    }
    if ('x' in prevRot || 'x' in nextRot) {
      bone.rotation.x = x;
    }
    if ('y' in prevRot || 'y' in nextRot) {
      bone.rotation.y = y;
    }
  }

  /**
   * Interpolate position between two keyframes and apply to bone
   * @param {Object} bone - Bone with position {x, y, z}
   * @param {Object} prevKf - Previous keyframe
   * @param {Object} nextKf - Next keyframe
   * @param {number} t - Interpolation factor [0, 1]
   * @private
   */
  _interpolatePosition(bone, prevKf, nextKf, t) {
    const prevPos = prevKf.position || {};
    const nextPos = nextKf.position || {};

    if (bone.position && typeof bone.position.set === 'function') {
      bone.position.set(
        (prevPos.x || 0) + ((nextPos.x || 0) - (prevPos.x || 0)) * t,
        (prevPos.y || 0) + ((nextPos.y || 0) - (prevPos.y || 0)) * t,
        (prevPos.z || 0) + ((nextPos.z || 0) - (prevPos.z || 0)) * t
      );
    } else {
      bone.position.x = (prevPos.x || 0) + ((nextPos.x || 0) - (prevPos.x || 0)) * t;
      bone.position.y = (prevPos.y || 0) + ((nextPos.y || 0) - (prevPos.y || 0)) * t;
      bone.position.z = (prevPos.z || 0) + ((nextPos.z || 0) - (prevPos.z || 0)) * t;
    }
  }

  // =============================================
  // Import / Export
  // =============================================

  /**
   * Export the current animation as a plain config object (deep copy)
   * @returns {Object|null} Config object suitable for JSON serialization, or null
   */
  exportAnimation() {
    if (!this.currentAnimation) return null;

    return {
      id: this.currentAnimation.id,
      name: this.currentAnimation.name,
      duration: this.currentAnimation.duration,
      loop: this.currentAnimation.loop,
      keyframes: JSON.parse(JSON.stringify(this.currentAnimation.keyframes)),
    };
  }

  /**
   * Import an animation from a config object
   * @param {Object} config - Configuration object with id, name, duration, loop, keyframes
   * @returns {boolean} True if imported successfully
   */
  importAnimation(config) {
    if (!config || typeof config !== 'object') return false;
    if (!config.id || config.duration === undefined) return false;

    const anim = new Animation({
      id: config.id,
      name: config.name || '',
      duration: config.duration,
      loop: config.loop || false,
      keyframes: config.keyframes || [],
    });

    this.loadAnimation(anim);
    return true;
  }
}

export { KeyframeEditor };