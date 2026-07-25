# Stress Companion - Frontend Documentation

## 1. Project Overview & Frontend Purpose
The **Stress Companion Frontend** is a modern React application intended to provide real-time stress analysis and chat-based therapy or assistance. It integrates advanced visual and voice analysis tools (e.g., MediaPipe for vision, VAD for voice detection), real-time WebSockets for stress inference, and AI-driven conversational elements. The frontend acts as the user-facing portal to interact with backend services via both RESTful APIs and real-time WebSocket connections.

## 2. Complete Frontend Tech Stack
The project is built on modern web technologies optimized for performance and real-time interactions: 

*   **Core Framework**: React 19, Vite, React Router DOM v7
*   **Optimization**: React Compiler (via `babel-plugin-react-compiler`)
*   **State Management**: Zustand (with Persist middleware for local storage)
*   **Styling**: Tailwind CSS v4, `next-themes` (for dark/light mode toggle)
*   **UI Components**: Radix UI (Headless UI components), `shadcn/ui` conventions, `lucide-react` (icons)
*   **Forms & Validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
*   **Networking & APIs**: Axios (with interceptors), Native WebSockets (`StressSocket`), Vercel AI SDK & Google Generative AI
*   **Visuals & Animations**: `@rive-app/react-webgl2` (Rive animations), `recharts` (for data visualization)
*   **Advanced Real-time Tools**: `@mediapipe/tasks-vision` (client-side processing), `@ricky0123/vad-web` (voice activity detection)
*   **Markdown Parsing**: `streamdown` & plugins (cjk, math, code, mermaid)

## 3. Folder and Component Structure Overview
The `src/` directory is logically organized to separate concerns effectively:
```text
src/
├── assets/         # Static assets (images, Rive raw files, etc.)
├── components/     # React components
│   ├── ai-elements/# Components specific to chatting and GenAI rendering
│   ├── features/   # Complex domain-specific components (e.g., Dashboard elements, Session flows)
│   ├── layout/     # Layout wrappers (Navbars, sidebars, main containers)
│   ├── ui/         # Reusable generic UI elements (buttons, inputs, dialogs - Shadcn built)
│   └── theme-provider.jsx
├── config/         # System-wide configuration (constants.js, api.js endpoints)
├── core/           # Core architecture classes (e.g., network/StressSocket.js, ChatClient.js)
├── hooks/          # Custom React hooks covering reusable logic
├── lib/            # Library setups (e.g., axios.js configuration)
├── pages/          # Top-level Routing components (Dashboard, Login, ProfilePage, SettingsPage, SessionReportPage, etc.)
└── store/          # Zustand state definitions (useAuthStore, useSessionStore, etc.)
```

## 4. Environment Setup Instructions
You need Node.js installed to develop and run this project.
*   **Recommended Node version**: v20 or higher (Due to React 19 & Vite compatibility).
*   Clone the repository to your local machine.

## 5. Package Manager Setup
The project uses `npm` as the default package manager (`package-lock.json` is present). 
*   **Required Tool**: npm (Make sure you are not using yarn/pnpm blindly to avoid lockfile conflicts, or migrate it according to team norms).

## 6. Dependency Installation Steps
Open your terminal in the `stress_companion_frontend` directory and run:
```bash
npm install
```

## 7. Configuration (.env)
Create a `.env.development` or `.env` file in the root of the project based on the provided `.env.example` file.
Required variables:

*   **`VITE_API_BASE_URL`**: Base URL for your FastAPI REST endpoints. (e.g., `http://localhost:8000`)
*   **`VITE_WS_BASE_URL`**: Base URL for your FastAPI WebSocket connections for optical/thermal processing. (e.g., `ws://localhost:8000`)

*Note: The `VITE_` prefix is strictly necessary for Vite to expose these variables to the frontend code via `import.meta.env`.*

## 8. Frontend Build and Development Commands
*   **Start Local Dev Server**: `npm run dev`
*   **Build for Production**: `npm run build`
*   **Preview Production Build**: `npm run preview`
*   **Run Linter**: `npm run lint`

## 9. How to run the frontend locally
1. Ensure your backend is actively running (usually on `http://localhost:8000`).
2. Verify your `.env` contains the correct mapping to the backend.
3. Execute `npm run dev`.
4. Open the `http://localhost:5173` (or the port Vite issues) in your browser.

## 10. API/Backend Integration Details
*   **REST APIs**: Handled centrally via `Axios`. The config natively lives in `src/lib/axios.js` which usually implements token-based `Authorization` interceptors. API endpoints are securely organized in `src/config/api.js`.
*   **WebSockets (`StressSocket.js`)**: Used to stream heavy or rapid data, like feeding video frames or thermal camera metrics to the backend real-time stress inference services. Includes native auto-reconnect fallback mechanisms.
*   **Chat Layer (`ChatClient.js`)**: Manages conversations by interfacing with the AI endpoints under specific Session records.
*   **Authentication**: Managed by storing access tokens extracted from authentication endpoints and passing them automatically in subsequent requests.

## 11. State Management, Routing & Styling
*   **State Management**: `zustand` is actively utilized to avoid Prop Drilling.
    *   `useAuthStore`: Handles user authentication sessions, caching tokens using `persist()` middleware to `localStorage`.
    *   `useSessionStore`: Tracks stress sessions and associated parameters.
    *   `useVisionStore` / `useUIStore`: Dedicated state management for local UI flows or camera/vision processing status.
*   **Routing**: Defined with `react-router-dom` v7. Routes naturally map to the `pages/` directory.
*   **Styling**: Employs `Tailwind CSS v4` as a Vite plugin (`@tailwindcss/vite`). Extensibility happens by chaining classes in components. `shadcn/ui` principles are used heavily.

## 12. Important Frontend Conventions & Implementation Notes
*   **React Compiler**: Explicitly enabled in `vite.config.js`. You do not need to manually implement `useMemo` or `useCallback` everywhere since the Babel plugin automates most memoization.
*   **Strict UI/Core Separation**: Always preserve complex logic outside React UI rendering loops. E.g., `StressSocket` operates strictly outside React loops to avoid heavy re-renders when parsing rapid frames (30+ FPS).
*   **Absolute Imports**: Paths utilize absolute imports leveraging the `@` alias strictly mapped to `src/` (e.g., `import { API_ENDPOINTS } from "@/config/api"`). Avoid extensive relative paths (`../../..`).

## 13. Troubleshooting Common Issues
*   **Vite Cannot Expose Network**: If trying to test on a physical mobile device, run Vite with `npm run dev -- --host` and ensure the backend uses `0.0.0.0`. 
*   **WebSocket Drops / Timeout**: Ensure the backend isn't restricting origins (CORS). Check the Terminal for `StressSocket Parse Error` which implies mismatching WS payloads.
*   **Dependencies Mismatch/Errors**: If seeing React 19 specific hooks errors, ensure you haven't downgraded `react` locally. Always run `npm ci` or `npm install` after a master branch pull.
*   **React Compiler Issues**: Because it modifies Vite Build performances, unexpected bugs with uncontrolled inputs might arise if the compiler misinterprets complex mutations. Wrap complex 3rd party mutations strictly or rely on refs if compiler warnings appear.
