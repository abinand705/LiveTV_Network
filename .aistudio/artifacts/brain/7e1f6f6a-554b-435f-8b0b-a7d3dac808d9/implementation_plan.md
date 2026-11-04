# AetherCast India — 3D Broadcast Studio & Live IPTV EPG Platform

AetherCast India transforms the live Indian television playlist (`https://iptv-org.github.io/iptv/countries/in.m3u`) into an interactive 3D broadcast studio and precision Electronic Program Guide (EPG), pairing seamless HLS (`.m3u8`) and MPEG-DASH (`.mpd`) playback with a spatial Three.js control room and collapsible floating EPG dock.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices incorporate your selections from our planning questions:

- **Confirmed 3D Experience**: An **Interactive 3D Broadcast Studio** built with Three.js where the live HLS/DASH video stream is projected onto a curved composite studio monitor wall with dynamic ambient bias lighting, flanked by composite 3D broadcast consoles, studio camera rigs, acoustic panels, and an optional 2D Theater/Split toggle for zero-distraction viewing.
- **Confirmed EPG Engine**: Automatic extraction and parsing of `url-tvg` / `x-tvg-url` XMLTV schedule feeds from the M3U header, paired with a deterministic, genre-aware schedule generator so every channel always displays rich Now, Next, and 24-hour timeline programs with live progress tracking.
- **Confirmed Playback & Management Suite**:
  - **Adaptive Streaming Engine**: Native `hls.js` and `dashjs` integration with real-time resolution/bitrate switching, audio track selector, latency indicator, and automatic stream health fallback.
  - **Multi-View & PiP**: Simultaneous dual-channel Multi-View (Primary + Secondary stream) and browser Picture-in-Picture (PiP) support.
  - **Channel Organization**: Instant search, category and language filters, persistent Favorites and Recent History, plus a Custom Stream Tester modal to inspect and play any external `.m3u8`, `.mpd`, or `.m3u` URL.

---

## 1. Overview & Core Concept

- **What It Does**: Fetches and parses the live India M3U playlist (`in.m3u`), organizes hundreds of regional, news, entertainment, sports, movie, and music channels into a fast searchable directory and time-grid EPG, and plays streams inside a physically lit 3D broadcast studio or crisp multi-view player.
- **Target Audience / Persona**: Viewers, broadcast enthusiasts, and cord-cutters who want an effortless, high-craft interface to browse live Indian television channels, inspect schedules, compare two live broadcasts side by side, and test custom HLS/DASH streams.
- **Key Value**: Eliminates clunky IPTV player lists and CORS/stream errors with automatic stream health recovery, a responsive EPG timeline, and a studio-grade visual presentation that keeps the viewport unobstructed.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Instant Live Tuning & Studio Arrival**:
   - On launch, the application fetches and parses `https://iptv-org.github.io/iptv/countries/in.m3u`, categorizes all channels by group and language, and tunes the 3D broadcast studio monitor wall to a featured live stream.
   - Users can orbit smoothly around the 3D broadcast desk, click camera preset buttons (`Studio Wide`, `Monitor Close-Up`, `Control Desk`, or `Dual-Screen Wall`), or expand the video into full-viewport 2D or Multi-View mode.
2. **Collapsible Bottom EPG & Channel Dock**:
   - Pinned to the bottom center (`<= 15%` compact bar when minimized, expandable into a rich EPG drawer) is the unified control dock. Users can press `H` or click **Hide Controls** to collapse the dock completely for an unobstructed 100% 3D studio view.
   - Expanding the **EPG & Channel Guide** drawer reveals a searchable, filterable channel browser alongside a horizontal time-slot program grid showing **Now Playing**, **Up Next**, progress bars, and program synopses.
3. **Adaptive Quality, Audio & Stream Recovery**:
   - Selecting any channel binds its HLS (`.m3u8`) or DASH (`.mpd`) manifest to the video engine, syncing the live HTML5 `<video>` element to the Three.js `VideoTexture` on the 3D studio screen.
   - Users can switch video quality levels (`Auto`, `1080p`, `720p`, `480p`), switch embedded audio tracks, pop out Picture-in-Picture, or launch a second channel in **Multi-View** mode.
   - If a community stream URL is offline or geo-restricted, the Stream Health Monitor surfaces a clean diagnostic action bar offering one-click retry, alternate mirror switching (when multiple streams exist for a channel), or a clean fallback test broadcast so the 3D screen never breaks.
4. **Custom Stream & Playlist Tester**:
   - Clicking **Custom Stream** opens a clean modal where users can paste any `.m3u8` (HLS), `.mpd` (DASH), or custom `.m3u` playlist URL, inspect its codec/resolution telemetry, and save it to their personal channel list.

### Visual Identity & Theme

- **Aesthetic Direction**: Precision Broadcast Control Room & Editorial Dark UI — inspired by high-end master control rooms and modern cinema interfaces.
- **Color Palette & Mood**:
  - **60% Dominant Canvas**: Deep obsidian broadcast slate (`#090B10`) matching the 3D studio horizon fog.
  - **30% Structural Surfaces**: Solid/translucent charcoal dock surfaces (`rgba(15, 19, 28, 0.92)`) with `1px solid rgba(255, 255, 255, 0.08)` hairline borders (no `backdrop-filter` over active WebGL to guarantee 60fps performance).
  - **10% Accent Budget**: Broadcast signal amber (`#F59E0B`) for active channel selection and live timeline playheads, paired with crisp signal cyan (`#06B6D4`) for HLS/DASH stream format indicators.
- **Typography & Hierarchy**:
  - **Display & Headings**: `Outfit` (600/700 weight) for crisp channel titles, broadcast headers, and studio camera labels.
  - **UI & Program Prose**: `Plus Jakarta Sans` (400/600 weight) for high-legibility EPG descriptions, category filters, and controls.
  - **Telemetry & Timecodes**: `JetBrains Mono` with `tabular-nums` for EPG broadcast timestamps (`18:30 – 19:00 IST`), bitrate/resolution readouts, and channel numbers.
- **Top Bar Contract**:
  - Strictly follows the 3-zone contract:
    1. **Brand Wordmark**: `AetherCast India` (single-line display wordmark).
    2. **Navigation Links**: `Live Studio`, `EPG Guide`, `Multi-View`, `Favorites`, `Custom Stream` (`whitespace-nowrap shrink-0`).
    3. **Primary Action**: `Cinema Mode (H)` toggle button.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Unified HTML5 Video + Three.js `VideoTexture` Bridge**
  - *Chosen Approach*: Drive HLS (`hls.js`) and DASH (`dashjs`) playback through managed HTML5 `<video>` elements that feed both the 3D Three.js `VideoTexture` (on the curved studio screen) and the crisp 2D/Multi-View overlay.
  - *Why*: Ensures zero duplicate network bandwidth when switching between 3D Studio View, 2D Fullscreen, and Multi-View, while preserving full browser Picture-in-Picture and hardware-decoded adaptive streaming.
- **Decision 2: Multi-Part Procedural 3D Broadcast Studio (`THREE.Group`)**
  - *Chosen Approach*: Construct the 3D studio entirely from procedural multi-part `THREE.Group` assemblies (curved main broadcast screen with beveled frame and articulated truss mount, multi-tier mixing console with faders and illuminated meters, robotic studio pedestal camera with lens hood and tally light, and instanced acoustic wall diffusers) lit by `RoomEnvironment` PMREM reflections, a warm key light, cool hemisphere fill, and dynamic screen-color bias lighting.
  - *Why*: Guarantees zero external `.glb` or `.hdr` 404 errors, instant startup, and authentic PBR metallic/roughness surface contrast.
- **Decision 3: Hybrid XMLTV Parser + Deterministic EPG Schedule Synthesis**
  - *Chosen Approach*: Parse `x-tvg-url` / `url-tvg` XMLTV feeds when accessible via CORS, and automatically synthesize realistic, time-aligned Indian television programming (tailored to each channel's category—News bulletins, Cinema blocks, Live Cricket/Sports, Regional Drama, Music countdowns) for channels lacking external XMLTV records.
  - *Why*: Public M3U playlists frequently omit EPG records for regional channels; this hybrid approach guarantees a complete, searchable EPG timeline across 100% of parsed channels.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AetherCast India Application                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Top Bar (3-Zone Contract: Brand Wordmark | 4-5 View Links | Cinema Toggle)  │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌───────────────────────────────────────┐    ┌─────────────────────────────────┐
│     3D Broadcast Studio Viewport      │    │   Adaptive Stream Engine        │
│  (Isolated useRef WebGL Canvas)       │◄───│  (HLS.js + Dash.js + Native)    │
│  ├─ RoomEnvironment PMREM + FogExp2   │    │  ├─ Primary Video Element       │
│  ├─ Curved Main Screen (VideoTexture) │    │  ├─ Secondary Video (Multi-View)│
│  ├─ Secondary Aux Monitor (Multi-View)│    │  ├─ Quality / Bitrate Controller│
│  ├─ Procedural Control Console Group  │    │  ├─ Audio Track Switcher        │
│  ├─ Robotic Pedestal Camera Group     │    │  └─ Stream Health & Mirror Retry│
│  └─ Damped Orbit & Preset Camera Rig  │    └─────────────────┬───────────────┘
└───────────────────────────────────────┘                      │
                ▲                                              ▼
                │                            ┌─────────────────────────────────┐
                │                            │   M3U & EPG Data Store          │
                │                            │  ├─ India M3U Playlist Parser   │
                │                            │  ├─ Channel Deduplication/Mirrors│
                │                            │  ├─ XMLTV Feed + Smart EPG Gen  │
                │                            │  └─ LocalStorage (Favs/History) │
                │                            └─────────────────┬───────────────┘
                │                                              │
                └──────────────────────┬───────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│            Collapsible Bottom Control & EPG Dock (<= 15% Height)             │
│  ├─ Transport & Stream Bar: Play/Pause, Volume, Quality, Audio, PiP, Camera  │
│  ├─ Expandable EPG Timeline Drawer: Search, Category/Language Tabs, Time Grid│
│  └─ Custom Stream Tester Modal: Add/Test External HLS (.m3u8) & DASH (.mpd)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`Channel`**: `id`, `name`, `logo`, `group` (News, Entertainment, Movies, Music, Sports, Kids, Religious, Legislative, etc.), `language`, `tvgId`, `streamUrls` (array of primary + backup mirrors found in the M3U), `streamType` (`hls` | `dash` | `native`), `isCustom`.
- **`ProgramSlot`**: `id`, `channelId`, `title`, `category`, `description`, `startTime` (UTC/IST), `endTime`, `isLive`.
- **`PlaybackState`**: `activeChannel`, `secondaryChannel` (when Multi-View is active), `activeMirrorIndex`, `status` (`loading` | `playing` | `paused` | `error`), `qualities` (available resolution tiers), `selectedQuality`, `audioTracks`, `selectedAudioTrack`, `cameraPreset` (`studio` | `screen` | `console` | `dual`).

### Interactive Component & State Mapping

- **M3U Ingestion & Deduplication**: Fetches `https://iptv-org.github.io/iptv/countries/in.m3u` on startup, groups duplicate channel entries as selectable stream mirrors (`Stream 1`, `Stream 2`), and extracts `#EXTM3U` attributes (`tvg-id`, `tvg-logo`, `group-title`, `http-user-agent`).
- **Stream Format Detection & Recovery**: Inspects URLs and content headers to route `.m3u8` streams to `hls.js` (with low-latency and buffer recovery enabled) and `.mpd` streams to `dashjs`. If a stream encounters a network or media error, `hls.recoverMediaError()` runs first, followed by automatic mirror failover or a user-accessible fallback stream option.
- **3D Scene Interaction**: Clicking the 3D monitor toggles play/pause or focuses the camera onto the screen; switching camera presets in the bottom dock smoothly interpolates camera position and look-at targets using exponential damping (`THREE.MathUtils.damp`).
