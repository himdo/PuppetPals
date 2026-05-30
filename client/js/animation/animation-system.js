/** Animation System - Keyframe-based animation engine
 * Provides Animation class for defining animations and AnimationPlayer for playback
 * Supports linear interpolation between keyframes, looping, speed control, and seeking
 */

/**
 * Animation class representing a keyframe animation
 * Contains metadata and an array of keyframes that define bone transforms over time
 */
class Animation {
  /**
   * Create an animation instance
   * @param {Object} config - Animation configuration
   * @param {string} config.id - Unique animation identifier
   * @param {string} config.name - Human-readable name
   * @param {number} config.duration - Total duration in milliseconds
   * @param {boolean} config.loop - Whether the animation loops
   * @param {Array} config.keyframes - Array of keyframe objects
   */
  constructor(config = {}) {
    this.id = config.id || '';
    this.name = config.name || '';
    this.duration = config.duration || 0;
    this.loop = config.loop || false;
    this.keyframes = config.keyframes || [];
  }

  /**
   * Get keyframes for a specific bone, sorted by time
   * @param {string} boneId - The bone identifier to filter by
   * @returns {Array} Sorted array of keyframes for the bone
   */
  getKeyframesForBone(boneId) {
    return this.keyframes
      .filter((kf) => kf.boneId === boneId)
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Export animation to a plain configuration object
   * @returns {Object} Plain object suitable for JSON serialization
   */
  toConfig() {
    return {
      id: this.id,
      name: this.name,
      duration: this.duration,
      loop: this.loop,
      keyframes: this.keyframes,
    };
  }

  /**
   * Create an Animation from a plain configuration object
   * @param {Object} config - Configuration object
   * @returns {Animation} New Animation instance
   */
  static fromConfig(config) {
    return new Animation(config);
  }
}

/**
 * AnimationPlayer class for playing back animations on a skeleton
 * Handles playback control (play/pause/stop/seek), time advancement,
 * looping, speed, and keyframe interpolation
 */
class AnimationPlayer {
  /**
   * Create an animation player bound to a skeleton
   * @param {Object} skeleton - Skeleton instance with getBone(id) method
   */
  constructor(skeleton) {
    this.skeleton = skeleton;
    this.currentAnimation = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.speed = 1;
  }

  /**
   * Start playing an animation
   * @param {Animation|null} animation - The animation to play
   */
  play(animation) {
    if (!animation) return;

    this.stop();
    this.currentAnimation = animation;
    this.currentTime = 0;
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
   * Stop the currently playing animation and reset state
   */
  stop() {
    this.currentAnimation = null;
    this.currentTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * Seek to a specific time within the animation
   * @param {number} time - Target time in milliseconds (clamped to [0, duration])
   */
  seek(time) {
    if (!this.currentAnimation) return;
    this.currentTime = Math.max(0, Math.min(time, this.currentAnimation.duration));
  }

  /**
   * Get the current playback time
   * @returns {number} Current time in milliseconds
   */
  getCurrentTime() {
    return this.currentAnimation ? this.currentTime : 0;
  }

  /**
   * Set the playback speed multiplier
   * @param {number} speed - Speed multiplier (clamped to >= 0)
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed);
  }

  /**
   * Update the animation playback
   * Advances time by delta (scaled by speed), handles looping/stop conditions,
   * and interpolates keyframe values onto bones
   * @param {number} [delta=0] - Time elapsed since last update in milliseconds
   */
  update(delta = 0) {
    if (!this.currentAnimation || !this.isPlaying) return;

    const anim = this.currentAnimation;

    // Advance time by delta scaled by speed
    if (delta > 0) {
      this.currentTime += delta * this.speed;
    }

    // Handle looping vs non-looping end conditions
    if (this.currentTime >= anim.duration) {
      if (anim.loop) {
        // Wrap around for looping animations
        this.currentTime = this.currentTime % anim.duration;
      } else {
        // Clamp to duration for non-looping animations
        this.currentTime = anim.duration;
      }
    }

    // Apply interpolated keyframes to bones
    this._applyKeyframesUsing(anim, this.currentTime);

    // After applying, check if non-looping animation has ended
    if (!anim.loop && this.currentTime >= anim.duration) {
      this.currentAnimation = null;
      this.isPlaying = false;
      // Do NOT reset currentTime — leave it at duration so getCurrentTime() reflects end
    }
  }

  /**
   * Apply keyframe interpolation to all bones at the given time
   * Uses the passed animation reference (not this.currentAnimation) to support
   * applying the final frame even after stop() would clear it.
   * @param {Animation} anim - The animation to apply
   * @param {number} time - Current animation time in milliseconds
   * @private
   */
  _applyKeyframesUsing(anim, time) {
    if (!anim || anim.keyframes.length === 0) return;

    // Collect unique bone IDs from keyframes
    const boneIds = new Set();
    for (const kf of anim.keyframes) {
      boneIds.add(kf.boneId);
    }

    // Process each bone
    for (const boneId of boneIds) {
      const bone = this.skeleton.getBone(boneId);
      if (!bone) continue;

      const kfs = anim.getKeyframesForBone(boneId);
      if (kfs.length === 0) continue;

      // Find surrounding keyframes for interpolation
      const { prevKf, nextKf } = this._findSurroundingKeyframes(kfs, time);

      // Calculate interpolation factor
      const timeRange = nextKf.time - prevKf.time;
      const t = timeRange > 0 ? (time - prevKf.time) / timeRange : 0;

      // Interpolate and apply rotation
      this._interpolateRotation(bone, prevKf, nextKf, t);

      // Interpolate and apply position (if both keyframes have position data)
      if (prevKf.position && nextKf.position) {
        this._interpolatePosition(bone, prevKf, nextKf, t);
      } else if (prevKf.position) {
        // Only prev has position — apply it directly
        this._setPosition(bone, prevKf.position);
      }
    }
  }

  /**
   * Apply keyframe interpolation (convenience wrapper using currentAnimation)
   * @param {number} time - Current animation time in milliseconds
   * @private
   */
  _applyKeyframes(time) {
    this._applyKeyframesUsing(this.currentAnimation, time);
  }

  /**
   * Find the surrounding keyframes that bracket the given time
   * @param {Array} kfs - Sorted keyframes for a bone
   * @param {number} time - Current animation time
   * @returns {{prevKf: Object, nextKf: Object}}
   * @private
   */
  _findSurroundingKeyframes(kfs, time) {
    let prevKf = kfs[0];
    let nextKf = kfs[kfs.length - 1];

    // If time is at or before first keyframe
    if (time <= kfs[0].time) {
      return { prevKf: kfs[0], nextKf: kfs[0] };
    }

    // If time is at or after last keyframe
    if (time >= kfs[kfs.length - 1].time) {
      return { prevKf: kfs[kfs.length - 1], nextKf: kfs[kfs.length - 1] };
    }

    // Find the bracket
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
   * Interpolate rotation values between two keyframes and apply to bone
   * @param {Object} bone - Bone object with setRotation method
   * @param {Object} prevKf - Previous keyframe
   * @param {Object} nextKf - Next keyframe
   * @param {number} t - Interpolation factor [0, 1]
   * @private
   */
  _interpolateRotation(bone, prevKf, nextKf, t) {
    const prevRot = prevKf.rotation || {};
    const nextRot = nextKf.rotation || {};

    // Interpolate each rotation axis
    const x = (prevRot.x || 0) + ((nextRot.x || 0) - (prevRot.x || 0)) * t;
    const y = (prevRot.y || 0) + ((nextRot.y || 0) - (prevRot.y || 0)) * t;
    const z = (prevRot.z || 0) + ((nextRot.z || 0) - (prevRot.z || 0)) * t;

    // Apply Z rotation via bone's setRotation (2D-style API)
    if ('z' in prevRot || 'z' in nextRot) {
      bone.setRotation(z);
    }

    // Apply X and Y rotation directly if present
    if ('x' in prevRot || 'x' in nextRot) {
      bone.rotation.x = x;
    }
    if ('y' in prevRot || 'y' in nextRot) {
      bone.rotation.y = y;
    }
  }

  /**
   * Interpolate position values between two keyframes and apply to bone
   * @param {Object} bone - Bone object with position {x, y, z}
   * @param {Object} prevKf - Previous keyframe
   * @param {Object} nextKf - Next keyframe
   * @param {number} t - Interpolation factor [0, 1]
   * @private
   */
  _interpolatePosition(bone, prevKf, nextKf, t) {
    const prevPos = prevKf.position || {};
    const nextPos = nextKf.position || {};

    this._setPosition(bone, {
      x: (prevPos.x || 0) + ((nextPos.x || 0) - (prevPos.x || 0)) * t,
      y: (prevPos.y || 0) + ((nextPos.y || 0) - (prevPos.y || 0)) * t,
      z: (prevPos.z || 0) + ((nextPos.z || 0) - (prevPos.z || 0)) * t,
    });
  }

  /**
   * Set bone position, supporting both Vector3 and plain objects
   * @param {Object} bone - Bone object
   * @param {Object} pos - Position {x, y, z}
   * @private
   */
  _setPosition(bone, pos) {
    if (bone.position && typeof bone.position.set === 'function') {
      // Three.js Vector3-style
      bone.position.set(pos.x, pos.y, pos.z);
    } else {
      // Plain object
      bone.position.x = pos.x;
      bone.position.y = pos.y;
      bone.position.z = pos.z;
    }
  }
}

export { Animation, AnimationPlayer };