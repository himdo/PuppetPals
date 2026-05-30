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
      <button id="reset-settings-btn" class="btn-secondary">Reset to Defaults</button>
    `;
  }
}

export default SettingsPanel;