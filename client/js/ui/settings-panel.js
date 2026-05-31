/** PuppetPals Settings Panel
 * Client-side settings/configuration UI panel
 * Allows users to adjust application settings
 */

class SettingsPanel {
  /**
   * Default settings values
   */
  static DEFAULT_SETTINGS = {
    volume: 80,
    showGrid: true,
    autoSave: true,
    theme: 'light',
    // Stage polish settings (Request 22)
    transitionSpeed: 'normal',
    wiggleIntensity: 'medium',
    showSlotMarkers: true,
    showLocationLabels: false,
    autoPlayWalkAnimation: true,
  };

  /**
   * Transition duration in ms per speed setting
   */
  static TRANSITION_DURATIONS = {
    fast: 200,
    normal: 400,
    slow: 800,
  };

  /**
   * Wiggle configuration per intensity setting
   */
  static WIGGLE_CONFIGS = {
    none: { frequency: 0, amplitude: 0 },
    low: { frequency: 2, amplitude: 3 },
    medium: { frequency: 3, amplitude: 5 },
    high: { frequency: 5, amplitude: 10 },
  };

  /**
   * @param {Object} socket - The socket client for server communication
   */
  constructor(socket) {
    this.socket = socket;
    this.isVisible = false;
    /** @type {Object} Current settings */
    this.settings = { ...SettingsPanel.DEFAULT_SETTINGS };
    this.panelElement = null;
  }

  /**
   * Initialize socket event listeners for settings events
   */
  initializeEventListeners() {
    this.socket.on('settings-sync', (data) => {
      this.settings = { ...this.settings, ...data };
      this._renderSettings();
    });
  }

  /**
   * Show the settings panel
   */
  show() {
    this.isVisible = true;
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
    this._renderSettings();
  }

  /**
   * Hide the settings panel
   */
  hide() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Toggle the settings panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get a setting value by key
   * @param {string} key - The setting key
   * @returns {*} The setting value or undefined
   */
  getSetting(key) {
    return this.settings[key];
  }

  /**
   * Set a setting value and sync with server
   * @param {string} key - The setting key
   * @param {*} value - The setting value
   */
  setSetting(key, value) {
    this.settings[key] = value;
    this.socket.emit('settings-update', { settings: { ...this.settings } });
    this._renderSettings();
  }

  /**
   * Reset all settings to defaults
   */
  resetToDefaults() {
    this.settings = { ...SettingsPanel.DEFAULT_SETTINGS };
    this.socket.emit('settings-update', { settings: { ...this.settings } });
    this._renderSettings();
  }

  /**
   * Get transition duration in ms based on current transitionSpeed setting
   * @returns {number} Duration in milliseconds
   */
  getTransitionDuration() {
    const speed = this.settings.transitionSpeed || 'normal';
    return SettingsPanel.TRANSITION_DURATIONS[speed] || 400;
  }

  /**
   * Get wiggle configuration based on current wiggleIntensity setting
   * @returns {{frequency: number, amplitude: number}} Wiggle config
   */
  getWiggleConfig() {
    const intensity = this.settings.wiggleIntensity || 'medium';
    return { ...SettingsPanel.WIGGLE_CONFIGS[intensity] } || { frequency: 3, amplitude: 5 };
  }

  /**
   * Remove all socket listeners and clean up
   */
  cleanup() {
    this.socket.off('settings-sync');
    this.hide();
  }

  // ============================================================
  // Internal rendering methods (DOM-dependent)
  // ============================================================

  /**
   * Render the settings in the panel UI
   * @private
   */
  _renderSettings() {
    const container = document.getElementById('settings-content');
    if (!container) return;

    container.innerHTML = `
      <div class="setting-group">
        <label>
          Volume: <input type="range" id="setting-volume" min="0" max="100" value="${this.settings.volume}" />
          <span id="volume-value">${this.settings.volume}%</span>
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="setting-show-grid" ${this.settings.showGrid ? 'checked' : ''} />
          Show Grid
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="setting-auto-save" ${this.settings.autoSave ? 'checked' : ''} />
          Auto Save
        </label>
      </div>
      <div class="setting-group">
        <label>
          Theme:
          <select id="setting-theme">
            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
          </select>
        </label>
      </div>

      <h3>Stage Visuals</h3>

      <div class="setting-group">
        <label>
          Transition Speed:
          <select id="setting-transition-speed">
            <option value="fast" ${this.settings.transitionSpeed === 'fast' ? 'selected' : ''}>Fast</option>
            <option value="normal" ${this.settings.transitionSpeed === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="slow" ${this.settings.transitionSpeed === 'slow' ? 'selected' : ''}>Slow</option>
          </select>
        </label>
      </div>
      <div class="setting-group">
        <label>
          Wiggle Intensity:
          <select id="setting-wiggle-intensity">
            <option value="none" ${this.settings.wiggleIntensity === 'none' ? 'selected' : ''}>None</option>
            <option value="low" ${this.settings.wiggleIntensity === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${this.settings.wiggleIntensity === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${this.settings.wiggleIntensity === 'high' ? 'selected' : ''}>High</option>
          </select>
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="setting-show-slot-markers" ${this.settings.showSlotMarkers ? 'checked' : ''} />
          Show Slot Markers
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="setting-show-location-labels" ${this.settings.showLocationLabels ? 'checked' : ''} />
          Show Location Labels
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="setting-auto-play-walk" ${this.settings.autoPlayWalkAnimation ? 'checked' : ''} />
          Auto-Play Walk Animation
        </label>
      </div>

      <button id="reset-settings-btn" class="btn-secondary">Reset to Defaults</button>
    `;
  }
}

export default SettingsPanel;