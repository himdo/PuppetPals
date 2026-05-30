/** Animation Library - Pre-defined animations for puppet characters
 * Provides 8 built-in animations: idle, walk, run, jump, wave, sit, dance, wave-hand
 * Uses standard bone IDs matching the default puppet skeleton configuration
 */

import { Animation } from './animation-system.js';

// Convert degrees to radians for rotation values
const deg = (d) => (d * Math.PI) / 180;

// =============================================
// Individual Animation Definitions
// =============================================

/**
 * Idle animation - subtle breathing/bobbing
 * Loop: true
 */
const idleAnimation = new Animation({
  id: 'idle',
  name: 'Idle Breathing',
  duration: 2000,
  loop: true,
  keyframes: [
    // Subtle torso bobbing up and down
    { time: 0, boneId: 'torso', position: { x: 0, y: 0, z: 0 } },
    { time: 1000, boneId: 'torso', position: { x: 0, y: 0.05, z: 0 } },
    { time: 2000, boneId: 'torso', position: { x: 0, y: 0, z: 0 } },
    // Head follows torso slightly
    { time: 0, boneId: 'head', position: { x: 0, y: 0, z: 0 } },
    { time: 1000, boneId: 'head', position: { x: 0, y: 0.03, z: 0 } },
    { time: 2000, boneId: 'head', position: { x: 0, y: 0, z: 0 } },
  ],
});

/**
 * Walk animation - walking leg/arm cycle
 * Loop: true
 */
const walkAnimation = new Animation({
  id: 'walk',
  name: 'Walk Cycle',
  duration: 1000,
  loop: true,
  keyframes: [
    // Left leg forward then back
    { time: 0, boneId: 'upper-leg-l', rotation: { z: deg(25) } },
    { time: 500, boneId: 'upper-leg-l', rotation: { z: deg(-25) } },
    { time: 1000, boneId: 'upper-leg-l', rotation: { z: deg(25) } },
    // Right leg opposite phase
    { time: 0, boneId: 'upper-leg-r', rotation: { z: deg(-25) } },
    { time: 500, boneId: 'upper-leg-r', rotation: { z: deg(25) } },
    { time: 1000, boneId: 'upper-leg-r', rotation: { z: deg(-25) } },
    // Lower legs follow
    { time: 0, boneId: 'lower-leg-l', rotation: { z: deg(-10) } },
    { time: 500, boneId: 'lower-leg-l', rotation: { z: deg(10) } },
    { time: 1000, boneId: 'lower-leg-l', rotation: { z: deg(-10) } },
    { time: 0, boneId: 'lower-leg-r', rotation: { z: deg(10) } },
    { time: 500, boneId: 'lower-leg-r', rotation: { z: deg(-10) } },
    { time: 1000, boneId: 'lower-leg-r', rotation: { z: deg(10) } },
    // Arms swing opposite to legs
    { time: 0, boneId: 'upper-arm-l', rotation: { z: deg(-20) } },
    { time: 500, boneId: 'upper-arm-l', rotation: { z: deg(20) } },
    { time: 1000, boneId: 'upper-arm-l', rotation: { z: deg(-20) } },
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(20) } },
    { time: 500, boneId: 'upper-arm-r', rotation: { z: deg(-20) } },
    { time: 1000, boneId: 'upper-arm-r', rotation: { z: deg(20) } },
    // Lower arms
    { time: 0, boneId: 'lower-arm-l', rotation: { z: deg(-15) } },
    { time: 500, boneId: 'lower-arm-l', rotation: { z: deg(15) } },
    { time: 1000, boneId: 'lower-arm-l', rotation: { z: deg(-15) } },
    { time: 0, boneId: 'lower-arm-r', rotation: { z: deg(15) } },
    { time: 500, boneId: 'lower-arm-r', rotation: { z: deg(-15) } },
    { time: 1000, boneId: 'lower-arm-r', rotation: { z: deg(15) } },
  ],
});

/**
 * Run animation - faster walk cycle with more extreme angles
 * Loop: true
 */
const runAnimation = new Animation({
  id: 'run',
  name: 'Run Cycle',
  duration: 500,
  loop: true,
  keyframes: [
    // Left leg - bigger swings
    { time: 0, boneId: 'upper-leg-l', rotation: { z: deg(45) } },
    { time: 250, boneId: 'upper-leg-l', rotation: { z: deg(-45) } },
    { time: 500, boneId: 'upper-leg-l', rotation: { z: deg(45) } },
    // Right leg opposite
    { time: 0, boneId: 'upper-leg-r', rotation: { z: deg(-45) } },
    { time: 250, boneId: 'upper-leg-r', rotation: { z: deg(45) } },
    { time: 500, boneId: 'upper-leg-r', rotation: { z: deg(-45) } },
    // Lower legs bent more
    { time: 0, boneId: 'lower-leg-l', rotation: { z: deg(-30) } },
    { time: 250, boneId: 'lower-leg-l', rotation: { z: deg(30) } },
    { time: 500, boneId: 'lower-leg-l', rotation: { z: deg(-30) } },
    { time: 0, boneId: 'lower-leg-r', rotation: { z: deg(30) } },
    { time: 250, boneId: 'lower-leg-r', rotation: { z: deg(-30) } },
    { time: 500, boneId: 'lower-leg-r', rotation: { z: deg(30) } },
    // Arms swing wider
    { time: 0, boneId: 'upper-arm-l', rotation: { z: deg(-40) } },
    { time: 250, boneId: 'upper-arm-l', rotation: { z: deg(40) } },
    { time: 500, boneId: 'upper-arm-l', rotation: { z: deg(-40) } },
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(40) } },
    { time: 250, boneId: 'upper-arm-r', rotation: { z: deg(-40) } },
    { time: 500, boneId: 'upper-arm-r', rotation: { z: deg(40) } },
    // Torso lean forward slightly
    { time: 0, boneId: 'torso', rotation: { z: deg(5) } },
    { time: 500, boneId: 'torso', rotation: { z: deg(5) } },
  ],
});

/**
 * Jump animation - crouch, jump up, land
 * Loop: false (one-shot)
 */
const jumpAnimation = new Animation({
  id: 'jump',
  name: 'Jump',
  duration: 800,
  loop: false,
  keyframes: [
    // Phase 1: Crouch (0-150ms)
    { time: 0, boneId: 'torso', position: { x: 0, y: 0, z: 0 } },
    { time: 150, boneId: 'torso', position: { x: 0, y: -0.15, z: 0 } },
    // Phase 2: Jump up (150-400ms)
    { time: 400, boneId: 'torso', position: { x: 0, y: 0.6, z: 0 } },
    // Phase 3: Land (400-800ms)
    { time: 650, boneId: 'torso', position: { x: 0, y: -0.1, z: 0 } },
    { time: 800, boneId: 'torso', position: { x: 0, y: 0, z: 0 } },
    // Legs bend during crouch and landing
    { time: 0, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 150, boneId: 'upper-leg-l', rotation: { z: deg(20) } },
    { time: 400, boneId: 'upper-leg-l', rotation: { z: deg(-15) } },
    { time: 650, boneId: 'upper-leg-l', rotation: { z: deg(25) } },
    { time: 800, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 0, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
    { time: 150, boneId: 'upper-leg-r', rotation: { z: deg(-20) } },
    { time: 400, boneId: 'upper-leg-r', rotation: { z: deg(15) } },
    { time: 650, boneId: 'upper-leg-r', rotation: { z: deg(-25) } },
    { time: 800, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
    // Arms go up during jump
    { time: 0, boneId: 'upper-arm-l', rotation: { z: deg(0) } },
    { time: 150, boneId: 'upper-arm-l', rotation: { z: deg(30) } },
    { time: 400, boneId: 'upper-arm-l', rotation: { z: deg(-50) } },
    { time: 650, boneId: 'upper-arm-l', rotation: { z: deg(15) } },
    { time: 800, boneId: 'upper-arm-l', rotation: { z: deg(0) } },
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    { time: 150, boneId: 'upper-arm-r', rotation: { z: deg(-30) } },
    { time: 400, boneId: 'upper-arm-r', rotation: { z: deg(50) } },
    { time: 650, boneId: 'upper-arm-r', rotation: { z: deg(-15) } },
    { time: 800, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
  ],
});

/**
 * Wave animation - arm waving greeting (looping)
 * Loop: true
 */
const waveAnimation = new Animation({
  id: 'wave',
  name: 'Wave',
  duration: 1200,
  loop: true,
  keyframes: [
    // Raise right arm
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(-60) } },
    { time: 200, boneId: 'upper-arm-r', rotation: { z: deg(-80) } },
    // Wave back and forth
    { time: 200, boneId: 'lower-arm-r', rotation: { z: deg(0) } },
    { time: 400, boneId: 'lower-arm-r', rotation: { z: deg(-30) } },
    { time: 600, boneId: 'lower-arm-r', rotation: { z: deg(30) } },
    { time: 800, boneId: 'lower-arm-r', rotation: { z: deg(-30) } },
    { time: 1000, boneId: 'lower-arm-r', rotation: { z: deg(30) } },
    { time: 1200, boneId: 'lower-arm-r', rotation: { z: deg(0) } },
    // Slight torso sway
    { time: 0, boneId: 'torso', rotation: { z: deg(0) } },
    { time: 600, boneId: 'torso', rotation: { z: deg(3) } },
    { time: 1200, boneId: 'torso', rotation: { z: deg(0) } },
  ],
});

/**
 * Sit animation - sit down pose (one-shot)
 * Loop: false
 */
const sitAnimation = new Animation({
  id: 'sit',
  name: 'Sit Down',
  duration: 600,
  loop: false,
  keyframes: [
    // Torso lowers
    { time: 0, boneId: 'torso', position: { x: 0, y: 0, z: 0 } },
    { time: 600, boneId: 'torso', position: { x: 0, y: -0.5, z: 0 } },
    // Legs bend for sitting
    { time: 0, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 600, boneId: 'upper-leg-l', rotation: { z: deg(-80) } },
    { time: 0, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
    { time: 600, boneId: 'upper-leg-r', rotation: { z: deg(80) } },
    // Lower legs extend forward
    { time: 0, boneId: 'lower-leg-l', rotation: { z: deg(0) } },
    { time: 600, boneId: 'lower-leg-l', rotation: { z: deg(70) } },
    { time: 0, boneId: 'lower-leg-r', rotation: { z: deg(0) } },
    { time: 600, boneId: 'lower-leg-r', rotation: { z: deg(-70) } },
    // Arms rest
    { time: 0, boneId: 'upper-arm-l', rotation: { z: deg(0) } },
    { time: 600, boneId: 'upper-arm-l', rotation: { z: deg(15) } },
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    { time: 600, boneId: 'upper-arm-r', rotation: { z: deg(-15) } },
  ],
});

/**
 * Dance animation - energetic dance moves
 * Loop: true
 */
const danceAnimation = new Animation({
  id: 'dance',
  name: 'Dance',
  duration: 1600,
  loop: true,
  keyframes: [
    // Torso sways side to side
    { time: 0, boneId: 'torso', rotation: { z: deg(0) } },
    { time: 400, boneId: 'torso', rotation: { z: deg(8) } },
    { time: 800, boneId: 'torso', rotation: { z: deg(0) } },
    { time: 1200, boneId: 'torso', rotation: { z: deg(-8) } },
    { time: 1600, boneId: 'torso', rotation: { z: deg(0) } },
    // Head bobs
    { time: 0, boneId: 'head', rotation: { z: deg(0) } },
    { time: 400, boneId: 'head', rotation: { z: deg(-10) } },
    { time: 800, boneId: 'head', rotation: { z: deg(10) } },
    { time: 1200, boneId: 'head', rotation: { z: deg(-10) } },
    { time: 1600, boneId: 'head', rotation: { z: deg(0) } },
    // Arms dance
    { time: 0, boneId: 'upper-arm-l', rotation: { z: deg(0) } },
    { time: 400, boneId: 'upper-arm-l', rotation: { z: deg(-70) } },
    { time: 800, boneId: 'upper-arm-l', rotation: { z: deg(20) } },
    { time: 1200, boneId: 'upper-arm-l', rotation: { z: deg(-70) } },
    { time: 1600, boneId: 'upper-arm-l', rotation: { z: deg(0) } },
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    { time: 400, boneId: 'upper-arm-r', rotation: { z: deg(20) } },
    { time: 800, boneId: 'upper-arm-r', rotation: { z: deg(-70) } },
    { time: 1200, boneId: 'upper-arm-r', rotation: { z: deg(20) } },
    { time: 1600, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    // Legs bounce
    { time: 0, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 400, boneId: 'upper-leg-l', rotation: { z: deg(15) } },
    { time: 800, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 1200, boneId: 'upper-leg-l', rotation: { z: deg(-15) } },
    { time: 1600, boneId: 'upper-leg-l', rotation: { z: deg(0) } },
    { time: 0, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
    { time: 400, boneId: 'upper-leg-r', rotation: { z: deg(-15) } },
    { time: 800, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
    { time: 1200, boneId: 'upper-leg-r', rotation: { z: deg(15) } },
    { time: 1600, boneId: 'upper-leg-r', rotation: { z: deg(0) } },
  ],
});

/**
 * Wave-hand animation - single hand wave (one-shot)
 * Loop: false
 */
const waveHandAnimation = new Animation({
  id: 'wave-hand',
  name: 'Wave Hand',
  duration: 1000,
  loop: false,
  keyframes: [
    // Raise arm
    { time: 0, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    { time: 200, boneId: 'upper-arm-r', rotation: { z: deg(-85) } },
    // Wave a few times
    { time: 200, boneId: 'lower-arm-r', rotation: { z: deg(0) } },
    { time: 350, boneId: 'lower-arm-r', rotation: { z: deg(-25) } },
    { time: 500, boneId: 'lower-arm-r', rotation: { z: deg(25) } },
    { time: 650, boneId: 'lower-arm-r', rotation: { z: deg(-25) } },
    { time: 800, boneId: 'lower-arm-r', rotation: { z: deg(25) } },
    // Lower arm
    { time: 800, boneId: 'lower-arm-r', rotation: { z: deg(0) } },
    { time: 800, boneId: 'upper-arm-r', rotation: { z: deg(-85) } },
    { time: 1000, boneId: 'upper-arm-r', rotation: { z: deg(0) } },
    { time: 1000, boneId: 'lower-arm-r', rotation: { z: deg(0) } },
  ],
});

// =============================================
// Animation Library Registry
// =============================================

/**
 * Central registry of all pre-defined animations
 * @type {Object.<string, Animation>}
 */
export const ANIMATION_LIBRARY = {
  idle: idleAnimation,
  walk: walkAnimation,
  run: runAnimation,
  jump: jumpAnimation,
  wave: waveAnimation,
  sit: sitAnimation,
  dance: danceAnimation
};

// Add wave-hand separately to avoid object key issues (hyphen is fine in objects)
ANIMATION_LIBRARY['wave-hand'] = waveHandAnimation;

// =============================================
// Convenience Getter Functions
// =============================================

export function getIdleAnimation() {
  return idleAnimation;
}

export function getWalkAnimation() {
  return walkAnimation;
}

export function getRunAnimation() {
  return runAnimation;
}

export function getJumpAnimation() {
  return jumpAnimation;
}

export function getWaveAnimation() {
  return waveAnimation;
}

export function getSitAnimation() {
  return sitAnimation;
}

export function getDanceAnimation() {
  return danceAnimation;
}

export function getWaveHandAnimation() {
  return waveHandAnimation;
}

/**
 * Get all animations as an array
 * @returns {Animation[]} Array of all pre-defined animations
 */
export function getAllAnimations() {
  return Object.values(ANIMATION_LIBRARY);
}

/**
 * Get a specific animation by its ID
 * @param {string} id - Animation identifier
 * @returns {Animation|null} The animation or null if not found
 */
export function getAnimation(id) {
  if (!id || typeof id !== 'string') return null;
  return ANIMATION_LIBRARY[id] || null;
}