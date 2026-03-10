# Zoom Video SDK Next.js App

A comprehensive Next.js application that integrates Zoom Video SDK for full-featured video conferencing with advanced capabilities including screen sharing, chat, live captions, translation, cloud recording, and AI meeting summary.

## Features

### Core Functionality

- ✅ **Create video sessions** via Zoom REST API
- ✅ **Join sessions** with role-based access (Host, Co-host, Attendee)
- ✅ **Real-time video and audio conferencing** with responsive grid layout
- ✅ **Audio/video controls** (mute, unmute, start/stop video)

### Advanced Features

- ✅ **Screen Sharing** - Share your screen with all participants
- ✅ **Chat** - Real-time text messaging during the session
- ✅ **Participant Management** - Host controls for muting, removing users, assigning roles
- ✅ **Cloud Recording** - Start, pause, resume, and stop cloud recordings (host-only)
- ✅ **Live Captions & Translation** - Automatic speech-to-text with multi-language translation support
- ✅ **AI Meeting Summary** - Smart meeting summaries powered by Zoom AI Companion

### Host/Manager Controls

- Mute/unmute individual participants or all participants
- Remove participants from session
- Assign/revoke manager role
- Transfer host privileges
- Control recording and captions

## Setup

### Prerequisites

- Node.js 18+ and npm
- Zoom account with **Video SDK** enabled
- Zoom account with **Cloud Recording** enabled (for recording feature)
- Zoom account with **Live Transcription** enabled (for captions feature)
- Zoom account with **AI Companion** enabled (for AI summary feature)
- Zoom **Workplace Pro** plan or higher (required for AI Companion features)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd zoom_poc
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the root directory:

   ```env
   # Zoom REST API credentials (for session management)
   ZOOM_API_KEY=your_rest_api_key_here
   ZOOM_API_SECRET=your_rest_api_secret_here

   # Zoom Video SDK credentials (for client-side joining)
   ZOOM_SDK_KEY=your_sdk_key_here
   ZOOM_SDK_SECRET=your_sdk_secret_here
   ```

   **Important:** These are **two separate sets of credentials**:

   - **REST API credentials** (`ZOOM_API_KEY`, `ZOOM_API_SECRET`): Used for server-side session creation via Zoom REST API
   - **Video SDK credentials** (`ZOOM_SDK_KEY`, `ZOOM_SDK_SECRET`): Used for generating JWT tokens that clients use to join sessions

   Get your credentials from the [Zoom Developer Console](https://developers.zoom.us/):

   - Create a **Server-to-Server OAuth** app for REST API credentials
   - Create a **Video SDK** app for SDK credentials

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Creating a Session

1. Select **"Create Session"** mode
2. Enter a session topic/name
3. Enter your name
4. Optionally provide a user ID (auto-generated if not provided)
5. Click **"Create Session"**
6. After creation, click **"Join Session"** to enter as the host

### Joining an Existing Session

1. Select **"Join Session"** mode
2. Enter the Session ID (provided by the session creator)
3. Enter your name
4. Optionally provide a user ID
5. Click **"Join Session"**

### During the Session

#### Basic Controls

- **Video Toggle** - Turn camera on/off
- **Audio Toggle** - Mute/unmute microphone
- **Screen Share** - Share your screen with participants
- **Chat** - Open chat panel to send/receive messages
- **Participants** - View participant list and manage users (host/managers)
- **Captions** - Enable live captions and translation
- **AI Summary** - Start/stop AI-powered meeting summary (host-only)
- **Recording** - Start/stop cloud recording (host-only)
- **Leave** - Exit the session

#### Host/Manager Actions

- **Mute All / Unmute All** - Control audio for all participants
- **Mute User** - Mute individual participants
- **Remove User** - Remove participants from session
- **Make Host** - Transfer host privileges
- **Make Manager / Revoke Manager** - Assign/remove manager role
- **Disable Captions** - Turn off captions for all participants

#### Live Captions & Translation

1. Click the **CC** button in the control bar
2. Click **"Enable Live Captions"** in the panel
3. Speak - your words appear as real-time captions
4. Open **"Language settings"** to:
   - Set your speaking language (microphone input)
   - Enable translation to a different language
5. Each participant can set their own translation language independently

## Project Structure

```
zoom_poc/
├── pages/
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── create.ts          # Create session endpoint
│   │   │   └── [sessionId].ts     # Session management endpoint
│   │   └── token.ts               # JWT token generation endpoint
│   ├── _app.tsx                    # Next.js app wrapper
│   └── index.tsx                  # Main meeting page
├── components/
│   ├── VideoConference.tsx         # Main meeting component
│   ├── VideoControls.tsx           # Audio/video/feature controls
│   ├── VideoGrid.tsx               # Video display grid
│   ├── ChatPanel.tsx              # Chat interface
│   ├── ParticipantPanel.tsx       # Participant list & management
│   ├── ScreenShareView.tsx        # Screen share display
│   └── CaptionPanel.tsx           # Live captions & translation
├── lib/
│   ├── zoom.ts                    # Zoom SDK client initialization
│   ├── zoom-api.ts                 # Zoom REST API client
│   ├── jwt-utils.ts               # JWT token generation (REST API & SDK)
│   └── session-store.ts           # Session ownership tracking
├── types/
│   ├── jsrsasign.d.ts             # TypeScript definitions for jsrsasign
│   └── zoom-elements.d.ts        # Custom HTML elements for Zoom SDK
├── styles/
│   └── globals.css                # Global styles
└── .env.local                     # Environment variables (not in git)
```

## Role Management

### Roles

- **Host**: User who creates the session. Full control including:

  - Start/stop recording
  - Start/stop AI summary
  - Mute/remove participants
  - Assign managers
  - Transfer host privileges
  - Disable captions for all

- **Manager**: Assigned by host. Can:

  - Mute/remove participants
  - Manage participants (except host actions)

- **Attendee**: Default role for all other participants. Can:
  - Use video/audio
  - Share screen
  - Use chat
  - Enable captions/translation

Roles are determined automatically based on session ownership and stored in the session store. The JWT token includes the role (`role_type: 0` for attendee, `1` for host).

## Technologies

- **Next.js 16** (Pages Router)
- **React 19**
- **TypeScript**
- **Zoom Video SDK** (`@zoom/videosdk`)
- **Zoom REST API** (for session management)
- **Tailwind CSS** (styling)
- **jsrsasign** (JWT signing for authentication)
- **Axios** (HTTP client)

## Account Requirements

To use all features, ensure your Zoom account has:

1. **Video SDK** enabled (required for all features)
2. **Cloud Recording** enabled (for recording feature)
3. **Live Transcription** enabled (for captions feature)
4. **AI Companion** enabled (for AI summary feature)
   - Requires **Zoom Workplace Pro** plan or higher

### Enabling Features in Zoom

1. Go to [Zoom Settings](https://zoom.us/profile/setting)
2. Navigate to:
   - **Settings → Recording** → Enable "Cloud recording"
   - **Settings → Meeting** → Enable "Live transcription"
   - **Settings → AI Companion** → Enable "Meeting summary with AI Companion"

## API Endpoints

### `POST /api/sessions/create`

Creates a new video session via Zoom REST API.

**Request:**

```json
{
  "topic": "My Meeting",
  "userName": "John Doe",
  "userId": "user123"
}
```

**Response:**

```json
{
  "sessionId": "abc123",
  "sessionName": "My Meeting",
  "creatorUserId": "user123",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### `POST /api/token`

Generates a JWT token for joining a session.

**Request:**

```json
{
  "sessionId": "abc123",
  "userName": "John Doe",
  "userId": "user123",
  "role": 1
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": 1,
  "sessionId": "abc123",
  "sessionName": "My Meeting",
  "userName": "John Doe"
}
```

### `GET /api/sessions/[sessionId]`

Retrieves session information.

### `DELETE /api/sessions/[sessionId]`

Deletes a session.

## Development Notes

### Session Store

- Currently uses **in-memory storage** (cleared on server restart)
- For production, replace `lib/session-store.ts` with a database solution (PostgreSQL, MongoDB, etc.)
- Session ownership is tracked to determine host role

### JWT Token Structure

The Video SDK JWT token includes:

```json
{
  "app_key": "ZOOM_SDK_KEY",
  "tpc": "session_name",
  "role_type": 1, // 0 = attendee, 1 = host
  "version": 1,
  "iat": 1234567890,
  "exp": 1234574490
}
```

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari (may have limitations with screen sharing)

### Known Limitations

- Session store is in-memory (not persistent across restarts)
- Screen sharing requires Chrome extension on some browsers
- AI Companion requires Zoom Workplace Pro plan
- Some features require account-level settings to be enabled

## Troubleshooting

### "INSUFFICIENT_PRIVILEGES" Error

- Ensure the user creating the session gets `role_type: 1` in the JWT token
- Check that session ownership is correctly tracked in the session store

### "INVALID_OPERATION" Error (7700)

- AI Companion is disabled in your Zoom account settings
- Enable it in Zoom Settings → AI Companion

### Recording Not Working

- Ensure Cloud Recording is enabled in Zoom account settings
- Verify you have the correct Zoom plan that includes cloud recording

### Captions Not Working

- Ensure Live Transcription is enabled in Zoom account settings
- Check that your account has transcription permissions

### Screen Share Not Working

- Install the Chrome extension if prompted
- Grant screen sharing permissions in browser

## License

This is a proof-of-concept implementation. For production use, ensure proper security measures, database persistence, and compliance with Zoom's terms of service.

## Resources

- [Zoom Video SDK Documentation](https://developers.zoom.us/docs/video-sdk/)
- [Zoom REST API Documentation](https://developers.zoom.us/docs/api/)
- [Zoom Developer Console](https://developers.zoom.us/)
