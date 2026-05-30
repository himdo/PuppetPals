/** PuppetPals Animation Panel
 * Client-side animation browser UI
 * Allows users to browse, play, stop, and favorite animations
 */

class AnimationPanel {
  /**
   * @param {Object} socket - The socket client for server communication
   */
  constructor(socket) {
    this.socket = socket;
    this.isVisible = false;
    /** @type {Array<Object>} Available animations */
    this.animations = [];
    /** @type {string|null} Currently playing animation ID */
    this.currentlyPlaying = null;
    /** @type {Array<string>} Favorite animation IDs */
    this.favorites = [];
    this.panelElement = null;
  }

  /**
   * Initialize socket event listeners for animation events
   */
  initializeEventListeners() {
    this.socket.on('animation-started', (data) => {
      this.currentlyPlaying = data.animationId || null;
      this._renderAnimationList();
    });

    this.socket.on('animation-stopped', (data) => {
      this.currentlyPlaying = null;
      this._renderAnimationList();
    });
  }

  /**
   * Show the animation panel
   */
  show() {
    this.isVisible = true;
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
  }

  /**
   * Hide the animation panel
   */
  hide() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Toggle the animation panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set the list of available animations
   * @param {Array<Object>} animations - Array of animation objects
   */
  setAnimations(animations) {
    this.animations = animations || [];
    this._renderAnimationList();
  }

  /**
   * Play an animation by ID
   * @param {string} animationId - The animation identifier
   */
  playAnimation(animationId) {
    const anim = this.animations.find(a => a.id === animationId);
    if (!anim) return;

    this.currentlyPlaying = animationId;
    this.socket.emit('start-animation', { animationId });
    this._renderAnimationList();
  }

  /**
   * Stop the currently playing animation
   */
  stopAnimation() {
    this.socket.emit('stop-animation', {});
    this.currentlyPlaying = null;
    this._renderAnimationList();
  }

  /**
   * Toggle an animation as favorite
   * @param {string} animationId - The animation identifier
   */
  toggleFavorite(animationId) {
    const anim = this.animations.find(a => a.id === animationId);
    if (!anim) return;

    const idx = this.favorites.indexOf(animationId);
    if (idx > -1) {
      this.favorites.splice(idx, 1);
    } else {
      this.favorites.push(animationId);
    }
    this._renderAnimationList();
  }

  /**
   * Get favorite animations
   * @returns {Array<Object>} Favorite animation objects
   */
  getFavoriteAnimations() {
    return this.animations.filter(a => this.favorites.includes(a.id));
  }

  /**
   * Check if an animation is currently playing
   * @param {string|null} animationId - The animation identifier
   * @returns {boolean} True if playing
   */
  isAnimationPlaying(animationId) {
    if (!animationId) return false;
    return this.currentlyPlaying === animationId;
  }

  /**
   * Find an animation by its ID
   * @param {string} animationId - The animation identifier
   * @returns {Object|null} Animation object or null
   */
  getAnimationById(animationId) {
    return this.animations.find(a => a.id === animationId) || null;
  }

  /**
   * Remove all socket listeners and clean up
   */
  cleanup() {
    this.socket.off('animation-started');
    this.socket.off('animation-stopped');
    this.hide();
    this.animations = [];
    this.currentlyPlaying = null;
    this.favorites = [];
  }

  // ============================================================
  // Internal rendering methods (DOM-dependent)
  // ============================================================

  /**
   * Render the animation list in the panel UI
   * @private
   */
  _renderAnimationList() {
    const listContainer = document.getElementById('animation-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // Render favorites first
    if (this.favorites.length > 0) {
      const favHeader = document.createElement('div');
      favHeader.className = 'animation-section-header';
      favHeader.textContent = '⭐ Favorites';
      listContainer.appendChild(favHeader);

      const favAnims = this.getFavoriteAnimations();
      for (const anim of favAnims) {
        listContainer.appendChild(this._createAnimationItem(anim));
      }
    }

    // Render all animations
    const header = document.createElement('div');
    header.className = 'animation-section-header';
    header.textContent = 'All Animations';
    listContainer.appendChild(header);

    for (const anim of this.animations) {
      listContainer.appendChild(this._createAnimationItem(anim));
    }
  }

  /**
   * Create a DOM element for an animation item
   * @param {Object} anim - Animation object
   * @returns {HTMLElement} The animation item element
   * @private
   */
  _createAnimationItem(anim) {
    const item = document.createElement('div');
    item.className = `animation-item ${this.currentlyPlaying === anim.id ? 'playing' : ''}`;
    item.setAttribute('data-animation-id', anim.id);

    const isFav = this.favorites.includes(anim.id);
    const isPlaying = this.currentlyPlaying === anim.id;

    item.innerHTML = `
      <div class="animation-info">
        <span class="animation-name">${anim.name}</span>
        <span class="animation-duration">${anim.duration}ms${anim.loop ? ' (loop)' : ''}</span>
      </div>
      <div class="animation-controls">
        <button class="btn-favorite ${isFav ? 'active' : ''}" data-animation-id="${anim.id}">
          ${isFav ? '★' : '☆'}
        </button>
        <button class="btn-play ${isPlaying ? 'active' : ''}" data-animation-id="${anim.id}">
          ${isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
      </div>
    `;

    return item;
  }
}

export default AnimationPanel;