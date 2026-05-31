/** PuppetPals Admin Panel
 * Client-side admin panel UI for the server owner
 * Provides controls to manage players, puppets, animations, and backgrounds
 */

class AdminPanel {
  /**
   * @param {Object} socket - The socket client for server communication
   */
  constructor(socket) {
    this.socket = socket;
    this.playerList = [];
    this.isVisible = false;
    this.currentBackground = 'default';
    this.panelElement = null;
    this.onScreenSlotCount = 5; // Default on-screen slot count
  }

  /**
   * Initialize socket event listeners for admin events
   */
  initializeEventListeners() {
    // Listen for player list from server
    this.socket.on('admin-player-list', (data) => {
      this.playerList = data.players || [];
      this._renderPlayerList();
    });

    // Listen for state updates (lock/unlock changes)
    this.socket.on('state-update', (data) => {
      const player = this.playerList.find(p => p.sessionId === data.playerId);
      if (player) {
        if (data.isLocked !== undefined) player.isLocked = data.isLocked;
        if (data.position) player.position = data.position;
      }
      this._renderPlayerList();
    });

    // Listen for background changes
    this.socket.on('background-changed', (data) => {
      this.currentBackground = data.background;
    });

    // Listen for stage config updates (slot count changes)
    this.socket.on('stage-config-update', (data) => {
      if (data.onScreenSlotCount !== undefined) {
        this.onScreenSlotCount = data.onScreenSlotCount;
      }
      this._renderPlayerList();
    });

    // Listen for slot movement updates
    this.socket.on('slot-moved', (data) => {
      const player = this.playerList.find(p => p.sessionId === data.playerId);
      if (player) {
        player.currentSlotIndex = data.toIndex;
      }
      this._renderPlayerList();
    });
  }

  /**
   * Show the admin panel
   */
  show() {
    this.isVisible = true;
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
    this.requestPlayerList();
  }

  /**
   * Hide the admin panel
   */
  hide() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Toggle the admin panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Request the current player list from the server
   */
  requestPlayerList() {
    this.socket.emit('admin-get-players', {});
  }

  /**
   * Lock a player's puppet
   * @param {string} playerId - The target player's session ID
   */
  lockPlayer(playerId) {
    this.socket.emit('admin-lock-puppet', { playerId, lock: true });
  }

  /**
   * Unlock a player's puppet
   * @param {string} playerId - The target player's session ID
   */
  unlockPlayer(playerId) {
    this.socket.emit('admin-lock-puppet', { playerId, lock: false });
  }

  /**
   * Move a player's puppet to a predefined location or coordinates
   * @param {string} playerId - The target player's session ID
   * @param {string|null} location - Predefined location key or null
   * @param {number} [x] - X coordinate (when location is null)
   * @param {number} [z] - Z coordinate (when location is null)
   */
  movePlayer(playerId, location, x, z) {
    const data = { playerId };
    if (location) {
      data.location = location;
    } else if (x !== undefined && z !== undefined) {
      data.x = x;
      data.z = z;
    }
    this.socket.emit('admin-move-puppet', data);
  }

  /**
   * Force start an animation on a player's puppet
   * @param {string} playerId - The target player's session ID
   * @param {Object} animation - The animation object
   */
  forceAnimation(playerId, animation) {
    this.socket.emit('admin-force-animation', { playerId, animation });
  }

  /**
   * Stop animation on a player's puppet
   * @param {string} playerId - The target player's session ID
   */
  stopAnimation(playerId) {
    this.socket.emit('admin-stop-animation-puppet', { playerId });
  }

  /**
   * Eject a player from the server
   * @param {string} playerId - The target player's session ID
   */
  ejectPlayer(playerId) {
    this.socket.emit('admin-eject-player', { playerId });
  }

  /**
   * Move a player's puppet off-stage
   * @param {string} playerId - The target player's session ID
   */
  moveOffStage(playerId) {
    this.socket.emit('admin-offstage-puppet', { playerId });
  }

  /**
   * Change the stage background
   * @param {string} background - The background image filename
   */
  changeBackground(background) {
    this.socket.emit('admin-change-background', { background });
  }

  /**
   * Pause (stop) all animations for all players
   */
  pauseAllAnimations() {
    this.socket.emit('admin-pause-all', {});
  }

  /**
   * Reset all puppet positions to center stage
   */
  resetAllPositions() {
    this.socket.emit('admin-reset-all', {});
  }

  /**
   * Kick all players except the server owner
   */
  kickAllPlayers() {
    this.socket.emit('admin-kick-all', {});
  }

  /**
   * Find a player by their session ID
   * @param {string} sessionId - The player's session ID
   * @returns {Object|null} The player object or null
   */
  getPlayerById(sessionId) {
    return this.playerList.find(p => p.sessionId === sessionId) || null;
  }

  /**
   * Get predefined stage locations for the UI
   * @returns {Array<{key: string, label: string}>} Stage locations
   */
  getStageLocations() {
    return [
      { key: 'center', label: 'Center Stage' },
      { key: 'stageLeft', label: 'Stage Left' },
      { key: 'stageRight', label: 'Stage Right' },
      { key: 'upstageLeft', label: 'Upstage Left' },
      { key: 'upstageRight', label: 'Upstage Right' },
      { key: 'downstageLeft', label: 'Downstage Left' },
      { key: 'downstageRight', label: 'Downstage Right' },
    ];
  }

  /**
   * Set the number of on-screen slots
   * @param {number} count - Number of on-screen slots (clamped to 2-10)
   */
  setOnScreenSlotCount(count) {
    const clamped = Math.max(2, Math.min(10, count));
    this.onScreenSlotCount = clamped;
    this.socket.emit('admin-set-slot-count', { count: clamped });
  }

  /**
   * Move a puppet one slot left or right
   * @param {string} playerId - The target player's session ID
   * @param {'left'|'right'} direction - Movement direction
   */
  movePuppetDirection(playerId, direction) {
    this.socket.emit('admin-move-direction', {
      targetPlayerId: playerId,
      direction,
    });
  }

  /**
   * Move a puppet to a specific slot index
   * @param {string} playerId - The target player's session ID
   * @param {number} slotIndex - The target slot index
   */
  movePuppetToSlot(playerId, slotIndex) {
    this.socket.emit('admin-move-to-slot', {
      targetPlayerId: playerId,
      slotIndex,
    });
  }

  /**
   * Get a human-readable label for a slot index
   * @param {number} slotIndex - The slot index
   * @returns {string} Human-readable slot label
   */
  getSlotLabel(slotIndex) {
    if (slotIndex === 0) return 'Off-screen (far left)';
    if (slotIndex === 1) return 'Off-screen (left)';

    // On-screen slots start at index 2
    const onScreenIndex = slotIndex - 2;
    const totalOnScreen = this.onScreenSlotCount;

    // Check if this is the center slot
    if (totalOnScreen % 2 === 1 && onScreenIndex === Math.floor(totalOnScreen / 2)) {
      return `Slot ${onScreenIndex + 1} - Center`;
    }

    return `Slot ${onScreenIndex + 1}`;
  }

  /**
   * Get all slot options for dropdown menus
   * @returns {Array<{value: string, label: string}>} Slot options
   */
  getSlotOptions() {
    const options = [];

    // Off-screen slots
    options.push({ value: '0', label: 'Off-screen (far left)' });
    options.push({ value: '1', label: 'Off-screen (left)' });

    // On-screen slots
    for (let i = 0; i < this.onScreenSlotCount; i++) {
      const slotIndex = i + 2;
      options.push({
        value: String(slotIndex),
        label: this.getSlotLabel(slotIndex),
      });
    }

    return options;
  }

  /**
   * Remove all socket listeners and clean up
   */
  cleanup() {
    this.socket.off('admin-player-list');
    this.socket.off('state-update');
    this.socket.off('background-changed');
    this.socket.off('stage-config-update');
    this.socket.off('slot-moved');
    this.hide();
    this.playerList = [];
  }

  // ============================================================
  // Internal rendering methods (DOM-dependent)
  // ============================================================

  /**
   * Render the player list in the admin panel UI
   * @private
   */
  _renderPlayerList() {
    const listContainer = document.getElementById('admin-player-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    for (const player of this.playerList) {
      const playerRow = document.createElement('div');
      playerRow.className = `admin-player-row ${player.role === 'owner' ? 'owner' : ''}`;
      if (player.isLocked) playerRow.classList.add('locked');

      playerRow.innerHTML = `
        <span class="player-nickname">${player.nickname}${player.role === 'owner' ? ' 👑' : ''}</span>
        <span class="player-status ${player.isLocked ? 'locked' : 'unlocked'}">
          ${player.isLocked ? '🔒' : '🔓'}
        </span>
        <div class="player-controls">
          <button class="btn-lock" data-session-id="${player.sessionId}">
            ${player.isLocked ? 'Unlock' : 'Lock'}
          </button>
          <select class="select-location" data-session-id="${player.sessionId}">
            <option value="">Move To...</option>
            ${this.getStageLocations().map(loc =>
              `<option value="${loc.key}">${loc.label}</option>`
            ).join('')}
          </select>
          <button class="btn-offstage" data-session-id="${player.sessionId}">
            Off Stage
          </button>
          <button class="btn-eject" data-session-id="${player.sessionId}">
            Eject
          </button>
        </div>
      `;

      listContainer.appendChild(playerRow);
    }

    this._bindPlayerControls();
  }

  /**
   * Bind event handlers to player control buttons
   * @private
   */
  _bindPlayerControls() {
    const listContainer = document.getElementById('admin-player-list');
    if (!listContainer) return;

    // Lock/Unlock buttons
    listContainer.querySelectorAll('.btn-lock').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.getAttribute('data-session-id');
        const player = this.getPlayerById(sessionId);
        if (player) {
          if (player.isLocked) {
            this.unlockPlayer(sessionId);
          } else {
            this.lockPlayer(sessionId);
          }
        }
      });
    });

    // Location dropdowns
    listContainer.querySelectorAll('.select-location').forEach(select => {
      select.addEventListener('change', () => {
        const sessionId = select.getAttribute('data-session-id');
        const location = select.value;
        if (location) {
          this.movePlayer(sessionId, location);
          select.value = '';
        }
      });
    });

    // Off-stage buttons
    listContainer.querySelectorAll('.btn-offstage').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.getAttribute('data-session-id');
        this.moveOffStage(sessionId);
      });
    });

    // Eject buttons
    listContainer.querySelectorAll('.btn-eject').forEach(btn => {
      btn.addEventListener('click', () => {
        const sessionId = btn.getAttribute('data-session-id');
        const player = this.getPlayerById(sessionId);
        if (player && player.role !== 'owner') {
          this.ejectPlayer(sessionId);
        }
      });
    });
  }
}

export default AdminPanel;