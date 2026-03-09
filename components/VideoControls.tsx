'use client';

import { useState, useEffect } from 'react';
import type ZoomVideo from '@zoom/videosdk';

interface VideoControlsProps {
  stream: typeof ZoomVideo.MediaStream;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  unreadCount: number;
  userRole: number; // 0 = attendee, 1 = host, 2 = co-host
}

export default function VideoControls({
  stream,
  onToggleVideo,
  onToggleAudio,
  onLeave,
  onToggleChat,
  isChatOpen,
  unreadCount,
  userRole,
}: VideoControlsProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  useEffect(() => {
    if (!stream) return;

    // Check initial video/audio state
    setIsVideoOn(stream.isCapturingVideo());
    setIsAudioOn(!stream.isAudioMuted());

    // Listen for state changes (if SDK provides events)
    // Note: You may need to poll or use SDK events if available
    const interval = setInterval(() => {
      setIsVideoOn(stream.isCapturingVideo());
      setIsAudioOn(!stream.isAudioMuted());
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  const handleToggleVideo = () => {
    onToggleVideo();
    setIsVideoOn((prev) => !prev);
  };

  const handleToggleAudio = () => {
    onToggleAudio();
    setIsAudioOn((prev) => !prev);
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 1:
        return 'Host';
      case 2:
        return 'Co-host';
      default:
        return 'Attendee';
    }
  };

  return (
    <div className="bg-gray-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white text-sm bg-blue-600 px-2 py-1 rounded">
          {getRoleLabel()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleVideo}
          className={`p-3 rounded-full ${
            isVideoOn
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          } transition-colors`}
          title={isVideoOn ? 'Turn off video' : 'Turn on video'}
        >
          {isVideoOn ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          )}
        </button>

        <button
          onClick={handleToggleAudio}
          className={`p-3 rounded-full ${
            isAudioOn
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-red-600 text-white hover:bg-red-700'
          } transition-colors`}
          title={isAudioOn ? 'Mute' : 'Unmute'}
        >
          {isAudioOn ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
        </button>

        <button
          onClick={onToggleChat}
          className={`relative p-3 rounded-full ${
            isChatOpen
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          } transition-colors`}
          title={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {!isChatOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onLeave}
          className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
