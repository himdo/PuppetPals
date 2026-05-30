/** PuppetPals Client Entry Point
 * Initializes the client application, Three.js scene, and wires the join screen
 */

import SocketClient from './socket-client.js';
import Renderer from './three/renderer.js';
import Scene from './three/scene.js';
import Camera from './three/camera.js';
import Lighting from './three/lighting.js';
import Stage from './three/stage.js';

// DOM Elements
let joinScreen, joinForm, nicknameInput, serverAddressInput, joinError, joinStatus, gameContainer;
let socketClient;

// Three.js components
let threeRenderer;
let threeScene;
let threeCamera;
let threeLighting;
let threeStage;
let isRendering = false;
let animationFrameId = null;

/**
 * Cache DOM elements
 */
function cacheElements() {
  joinScreen = document.getElementById('join-screen');
  joinForm = document.getElementById('join-form');
  nicknameInput = document.getElementById('nickname');
  serverAddressInput = document.getElementById('server-address');
  joinError = document.getElementById('join-error');
  joinStatus = document.getElementById('join-status');
  gameContainer = document.getElementById('game-container');
}

/**
 * Show error message on join screen
 * @param {string} message
 */
function showJoinError(message) {
  joinError.textContent = message;
  joinError.classList.remove('hidden');
  joinStatus.classList.add('hidden');
}

/**
 * Hide error message on join screen
 */
function hideJoinError() {
  joinError.textContent = '';
  joinError.classList.add('hidden');
}

/**
 * Show connection status message
 * @param {string} message
 */
function showJoinStatus(message) {
  joinStatus.textContent = message;
  joinStatus.classList.remove('hidden');
  hideJoinError();
}

/**
 * Hide status message
 */
function hideJoinStatus() {
  joinStatus.classList.add('hidden');
}

/**
 * Hide the join screen and show the game
 */
function enterGame() {
  joinScreen.classList.add('hidden');
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
  }

  // Initialize Three.js scene after entering the game
  initThreeJS();
}

/**
 * Initialize all Three.js components
 */
function initThreeJS() {
  const canvas = document.getElementById('stage-canvas');
  if (!canvas) {
    console.error('[ThreeJS] Canvas element #stage-canvas not found');
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  // 1. Create the scene
  threeScene = new Scene();

  // 2. Create the renderer
  threeRenderer = new Renderer(canvas, {
    antialias: true,
    alpha: false,
    clearColor: 0x1a1a2e,
    clearAlpha: 1,
  });
  threeRenderer.init(width, height);

  // 3. Create the camera
  threeCamera = new Camera(canvas);

  // 4. Setup lighting
  threeLighting = new Lighting(threeScene.getScene());
  threeLighting.setupBasicLighting();

  // 5. Setup the stage
  threeStage = new Stage(threeScene.getScene());
  threeStage.setupStage();

  console.log('[ThreeJS] Scene initialized successfully');

  // Start the render loop
  startRenderLoop();

  // Handle window resize
  window.addEventListener('resize', handleWindowResize);
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (threeRenderer) {
    threeRenderer.handleResize(width, height);
  }
  if (threeCamera) {
    threeCamera.handleResize(width, height);
  }
}

/**
 * Start the render loop using requestAnimationFrame
 */
function startRenderLoop() {
  if (isRendering) return;
  isRendering = true;

  function render() {
    if (!isRendering) return;

    // Update camera controls
    if (threeCamera) {
      threeCamera.update();
    }

    // Render the scene
    if (threeRenderer && threeScene && threeCamera) {
      threeRenderer.render(
        threeScene.getScene(),
        threeCamera.getCamera()
      );
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();
}

/**
 * Stop the render loop and clean up Three.js resources
 */
function stopRenderLoop() {
  isRendering = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Clean up Three.js resources
  if (threeCamera) {
    threeCamera.dispose();
    threeCamera = null;
  }

  if (threeRenderer) {
    threeRenderer.dispose();
    threeRenderer = null;
  }

  // Remove resize listener
  window.removeEventListener('resize', handleWindowResize);
}

/**
 * Clean up all resources on page unload
 */
function cleanup() {
  stopRenderLoop();
}

/**
 * Handle join form submission
 * @param {Event} event
 */
async function handleJoin(event) {
  event.preventDefault();
  hideJoinError();
  hideJoinStatus();

  const nickname = nicknameInput.value.trim();
  const serverUrl = serverAddressInput.value.trim();

  if (!nickname) {
    showJoinError('Please enter a nickname.');
    return;
  }

  showJoinStatus('Connecting to server...');

  try {
    // Create and connect socket client
    socketClient = new SocketClient();

    // Register event listeners before connecting
    socketClient.on('join-confirmed', handleJoinConfirmed);
    socketClient.on('nickname-taken', handleNicknameTaken);
    socketClient.on('player-disconnected', handlePlayerDisconnected);
    socketClient.on('reconnect-failed', handleReconnectFailed);

    await socketClient.connect(serverUrl || window.location.origin);
    showJoinStatus('Connected! Joining with nickname...');

    // Request to join with nickname
    socketClient.join(nickname);

  } catch (error) {
    showJoinError('Failed to connect to server. Please check the address and try again.');
    console.error('[Main] Connection failed:', error);
  }
}

/**
 * Handle successful join confirmation from server
 * @param {Object} data
 */
function handleJoinConfirmed(data) {
  console.log('[Main] Join confirmed:', data);
  showJoinStatus(`Welcome, ${data.nickname}! Role: ${data.role}`);

  // Store session info
  window.playerRole = data.role;
  window.players = data.players;

  // Transition to game view
  setTimeout(() => {
    enterGame();
  }, 500);
}

/**
 * Handle nickname taken error from server
 * @param {Object} data
 */
function handleNicknameTaken(data) {
  showJoinError(data.message || 'That nickname is already taken.');
  console.warn('[Main] Nickname taken:', data.message);
}

/**
 * Handle player disconnected broadcast
 * @param {Object} data
 */
function handlePlayerDisconnected(data) {
  if (data._type === 'player_joined') {
    console.log(`[Main] Player joined: ${data.nickname}`);
    if (window.players) {
      window.players = data.players;
    }
  } else {
    console.log(`[Main] Player disconnected: ${data.nickname}`);
    if (data.players) {
      window.players = data.players;
    }
  }
}

/**
 * Handle reconnection failure
 * @param {Object} data
 */
function handleReconnectFailed(data) {
  console.error('[Main] Reconnection failed after', data.attempts, 'attempts');
  // Show the join screen again so the user can retry manually
  joinScreen.classList.remove('hidden');
  showJoinError('Connection lost. Please try connecting again.');
}

/**
 * Initialize the client application
 */
function init() {
  cacheElements();

  // Set default server address
  if (serverAddressInput && !serverAddressInput.value) {
    serverAddressInput.placeholder = window.location.origin;
  }

  // Attach form submit handler
  if (joinForm) {
    joinForm.addEventListener('submit', handleJoin);
  }

  // Allow pressing Enter in nickname field
  if (nicknameInput) {
    nicknameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        joinForm.requestSubmit();
      }
    });
  }

  // Focus the nickname input
  if (nicknameInput) {
    nicknameInput.focus();
  }
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanup);

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
