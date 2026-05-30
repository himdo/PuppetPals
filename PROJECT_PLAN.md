# PuppetPals - Project Plan

## Project Overview

**PuppetPals** is a web-based puppet controlling software where one person acts as the server owner with master controls, and up to 10 clients can connect to control their own puppets on a shared 3D stage. The system features a hierarchical skeleton-based puppet system, real-time synchronized animations, an in-browser puppet editor, and comprehensive admin controls.

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend Framework | Vanilla JavaScript + ES Modules | Modular client-side code |
| 3D Rendering | Three.js | 3D stage, puppet rendering, camera controls |
| Real-time Communication | Socket.io (WebSocket) | Server-client synchronization |
| Server Runtime | Node.js + Express | HTTP server, asset streaming, game logic |
| UI Framework | Custom HTML/CSS with minimal dependencies | Clean, performant UI overlays |
| Asset Format | PNG images + JSON configuration | Puppet parts, skeletons, animations |
| State Management | Centralized state store | Synced puppet positions, animations, settings |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   HTTP API   │  │  Socket.io   │  │    Asset Storage      │  │
│  │  (file serve)│  │  (real-time) │  │      (assets/)        │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  Game State Manager                        │  │
│  │  - Player states   - Puppet positions   - Animations      │  │
│  │  - Stage config    - Admin actions      - Backgrounds     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────┬─────────────────────────┬─────────────────────────┘
               │                         │
         WebSocket                  WebSocket
               │                         │
   ┌───────────┴───────────┐   ┌────────┴──────────────┐
   │      CLIENT 1         │   │    CLIENT 2...10      │
   │  ┌──────────────────┐ │   │  ┌──────────────────┐ │
   │  │   Three.js       │ │   │  │   Three.js       │ │
   │  │   Renderer       │ │   │  │   Renderer       │ │
   │  └──────────────────┘ │   │  └──────────────────┘ │
   │  ┌──────────────────┐ │   │  ┌──────────────────┐ │
   │  │   Puppet         │ │   │  │   Puppet         │ │
   │  │   Controller     │ │   │  │   Controller     │ │
   │  └──────────────────┘ │   │  └──────────────────┘ │
   │  ┌──────────────────┐ │   │                      │ │
   │  │   UI Overlay     │ │   │                      │ │
   │  └──────────────────┘ │   │                      │ │
   └───────────────────────┘   └──────────────────────┘
```

---

## Directory Structure

```
PuppetPals/
├── package.json
├── PROJECT_PLAN.md
├── server/
│   ├── index.js                    # Server entry point
│   ├── config.js                   # Server configuration
│   ├── socket-handler.js           # Socket.io event handlers
│   ├── game-state.js               # Centralized game state manager
│   ├── asset-manager.js            # Asset upload/streaming
│   ├── auth-manager.js             # Nickname authentication
│   ├── admin-controller.js         # Server owner master controls
│   └── animation-sync.js           # Server-side animation synchronization
├── client/
│   ├── index.html                  # Main HTML entry point
│   ├── css/
│   │   ├── main.css                # Global styles
│   │   ├── stage.css               # 3D stage overlay styles
│   │   ├── editor.css              # Puppet editor UI styles
│   │   └── animations.css          # Animation panel styles
│   ├── js/
│   │   ├── main.js                 # Client entry point
│   │   ├── app-state.js            # Client state management
│   │   ├── socket-client.js        # Socket.io client connection
│   │   ├── three/
│   │   │   ├── scene.js            # Three.js scene setup
│   │   │   ├── camera.js           # Camera controls
│   │   │   ├── renderer.js         # Renderer configuration
│   │   │   ├── lighting.js         # Scene lighting
│   │   │   └── stage.js            # 3D stage/ground plane
│   │   ├── puppet/
│   │   │   ├── puppet.js           # Puppet class definition
│   │   │   ├── bone.js             # Bone/joint class
│   │   │   ├── skeleton.js         # Skeleton hierarchy manager
│   │   │   ├── mesh-loader.js      # PNG to mesh conversion
│   │   │   └── puppet-editor.js    # In-browser puppet editor
│   │   ├── animation/
│   │   │   ├── animation-system.js     # Animation playback
│   │   │   ├── keyframe-editor.js      # Keyframe creation/editing
│   │   │   ├── animation-library.js    # Pre-defined animations
│   │   │   └── animation-sync.js       # Client-side sync
│   │   ├── ui/
│   │   │   ├── ui-manager.js           # UI overlay management
│   │   │   ├── puppet-panel.js         # Puppet selection panel
│   │   │   ├── animation-panel.js      # Animation trigger panel
│   │   │   ├── admin-panel.js          # Server owner controls
│   │   │   ├── chat-panel.js           # Optional chat
│   │   │   └── settings-panel.js       # Settings/configuration
│   │   └── assets/
│   │       └── asset-browser.js        # Server asset browser
│   └── assets/
│       ├── default-puppets/            # Pre-defined puppet assets
│       │   ├── basic-puppet/
│       │   │   ├── head.png
│       │   │   ├── torso.png
│       │   │   ├── upper-arm-l.png
│       │   │   ├── lower-arm-l.png
│       │   │   ├── upper-arm-r.png
│       │   │   ├── lower-arm-r.png
│       │   │   ├── upper-leg-l.png
│       │   │   ├── lower-leg-l.png
│       │   │   ├── upper-leg-r.png
│       │   │   ├── lower-leg-r.png
│       │   │   └── skeleton.json       # Bone hierarchy config
│       │   └── ...
│       └── default-backgrounds/
│           └── default-stage.png
├── assets/                           # Server-side asset storage
│   ├── puppets/
│   ├── backgrounds/
│   └── animations/
└── shared/
    ├── constants.js                  # Shared constants
    ├── protocols.js                  # Socket event definitions
    └── utils.js                      # Shared utility functions
```

---

# Broken-Down Requests (Implementation Tasks)

Each request below is a self-contained objective that a coder can implement independently. They are ordered by dependency.

---

## Request 1: Project Foundation & Server Setup

**Priority:** P0 - Foundation
**Dependencies:** None

### Description

Set up the basic Node.js server with Express and Socket.io. Create the project structure and configure the build tooling.

### Requirements

1. **Initialize the project** with all necessary dependencies:
   - `express` for HTTP server
   - `socket.io` for real-time WebSocket communication
   - `cors` for cross-origin support
   - `uuid` for unique identifier generation

2. **Create the server entry point** (`server/index.js`) that:
   - Starts an Express server on a configurable port (default: 3000)
   - Serves static files from the `client/` directory
   - Initializes Socket.io with CORS enabled
   - Serves uploaded assets from `assets/` directory

3. **Create server configuration** (`server/config.js`) with:
   - Configurable port, max players (default: 10)
   - Asset upload size limits
   - Server hostname settings

4. **Create the directory structure** as defined above

5. **Create basic `index.html`** with a loading screen

### Deliverables

- Working Express server that serves static files
- Socket.io connection established on client connect
- Complete directory structure created
- `package.json` with all dependencies and start scripts

### Acceptance Criteria

- [ ] Server starts with `npm start`
- [ ] Client can access `http://localhost:3000` and see the loading screen
- [ ] Socket.io logs a connection event when a client connects
- [ ] All directories from the structure are created

---

## Request 2: Nickname Authentication & Connection System

**Priority:** P0 - Core
**Dependencies:** Request 1

### Description

Implement the nickname-based authentication system for players joining the server. The first player to connect becomes the Server Owner.

### Requirements

1. **Create `server/auth-manager.js`**:
   - Track connected clients with unique session IDs
   - Assign the first connected client as the "Server Owner" (master)
   - Validate and assign unique nicknames (no duplicates, 3-20 chars)
   - Handle disconnection and nickname release

2. **Create `shared/protocols.js`**:
   - Define all socket event names as constants
   - Define event payload structures

3. **Implement socket events** in `server/socket-handler.js`:
   - `request-join`: Client requests to join with a nickname
   - `join-confirmed`: Server confirms join, sends role (owner/client), player list
   - `player-disconnected`: Broadcast when a player leaves
   - `nickname-taken`: Server rejects duplicate nickname

4. **Create client-side `client/js/socket-client.js`**:
   - Socket.io client connection manager
   - Reconnection logic with exponential backoff
   - Event emission and listening wrapper

5. **Create join screen UI** in `client/index.html`:
   - Nickname input field
   - Connect button
   - Error display for taken nicknames
   - Server address input (default: current origin)

### Deliverables

- Auth manager tracking players and roles
- Socket protocol definitions
- Join screen with nickname input
- Connection/disconnection handling

### Acceptance Criteria

- [ ] First player connects and is assigned "Server Owner" role
- [ ] Subsequent players connect as "Client" role
- [ ] Duplicate nicknames are rejected with error message
- [ ] Disconnected players are removed from the player list
- [ ] All connected players are notified when someone joins/leaves

---

## Request 3: Three.js 3D Scene Setup

**Priority:** P0 - Core
**Dependencies:** Request 1

### Description

Set up the Three.js 3D rendering environment with a stage, camera, and lighting.

### Requirements

1. **Create `client/js/three/renderer.js`**:
   - Initialize Three.js WebGL renderer
   - Handle window resize events
   - Set clear color and antialiasing

2. **Create `client/js/three/scene.js`**:
   - Create and manage the main scene
   - Handle scene children management

3. **Create `client/js/three/camera.js`**:
   - Perspective camera setup
   - Orbit controls for camera rotation/zoom
   - Configurable camera presets (default, top-down, side)

4. **Create `client/js/three/lighting.js`**:
   - Ambient light for base illumination
   - Directional light for shadows
   - Optional point lights for atmosphere

5. **Create `client/js/three/stage.js`**:
   - Renderable stage/ground plane
   - Grid helper for visual reference
   - Stage boundary markers
   - Background plane for the server-selected background image

6. **Update `client/js/main.js`**:
   - Initialize Three.js components in order
   - Set up render loop with `requestAnimationFrame`
   - Handle cleanup on page unload

### Deliverables

- Fully functional Three.js scene
- Rotatable/zoomable camera
- Lit 3D stage with grid
- Render loop running at 60fps

### Acceptance Criteria

- [ ] Browser shows a 3D stage with a ground plane and grid
- [ ] Camera can be rotated with mouse drag and zoomed with scroll
- [ ] Scene is properly lit (no completely dark view)
- [ ] Window resize adjusts the renderer correctly
- [ ] Background plane is rendered and can display a texture

---

## Request 4: Asset Management & Streaming System

**Priority:** P1 - Important
**Dependencies:** Request 2

### Description

Implement the server-side asset storage and streaming system. The server owner can upload assets that are streamed to connected clients.

### Requirements

1. **Create `server/asset-manager.js`**:
   - Handle PNG file uploads (puppet parts, backgrounds)
   - Handle JSON file uploads (skeleton configs, animation configs)
   - Store assets in organized directory structure
   - Generate asset manifests for clients
   - Support asset deletion and replacement
   - Validate file types and sizes

2. **Create asset serving routes** in `server/index.js`:
   - Serve assets from `assets/` directory
   - Cache headers for efficient loading

3. **Create `client/js/assets/asset-browser.js`**:
   - Display available puppets from server
   - Display available backgrounds from server
   - Upload new assets to server
   - Download/cache assets locally

4. **Implement socket events**:
   - `upload-asset`: Client uploads an asset
   - `asset-uploaded`: Server broadcasts new asset available
   - `asset-manifest`: Client requests full asset list
   - `delete-asset`: Server owner deletes an asset

5. **Create UI for asset management** (`client/css/editor.css` + HTML):
   - Asset browser panel
   - Upload dialog
   - Asset preview thumbnails

### Default Assets Required

Include a basic default puppet with these PNG parts (can be simple colored rectangles for placeholders):

- `head.png` - Circular head
- `torso.png` - Rectangular body
- `upper-arm-l.png`, `upper-arm-r.png` - Upper arms
- `lower-arm-l.png`, `lower-arm-r.png` - Lower arms
- `upper-leg-l.png`, `upper-leg-r.png` - Upper legs
- `lower-leg-l.png`, `lower-leg-r.png` - Lower legs
- `skeleton.json` - Default bone hierarchy

### Deliverables

- Server-side asset upload and storage
- Asset streaming to connected clients
- Asset browser UI
- Default puppet assets included

### Acceptance Criteria

- [ ] Server owner can upload PNG and JSON files
- [ ] Uploaded assets are accessible via HTTP
- [ ] Clients receive notification when new assets are uploaded
- [ ] Asset browser displays all available assets with thumbnails
- [ ] Default puppet assets are included and loadable

---

## Request 5: Puppet Bone & Skeleton System

**Priority:** P1 - Core
**Dependencies:** Request 3, Request 4

### Description

Implement the hierarchical bone/skeleton system for puppets. Each bone represents a puppet part with parent-child relationships.

### Requirements

1. **Create `client/js/puppet/bone.js`**:

   - Bone class with properties:
     - `id`: Unique identifier
     - `name`: Human-readable name
     - `parentId`: Reference to parent bone (null for root)
     - `position`: Vector3 for local position
     - `rotation`: Euler for local rotation
     - `scale`: Vector3 for local scale
     - `mesh`: Three.js mesh (the PNG sprite)
     - `socketOffset`: Vector2 offset for attaching child bones
   - Methods:
     - `updateWorldTransform()`: Calculate world position from hierarchy
     - `setRotation(angle)`: Rotate around Z axis (2D-style)
     - `getWorldPosition()`: Return world space position

2. **Create `client/js/puppet/skeleton.js`**:

   - Skeleton class to manage bone hierarchy
   - Load bone hierarchy from JSON configuration
   - Build parent-child relationships
   - Traverse hierarchy for updates
   - Methods:
     - `loadFromConfig(json)`: Parse skeleton JSON
     - `getBone(id)`: Find bone by ID
     - `update()`: Update all bone transforms in order
     - `getRootBones()`: Return bones with no parent

3. **Create `client/js/puppet/mesh-loader.js`**:

   - Load PNG images as Three.js sprites/plane geometries
   - Apply correct UV mapping
   - Handle transparent PNG backgrounds
   - Scale meshes to fit bone dimensions

4. **Define skeleton JSON format**:

   ```json
   {
     "name": "Basic Puppet",
     "bones": [
       {
         "id": "torso",
         "name": "Torso",
         "parentId": null,
         "asset": "torso.png",
         "position": { "x": 0, "y": 0, "z": 0 },
         "scale": { "x": 1, "y": 1 },
         "childrenSocket": { "y": 0.5 }
       },
       {
         "id": "head",
         "name": "Head",
         "parentId": "torso",
         "asset": "head.png",
         "socketOffset": { "x": 0, "y": 1.2 },
         "scale": { "x": 0.8, "y": 0.8 }
       }
     ]
   }
   ```

### Deliverables

- Bone class with hierarchical transforms
- Skeleton manager for bone relationships
- PNG mesh loader for puppet parts
- Skeleton JSON configuration format

### Acceptance Criteria

- [ ] Skeleton loads from JSON configuration
- [ ] Parent bone movement correctly moves child bones
- [ ] Each bone renders its associated PNG sprite
- [ ] World transforms are calculated correctly
- [ ] Bone hierarchy can be traversed and modified

---

## Request 6: Puppet Class & Rendering

**Priority:** P1 - Core
**Dependencies:** Request 5

### Description

Create the main Puppet class that combines the skeleton system with Three.js rendering. Each player controls one puppet.

### Requirements

1. **Create `client/js/puppet/puppet.js`**:

   - Puppet class properties:
     - `id`: Unique puppet identifier
     - `ownerId`: Socket ID of the owner
     - `skeleton`: Skeleton instance
     - `name`: Player's nickname
     - `isOwnerControlled`: Boolean for visual indicator
     - `isLocked`: Boolean (set by server owner)
   - Methods:
     - `load(skeletonConfig, assetBaseUrl)`: Load puppet from config
     - `update()`: Update skeleton and render
     - `moveTo(position)`: Move puppet to stage position
     - `setBoneRotation(boneId, angle)`: Rotate specific bone
     - `playAnimation(animation)`: Start animation playback
     - `stopAnimation()`: Stop current animation
     - `lock()`: Prevent owner from controlling
     - `unlock()`: Restore owner control
     - `teleportTo(position)`: Instant position change (admin)

2. **Puppet rendering**:

   - Render all bones in hierarchy order
   - Display player name above puppet
   - Show lock indicator when puppet is locked
   - Highlight puppet when selected by user

3. **Puppet pool management** in `client/js/main.js`:

   - Track all puppets on stage
   - Create/destroy puppets as players join/leave
   - Update puppet positions from server state

### Deliverables

- Complete Puppet class with all methods
- Puppet rendering on 3D stage
- Player name display
- Lock/teleport visual feedback

### Acceptance Criteria

- [ ] Puppet renders all bones correctly on stage
- [ ] Puppet moves when position is updated
- [ ] Individual bones can be rotated
- [ ] Locked puppets show visual indicator
- [ ] Player name is visible above puppet
- [ ] Multiple puppets can coexist on stage

---

## Request 7: In-Browser Puppet Editor

**Priority:** P2 - Important
**Dependencies:** Request 6

### Description

Create a visual in-browser editor for customizing puppet appearance, bone positions, and socket connections.

### Requirements

1. **Create `client/js/puppet/puppet-editor.js`**:

   - Load a puppet into edit mode
   - Display bone selection overlay
   - Allow dragging bones to reposition
   - Allow adjusting bone rotation with angle slider
   - Allow adjusting bone scale
   - Visual socket point indicators
   - Drag to reposition socket points on parent bone

2. **Create editor UI** (`client/css/editor.css` + HTML panels):

   - Bone list panel (hierarchy tree view)
   - Selected bone properties panel:
     - Position X, Y, Z sliders
     - Rotation angle slider
     - Scale X, Y sliders
     - Asset selector (choose PNG from asset browser)
   - Socket editor:
     - Visual socket points on selected bone
     - Drag to reposition attachment points
   - Apply/Cancel/Save buttons
   - Export skeleton as JSON

3. **Editor socket events**:

   - `puppet-updated`: Send updated puppet config to server
   - `sync-puppet`: Server broadcasts puppet updates to all clients

### Deliverables

- Visual puppet editor UI
- Bone manipulation (position, rotation, scale)
- Socket point editing
- Asset swapping for bones
- JSON export of skeleton config

### Acceptance Criteria

- [ ] User can select individual bones in the editor
- [ ] Bone position, rotation, scale can be adjusted with sliders
- [ ] Changes are previewed in real-time on the puppet
- [ ] Socket points can be repositioned visually
- [ ] New PNG assets can be assigned to bones
- [ ] Editor can export updated skeleton JSON
- [ ] Changes can be saved and synced to server

---

## Request 8: Animation System - Keyframe Engine

**Priority:** P2 - Core
**Dependencies:** Request 6

### Description

Implement the keyframe-based animation system with predefined animations and server synchronization.

### Requirements

1. **Create `client/js/animation/animation-system.js`**:

   - Animation class with properties:
     - `id`: Unique animation identifier
     - `name`: Human-readable name
     - `duration`: Total duration in milliseconds
     - `loop`: Boolean for loop behavior
     - `keyframes`: Array of keyframe objects
   - Keyframe format:

     ```javascript
     {
       time: 0,                       // Time in milliseconds
       boneId: "upper-arm-l",
       rotation: { x: 0, y: 0, z: 45 },  // Euler angles
       position: { x: 0, y: 0, z: 0 }    // Optional position override
     }
     ```

   - AnimationPlayer class:
     - `play(animation)`: Start animation
     - `pause()`: Pause animation
     - `stop()`: Stop and reset
     - `seek(time)`: Jump to specific time
     - `getCurrentTime()`: Get current playback time
     - Interpolate between keyframes using linear/spline interpolation

2. **Create `client/js/animation/animation-library.js`**:

   - Pre-defined animations:
     - `idle`: Subtle breathing/bobbing (loop)
     - `walk`: Walking leg/arm cycle (loop)
     - `run`: Faster walk cycle (loop)
     - `jump`: Jump up and land (one-shot)
     - `wave`: Arm waving greeting (loop)
     - `sit`: Sit down pose (one-shot)
     - `dance`: Dancing animation (loop)
     - `wave-hand`: Single hand wave (one-shot)

3. **Animation JSON format** for storage:

   ```json
   {
     "id": "walk",
     "name": "Walk Cycle",
     "duration": 1000,
     "loop": true,
     "keyframes": [
       { "time": 0, "boneId": "upper-leg-l", "rotation": { "z": 30 } },
       { "time": 500, "boneId": "upper-leg-l", "rotation": { "z": -30 } },
       { "time": 0, "boneId": "upper-leg-r", "rotation": { "z": -30 } },
       { "time": 500, "boneId": "upper-leg-r", "rotation": { "z": 30 } }
     ]
   }
   ```

### Deliverables

- Keyframe animation engine with interpolation
- Animation player with play/pause/stop/seek
- 8 pre-defined animations
- Animation JSON format for storage/sharing

### Acceptance Criteria

- [ ] Animations play smoothly at 60fps
- [ ] Keyframes are interpolated correctly between values
- [ ] Looping animations repeat seamlessly
- [ ] Multiple bone keyframes are applied simultaneously
- [ ] Animations can be started, paused, stopped, and seeked
- [ ] Pre-defined animations are included and functional

---

## Request 9: Animation Synchronization

**Priority:** P2 - Core
**Dependencies:** Request 8

### Description

Synchronize animations across all connected clients so everyone sees the same animation state.

### Requirements

1. **Create `server/animation-sync.js`**:

   - Track which animation each puppet is playing
   - Track animation playback time for each puppet
   - Send animation state updates to all clients
   - Handle animation start/stop/sync events

2. **Create `client/js/animation/animation-sync.js`**:

   - Receive animation commands from server
   - Synchronize local animation playback with server time
   - Handle network latency compensation
   - Smooth interpolation for late-synced animations

3. **Socket events**:

   - `start-animation`: Owner requests animation playback
   - `animation-started`: Server broadcasts animation start with timestamp
   - `animation-state`: Periodic state sync from server
   - `stop-animation`: Owner stops animation
   - `admin-start-animation`: Server owner forces animation on another puppet
   - `admin-stop-animation`: Server owner forces animation stop

### Deliverables

- Server-side animation state tracking
- Client-side animation synchronization
- Network latency compensation
- Admin animation control

### Acceptance Criteria

- [ ] When a player starts an animation, all clients see it
- [ ] Animations are synchronized within 200ms tolerance
- [ ] Server owner can force animations on other players' puppets
- [ ] Animations handle network lag gracefully
- [ ] Animation state survives brief connection drops

---

## Request 10: Animation Keyframe Editor

**Priority:** P3 - Advanced
**Dependencies:** Request 8, Request 9

### Description

Create a visual keyframe animation editor for creating and editing custom animations.

### Requirements

1. **Create `client/js/animation/keyframe-editor.js`**:

   - Timeline view with scrubber
   - Bone selector for target bone
   - Keyframe addition at current timeline position
   - Keyframe deletion
   - Keyframe selection and editing
   - Visual preview of animation on timeline
   - Play/Pause/Stop controls

2. **Keyframe editor UI** (`client/css/animations.css` + HTML):

   - Horizontal timeline with time markers
   - Keyframe markers on timeline per bone
   - Bone rotation/position sliders for keyframe values
   - Add/Delete keyframe buttons
   - Animation name input
   - Duration input
   - Loop toggle
   - Save/Load/Export buttons
   - Animation library browser

3. **Socket events**:

   - `save-animation`: Save animation to server
   - `animation-saved`: Server confirms and broadcasts
   - `load-animation`: Load animation from server
   - `delete-animation`: Delete animation from server

### Deliverables

- Visual keyframe editor UI
- Timeline with keyframe markers
- Bone-targeted keyframe creation
- Animation save/load/export
- Animation library management

### Acceptance Criteria

- [ ] User can create new animations from scratch
- [ ] Keyframes can be added, edited, and deleted
- [ ] Timeline scrubber previews animation
- [ ] Animations can be saved to the server
- [ ] Saved animations appear in the animation library
- [ ] Animations can be exported as JSON

---

## Request 11: Game State Management & Puppet Movement

**Priority:** P1 - Core
**Dependencies:** Request 6, Request 9

### Description

Implement the centralized game state management and puppet movement on stage.

### Requirements

1. **Create `server/game-state.js`**:

   - Track all player states:
     - Position on stage
     - Current animation
     - Puppet configuration
     - Lock status
   - Pre-defined stage locations:
     - Center stage
     - Stage left
     - Stage right
     - Upstage left
     - Upstage right
     - Downstage left
     - Downstage right
   - Methods:
     - `movePlayer(playerId, location)`: Move to predefined location
     - `movePlayerTo(playerId, x, z)`: Move to exact coordinates
     - `getPlayerState(playerId)`: Get player state
     - `getAllPlayerStates()`: Get all states for sync
     - `broadcastState()`: Send state to all clients
     - `broadcastStateUpdate(playerId)`: Send single player update

2. **Client state sync**:

   - `client/js/app-state.js`: Client-side state mirror
   - Receive state updates from server
   - Update local puppet positions and animations
   - Smooth interpolation for movement

3. **Socket events**:

   - `move-puppet`: Client requests puppet movement
   - `puppet-moved`: Server broadcasts movement
   - `state-sync`: Full state sync on connect
   - `state-update`: Incremental state updates

4. **Movement UI**:

   - Stage location buttons (move to predefined spots)
   - Click on stage to move (advanced mode)
   - Smooth movement animation between positions

### Deliverables

- Server-side game state manager
- Client-side state synchronization
- Pre-defined stage locations
- Movement UI with buttons and stage clicking
- Smooth puppet movement

### Acceptance Criteria

- [ ] Players can move their puppet to predefined stage locations
- [ ] All clients see puppet movement in real-time
- [ ] New clients receive full state sync on connect
- [ ] Puppet movement is smooth and interpolated
- [ ] Server owner can see all player positions

---

## Request 12: Admin Panel & Master Controls

**Priority:** P2 - Important
**Dependencies:** Request 11

### Description

Create the admin panel for the server owner with master controls over all players and puppets.

### Requirements

1. **Create `server/admin-controller.js`**:

   - Force move any puppet to any position
   - Force specific animations on any puppet
   - Lock/unlock any puppet (prevent owner control)
   - Eject any player from the server
   - Move any puppet off-stage (hidden position)
   - Change stage background for all clients
   - Override any player's puppet configuration

2. **Create `client/js/ui/admin-panel.js`**:

   - Only visible to Server Owner
   - Player list with controls per player:
     - Lock/Unlock toggle
     - Force move dropdown (stage locations)
     - Force animation dropdown
     - Eject button
     - Move off-stage button
   - Background selector:
     - Choose from available backgrounds
     - Upload new background
     - Apply to all clients
   - Global controls:
     - Pause all animations
     - Reset all puppet positions
     - Kick all players

3. **Socket events**:

   - `admin-move-puppet`: Force move a puppet
   - `admin-lock-puppet`: Lock/unlock a puppet
   - `admin-force-animation`: Force animation on puppet
   - `admin-eject-player`: Remove player from server
   - `admin-change-background`: Change stage background
   - `admin-offstage-puppet`: Move puppet off-stage

### Deliverables

- Server-side admin controller
- Admin panel UI (owner only)
- All master control functions
- Background selection and application

### Acceptance Criteria

- [ ] Server owner sees the admin panel
- [ ] Server owner can lock/unlock any puppet
- [ ] Locked puppets cannot be controlled by their owner
- [ ] Server owner can force animations on any puppet
- [ ] Server owner can eject players
- [ ] Server owner can change the background
- [ ] Server owner can move puppets off-stage

---

## Request 13: UI Panels & Polish

**Priority:** P3 - Polish
**Dependencies:** All previous requests

### Description

Create and polish all UI panels, add settings, and finalize the user interface.

### Requirements

1. **Create `client/js/ui/ui-manager.js`**:

   - Central UI management
   - Panel show/hide animations
   - Responsive layout handling
   - Theme support (light/dark)

2. **Create `client/js/ui/puppet-panel.js`**:

   - Puppet selection from available puppets
   - Puppet preview
   - Edit puppet button (opens editor)
   - Save custom puppet

3. **Create `client/js/ui/animation-panel.js`**:

   - Animation library browser
   - Play/Stop buttons per animation
   - Currently playing indicator
   - Quick-access favorite animations

4. **Create `client/js/ui/chat-panel.js`**:

   - Optional text chat between players
   - System messages (player joined/left)
   - Admin messages

5. **Create `client/js/ui/settings-panel.js`**:

   - Camera preset selection
   - UI opacity settings
   - Audio settings (if added later)
   - Advanced mode toggle

6. **Advanced mode toggle**:

   - Simple mode: Only predefined locations and animations
   - Advanced mode: Full keyframe editor, direct angle control, stage clicking

### Deliverables

- All UI panels completed and polished
- Settings panel
- Chat panel
- Advanced mode toggle
- Responsive UI

### Acceptance Criteria

- [ ] All panels are visually consistent
- [ ] Panels can be opened/closed smoothly
- [ ] Settings persist during the session
- [ ] Advanced mode shows/hides advanced features
- [ ] UI is responsive and works on various screen sizes

---

## Request 14: Network Optimization & Final Integration

**Priority:** P3 - Polish
**Dependencies:** All previous requests

### Description

Optimize network communication, handle edge cases, and perform final integration testing.

### Requirements

1. **Network optimization**:

   - State delta updates (only send changed data)
   - Throttled position updates (max 20Hz)
   - Animation state batching
   - Connection quality indicator

2. **Edge case handling**:

   - Server owner disconnects (promote new owner or shut down)
   - Asset loading failures (fallback to default)
   - Animation sync drift correction
   - Duplicate session handling

3. **Performance**:

   - Puppet rendering optimization
   - Texture caching
   - Efficient state broadcasting

4. **Documentation**:

   - README.md with setup instructions
   - API documentation for socket events
   - Skeleton JSON format documentation
   - Animation JSON format documentation

### Deliverables

- Optimized network communication
- Edge case handling
- Performance improvements
- Complete documentation

### Acceptance Criteria

- [ ] Network traffic is minimized with delta updates
- [ ] Server handles 10 simultaneous players smoothly
- [ ] Asset failures have proper fallbacks
- [ ] Server owner disconnection is handled gracefully
- [ ] README includes full setup and usage instructions
- [ ] All socket events are documented

---

# Implementation Order Summary

| Order | Request | Priority | Estimated Complexity |
|-------|---------|----------|----------------------|
| 1 | Project Foundation & Server Setup | P0 | Low |
| 2 | Nickname Authentication & Connection | P0 | Medium |
| 3 | Three.js 3D Scene Setup | P0 | Medium |
| 4 | Asset Management & Streaming | P1 | Medium |
| 5 | Puppet Bone & Skeleton System | P1 | High |
| 6 | Puppet Class & Rendering | P1 | High |
| 7 | Game State Management & Movement | P1 | Medium |
| 8 | Animation System - Keyframe Engine | P2 | High |
| 9 | Animation Synchronization | P2 | Medium |
| 10 | In-Browser Puppet Editor | P2 | High |
| 11 | Admin Panel & Master Controls | P2 | Medium |
| 12 | Animation Keyframe Editor | P3 | High |
| 13 | UI Panels & Polish | P3 | Medium |
| 14 | Network Optimization & Final Integration | P3 | Medium |

---

# Shared Socket Event Reference

All socket events should be defined in `shared/protocols.js`:

```javascript
// Client -> Server
const CLIENT_EVENTS = {
  REQUEST_JOIN: 'request-join',
  MOVE_PUPPET: 'move-puppet',
  ROTATE_BONE: 'rotate-bone',
  START_ANIMATION: 'start-animation',
  STOP_ANIMATION: 'stop-animation',
  UPLOAD_ASSET: 'upload-asset',
  SAVE_PUPPET: 'save-puppet',
  SAVE_ANIMATION: 'save-animation',
  ADMIN_MOVE_PUPPET: 'admin-move-puppet',
  ADMIN_LOCK_PUPPET: 'admin-lock-puppet',
  ADMIN_FORCE_ANIMATION: 'admin-force-animation',
  ADMIN_EJECT_PLAYER: 'admin-eject-player',
  ADMIN_CHANGE_BACKGROUND: 'admin-change-background',
  ADMIN_OFFSTAGE_PUPPET: 'admin-offstage-puppet',
  REQUEST_ASSET_MANIFEST: 'request-asset-manifest',
  DELETE_ASSET: 'delete-asset',
  CHAT_MESSAGE: 'chat-message',
};

// Server -> Client
const SERVER_EVENTS = {
  JOIN_CONFIRMED: 'join-confirmed',
  NICKNAME_TAKEN: 'nickname-taken',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PUPPET_MOVED: 'puppet-moved',
  ANIMATION_STARTED: 'animation-started',
  ANIMATION_STATE: 'animation-state',
  ASSET_UPLOADED: 'asset-uploaded',
  ASSET_MANIFEST: 'asset-manifest',
  STATE_SYNC: 'state-sync',
  STATE_UPDATE: 'state-update',
  ADMIN_PUPPET_LOCKED: 'admin-puppet-locked',
  ADMIN_PUPPET_MOVED: 'admin-puppet-moved',
  ADMIN_ANIMATION_FORCED: 'admin-animation-forced',
  BACKGROUND_CHANGED: 'background-changed',
  CHAT_MESSAGE: 'chat-message',
  SYSTEM_MESSAGE: 'system-message',
};
```

---

# Data Format References

## Skeleton JSON Format

```json
{
  "name": "Puppet Name",
  "bones": [
    {
      "id": "unique-id",
      "name": "Display Name",
      "parentId": null,
      "asset": "bone-image.png",
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1 },
      "socketPoints": [
        { "id": "top", "offset": { "x": 0, "y": 0.5 } }
      ]
    }
  ]
}
```

## Animation JSON Format

```json
{
  "id": "animation-id",
  "name": "Animation Name",
  "duration": 1000,
  "loop": true,
  "interpolation": "linear",
  "keyframes": [
    {
      "time": 0,
      "boneId": "bone-id",
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "position": { "x": 0, "y": 0, "z": 0 }
    }
  ]
}
```

## Player State Format

```javascript
{
  playerId: 'socket-id',
  nickname: 'PlayerName',
  role: 'owner' | 'client',
  puppetId: 'puppet-config-id',
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  currentAnimation: 'animation-id' | null,
  animationTime: 0,
  isLocked: false,
  isOffStage: false
}