# Zoom Video SDK Next.js App

A Next.js application that integrates Zoom Video SDK for basic video and audio conferencing.

## Features

- Create video sessions via Zoom REST API
- Join sessions with role-based access (Host, Co-host, Attendee)
- Real-time video and audio conferencing
- Responsive video grid layout
- Audio/video controls

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   ZOOM_API_KEY=your_api_key_here
   ZOOM_API_SECRET=your_api_secret_here
   ```
   
   Get your API credentials from the [Zoom Developer Console](https://developers.zoom.us/).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Create a Session:**
   - Enter a session topic/name
   - Enter your name
   - Optionally provide a user ID (auto-generated if not provided)
   - Click "Create Session"

2. **Join the Session:**
   - After session creation, enter your name
   - Click "Join Session"
   - Allow camera and microphone permissions when prompted

3. **During the Session:**
   - Toggle video on/off
   - Mute/unmute audio
   - View other participants in the video grid
   - Leave the session when done

## Project Structure

```
zoom_poc/
├── pages/
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── create.ts      # Create session endpoint
│   │   │   └── [sessionId].ts # Session management endpoint
│   │   └── token.ts           # JWT token generation endpoint
│   └── index.tsx               # Main meeting page
├── components/
│   ├── VideoConference.tsx    # Main meeting component
│   ├── VideoControls.tsx       # Audio/video controls
│   └── VideoGrid.tsx           # Video display grid
├── lib/
│   ├── zoom.ts                 # Zoom SDK utilities
│   ├── zoom-api.ts             # Zoom REST API client
│   ├── jwt-utils.ts            # JWT token generation
│   └── session-store.ts        # Session ownership tracking
└── .env.local                  # Environment variables (not in git)
```

## Role Management

- **Host**: User who creates the session. Full control over the session.
- **Co-host**: Assigned by host. Can manage participants but cannot end session.
- **Attendee**: Default role for all other participants.

Roles are determined automatically based on session ownership and stored in the session store.

## Technologies

- Next.js 16 (Pages Router)
- React 19
- TypeScript
- Zoom Video SDK
- Tailwind CSS
- jsrsasign (JWT signing)

## Notes

- This is a POC implementation using in-memory session storage
- For production, replace the session store with a database
- Ensure your Zoom account has Video SDK enabled
- API credentials must have appropriate permissions
