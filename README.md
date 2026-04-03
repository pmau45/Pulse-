# Pulse

A real-time connection pods dating app built with React, Vite, and Tailwind CSS. User profiles and app state are persisted to `localStorage` so your data survives page refreshes.

## Features

- **Onboarding** – Multi-step profile creation (name, icebreakers, reveal info)
- **Smart Resume** – Skips onboarding automatically if a profile already exists
- **Pods** – Browse nearby connection pods, view details, and join live sessions
- **Chat** – Countdown timer, blind profile reveal, and info exchange
- **Local Storage** – Profile, active pod, pods history, and exchange records are all persisted

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Vite](https://vitejs.dev/) | Fast dev server & build tool |
| [React 18](https://react.dev/) | UI framework |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Lucide React](https://lucide.dev/) | Icon library |

## Project Structure

```
Pulse-/
├── index.html
├── netlify.toml               # Netlify build config + SPA redirect
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx               # React DOM entry point
    ├── App.jsx                # Main Pulse component (all views)
    ├── index.css              # Tailwind directives + global styles
    ├── components/
    │   ├── PhotoGallery.jsx   # Photo grid with delete support
    │   ├── PhotoUpload.jsx    # Image picker & compressor
    │   └── Settings.jsx       # Settings panel view
    ├── hooks/
    │   ├── useLocalStorage.js # Generic localStorage persistence hook
    │   └── useSettings.js     # User-settings hook with defaults
    └── utils/
        ├── photoUtils.js      # Image compression helpers (Canvas API)
        └── storageManager.js  # Storage helpers & migration logic
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## localStorage Keys

| Key | Description |
|-----|-------------|
| `pulse_user_profile` | Completed user profile from onboarding |
| `pulse_app_state` | Current view (welcome / onboarding / locationPermission / home / chat / settings / editPhotos) |
| `pulse_active_pod` | The pod the user most recently joined |
| `pulse_pods_history` | List of all pods the user has joined |
| `pulse_exchanges` | List of all info-exchange records |
| `pulse_storage_version` | Schema version for future migrations |
| `pulse_user_photos` | Array of base64-encoded profile photo data URLs |
| `pulse_user_settings` | User preferences (theme, notifications, location, visibility, photo privacy) |
| `pulse_chat_end_time` | Epoch ms timestamp when the active chat session ends |
| `pulse_missed_connections` | Count of chats that expired without an exchange |

## Resetting Your Profile

Open the browser console and run:

```js
localStorage.clear();
location.reload();
```

## Deploying to Netlify

### One-click deploy (recommended)

1. Push the repository to GitHub.
2. Log in to [Netlify](https://app.netlify.com/) and click **Add new site → Import an existing project**.
3. Select your GitHub repository.
4. Netlify will automatically detect the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**.

SPA client-side routing is handled by the `[[redirects]]` rule in `netlify.toml` (all paths fall back to `/index.html`).

### Required environment

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |

> **Tip:** Set `NODE_VERSION = 18` in **Netlify → Site settings → Environment variables** to pin the Node version on Netlify's build workers.
