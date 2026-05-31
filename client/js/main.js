/** PuppetPals Client Entry Point
 * Initializes the client application, Three.js scene, and wires the join screen
 */

import SocketClient from './socket-client.js';
import AppState from './app-state.js';
import Renderer from './three/renderer.js';
import Scene from './three/scene.js';
import Camera from './three/camera.js';
import Lighting from './three/lighting.js';
import Stage from './three/stage.js';
import AssetBrowser from './assets/asset-browser.js';

// DOM Elements
let joinScreen, joinForm, nicknameInput, serverAddressInput, joinError, joinStatus, gameContainer;
let socketClient;
let assetBrowser;

// Movement bar elements (Request 19)
let movementBar, moveLeftBtn, moveRightBtn, moveOnStageBtn, slotLabel, slotPosition;

// Application state
let appState;

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

  // Movement bar elements (Request 19)
  movementBar = document.getElementById('movement-bar');
  moveLeftBtn = document.getElementById('move-left-btn');
  moveRightBtn = document.getElementById('move-right-btn');
  moveOnStageBtn = document.getElementById('move-on-stage-btn');
  slotLabel = document.getElementById('slot-label');
  slotPosition = document.getElementById('slot-position');
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
 * Initialize the Asset Browser after joining
 */
function initAssetBrowser() {
  const container = document.getElementById('asset-browser-container');
  const rawSocket = socketClient.getSocket();

  if (!container || !rawSocket) return;

  assetBrowser = new AssetBrowser({
    socket: rawSocket,
    container: container,
  });

  // Hide upload section for non-owners
  const isOwner = window.playerRole === 'owner';
  const uploadSection = container.querySelector('.asset-upload-section');
  if (uploadSection) {
    uploadSection.style.display = isOwner ? 'block' : 'none';
  }

  // Hide delete buttons for non-owners
  if (!isOwner) {
    const style = document.createElement('style');
    style.textContent = '.asset-delete-btn { display: none !important; }';
    container.appendChild(style);
  }

  // Request manifest after a short delay to ensure socket is ready
  setTimeout(() => {
    assetBrowser.requestManifest();
  }, 300);
}

/**
 * Setup asset panel toggle buttons
 */
function setupAssetPanelToggle() {
  const toggleBtn = document.getElementById('toggle-asset-panel');
  const closeBtn = document.getElementById('close-asset-panel');
  const panel = document.getElementById('asset-panel');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
    });
  }
}

// ============================================================
// Movement Bar (Request 19)
// ============================================================

/**
 * Initialize the movement bar UI
 */
function initMovementBar() {
  if (!movementBar || !moveLeftBtn || !moveRightBtn) return;

  // Show the movement bar
  movementBar.classList.remove('hidden');

  // Left button handler
  moveLeftBtn.addEventListener('click', () => {
    if (window.appState && window.appState.buttonsEnabled) {
      window.appState.requestMoveDirection('left');
      updateMovementButtons();
    }
  });

  // Right button handler
  moveRightBtn.addEventListener('click', () => {
    if (window.appState && window.appState.buttonsEnabled) {
      window.appState.requestMoveDirection('right');
      updateMovementButtons();
    }
  });

  // Move on-stage button handler
  if (moveOnStageBtn) {
    moveOnStageBtn.addEventListener('click', () => {
      if (window.appState && window.appState.buttonsEnabled) {
        window.appState.requestMoveOnStage();
        updateMovementButtons();
      }
    });
  }

  // Listen for state changes to update UI
  if (window.appState) {
    window.appState.on('slotMoved', (data) => {
      if (data.playerId === window.appState.localPlayerId) {
        updateSlotIndicator(data.toIndex);
      }
    });
  }
}

/**
 * Update movement button states based on cooldown
 */
function updateMovementButtons() {
  if (!window.appState) return;

  const enabled = window.appState.buttonsEnabled;
  if (moveLeftBtn) moveLeftBtn.disabled = !enabled;
  if (moveRightBtn) moveRightBtn.disabled = !enabled;
  if (moveOnStageBtn) moveOnStageBtn.disabled = !enabled;
}

/**
 * Update the slot indicator display
 * @param {number} slotIndex - Current slot index
 */
function updateSlotIndicator(slotIndex) {
  if (slotLabel) {
    slotLabel.textContent = `Slot ${slotIndex}`;
  }

  if (slotPosition) {
    const isOffScreen = slotIndex !== null && slotIndex < 2;
    if (isOffScreen) {
      slotPosition.textContent = 'OFF-SCREEN';
      slotPosition.classList.add('off-screen');
      if (moveOnStageBtn) moveOnStageBtn.classList.remove('hidden');
    } else {
      slotPosition.textContent = 'On-Screen';
      slotPosition.classList.remove('off-screen');
      if (moveOnStageBtn) moveOnStageBtn.classList.add('hidden');
    }
  }
}

/**
 * Periodically update movement button states (for cooldown sync)
 */
function startMovementButtonSync() {
  setInterval(() => {
    updateMovementButtons();
  }, 100);
}

/**
 * Update player info display
 */
function updatePlayerInfo() {
  const playerInfo = document.getElementById('player-info');
  if (playerInfo) {
    playerInfo.textContent = `${window.nickname} (${window.playerRole})`;
  }
}

/**
 * Hide the join screen and show the game
 */
function enterGame() {
  joinScreen.classList.add('hidden');
  if (gameContainer) {
    gameContainer.classList.remove('hidden');
  }

  // Update player info bar
  updatePlayerInfo();

  // Setup asset panel toggle
  setupAssetPanelToggle();

  // Initialize Three.js scene after entering the game
  initThreeJS();

  // Initialize asset browser
  initAssetBrowser();

  // Initialize movement bar (Request 19)
  initMovementBar();
  startMovementButtonSync();
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
  if (assetBrowser) {
    assetBrowser.destroy();
  }
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
  window.nickname = data.nickname;
  window.players = data.players;

  // Initialize app state
  appState = new AppState();
  appState.setSocketClient(socketClient);
  appState.setLocalPlayer(data.sessionId, `puppet-${data.sessionId}`, data.nickname);
  appState.setupSocketListeners();
  window.appState = appState;

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

  // Server address input has default value in HTML (http://localhost:3000)

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