/** PuppetPals Client Entry Point
 * Initializes the client application and wires the join screen
 */

import SocketClient from './socket-client.js';

// DOM Elements
let joinScreen, joinForm, nicknameInput, serverAddressInput, joinError, joinStatus, gameContainer;
let socketClient;

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

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}