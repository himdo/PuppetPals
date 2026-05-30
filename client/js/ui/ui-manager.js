/** PuppetPals UI Manager
 * Central UI management for all panels
 * Handles panel show/hide, theme support, and advanced mode toggle
 */

class UIManager {
  constructor() {
    /** @type {Object<string, Object>} Registered panels keyed by name */
    this.panels = {};

    /** @type {string} Current theme ('light' or 'dark') */
    this.theme = 'light';

    /** @type {boolean} Advanced mode enabled */
    this.advancedMode = false;

    /** @type {number} UI opacity (0-1) */
    this.uiOpacity = 1;

    /** @type {Object<string, Array<Function>>} Event listeners */
    this._listeners = {};

    this._applyTheme();
    this._applyOpacity();
  }

  // ============================================================
  // Event Emitter
  // ============================================================

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...*} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const callback of this._listeners[event]) {
      try {
        callback(...args);
      } catch (e) {
        console.error(`[UIManager] Error in event listener for '${event}':`, e);
      }
    }
  }

  // ============================================================
  // Panel Registration
  // ============================================================

  /**
   * Register a panel with the manager
   * @param {string} name - Unique panel identifier
   * @param {Object} panel - Panel instance with show/hide methods
   */
  registerPanel(name, panel) {
    this.panels[name] = panel;
  }

  /**
   * Get a registered panel by name
   * @param {string} name - Panel identifier
   * @returns {Object|null} Panel instance or null
   */
  getPanel(name) {
    return this.panels[name] || null;
  }

  /**
   * Get all registered panel names
   * @returns {string[]} Array of panel names
   */
  getRegisteredPanelNames() {
    return Object.keys(this.panels);
  }

  // ============================================================
  // Panel Visibility Control
  // ============================================================

  /**
   * Show a specific panel
   * @param {string} name - Panel identifier
   */
  showPanel(name) {
    const panel = this.panels[name];
    if (!panel) return;
    if (typeof panel.show === 'function') panel.show();
    this.emit('panelVisible', name);
  }

  /**
   * Hide a specific panel
   * @param {string} name - Panel identifier
   */
  hidePanel(name) {
    const panel = this.panels[name];
    if (!panel) return;
    if (typeof panel.hide === 'function') panel.hide();
    this.emit('panelHidden', name);
  }

  /**
   * Toggle a specific panel visibility
   * @param {string} name - Panel identifier
   */
  togglePanel(name) {
    const panel = this.panels[name];
    if (!panel) return;
    if (typeof panel.toggle === 'function') {
      panel.toggle();
    } else {
      // Fallback: if panel has no toggle, show it if hidden
      if (typeof panel.show === 'function') panel.show();
    }
  }

  /**
   * Show all registered panels
   */
  showAllPanels() {
    for (const name of Object.keys(this.panels)) {
      this.showPanel(name);
    }
  }

  /**
   * Hide all registered panels
   */
  hideAllPanels() {
    for (const name of Object.keys(this.panels)) {
      this.hidePanel(name);
    }
  }

  // ============================================================
  // Theme Management
  // ============================================================

  /**
   * Set the UI theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    this.theme = theme;
    this._applyTheme();
    this.emit('themeChanged', theme);
  }

  /**
   * Get the current theme
   * @returns {string} Current theme name
   */
  getTheme() {
    return this.theme;
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme() {
    const newTheme = this.theme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Apply theme to DOM elements
   * @private
   */
  _applyTheme() {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      overlay.className = `theme-${this.theme}`;
    }

    // Apply theme to all panel containers
    for (const name of Object.keys(this.panels)) {
      const container = document.getElementById(`panel-${name}`);
      if (container) {
        container.className = `ui-panel theme-${this.theme}`;
      }
    }
  }

  // ============================================================
  // Advanced Mode
  // ============================================================

  /**
   * Enable advanced mode
   */
  enableAdvancedMode() {
    this.advancedMode = true;
    this._applyAdvancedMode();
    this.emit('advancedModeToggled', true);
  }

  /**
   * Disable advanced mode
   */
  disableAdvancedMode() {
    this.advancedMode = false;
    this._applyAdvancedMode();
    this.emit('advancedModeToggled', false);
  }

  /**
   * Toggle advanced mode
   */
  toggleAdvancedMode() {
    if (this.advancedMode) {
      this.disableAdvancedMode();
    } else {
      this.enableAdvancedMode();
    }
  }

  /**
   * Check if advanced mode is enabled
   * @returns {boolean} True if advanced mode is on
   */
  isAdvancedMode() {
    return this.advancedMode;
  }

  /**
   * Apply advanced mode to DOM elements
   * @private
   */
  _applyAdvancedMode() {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      if (this.advancedMode) {
        overlay.classList.add('advanced-mode');
      } else {
        overlay.classList.remove('advanced-mode');
      }
    }

    // Toggle visibility of advanced-only elements
    const advancedElements = document.querySelectorAll('.advanced-only');
    for (const el of advancedElements) {
      el.style.display = this.advancedMode ? 'block' : 'none';
    }
  }

  // ============================================================
  // UI Opacity
  // ============================================================

  /**
   * Set UI opacity (clamped between 0 and 1)
   * @param {number} opacity - Opacity value 0-1
   */
  setUiOpacity(opacity) {
    this.uiOpacity = Math.max(0, Math.min(1, opacity));
    this._applyOpacity();
    this.emit('opacityChanged', this.uiOpacity);
  }

  /**
   * Get current UI opacity
   * @returns {number} Current opacity value
   */
  getUiOpacity() {
    return this.uiOpacity;
  }

  /**
   * Apply opacity to DOM elements
   * @private
   */
  _applyOpacity() {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      overlay.style.opacity = this.uiOpacity;
    }
  }

  // ============================================================
  // Cleanup
  // ============================================================

  /**
   * Clean up all panels and listeners
   */
  cleanup() {
    // Hide all panels first
    for (const name of Object.keys(this.panels)) {
      const panel = this.panels[name];
      if (typeof panel.hide === 'function') {
        panel.hide();
      }
    }

    // Clear panels
    this.panels = {};

    // Clear listeners
    this._listeners = {};
  }
}

export default UIManager;