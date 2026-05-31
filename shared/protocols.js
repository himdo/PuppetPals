/** Shared Socket Protocols
 * Defines all socket event names and payload structures
 * Used by both server and client for consistent communication
 */

const SocketEvents = {
  // ---- Connection & Authentication ----
  /** Client requests to join with a nickname */
  REQUEST_JOIN: 'request-join',

  /** Server confirms join, sends role and player list */
  JOIN_CONFIRMED: 'join-confirmed',

  /** Server rejects duplicate nickname */
  NICKNAME_TAKEN: 'nickname-taken',

  /** Broadcast when a player disconnects */
  PLAYER_DISCONNECTED: 'player-disconnected',

  // ---- Puppet Movement ----
  /** Client requests puppet movement */
  MOVE_PUPPET: 'move-puppet',

  /** Server broadcasts puppet movement */
  PUPPET_MOVED: 'puppet-moved',

  /** Client requests directional slot movement (left/right) */
  MOVE_DIRECTION: 'move-direction',

  /** Server broadcasts slot movement result */
  SLOT_MOVED: 'slot-moved',

  /** Server broadcasts stage config update (e.g., on-screen slot count change) */
  STAGE_CONFIG_UPDATE: 'stage-config-update',

  // ---- Animations ----
  /** Owner requests animation playback */
  START_ANIMATION: 'start-animation',

  /** Server broadcasts animation start with timestamp */
  ANIMATION_STARTED: 'animation-started',

  /** Periodic animation state sync from server */
  ANIMATION_STATE: 'animation-state',

  /** Owner stops animation */
  STOP_ANIMATION: 'stop-animation',

  /** Server owner forces animation on another puppet */
  ADMIN_START_ANIMATION: 'admin-start-animation',

  /** Server owner forces animation stop */
  ADMIN_STOP_ANIMATION: 'admin-stop-animation',

  /** Animation error response */
  ANIMATION_ERROR: 'animation-error',

  /** Server broadcasts animation stopped */
  ANIMATION_STOPPED: 'animation-stopped',

  // ---- State Sync ----
  /** Full state sync on connect */
  STATE_SYNC: 'state-sync',

  /** Incremental state updates */
  STATE_UPDATE: 'state-update',

  // ---- Admin Controls ----
  /** Force move a puppet */
  ADMIN_MOVE_PUPPET: 'admin-move-puppet',

  /** Lock/unlock a puppet */
  ADMIN_LOCK_PUPPET: 'admin-lock-puppet',

  /** Force animation on puppet (admin) */
  ADMIN_FORCE_ANIMATION: 'admin-force-animation',

  /** Stop animation on puppet (admin) */
  ADMIN_STOP_ANIMATION_PUPPET: 'admin-stop-animation-puppet',

  /** Eject player from server */
  ADMIN_EJECT_PLAYER: 'admin-eject-player',

  /** Change stage background */
  ADMIN_CHANGE_BACKGROUND: 'admin-change-background',

  /** Move puppet off-stage */
  ADMIN_OFFSTAGE_PUPPET: 'admin-offstage-puppet',

  /** Override puppet configuration */
  ADMIN_OVERRIDE_PUPPET: 'admin-override-puppet',

  /** Pause all animations */
  ADMIN_PAUSE_ALL: 'admin-pause-all',

  /** Reset all puppet positions */
  ADMIN_RESET_ALL: 'admin-reset-all',

  /** Kick all players */
  ADMIN_KICK_ALL: 'admin-kick-all',

  /** Get player list */
  ADMIN_GET_PLAYERS: 'admin-get-players',

  /** Admin sets number of on-screen slots */
  ADMIN_SET_SLOT_COUNT: 'admin-set-slot-count',

  /** Admin moves a puppet direction (left/right) */
  ADMIN_MOVE_DIRECTION: 'admin-move-direction',

  /** Admin moves a puppet to a specific slot index */
  ADMIN_MOVE_TO_SLOT: 'admin-move-to-slot',

  /** Admin error response */
  ADMIN_ERROR: 'admin-error',

  /** Background changed broadcast */
  BACKGROUND_CHANGED: 'background-changed',

  /** Puppet config overridden broadcast */
  PUPPET_CONFIG_OVERRIDDEN: 'puppet-config-overridden',

  // ---- Asset Management ----
  /** Client uploads an asset */
  UPLOAD_ASSET: 'upload-asset',

  /** Server broadcasts new asset available */
  ASSET_UPLOADED: 'asset-uploaded',

  /** Client requests full asset list */
  ASSET_MANIFEST: 'asset-manifest',

  /** Server responds with asset manifest */
  ASSET_MANIFEST_RESPONSE: 'asset-manifest-response',

  /** Server owner deletes an asset */
  DELETE_ASSET: 'delete-asset',

  /** Server responds to delete request */
  DELETE_RESULT: 'delete-result',

  /** Server broadcasts asset deletion */
  ASSET_DELETED: 'asset-deleted',

  /** Upload error response */
  UPLOAD_ERROR: 'upload-error',

  /** Delete error response */
  DELETE_ERROR: 'delete-error',

  // ---- Puppet Editor ----
  /** Send updated puppet config to server */
  PUPPET_UPDATED: 'puppet-updated',

  /** Server broadcasts puppet updates to all clients */
  SYNC_PUPPET: 'sync-puppet',

  // ---- Keyframe Animation Editor ----
  /** Save animation to server */
  SAVE_ANIMATION: 'save-animation',

  /** Server confirms animation saved and broadcasts to all clients */
  ANIMATION_SAVED: 'animation-saved',

  /** Load animation from server */
  LOAD_ANIMATION: 'load-animation',

  /** Server responds with animation data */
  ANIMATION_LOADED: 'animation-loaded',

  /** Delete animation from server */
  DELETE_ANIMATION: 'delete-animation',

  /** Server confirms animation deleted and broadcasts */
  ANIMATION_DELETED: 'animation-deleted',

  /** Get list of all custom animations */
  LIST_ANIMATIONS: 'list-animations',

  /** Server responds with animation list */
  ANIMATION_LIST: 'animation-list',

  // ---- Chat ----
  /** Send chat message */
  CHAT_MESSAGE: 'chat-message',

  /** System message */
  SYSTEM_MESSAGE: 'system-message',
};

export default SocketEvents;