/** PuppetPals Chat Panel
 * Client-side chat/messaging UI panel
 * Allows users to send and receive chat messages
 */

class ChatPanel {
  /**
   * @param {Object} socket - The socket client for server communication
   */
  constructor(socket) {
    this.socket = socket;
    this.isVisible = false;
    /** @type {Array<Object>} Chat messages */
    this.messages = [];
    /** @type {number} Maximum messages to store */
    this.maxMessages = 100;
    this.panelElement = null;
  }

  /**
   * Initialize socket event listeners for chat events
   */
  initializeEventListeners() {
    this.socket.on('chat-message', (data) => {
      this.addMessage(data.user || 'Unknown', data.text || '');
    });
  }

  /**
   * Show the chat panel
   */
  show() {
    this.isVisible = true;
    if (this.panelElement) {
      this.panelElement.style.display = 'block';
    }
  }

  /**
   * Hide the chat panel
   */
  hide() {
    this.isVisible = false;
    if (this.panelElement) {
      this.panelElement.style.display = 'none';
    }
  }

  /**
   * Toggle the chat panel visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Send a chat message
   * @param {string} text - The message text
   */
  sendMessage(text) {
    if (!text || !text.trim()) return;
    this.socket.emit('chat-message', { text: text.trim() });
  }

  /**
   * Add a message to the local message list
   * @param {string} user - The username
   * @param {string} text - The message text
   */
  addMessage(user, text) {
    const message = {
      user,
      text,
      timestamp: Date.now(),
    };

    this.messages.push(message);

    // Enforce max messages limit
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    this._renderMessages();
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    this.messages = [];
    this._renderMessages();
  }

  /**
   * Remove all socket listeners and clean up
   */
  cleanup() {
    this.socket.off('chat-message');
    this.hide();
    this.messages = [];
  }

  // ============================================================
  // Internal rendering methods (DOM-dependent)
  // ============================================================

  /**
   * Render the messages in the panel UI
   * @private
   */
  _renderMessages() {
    const messageContainer = document.getElementById('chat-messages');
    if (!messageContainer) return;

    messageContainer.innerHTML = '';

    for (const msg of this.messages) {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message';

      const time = new Date(msg.timestamp).toLocaleTimeString();
      messageEl.innerHTML = `
        <span class="chat-user">${msg.user}</span>
        <span class="chat-time">${time}</span>
        <span class="chat-text">${msg.text}</span>
      `;

      messageContainer.appendChild(messageEl);
    }

    // Scroll to bottom
    if (messageContainer.scrollTop) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }
}

export default ChatPanel;