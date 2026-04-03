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
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── README.md
└── src/
    ├── main.jsx               # React DOM entry point
    ├── App.jsx                # Main Pulse component with localStorage
    ├── index.css              # Tailwind directives + global styles
    ├── hooks/
    │   └── useLocalStorage.js # Custom hook for localStorage persistence
    └── utils/
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
| `pulse_app_state` | Current view (onboarding / home / detail / chat) |
| `pulse_active_pod` | The pod the user most recently joined |
| `pulse_pods_history` | List of all pods the user has joined |
| `pulse_exchanges` | List of all info-exchange records |
| `pulse_storage_version` | Schema version for future migrations |

## Resetting Your Profile

Open the browser console and run:

```js
localStorage.clear();
location.reload();
```
