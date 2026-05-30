/** PuppetPals Socket Client
 * Manages the client-side Socket.io connection, reconnection logic, and event wrapping
 */

import { io } from 'https://cdn.socket.io/4.7.2/socket.io.esm.min.js';

const SOCKET_EVENTS = {
  REQUEST_JOIN: 'request-join',
  JOIN_CONFIRMED: 'join-confirmed',
  NICKNAME_TAKEN: 'nickname-taken',
  PLAYER_DISCONNECTED: 'player-disconnected',
};

/**
 * Client-side socket connection manager with reconnection support
 */
class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.serverUrl = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Initial delay in ms
    this.reconnectTimer = null;
    this.eventListeners = new Map();
    this.sessionId = null;
    this.role = null;
    this.nickname = null;
  }

  /**
   * Connect to the server
   * @param {string} serverUrl - The server URL (e.g., 'http://localhost:3000')
   * @returns {Promise<boolean>} Resolves true when connected
   */
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      this.serverUrl = serverUrl || window.location.origin;

      // Clear any existing reconnection timer
      this._clearReconnectTimer();

      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: false, // We handle reconnection manually
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          console.log('[SocketClient] Connected to server');
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[SocketClient] Connection error:', error.message);
          this.connected = false;
          reject(new Error('Failed to connect to server'));
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('[SocketClient] Disconnected from server');
          this._handleReconnection();
        });

        // Register server event handlers
        this._registerEventHandlers();

      } catch (error) {
        console.error('[SocketClient] Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Register internal event handlers for server events
   */
  _registerEventHandlers() {
    if (!this.socket) return;

    // Handle join confirmation
    this.socket.on(SOCKET_EVENTS.JOIN_CONFIRMED, (data) => {
      this.sessionId = data.sessionId;
      this.role = data.role;
      this.nickname = data.nickname;
      this._emitInternal('join-confirmed', data);
    });

    // Handle nickname taken
    this.socket.on(SOCKET_EVENTS.NICKNAME_TAKEN, (data) => {
      this._emitInternal('nickname-taken', data);
    });

    // Handle player disconnected
    this.socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (data) => {
      this._emitInternal('player-disconnected', data);
    });
  }

  /**
   * Request to join the game with a nickname
   * @param {string} nickname - The desired nickname
   */
  join(nickname) {
    if (!this.socket || !this.connected) {
      console.warn('[SocketClient] Not connected, cannot join');
      return;
    }

    this.socket.emit(SOCKET_EVENTS.REQUEST_JOIN, { nickname });
  }

  /**
   * Subscribe to an internal event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove a specific event listener
   * @param {string} event - Event name
   * @param {Function} callback - The callback to remove
   */
  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit an event to all registered internal listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _emitInternal(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SocketClient] Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  _handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SocketClient] Max reconnection attempts reached');
      this._emitInternal('reconnect-failed', { attempts: this.reconnectAttempts });
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`[SocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this._clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.serverUrl)
        .then(() => {
          // Re-join with the same nickname if we had one
          if (this.nickname) {
            this.join(this.nickname);
          }
        })
        .catch(() => {
          this._emitInternal('reconnect-failed', { attempts: this.reconnectAttempts });
        });
    }, delay);
  }

  /**
   * Clear the reconnection timer
   */
  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    this._clearReconnectTimer();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.sessionId = null;
    this.role = null;
    this.nickname = null;
  }

  /**
   * Get connection status
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.socket !== null;
  }

  /**
   * Get the current session info
   * @returns {Object|null}
   */
  getSessionInfo() {
    if (!this.sessionId) return null;
    return {
      sessionId: this.sessionId,
      role: this.role,
      nickname: this.nickname,
    };
  }

  /**
   * Emit a custom event to the server
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }
}

export default SocketClient;