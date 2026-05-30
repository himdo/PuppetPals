/** PuppetPals Client Entry Point
 * Initializes the client application
 */

/**
 * Show the loading screen initially
 */
function showLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.remove('hidden');
  }
}

/**
 * Hide the loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
  }
}

/**
 * Show the join screen
 */
function showJoinScreen() {
  hideLoadingScreen();
  const joinScreen = document.getElementById('join-screen');
  if (joinScreen) {
    joinScreen.classList.remove('hidden');
  }
}

/**
 * Initialize the client application
 */
async function init() {
  showLoadingScreen();

  // For now, show the join screen after a brief delay
  // The full application will be built in subsequent requests
  setTimeout(() => {
    showJoinScreen();
  }, 1000);
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}