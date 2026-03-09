'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { initZoomClient } from '@/lib/zoom';
import type ZoomVideo from '@zoom/videosdk';
import VideoGrid from './VideoGrid';
import VideoControls from './VideoControls';
import ChatPanel, { type ChatMessage } from './ChatPanel';

interface VideoConferenceProps {
  sessionName: string; // Session name/topic (must match tpc in JWT token)
  token: string;
  userName: string;
  userRole: number; // 0 = attendee, 1 = host, 2 = co-host
  onLeave: () => void;
}

export default function VideoConference({
  sessionName,
  token,
  userName,
  userRole,
  onLeave,
}: VideoConferenceProps) {
  const [client, setClient] = useState<typeof ZoomVideo | null>(null);
  const [stream, setStream] = useState<typeof ZoomVideo.MediaStream | null>(
    null
  );
  const [participants, setParticipants] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatClient, setChatClient] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    let mediaStream: typeof ZoomVideo.MediaStream | null = null;

    async function joinSession() {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize Zoom client
        const zoomClient = await initZoomClient();
        if (!mounted) return;

        setClient(zoomClient as any);

        // Join session - use sessionName (must match tpc in JWT token)
        await zoomClient.join(sessionName, token, userName, '');
        if (!mounted) return;

        setIsJoined(true);

        // Get media stream
        mediaStream = zoomClient.getMediaStream();
        setStream(mediaStream as any);

        // Auto-start video and audio so there's a feed to render
        try {
          await mediaStream.startVideo();
        } catch (videoErr) {
          console.warn('Could not auto-start video:', videoErr);
        }

        try {
          await mediaStream.startAudio();
        } catch (audioErr) {
          console.warn('Could not auto-start audio:', audioErr);
        }

        // Get initial participants
        const allParticipants = zoomClient.getAllUser();
        setParticipants(allParticipants || []);

        // Listen to participant events
        zoomClient.on('user-added', (payload: any) => {
          if (mounted) {
            setParticipants((prev) => [...prev, payload.user]);
          }
        });

        zoomClient.on('user-removed', (payload: any) => {
          if (mounted) {
            setParticipants((prev) =>
              prev.filter((p) => p.userId !== payload.user.userId)
            );
          }
        });

        // Listen to video/audio state changes
        zoomClient.on('video-active-change', () => {
          if (mounted) {
            const allParticipants = zoomClient.getAllUser();
            setParticipants([...allParticipants] || []);
          }
        });

        zoomClient.on('peer-video-state-change', (payload: any) => {
          if (mounted) {
            console.log('peer-video-state-change:', payload);
            const allParticipants = zoomClient.getAllUser();
            setParticipants([...allParticipants] || []);
          }
        });

        zoomClient.on('audio-change', () => {
          if (mounted) {
            const allParticipants = zoomClient.getAllUser();
            setParticipants([...allParticipants] || []);
          }
        });

        // Initialize chat client
        try {
          const chat = zoomClient.getChatClient();
          setChatClient(chat);

          const history = chat.getHistory();
          if (history?.length) {
            setChatMessages(history);
          }

          zoomClient.on('chat-on-message', (payload: any) => {
            if (mounted) {
              setChatMessages((prev) => {
                // Check for duplicates by ID, or by message content + sender + timestamp
                const isDuplicate = prev.some((m: ChatMessage) => {
                  if (payload.id && m.id === payload.id) return true;
                  // Also check by content, sender, and timestamp (within 1 second) to catch duplicates
                  if (
                    m.message === payload.message &&
                    m.sender?.userId === payload.sender?.userId &&
                    Math.abs(m.timestamp - payload.timestamp) < 1000
                  ) {
                    return true;
                  }
                  return false;
                });
                if (isDuplicate) return prev;
                return [...prev, payload];
              });
              setIsChatOpen((open) => {
                if (!open) {
                  setUnreadCount((c) => c + 1);
                }
                return open;
              });
            }
          });
        } catch (chatErr) {
          console.warn('Could not initialize chat client:', chatErr);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error joining session:', err);
        if (mounted) {
          setError(err.message || 'Failed to join session');
          setIsLoading(false);
        }
      }
    }

    joinSession();

    return () => {
      mounted = false;
      if (client) {
        client.leave().catch(console.error);
      }
    };
  }, [sessionName, token, userName]);

  const handleLeave = async () => {
    try {
      if (client) {
        await client.leave();
      }
      onLeave();
    } catch (err) {
      console.error('Error leaving session:', err);
      onLeave(); // Still call onLeave even if there's an error
    }
  };

  const toggleVideo = async () => {
    if (!stream) return;
    try {
      if (stream.isCapturingVideo()) {
        await stream.stopVideo();
      } else {
        await stream.startVideo();
      }
    } catch (err) {
      console.error('Error toggling video:', err);
    }
  };

  const toggleAudio = async () => {
    if (!stream) return;
    try {
      if (stream.isAudioMuted()) {
        await stream.unmuteAudio();
      } else {
        await stream.muteAudio();
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
    }
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!chatClient) return;
      // Don't add the message to state here - let the 'chat-on-message' event handle it
      // This prevents duplicate messages (one from sendToAll result, one from event)
      await chatClient.sendToAll(text);
    },
    [chatClient]
  );

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  // Get current user ID for chat
  let currentUserId = 0;
  try {
    currentUserId = (client as any)?.getSessionInfo?.()?.userId ?? 0;
  } catch {
    // not ready
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Joining session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <p className='text-red-600 mb-4'>{error}</p>
          <button
            onClick={onLeave}
            className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isJoined || !stream) {
    return null;
  }

  return (
    <div className='flex flex-col h-screen bg-gray-900'>
      <div className='flex-1 overflow-hidden flex'>
        <div
          className={`${
            isChatOpen ? 'w-[70%]' : 'w-full'
          } transition-all duration-300`}
          ref={videoContainerRef}
        >
          <VideoGrid
            stream={stream}
            participants={participants}
            client={client}
          />
        </div>
        {isChatOpen && (
          <div className='w-[30%] min-w-[280px]'>
            <ChatPanel
              messages={chatMessages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
              onClose={toggleChat}
            />
          </div>
        )}
      </div>
      <VideoControls
        stream={stream}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onLeave={handleLeave}
        onToggleChat={toggleChat}
        isChatOpen={isChatOpen}
        unreadCount={unreadCount}
        userRole={userRole}
      />
    </div>
  );
}
