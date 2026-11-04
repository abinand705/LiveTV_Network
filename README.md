# Live TV Network

**Live TV Network** is an Android TV-inspired live television streaming platform for Indian broadcast channels. It dynamically parses the public India IPTV playlist (`https://iptv-org.github.io/iptv/countries/in.m3u`), enriches channels with Electronic Program Guide (EPG) schedule data, and delivers adaptive **HLS (`.m3u8`)** and **MPEG-DASH (`.mpd`)** live playback across mobile phones, tablets, desktops, and smart TVs.

---

## Key Features

### 1. Multi-Language Onboarding & Personalization
- **Step 1 Language Selector**: On initial load, users can select one or multiple Indian languages (*Hindi, English, Malayalam, Tamil, Telugu, Kannada, Bengali, Marathi, Punjabi, Gujarati, Odia, Assamese, Urdu, Bhojpuri*, or *All Languages*).
- **Explicit Continue Gate**: Users can toggle as many languages as they want and enter the main television launcher when clicking **Continue**.
- **Live Language Rail**: Easily toggle additional languages at any time directly from the horizontal language bar on the home screen.

### 2. Auto-Switching Live Channel Hero Banner
- **Live Spotlight Player**: Automatically cycles through featured live channels at regular intervals with a smooth progress indicator.
- **Unobstructed Widescreen Video**: Full-width video viewport (`object-contain`) with a subtle bottom control dock.
- **Manual Spotlight Controls**: Pause/resume auto-switching or step backward/forward between spotlight channels.

### 3. Adaptive HLS & MPEG-DASH Playback Engine
- **Dual-Protocol Engine**: Powered by `hls.js` for `.m3u8` HTTP Live Streaming and `dashjs` for `.mpd` MPEG-DASH streams, with native Safari HLS fallback.
- **Automatic Stream Recovery & Mirrors**: Detects offline or geo-restricted feeds and provides one-click feed switching plus verified HLS and MPEG-DASH backup streams.

### 4. Fullscreen TV Mode, Picture-in-Picture & Mobile Screen Rotation
- **Pure Fullscreen TV (`F` Key)**: Press `f` (or click **Watch Fullscreen (F)**) to watch the live broadcast in a distraction-free fullscreen view with all banners, headers, and overlays hidden. Use `ArrowUp` / `ArrowDown` to surf channels while in fullscreen.
- **Native Picture-in-Picture (PiP)**: Click **Picture-in-Picture** to pop the live video into a floating PiP window (with automatic in-app corner dock fallback) so you can scroll and browse channels while keeping your current stream visible in the corner.
- **Mobile Screen Rotation**: Tap **Rotate** (**Rotate Screen**) on mobile phones or tablets to lock or rotate the live video player into a full-screen 90° landscape view, with a quick **Portrait View** button to return.

### 5. Darker Navigation Bar with In-Place Running Search & Inline Info/Contact Drawer
- **In-Place Running Search Bar**: Clicking **Search** in the top dark navbar smoothly expands the search input directly from the Search button's position (`origin-left`) while hiding the other navbar buttons. Clicking outside the search bar retracts it in a running effect and restores the navbar buttons.
- **Inline Navbar Sections (`Terms & Conditions`, `Privacy`, `Disclaimer`, `Contact Us`)**:
  - Clicking **Contact Us** in the navbar opens an inline form **directly inside the navbar itself** with input boxes for **Name**, **Email ID**, **Message**, and a **Submit** button.
  - Clicking **Terms & Conditions**, **Privacy**, or **Disclaimer** expands the corresponding legal and broadcast information right inside the navbar.

### 6. Categorized Android TV Swimlanes & Searchable EPG Guide
- **Categorized Horizontal Swimlanes**: Channels are organized by genre (*News, Entertainment, Movies, Music, Sports, Kids, Knowledge & Public, Business, Devotional*).
- **Electronic Program Guide (TV Guide)**: Searchable EPG view displaying live **LIVE NOW** progress bars and **UP NEXT** program schedules.
- **Persistent Watchlist**: Star your favorite channels to save them to `localStorage` and filter them anytime via the **Watchlist** tab.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`F` / `f`** | Toggle pure Fullscreen TV mode on or off |
| **`Esc` / `Backspace`** | Exit Fullscreen TV mode, exit Mobile Landscape Rotation, or close the Search bar |
| **`ArrowUp` / `ChannelUp`** | Switch to the next channel while in Fullscreen TV mode |
| **`ArrowDown` / `ChannelDown`** | Switch to the previous channel while in Fullscreen TV mode |

---

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8 (`@vitejs/plugin-react`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Streaming Engines**: `hls.js` (HLS `.m3u8`) & `dashjs` (MPEG-DASH `.mpd`)
- **Icons & Typography**: `lucide-react`, Google Fonts (*Outfit*, *Plus Jakarta Sans*, *JetBrains Mono*)

---

## Project Structure

```text
├── public/
│   └── favicon.svg                 # Custom Live TV Network SVG broadcast emblem
├── src/
│   ├── components/
│   │   ├── EpgGuidePanel.tsx       # Searchable TV Guide with LIVE NOW & UP NEXT slots
│   │   └── LiveTvLogo.tsx          # Custom SVG logo & wordmark component (light/dark variants)
│   ├── services/
│   │   ├── epgService.ts           # XMLTV parser & deterministic Indian TV schedule generator
│   │   ├── m3uParser.ts            # M3U playlist fetcher, language classifier & mirror deduplicator
│   │   └── streamController.ts     # Unified HLS.js + dash.js adaptive playback controller
│   ├── App.tsx                     # Main Android TV launcher, onboarding, navbar & video stage
│   ├── index.css                   # Tailwind CSS v4 imports & custom scrollbar utilities
│   ├── main.tsx                    # React application entry point
│   └── types.ts                    # TypeScript interfaces for channels, EPG slots & telemetry
├── index.html                      # HTML entry point with SEO/OpenGraph metadata & fonts
├── package.json                    # Project dependencies & scripts
└── README.md                       # Project documentation
```

---

## Local Setup & Installation

### Prerequisites
- **Node.js** `v18+` (recommended `v20+` or `v22+`)
- **npm** `v9+`

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd LiveTV_Network
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Type-Check & Production Build
```bash
npm run lint
npm run build
npm run preview
```
