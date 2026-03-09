import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import VideoConference with SSR disabled
// Zoom Video SDK requires browser APIs and cannot run on the server
const VideoConference = dynamic(() => import('@/components/VideoConference'), {
  ssr: false,
});

export default function Home() {
  const [sessionTopic, setSessionTopic] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [joinSessionId, setJoinSessionId] = useState(''); // For joining existing sessions
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInSession, setIsInSession] = useState(false);
  const [mode, setMode] = useState<'create' | 'join'>('create'); // 'create' or 'join'

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Generate a simple user ID if not provided
      const finalUserId = userId || `user_${Date.now()}`;

      const response = await fetch('/api/sessions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: sessionTopic,
          userName,
          userId: finalUserId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setSessionName(data.sessionName || data.topic);
      setUserId(finalUserId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    // Use sessionId if we created it, otherwise use joinSessionId
    const targetSessionId = sessionId || joinSessionId;

    if (!targetSessionId || !userName) {
      setError('Please fill in all fields');
      return;
    }

    // Generate userId if not provided
    const finalUserId = userId || `user_${Date.now()}`;

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: targetSessionId,
          userName,
          userId: finalUserId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
      setUserRole(data.role);
      setSessionId(targetSessionId); // Set sessionId for consistency
      // Ensure we have sessionName from the token response if available
      if (data.sessionName) {
        setSessionName(data.sessionName);
      } else {
        // If sessionName not in response, use sessionId as fallback
        setSessionName(targetSessionId);
      }
      setUserId(finalUserId);
      setIsInSession(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to join session';
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveSession = () => {
    setIsInSession(false);
    setToken(null);
    setSessionId(null);
    setSessionName(null);
    setError(null);
  };

  if (isInSession && token && sessionId && sessionName) {
    return (
      <VideoConference
        sessionName={sessionName}
        token={token}
        userName={userName}
        userRole={userRole}
        onLeave={handleLeaveSession}
      />
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center p-4'>
      <div className='bg-white rounded-lg shadow-lg p-8 w-full max-w-md'>
        <h1 className='text-3xl font-bold text-gray-900 mb-6 text-center'>
          Zoom Video SDK
        </h1>

        {error && (
          <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
            {error}
          </div>
        )}

        {/* Mode Toggle */}
        {!isInSession && (
          <div className='mb-4 flex gap-2 border-b border-gray-200 pb-4'>
            <button
              onClick={() => {
                setMode('create');
                setError(null);
                setSessionId(null);
                setJoinSessionId('');
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Create Session
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError(null);
                setSessionId(null);
              }}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                mode === 'join'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Join Session
            </button>
          </div>
        )}

        {mode === 'create' && !sessionId ? (
          <form onSubmit={handleCreateSession} className='space-y-4'>
            <div>
              <label
                htmlFor='topic'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Session Topic
              </label>
              <input
                type='text'
                id='topic'
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                required
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter session name'
              />
            </div>

            <div>
              <label
                htmlFor='userName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Your Name
              </label>
              <input
                type='text'
                id='userName'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter your name'
              />
            </div>

            <div>
              <label
                htmlFor='userId'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                User ID (optional)
              </label>
              <input
                type='text'
                id='userId'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Auto-generated if not provided'
              />
            </div>

            <button
              type='submit'
              disabled={isCreating}
              className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
            >
              {isCreating ? 'Creating Session...' : 'Create Session'}
            </button>
          </form>
        ) : mode === 'create' && sessionId ? (
          <div className='space-y-4'>
            <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
              <p className='text-sm text-green-800 mb-2'>
                <strong>Session Created!</strong>
              </p>
              <p className='text-xs text-green-700 mb-2'>
                Session ID:{' '}
                <code className='bg-green-100 px-1 rounded'>{sessionId}</code>
              </p>
              <p className='text-xs text-gray-600'>
                Share this Session ID with others to let them join
              </p>
            </div>

            <div>
              <label
                htmlFor='joinUserName'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Your Name
              </label>
              <input
                type='text'
                id='joinUserName'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter your name'
              />
            </div>

            <button
              onClick={handleJoinSession}
              disabled={isJoining || !userName}
              className='w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </button>

            <button
              onClick={() => {
                setSessionId(null);
                setSessionName(null);
                setError(null);
              }}
              className='w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors'
            >
              Create New Session
            </button>
          </div>
        ) : (
          // Join existing session mode
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinSession();
            }}
            className='space-y-4'
          >
            <div>
              <label
                htmlFor='joinSessionId'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Session ID
              </label>
              <input
                type='text'
                id='joinSessionId'
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value)}
                required
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter session ID to join'
              />
              <p className='text-xs text-gray-500 mt-1'>
                Get the Session ID from the person who created the session
              </p>
            </div>

            <div>
              <label
                htmlFor='joinUserNameInput'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Your Name
              </label>
              <input
                type='text'
                id='joinUserNameInput'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter your name'
              />
            </div>

            <div>
              <label
                htmlFor='joinUserIdInput'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                User ID (optional)
              </label>
              <input
                type='text'
                id='joinUserIdInput'
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className='text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Auto-generated if not provided'
              />
            </div>

            <button
              type='submit'
              disabled={isJoining || !joinSessionId || !userName}
              className='w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
