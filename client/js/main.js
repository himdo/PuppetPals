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
import PuppetEditor from './puppet/puppet-editor.js';
import PuppetPanel from './ui/puppet-panel.js';
import VisualEditor from './puppet/visual-editor.js';

// DOM Elements
let joinScreen, joinForm, nicknameInput, serverAddressInput, joinError, joinStatus, gameContainer;
let socketClient;
let assetBrowser;

// Movement bar elements (Request 19)
let movementBar, moveLeftBtn, moveRightBtn, moveOnStageBtn, slotLabel, slotPosition;

// Puppet Editor elements
let puppetEditorOverlay, editorBoneList, editorProperties, editorChangesIndicator;
let openEditorBtn, editorCloseBtn, editorResetBtn, editorSortYBtn, editorExportBtn, editorApplyBtn;
let puppetBuilderBar;

// Visual Editor elements
let visualEditorOverlay, visualEditorContainer, veCloseBtn;

// Puppet Editor instances
let puppetEditor;
let puppetPanel;
let visualEditor;

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

  // Puppet Builder bar
  puppetBuilderBar = document.getElementById('puppet-builder-bar');
  openEditorBtn = document.getElementById('open-editor-btn');

  // Puppet Editor overlay elements
  puppetEditorOverlay = document.getElementById('puppet-editor-overlay');
  editorBoneList = document.getElementById('editor-bone-list');
  editorProperties = document.getElementById('editor-properties');
  editorChangesIndicator = document.getElementById('editor-changes-indicator');
  openEditorBtn = document.getElementById('open-editor-btn');
  editorCloseBtn = document.getElementById('editor-close-btn');
  editorResetBtn = document.getElementById('editor-reset-btn');
  editorSortYBtn = document.getElementById('editor-sort-y-btn');
  editorExportBtn = document.getElementById('editor-export-btn');
  editorApplyBtn = document.getElementById('editor-apply-btn');

  // Visual Editor overlay elements
  visualEditorOverlay = document.getElementById('visual-editor-overlay');
  visualEditorContainer = document.getElementById('visual-editor-container');
  veCloseBtn = document.getElementById('ve-close-btn');
  const openVisualEditorBtn = document.getElementById('open-visual-editor-btn');
  if (openVisualEditorBtn) {
    openVisualEditorBtn.addEventListener('click', () => openVisualEditor());
  }
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

// ============================================================
// Puppet Editor (Request 7 - In-Browser Puppet Builder)
// ============================================================

/**
 * Initialize the Puppet Editor and Puppet Panel
 */
function initPuppetEditor() {
  const rawSocket = socketClient ? socketClient.getSocket() : null;
  if (!rawSocket) {
    console.warn('[Main] No socket available for PuppetEditor');
    return;
  }

  // Create the editor instance
  puppetEditor = new PuppetEditor({ socket: rawSocket });

  // Create the panel instance
  puppetPanel = new PuppetPanel(rawSocket);
  puppetPanel.setEditorCallback(() => openPuppetEditor());

  // Show the builder bar
  if (puppetBuilderBar) {
    puppetBuilderBar.classList.remove('hidden');
  }

  // Wire up editor UI buttons
  setupEditorUI();

  // Setup socket listeners for puppet sync
  setupPuppetEditorSocketListeners();

  // Initialize the visual editor
  initVisualEditor();

  console.log('[Main] Puppet Editor initialized');
}

// ============================================================
// Visual Editor (Drag-and-Drop Puppet Builder)
// ============================================================

/**
 * Initialize the Visual Editor
 */
function initVisualEditor() {
  if (!visualEditorContainer) {
    console.warn('[Main] Visual editor container not found');
    return;
  }

  const rawSocket = socketClient ? socketClient.getSocket() : null;

  visualEditor = new VisualEditor({
    container: visualEditorContainer,
    socket: rawSocket,
    assetBrowser: assetBrowser,
  });

  // Close button
  if (veCloseBtn) {
    veCloseBtn.addEventListener('click', () => closeVisualEditor());
  }

  // Click outside container to close
  if (visualEditorOverlay) {
    visualEditorOverlay.addEventListener('click', (e) => {
      if (e.target === visualEditorOverlay) {
        closeVisualEditor();
      }
    });
  }

  console.log('[Main] Visual Editor initialized');
}

/**
 * Open the visual editor overlay
 */
function openVisualEditor() {
  if (!visualEditorOverlay) return;

  visualEditorOverlay.classList.add('active');

  // Refresh palette and render canvas after overlay is visible
  if (visualEditor) {
    visualEditor.refreshPalette();
    // Small delay to ensure DOM is visible before rendering
    requestAnimationFrame(() => {
      visualEditor.render();
    });
  }
}

/**
 * Close the visual editor overlay
 */
function closeVisualEditor() {
  if (!visualEditorOverlay) return;

  visualEditorOverlay.classList.remove('active');
}

/**
 * Wire up all editor UI button handlers
 */
function setupEditorUI() {
  // Open editor button (from builder bar)
  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', () => openPuppetEditor());
  }

  // Close button
  if (editorCloseBtn) {
    editorCloseBtn.addEventListener('click', () => closePuppetEditor());
  }

  // Reset button
  if (editorResetBtn) {
    editorResetBtn.addEventListener('click', () => {
      if (puppetEditor) {
        puppetEditor.resetToOriginal();
        renderEditorProperties();
        updateChangesIndicator();
      }
    });
  }

  // Sort Z by Y button
  if (editorSortYBtn) {
    editorSortYBtn.addEventListener('click', () => {
      if (puppetEditor) {
        puppetEditor.sortByYPosition();
        renderEditorBoneList();
        renderEditorProperties();
      }
    });
  }

  // Export JSON button
  if (editorExportBtn) {
    editorExportBtn.addEventListener('click', () => {
      if (puppetEditor) {
        const json = puppetEditor.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'puppet-config.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  // Apply button
  if (editorApplyBtn) {
    editorApplyBtn.addEventListener('click', () => {
      if (puppetEditor) {
        puppetEditor.applyChanges();
        updateChangesIndicator();
      }
    });
  }

  // Click outside container to close
  if (puppetEditorOverlay) {
    puppetEditorOverlay.addEventListener('click', (e) => {
      if (e.target === puppetEditorOverlay) {
        closePuppetEditor();
      }
    });
  }
}

/**
 * Setup socket listeners for puppet editor sync
 */
function setupPuppetEditorSocketListeners() {
  const rawSocket = socketClient ? socketClient.getSocket() : null;
  if (!rawSocket) return;

  // Listen for synced puppet updates from server
  rawSocket.on('sync-puppet', (data) => {
    console.log('[PuppetEditor] Received puppet sync:', data);
    // If editor is open and editing this puppet, refresh
    if (puppetEditor && puppetEditor.isActive) {
      renderEditorBoneList();
      renderEditorProperties();
    }
  });
}

/**
 * Open the puppet editor overlay
 */
async function openPuppetEditor() {
  if (!puppetEditor) return;

  // Get the current puppet from appState
  let puppet = getCurrentPuppet();
  if (!puppet) {
    // Try to dynamically import the Puppet class so we can create a default puppet
    try {
      const mod = await import('./puppet/puppet.js');
      window._PuppetClass = mod.default;
      puppet = getCurrentPuppet();
    } catch (e) {
      console.warn('[PuppetEditor] Failed to load Puppet class for default editor puppet', e);
    }
  }

  if (!puppet) {
    console.warn('[PuppetEditor] No puppet found to edit');
    return;
  }

  // Activate editing on the current puppet
  puppetEditor.activate(puppet);

  // Render the bone list and properties
  renderEditorBoneList();
  renderEditorProperties();
  updateChangesIndicator();

  // Show the overlay
  if (puppetEditorOverlay) {
    puppetEditorOverlay.classList.add('active');
  }
}

/**
 * Close the puppet editor overlay
 */
function closePuppetEditor() {
  if (!puppetEditor) return;

  puppetEditor.deactivate();

  if (puppetEditorOverlay) {
    puppetEditorOverlay.classList.remove('active');
  }
}

/**
 * Get the current puppet from the Three.js scene, or create a default puppet for editing.
 * @returns {Object|null} Puppet instance with skeleton and group
 */
function getCurrentPuppet() {
  // Try to find existing puppet in the scene
  if (threeScene) {
    const scene = threeScene.getScene();
    const puppetObj = scene.getObjectByName(`puppet-${appState?.localPlayerId}`);
    if (puppetObj && puppetObj.userData?.skeleton) {
      // Puppet exists in scene with skeleton
      return {
        skeleton: puppetObj.userData.skeleton,
        group: puppetObj,
      };
    }
  }

  // Create a default puppet for editing (not yet on stage)
  return createDefaultPuppetForEdit();
}

/**
 * Create a default puppet instance for editing in the builder.
 * This puppet is not yet on stage - it exists only in the editor.
 * @returns {Object} Puppet-like object with skeleton and group
 */
function createDefaultPuppetForEdit() {
  const PuppetClass = window._PuppetClass;
  if (PuppetClass) {
    const puppet = new PuppetClass({
      id: `puppet-${appState?.localPlayerId || 'edit'}`,
      ownerId: appState?.localPlayerId || 'edit',
      name: window.nickname || 'Editor',
    });

    // Load default skeleton config
    const defaultConfig = {
      name: 'My Puppet',
      bones: [
        { id: 'torso', name: 'Torso', parentId: null, asset: 'torso.png', position: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1 }, socketOffset: { x: 0, y: 0.5 }, zDepth: 1 },
        { id: 'head', name: 'Head', parentId: 'torso', asset: 'head.png', position: { x: 0, y: 1.2, z: 0 }, scale: { x: 0.8, y: 0.8 }, socketOffset: { x: 0, y: 0.8 }, zDepth: 3 },
        { id: 'upper-arm-l', name: 'Upper Arm Left', parentId: 'torso', asset: 'upper-arm-l.png', position: { x: -0.8, y: 0.5, z: 0 }, scale: { x: 0.5, y: 0.8 }, socketOffset: { x: 0, y: -0.6 }, zDepth: 2 },
        { id: 'upper-arm-r', name: 'Upper Arm Right', parentId: 'torso', asset: 'upper-arm-r.png', position: { x: 0.8, y: 0.5, z: 0 }, scale: { x: 0.5, y: 0.8 }, socketOffset: { x: 0, y: -0.6 }, zDepth: 2 },
        { id: 'upper-leg-l', name: 'Upper Leg Left', parentId: 'torso', asset: 'upper-leg-l.png', position: { x: -0.4, y: -0.8, z: 0 }, scale: { x: 0.5, y: 0.8 }, socketOffset: { x: 0, y: -0.7 }, zDepth: 0 },
        { id: 'upper-leg-r', name: 'Upper Leg Right', parentId: 'torso', asset: 'upper-leg-r.png', position: { x: 0.4, y: -0.8, z: 0 }, scale: { x: 0.5, y: 0.8 }, socketOffset: { x: 0, y: -0.7 }, zDepth: 0 },
      ],
    };

    puppet.load(defaultConfig, '/assets');
    return puppet;
  }

  return null;
}

/**
 * Render the bone list in the editor
 */
function renderEditorBoneList() {
  if (!puppetEditor || !editorBoneList) return;

  const bones = puppetEditor.getBoneList();
  editorBoneList.innerHTML = '';

  if (!bones || bones.length === 0) {
    editorBoneList.innerHTML = '<div class="puppet-editor-no-selection">No bones found</div>';
    return;
  }

  for (const boneInfo of bones) {
    const item = document.createElement('div');
    item.className = `bone-list-item ${puppetEditor.selectedBoneId === boneInfo.id ? 'selected' : ''}`;
    item.dataset.boneId = boneInfo.id;

    // Indent based on parent
    const indent = boneInfo.parentId ? '<span class="bone-indent"></span>' : '';

    item.innerHTML = `
      ${indent}
      <span class="bone-icon">◉</span>
      <span class="bone-name">${boneInfo.name || boneInfo.id}</span>
      <span class="bone-asset">[Z:${boneInfo.zDepth || 0}]</span>
    `;

    item.addEventListener('click', () => {
      puppetEditor.selectBone(boneInfo.id);
      renderEditorBoneList();
      renderEditorProperties();
    });

    editorBoneList.appendChild(item);
  }
}

/**
 * Render the properties panel for the selected bone
 */
function renderEditorProperties() {
  if (!puppetEditor || !editorProperties) return;

  const boneId = puppetEditor.selectedBoneId;
  if (!boneId) {
    editorProperties.innerHTML = '<div class="puppet-editor-no-selection">Select a bone to edit its properties</div>';
    return;
  }

  // Get all properties for the selected bone
  const position = puppetEditor.getBonePosition(boneId);
  const rotation = puppetEditor.getBoneRotation(boneId);
  const scale = puppetEditor.getBoneScale(boneId);
  const socketOffset = puppetEditor.getSocketOffset(boneId);
  const zDepth = puppetEditor.getBoneZDepth(boneId);
  const asset = puppetEditor.getBoneAsset(boneId);

  editorProperties.innerHTML = `
    <h3>Bone Properties</h3>

    <div class="property-section">
      <div class="property-section-title">Position</div>
      ${propertySlider('X', position?.x ?? 0, -10, 10, 0.1, 'posX')}
      ${propertySlider('Y', position?.y ?? 0, -10, 10, 0.1, 'posY')}
      ${propertySlider('Z', position?.z ?? 0, -10, 10, 0.1, 'posZ')}
    </div>

    <div class="property-section">
      <div class="property-section-title">Rotation (degrees)</div>
      ${propertySlider('X', rotation?.x ?? 0, -180, 180, 1, 'rotX')}
      ${propertySlider('Y', rotation?.y ?? 0, -180, 180, 1, 'rotY')}
      ${propertySlider('Z', rotation?.z ?? 0, -180, 180, 1, 'rotZ')}
    </div>

    <div class="property-section">
      <div class="property-section-title">Scale</div>
      ${propertySlider('X', scale?.x ?? 1, 0.1, 5, 0.1, 'scaleX')}
      ${propertySlider('Y', scale?.y ?? 1, 0.1, 5, 0.1, 'scaleY')}
    </div>

    <div class="property-section">
      <div class="property-section-title">Socket Offset</div>
      ${propertySlider('X', socketOffset?.x ?? 0, -5, 5, 0.1, 'socketX')}
      ${propertySlider('Y', socketOffset?.y ?? 0, -5, 5, 0.1, 'socketY')}
    </div>

    <div class="property-section">
      <div class="property-section-title">Z-Depth (Layer)</div>
      ${propertySlider('Z', zDepth ?? 0, -10, 10, 1, 'zDepth')}
    </div>

    <div class="property-section">
      <div class="property-section-title">Asset</div>
      <div class="property-row">
        <span class="property-label">File</span>
        <input type="text" class="property-input" id="prop-asset" value="${asset || ''}" placeholder="bone-image.png" />
        <button type="button" class="btn btn-small" id="prop-asset-browse" title="Browse assets">Browse</button>
      </div>
      <div id="prop-asset-picker" class="asset-picker hidden"></div>
    </div>
  `;

  // Bind slider events
  bindPropertySliders(boneId);
}

/**
 * Generate HTML for a property slider row
 */
function propertySlider(label, value, min, max, step, id) {
  return `
    <div class="property-row">
      <span class="property-label">${label}</span>
      <input type="range" class="property-slider" id="prop-${id}" min="${min}" max="${max}" step="${step}" value="${value}" />
      <span class="property-value" id="prop-${id}-value">${value}</span>
    </div>
  `;
}

/**
 * Bind slider change events to update the bone
 * @param {string} boneId
 */
function bindPropertySliders(boneId) {
  const sliders = editorProperties.querySelectorAll('.property-slider');
  sliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
      const id = e.target.id.replace('prop-', '');
      const value = parseFloat(e.target.value);
      const valueEl = document.getElementById(`prop-${id}-value`);
      if (valueEl) valueEl.textContent = value;

      // Apply to bone based on property type
      applyPropertyChange(boneId, id, value);
      updateChangesIndicator();
    });
  });

  // Asset input
  const assetInput = document.getElementById('prop-asset');
  if (assetInput) {
    assetInput.addEventListener('change', (e) => {
      puppetEditor.setBoneAsset(boneId, e.target.value);
      updateChangesIndicator();
    });
  }

  // Asset browse button
  const browseBtn = document.getElementById('prop-asset-browse');
  if (browseBtn) {
    browseBtn.addEventListener('click', () => showAssetPicker(boneId));
  }
}

/**
 * Show a dropdown picker of available puppet assets for the bone
 * @param {string} boneId
 */
function showAssetPicker(boneId) {
  const picker = document.getElementById('prop-asset-picker');
  if (!picker) return;

  // Get available puppet assets from the asset browser
  const assets = assetBrowser ? assetBrowser.getAssetsByCategory('puppets') : [];

  if (assets.length === 0) {
    picker.innerHTML = '<div class="asset-picker-empty">No puppet assets available. Upload assets first.</div>';
    picker.classList.remove('hidden');
    return;
  }

  // Filter to image files only
  const imageAssets = assets.filter(a => a.fileType === 'image');

  picker.innerHTML = '';
  imageAssets.forEach(asset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'asset-picker-item';
    btn.textContent = asset.name || asset.path;
    btn.title = asset.path;
    btn.addEventListener('click', () => {
      puppetEditor.setBoneAsset(boneId, asset.name || asset.path);
      const assetInput = document.getElementById('prop-asset');
      if (assetInput) assetInput.value = asset.name || asset.path;
      picker.classList.add('hidden');
      updateChangesIndicator();
    });
    picker.appendChild(btn);
  });

  picker.classList.remove('hidden');
}

/**
 * Apply a property change to the bone
 * @param {string} boneId
 * @param {string} propId
 * @param {number} value
 */
function applyPropertyChange(boneId, propId, value) {
  switch (propId) {
    case 'posX': puppetEditor.setBonePositionX(boneId, value); break;
    case 'posY': puppetEditor.setBonePositionY(boneId, value); break;
    case 'posZ': puppetEditor.setBonePositionZ(boneId, value); break;
    case 'rotX': puppetEditor.setBoneRotationX(boneId, value); break;
    case 'rotY': puppetEditor.setBoneRotationY(boneId, value); break;
    case 'rotZ': puppetEditor.setBoneRotationZ(boneId, value); break;
    case 'scaleX': puppetEditor.setBoneScaleX(boneId, value); break;
    case 'scaleY': puppetEditor.setBoneScaleY(boneId, value); break;
    case 'socketX': puppetEditor.setSocketOffsetX(boneId, value); break;
    case 'socketY': puppetEditor.setSocketOffsetY(boneId, value); break;
    case 'zDepth': puppetEditor.setBoneZDepth(boneId, value); break;
  }
}

/**
 * Update the changes indicator (saved/unsaved dot)
 */
function updateChangesIndicator() {
  if (!editorChangesIndicator || !puppetEditor) return;

  const hasChanges = puppetEditor.hasChanges();
  if (hasChanges) {
    editorChangesIndicator.className = 'changes-indicator';
    editorChangesIndicator.innerHTML = '<span class="dot"></span> Modified';
  } else {
    editorChangesIndicator.className = 'changes-indicator saved';
    editorChangesIndicator.innerHTML = '<span class="dot"></span> Saved';
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

  // Initialize puppet editor (always available to all players)
  initPuppetEditor();
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