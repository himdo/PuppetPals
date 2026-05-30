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

  /** Eject player from server */
  ADMIN_EJECT_PLAYER: 'admin-eject-player',

  /** Change stage background */
  ADMIN_CHANGE_BACKGROUND: 'admin-change-background',

  /** Move puppet off-stage */
  ADMIN_OFFSTAGE_PUPPET: 'admin-offstage-puppet',

  // ---- Asset Management ----
  /** Client uploads an asset */
  UPLOAD_ASSET: 'upload-asset',

  /** Server broadcasts new asset available */
  ASSET_UPLOADED: 'asset-uploaded',

  /** Client requests full asset list */
  ASSET_MANIFEST: 'asset-manifest',

  /** Server owner deletes an asset */
  DELETE_ASSET: 'delete-asset',

  // ---- Puppet Editor ----
  /** Send updated puppet config to server */
  PUPPET_UPDATED: 'puppet-updated',

  /** Server broadcasts puppet updates to all clients */
  SYNC_PUPPET: 'sync-puppet',

  // ---- Chat ----
  /** Send chat message */
  CHAT_MESSAGE: 'chat-message',

  /** System message */
  SYSTEM_MESSAGE: 'system-message',
};

/**
 * Payload structures (documentation only)
 *
 * request-join: { nickname: string }
 * join-confirmed: { sessionId: string, role: string, players: Array, puppetConfig: object }
 * nickname-taken: { message: string }
 * player-disconnected: { sessionId: string, nickname: string }
 * move-puppet: { sessionId: string, location: string | { x: number, z: number } }
 * puppet-moved: { sessionId: string, position: { x: number, z: number } }
 * start-animation: { sessionId: string, animationId: string }
 * animation-started: { sessionId: string, animationId: string, startTime: number }
 * animation-state: { sessionId: string, animationId: string, currentTime: number, playing: boolean }
 * state-sync: { players: Array, stageConfig: object }
 */

module.exports = SocketEvents;