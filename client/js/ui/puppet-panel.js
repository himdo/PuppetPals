/** PuppetPals Puppet Panel
 * Client-side puppet selection panel UI
 * Allows users to browse, select, and edit puppets
 */

class PuppetPanel {
  /**
   * @param {Object} socket - The socket client for server communication
   */
  constructor(socket) {
    this.socket = socket;
    this.isVisible = false;
    /** @type {Array<Object>} Available puppet definitions */
    this.availablePuppets = [];
    /** @type {string|null} Currently selected puppet ID */
    this.selectedPuppet = null;
    /** @type {Function|null} Callback for opening puppet editor */
    this.editorCallback = null;
    /** @type {string} Preview view mode ('2d' or '3d') */
    this.previewView = '2d';
    this.panelElement = null;
  }

  /**
   * Set the preview view mode for puppet display
   * @param {string} view - View mode ('2d' or '3d')
   */
  setPreviewView(view) {
    this.previewView = view === '3d' ? '3d' : '2d';
  }

  /**
   * Initialize socket event listeners for puppet events
   */
  initializeEventListeners() {
    this.socket.on('puppet-list', (data) => {
      this.availablePuppets = data.puppets || [];
      this._renderPuppetList();
    });
  }

  /**
   * Show the puppet panel
   */
  show() {
    this.isVisible = true;
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
    this.requestPuppetList();
  }

  /**
   * Hide the puppet panel
   */
  hide() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Toggle the puppet panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set callback for opening the puppet editor
   * @param {Function} callback - Function that receives puppetId
   */
  setEditorCallback(callback) {
    this.editorCallback = callback;
  }

  /**
   * Request the puppet list from server
   */
  requestPuppetList() {
    this.socket.emit('request-puppet-list', {});
  }

  /**
   * Select a puppet by ID
   * @param {string} puppetId - The puppet identifier
   */
  selectPuppet(puppetId) {
    const puppet = this.availablePuppets.find(p => p.id === puppetId);
    if (!puppet) return;

    this.selectedPuppet = puppetId;
    this.socket.emit('select-puppet', { puppetId });
    this._renderPuppetList();
  }

  /**
   * Open the puppet editor for the selected puppet
   */
  openEditor() {
    if (!this.editorCallback || !this.selectedPuppet) return;
    this.editorCallback(this.selectedPuppet);
  }

  /**
   * Save a custom puppet configuration
   * @param {Object} config - The puppet skeleton configuration
   */
  savePuppet(config) {
    this.socket.emit('save-puppet', { config });
  }

  /**
   * Find a puppet by its ID
   * @param {string} puppetId - The puppet identifier
   * @returns {Object|null} Puppet object or null
   */
  getPuppetById(puppetId) {
    return this.availablePuppets.find(p => p.id === puppetId) || null;
  }

  /**
   * Get the currently selected puppet object
   * @returns {Object|null} Selected puppet or null
   */
  getSelectedPuppet() {
    if (!this.selectedPuppet) return null;
    return this.getPuppetById(this.selectedPuppet);
  }

  /**
   * Remove all socket listeners and clean up
   */
  cleanup() {
    this.socket.off('puppet-list');
    this.hide();
    this.availablePuppets = [];
    this.selectedPuppet = null;
    this.editorCallback = null;
  }

  // ============================================================
  // Internal rendering methods (DOM-dependent)
  // ============================================================

  /**
   * Render the puppet list in the panel UI
   * @private
   */
  _renderPuppetList() {
    const listContainer = document.getElementById('puppet-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    for (const puppet of this.availablePuppets) {
      const puppetItem = document.createElement('div');
      puppetItem.className = `puppet-item ${this.selectedPuppet === puppet.id ? 'selected' : ''}`;
      puppetItem.setAttribute('data-puppet-id', puppet.id);

      puppetItem.innerHTML = `
        <div class="puppet-thumbnail puppet-preview-${this.previewView}">
          <img src="/assets/puppets/${puppet.thumbnail || 'placeholder.png'}" alt="${puppet.name}" />
        </div>
        <div class="puppet-name">${puppet.name}</div>
      `;

      puppetItem.addEventListener('click', () => {
        this.selectPuppet(puppet.id);
      });

      listContainer.appendChild(puppetItem);
    }

    this._bindEditButton();
  }

  /**
   * Bind the edit button event handler
   * @private
   */
  _bindEditButton() {
    const editBtn = document.getElementById('puppet-edit-btn');
    if (!editBtn || typeof editBtn.addEventListener !== 'function') return;

    editBtn.addEventListener('click', () => {
      this.openEditor();
    });
  }
}

export default PuppetPanel;