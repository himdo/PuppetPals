/** Puppet Class - Main puppet controller combining skeleton system with Three.js rendering
 * Each player controls one puppet on the shared 3D stage
 * Handles rendering, movement, animation playback, and admin controls
 */

import * as THREE from 'three';
import Skeleton from './skeleton.js';
import MeshLoader from './mesh-loader.js';

class Puppet {
  /**
   * Create a puppet instance
   * @param {Object} config - Puppet configuration
   * @param {string} config.id - Unique puppet identifier
   * @param {string} config.ownerId - Socket ID of the owner
   * @param {string} config.name - Player's nickname
   */
  constructor(config = {}) {
    this.id = config.id || '';
    this.ownerId = config.ownerId || '';
    this.name = config.name || '';

    // Skeleton system
    this.skeleton = null;

    // Three.js group containing all bone meshes
    this.group = new THREE.Object3D();
    this.group.name = `puppet-${this.id}`;

    // Visual indicators
    this.nameLabel = null;
    this.lockIndicator = null;

    // Control state
    this.isOwnerControlled = config.isOwnerControlled || false;
    this.isLocked = false;
    this.isSelected = false;

    // Animation state
    this.currentAnimation = null;
    this.animationStartTime = null;

    // Movement state
    this.targetPosition = null;
    this.isMoving = false;
    this.moveSpeed = 5; // Units per second

    // Slot-based movement state (Request 19)
    this.currentSlotIndex = 0;
    this.targetSlotIndex = null;
    this.facingDirection = 'right'; // 'left' | 'right'
    
    // Transition config for wiggling motion
    this.transitionDuration = 400; // ms
    this.wiggleFrequency = 3; // cycles per transition
    this.wiggleAmplitude = 5; // px max displacement
    
    // Transition state
    this._transitionStartX = 0;
    this._transitionTargetX = 0;
    this._transitionStartTime = null;
    this._transitionDuration = this.transitionDuration;
    
    // Animation lifecycle hooks
    this.onMovementStart = null; // Callback when movement begins
    this.onMovementEnd = null;   // Callback when movement completes
    this._previousAnimation = null; // Stored animation before walk

    // Mesh loader for creating placeholder meshes
    this.meshLoader = new MeshLoader();
  }

  /**
   * Load puppet from skeleton configuration
   * Creates bone meshes and builds the Three.js scene graph
   * @param {Object} skeletonConfig - Skeleton JSON configuration
   * @param {string} assetBaseUrl - Base URL for asset loading
   */
  load(skeletonConfig, assetBaseUrl) {
    // Create skeleton from config
    this.skeleton = new Skeleton({ name: skeletonConfig.name || '' });
    this.skeleton.loadFromConfig(skeletonConfig);

    // Create placeholder meshes for all bones and add to group
    for (const bone of Object.values(this.skeleton.bones)) {
      // Create a placeholder mesh based on bone scale
      const width = bone.scale ? bone.scale.x : 1;
      const height = bone.scale ? bone.scale.y : 1;
      const mesh = this.meshLoader.createPlaceholderMesh(width, height, bone.id);

      // Position mesh at bone's local position
      mesh.position.set(bone.position.x, bone.position.y, bone.position.z);

      // Assign mesh to bone
      bone.setMesh(mesh);

      // Add to puppet group
      this.group.add(mesh);
    }

    // Create name label (represented as a simple mesh marker for now)
    this.nameLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.01, 0.01),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    this.nameLabel.name = `${this.id}-name-label`;
    this.nameLabel.position.set(0, 2, 0);
    this.group.add(this.nameLabel);

    // Create lock indicator
    this.lockIndicator = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      })
    );
    this.lockIndicator.name = `${this.id}-lock-indicator`;
    this.lockIndicator.position.set(0, 2.3, 0);
    this.lockIndicator.visible = false;
    this.group.add(this.lockIndicator);
  }

  /**
   * Update puppet state: movement, animation, and skeleton transforms
   * Called every frame
   */
  update() {
    if (!this.skeleton) return;

    // Update slot-based wiggling transition first (takes priority)
    this._updateSlotTransition();

    // Update smooth movement (legacy)
    this._updateMovement();

    // Update animation
    this._updateAnimation();

    // Update skeleton transforms
    this.skeleton.update();
  }

  /**
   * Update slot-based wiggling transition
   * Uses sine-wave offset during translation for "wiggling" effect
   * @private
   */
  _updateSlotTransition() {
    if (!this.isMoving || !this._transitionStartTime) return;

    const elapsed = Date.now() - this._transitionStartTime;
    const progress = Math.min(elapsed / this._transitionDuration, 1);

    if (progress >= 1) {
      // Transition complete
      this.group.position.x = this._transitionTargetX;
      this.isMoving = false;
      this._transitionStartTime = null;
      
      // Restore previous animation
      this._restorePreviousAnimation();
      
      return;
    }

    // Calculate base position (linear interpolation)
    const baseX = this._transitionStartX + (this._transitionTargetX - this._transitionStartX) * progress;
    
    // Calculate wiggle offset using sine wave
    // Wiggle decreases as progress approaches 1 (fade out)
    const wiggleAmount = Math.sin(progress * Math.PI * this.wiggleFrequency) * 
                        this.wiggleAmplitude * (1 - progress);
    
    // Apply position with wiggle
    this.group.position.x = baseX + wiggleAmount;
  }

  /**
   * Restore the previous animation after movement completes
   * @private
   */
  _restorePreviousAnimation() {
    if (this._previousAnimation) {
      this.playAnimation(this._previousAnimation);
      this._previousAnimation = null;
    } else {
      this.stopAnimation();
    }
    
    // Call lifecycle hook
    if (typeof this.onMovementEnd === 'function') {
      this.onMovementEnd();
    }
  }

  /**
   * Update smooth movement toward target position
   * @private
   */
  _updateMovement() {
    if (!this.isMoving || !this.targetPosition) return;

    const currentPos = this.group.position;
    const dx = this.targetPosition.x - currentPos.x;
    const dz = this.targetPosition.z - currentPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Check if reached target (within threshold)
    if (distance < 0.01) {
      currentPos.x = this.targetPosition.x;
      currentPos.z = this.targetPosition.z;
      this.isMoving = false;
      this.targetPosition = null;
      return;
    }

    // Move toward target
    const moveStep = Math.min(this.moveSpeed * 0.016, distance); // Clamp to avoid overshoot
    const ratio = moveStep / distance;

    currentPos.x += dx * ratio;
    currentPos.z += dz * ratio;

    // Face movement direction
    if (Math.abs(dx) > 0.01) {
      this.group.rotation.y = dx > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }

  /**
   * Update animation keyframes
   * @private
   */
  _updateAnimation() {
    if (!this.currentAnimation || !this.animationStartTime) return;

    const elapsed = Date.now() - this.animationStartTime;
    const duration = this.currentAnimation.duration;

    // Check if animation is complete
    if (elapsed >= duration) {
      if (this.currentAnimation.loop) {
        // Reset start time for looping
        this.animationStartTime = Date.now();
      } else {
        // Stop non-looping animation
        this.stopAnimation();
        return;
      }
    }

    // Calculate current time within animation cycle
    const currentTime = elapsed % duration;

    // Apply keyframes
    const keyframes = this.currentAnimation.keyframes || [];
    if (keyframes.length === 0) return;

    // Group keyframes by bone
    const boneKeyframes = {};
    for (const kf of keyframes) {
      if (!boneKeyframes[kf.boneId]) {
        boneKeyframes[kf.boneId] = [];
      }
      boneKeyframes[kf.boneId].push(kf);
    }

    // Sort each bone's keyframes by time
    for (const boneId of Object.keys(boneKeyframes)) {
      boneKeyframes[boneId].sort((a, b) => a.time - b.time);
    }

    // Apply interpolated rotations to bones
    for (const [boneId, kfs] of Object.entries(boneKeyframes)) {
      const bone = this.skeleton.getBone(boneId);
      if (!bone) continue;

      // Find surrounding keyframes for interpolation
      let prevKf = kfs[0];
      let nextKf = kfs[kfs.length - 1];

      for (let i = 0; i < kfs.length - 1; i++) {
        if (currentTime >= kfs[i].time && currentTime <= kfs[i + 1].time) {
          prevKf = kfs[i];
          nextKf = kfs[i + 1];
          break;
        }
      }

      // Interpolate between keyframes
      const timeRange = nextKf.time - prevKf.time;
      const t = timeRange > 0 ? (currentTime - prevKf.time) / timeRange : 0;

      // Apply Z rotation interpolation
      if (prevKf.rotation && nextKf.rotation) {
        const prevZ = prevKf.rotation.z || 0;
        const nextZ = nextKf.rotation.z || 0;
        const interpolatedZ = prevZ + (nextZ - prevZ) * t;
        bone.setRotation(interpolatedZ);
      }

      // Apply position interpolation if present
      if (prevKf.position && nextKf.position) {
        const prevPos = prevKf.position;
        const nextPos = nextKf.position;
        bone.position.set(
          (prevPos.x || 0) + ((nextPos.x || 0) - (prevPos.x || 0)) * t,
          (prevPos.y || 0) + ((nextPos.y || 0) - (prevPos.y || 0)) * t,
          (prevPos.z || 0) + ((nextPos.z || 0) - (prevPos.z || 0)) * t
        );
      }
    }
  }

  /**
   * Move puppet to a stage position with smooth interpolation
   * @param {Object} position - Target position {x, y, z}
   */
  moveTo(position) {
    this.targetPosition = {
      x: position.x || 0,
      y: position.y || 0,
      z: position.z || 0,
    };
    this.isMoving = true;
  }

  /**
   * Move puppet to a slot position with smooth wiggling transition
   * @param {number} targetX - Target X position in world space
   * @param {number} [duration=this.transitionDuration] - Transition duration in ms
   * @param {'left'|'right'} direction - Movement direction for sprite flipping
   */
  moveToSlot(targetX, duration, direction) {
    // Store current animation as "previous" for restoration
    this._previousAnimation = this.currentAnimation;
    
    // Start transition from current position
    this._transitionStartX = this.group.position.x;
    this._transitionTargetX = targetX;
    this._transitionStartTime = Date.now();
    this._transitionDuration = duration || this.transitionDuration;
    
    // Set facing direction
    this.facingDirection = direction || 'right';
    this.setFacingDirection(this.facingDirection);
    
    // Mark as moving
    this.isMoving = true;
    
    // Call lifecycle hook
    if (typeof this.onMovementStart === 'function') {
      this.onMovementStart();
    }
  }

  /**
   * Set the puppet's facing direction by flipping the sprite horizontally
   * @param {'left'|'right'} direction - Direction to face
   */
  setFacingDirection(direction) {
    if (direction === 'left') {
      this.facingDirection = 'left';
      this.group.scale.x = -1;
    } else if (direction === 'right') {
      this.facingDirection = 'right';
      this.group.scale.x = 1;
    }
    // Invalid directions are ignored
  }

  /**
   * Rotate a specific bone by the given angle
   * @param {string} boneId - ID of the bone to rotate
   * @param {number} angle - Rotation angle in radians
   */
  setBoneRotation(boneId, angle) {
    if (!this.skeleton) return;
    const bone = this.skeleton.getBone(boneId);
    if (!bone) return;
    bone.setRotation(angle);
  }

  /**
   * Start animation playback
   * @param {Object} animation - Animation object with keyframes
   */
  playAnimation(animation) {
    // Stop any currently playing animation
    this.stopAnimation();

    this.currentAnimation = animation;
    this.animationStartTime = Date.now();
  }

  /**
   * Stop current animation
   */
  stopAnimation() {
    this.currentAnimation = null;
    this.animationStartTime = null;
  }

  /**
   * Lock puppet to prevent owner from controlling
   * Used by server owner admin controls
   */
  lock() {
    this.isLocked = true;
    if (this.lockIndicator) {
      this.lockIndicator.visible = true;
    }
  }

  /**
   * Unlock puppet to restore owner control
   */
  unlock() {
    this.isLocked = false;
    if (this.lockIndicator) {
      this.lockIndicator.visible = false;
    }
  }

  /**
   * Instantly teleport puppet to new position (admin only)
   * @param {Object} position - Target position {x, y, z}
   */
  teleportTo(position) {
    this.group.position.set(
      position.x || 0,
      position.y || 0,
      position.z || 0
    );
    this.isMoving = false;
    this.targetPosition = null;
  }

  /**
   * Select this puppet for visual highlighting
   */
  select() {
    this.isSelected = true;
  }

  /**
   * Deselect this puppet
   */
  deselect() {
    this.isSelected = false;
  }

  /**
   * Update the puppet's display name
   * @param {string} newName - New display name
   */
  setName(newName) {
    this.name = newName;
  }

  /**
   * Dispose of puppet resources
   * Remove meshes, clear references, stop animations
   */
  dispose() {
    // Stop animation
    this.stopAnimation();

    // Clear movement state
    this.isMoving = false;
    this.targetPosition = null;

    // Remove all children from group
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child.geometry && child.geometry.dispose) {
        child.geometry.dispose();
      }
      if (child.material && child.material.dispose) {
        child.material.dispose();
      }
    }

    // Dispose meshes via mesh loader
    this.meshLoader.disposeAll();

    // Clear skeleton
    this.skeleton = null;
  }
}

export default Puppet;