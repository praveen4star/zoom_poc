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
  onToggleScreenShare?: () => void;
  isSharing?: boolean;
  onToggleParticipants?: () => void;
  isParticipantsOpen?: boolean;
  participantCount?: number;
  onToggleRecording?: () => void;
  onPauseRecording?: () => void;
  recordingStatus?: 'Stopped' | 'Recording' | 'Paused';
  canRecord?: boolean;
  isHost?: boolean;
  onToggleCaptions?: () => void;
  isCaptionsOpen?: boolean;
  onToggleSummary?: () => void;
  summaryStatus?: 'Start' | 'Paused' | 'Stopped' | 'Default';
  isSummaryEnabled?: boolean;
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
  onToggleScreenShare,
  isSharing = false,
  onToggleParticipants,
  isParticipantsOpen = false,
  participantCount = 0,
  onToggleRecording,
  onPauseRecording,
  recordingStatus = 'Stopped',
  canRecord = false,
  isHost = false,
  onToggleCaptions,
  isCaptionsOpen = false,
  onToggleSummary,
  summaryStatus = 'Default',
  isSummaryEnabled = false,
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
    <div className='bg-gray-800 p-4 flex items-center justify-between'>
      <div className='flex items-center gap-2'>
        <span className='text-white text-sm bg-blue-600 px-2 py-1 rounded'>
          {getRoleLabel()}
        </span>
      </div>

      <div className='flex items-center gap-4'>
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
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
              />
            </svg>
          ) : (
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
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
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
              />
            </svg>
          ) : (
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2'
              />
            </svg>
          )}
        </button>

        {/* Screen Share */}
        {onToggleScreenShare && (
          <button
            onClick={onToggleScreenShare}
            className={`p-3 rounded-full ${
              isSharing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors`}
            title={isSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isSharing ? (
              /* Stop sharing icon */
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                />
              </svg>
            ) : (
              /* Share screen icon */
              <svg
                className='w-6 h-6'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
            )}
          </button>
        )}

        {/* Recording — only show for host or if recording is enabled */}
        {onToggleRecording && (isHost || canRecord) && (
          <div className='flex items-center gap-1'>
            <button
              onClick={onToggleRecording}
              className={`p-3 rounded-full ${
                recordingStatus === 'Recording'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : recordingStatus === 'Paused'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              } transition-colors`}
              title={
                recordingStatus === 'Recording'
                  ? 'Stop recording'
                  : recordingStatus === 'Paused'
                  ? 'Resume recording'
                  : 'Start recording'
              }
            >
              {recordingStatus === 'Recording' ? (
                /* Stop / solid square icon */
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <rect x='6' y='6' width='12' height='12' rx='1' />
                </svg>
              ) : recordingStatus === 'Paused' ? (
                /* Resume / play icon */
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M8 5v14l11-7z' />
                </svg>
              ) : (
                /* Record / circle icon */
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <circle cx='12' cy='12' r='7' />
                </svg>
              )}
            </button>
            {/* Pause button — only visible while recording */}
            {recordingStatus === 'Recording' && onPauseRecording && (
              <button
                onClick={onPauseRecording}
                className='p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors'
                title='Pause recording'
              >
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <rect x='6' y='5' width='4' height='14' rx='1' />
                  <rect x='14' y='5' width='4' height='14' rx='1' />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Participants */}
        {onToggleParticipants && (
          <button
            onClick={onToggleParticipants}
            className={`relative p-3 rounded-full ${
              isParticipantsOpen
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors`}
            title={
              isParticipantsOpen ? 'Close participants' : 'Show participants'
            }
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              />
            </svg>
            {participantCount > 0 && (
              <span className='absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1'>
                {participantCount}
              </span>
            )}
          </button>
        )}

        {/* Captions / Translation */}
        {onToggleCaptions && (
          <button
            onClick={onToggleCaptions}
            className={`p-3 rounded-full ${
              isCaptionsOpen
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors`}
            title={
              isCaptionsOpen ? 'Hide captions' : 'Show captions & translation'
            }
          >
            {/* CC icon */}
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <rect x='2' y='4' width='20' height='16' rx='2' strokeWidth={2} />
              <text
                x='12'
                y='15'
                textAnchor='middle'
                fill='currentColor'
                stroke='none'
                fontSize='8'
                fontWeight='bold'
                fontFamily='sans-serif'
              >
                CC
              </text>
            </svg>
          </button>
        )}

        {/* AI Summary */}
        {onToggleSummary && (isHost || isSummaryEnabled) && (
          <button
            onClick={onToggleSummary}
            className={`p-3 rounded-full ${
              summaryStatus === 'Start'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            } transition-colors`}
            title={
              summaryStatus === 'Start' ? 'Stop AI Summary' : 'Start AI Summary'
            }
          >
            {/* Sparkle / AI icon */}
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z'
              />
            </svg>
          </button>
        )}

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
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
          {!isChatOpen && unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onLeave}
          className='px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium'
        >
          Leave
        </button>
      </div>
    </div>
  );
}
