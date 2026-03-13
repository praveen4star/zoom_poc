'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { initZoomClient } from '@/lib/zoom';
import type ZoomVideo from '@zoom/videosdk';
import VideoGrid from './VideoGrid';
import VideoControls from './VideoControls';
import ChatPanel, { type ChatMessage } from './ChatPanel';
import ScreenShareView from './ScreenShareView';
import ParticipantPanel from './ParticipantPanel';
import CaptionPanel, { type CaptionMessage } from './CaptionPanel';
import ReactionOverlay, { type Reaction } from './ReactionOverlay';
import BreakoutRoomPanel, {
  type SubsessionInfo,
  type HelpRequest,
} from './BreakoutRoomPanel';

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
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<
    'Stopped' | 'Recording' | 'Paused'
  >('Stopped');
  const [recordingClient, setRecordingClient] = useState<any>(null);
  const [canRecord, setCanRecord] = useState(false);
  const [lttClient, setLttClient] = useState<any>(null);
  const [captionMessages, setCaptionMessages] = useState<CaptionMessage[]>([]);
  const [isCaptionsOpen, setIsCaptionsOpen] = useState(false);
  const [aiClient, setAiClient] = useState<any>(null);
  const [summaryStatus, setSummaryStatus] = useState<
    'Start' | 'Paused' | 'Stopped' | 'Default'
  >('Default');
  const [isSummaryEnabled, setIsSummaryEnabled] = useState(false);
  const [activeShareUserId, setActiveShareUserId] = useState<number | null>(
    null
  );
  const [cmdClient, setCmdClient] = useState<any>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isFileTransferEnabled, setIsFileTransferEnabled] = useState(false);
  const [fileTransferSetting, setFileTransferSetting] = useState<{
    typeLimit?: string;
    sizeLimit?: number;
  } | null>(null);
  const [imageBlobs, setImageBlobs] = useState<Record<string, string>>({});
  const [ssClient, setSsClient] = useState<any>(null);
  const [isBreakoutRoomsOpen, setIsBreakoutRoomsOpen] = useState(false);
  const [subsessionStatus, setSubsessionStatus] = useState(1); // 1=NotStarted
  const [subsessions, setSubsessions] = useState<SubsessionInfo[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<
    Array<{ userId: number; displayName: string }>
  >([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [ssBroadcastMsg, setSsBroadcastMsg] = useState<string | null>(null);
  const [ssClosingCountdown, setSsClosingCountdown] = useState<number | null>(
    null
  );
  const [ssRoomCountdown, setSsRoomCountdown] = useState<number | null>(null);
  const [ssInvite, setSsInvite] = useState<{
    subsessionId: string;
    subsessionName: string;
  } | null>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const reactionIdCounter = useRef(0);

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
        // Payload is Array<ParticipantPropertiesPayload>
        zoomClient.on('user-added', (payload: any) => {
          if (mounted) {
            const users = Array.isArray(payload) ? payload : [payload];
            setParticipants((prev) => [...prev, ...users]);
          }
        });

        zoomClient.on('user-removed', (payload: any) => {
          if (mounted) {
            const users = Array.isArray(payload) ? payload : [payload];
            const removedIds = new Set(users.map((u: any) => u.userId));
            setParticipants((prev) =>
              prev.filter((p) => !removedIds.has(p.userId))
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
          // File transfer support
          try {
            setIsFileTransferEnabled(chat.isFileTransferEnabled());
            setFileTransferSetting(chat.getFileTransferSetting());
          } catch {
            // file transfer may not be available
          }

          // Track upload progress — update the file.upload field on matching messages
          zoomClient.on('chat-file-upload-progress', (payload: any) => {
            if (!mounted) return;
            setChatMessages((prev) =>
              prev.map((m) => {
                if (
                  m.file &&
                  m.file.name === payload.fileName &&
                  m.sender?.userId === currentUserId
                ) {
                  return {
                    ...m,
                    file: {
                      ...m.file,
                      upload: {
                        status: payload.status,
                        progress: payload.progress,
                      },
                    },
                  };
                }
                return m;
              })
            );
          });

          // Track download progress — store blob URLs for inline image previews
          zoomClient.on('chat-file-download-progress', (payload: any) => {
            if (!mounted) return;
            if (payload.status === 2 && payload.fileBlob) {
              const blobUrl = URL.createObjectURL(payload.fileBlob);
              setImageBlobs((prev) => ({ ...prev, [payload.id]: blobUrl }));
            }
          });
        } catch (chatErr) {
          console.warn('Could not initialize chat client:', chatErr);
        }

        // Listen to screen share events
        zoomClient.on('active-share-change', (payload: any) => {
          if (!mounted) return;
          if (payload.state === 'Active') {
            setActiveShareUserId(payload.userId);
          } else if (payload.state === 'Inactive') {
            setActiveShareUserId(null);
          }
        });

        zoomClient.on('peer-share-state-change', (payload: any) => {
          if (!mounted) return;
          console.log('peer-share-state-change:', payload);
        });

        zoomClient.on('passively-stop-share', (payload: any) => {
          if (!mounted) return;
          console.log('passively-stop-share:', payload);
          setIsSharing(false);
        });

        // Initialize recording client
        try {
          const recClient = zoomClient.getRecordingClient();
          setRecordingClient(recClient);
          setCanRecord(recClient.canStartRecording());

          // Sync initial status
          const initialStatus = recClient.getCloudRecordingStatus();
          if (
            initialStatus === 'Recording' ||
            initialStatus === 'Paused' ||
            initialStatus === 'Stopped'
          ) {
            setRecordingStatus(initialStatus);
          }

          zoomClient.on('recording-change', (payload: any) => {
            if (!mounted) return;
            console.log('recording-change:', payload);
            if (
              payload.state === 'Recording' ||
              payload.state === 'Paused' ||
              payload.state === 'Stopped'
            ) {
              setRecordingStatus(payload.state);
            }
          });
        } catch (recErr) {
          console.warn('Could not initialize recording client:', recErr);
        }

        // Initialize live transcription / translation client
        try {
          const ltt = zoomClient.getLiveTranscriptionClient();
          setLttClient(ltt);

          // Listen for transcription / translation messages
          zoomClient.on('caption-message', (payload: any) => {
            if (!mounted) return;
            setCaptionMessages((prev) => {
              // If the message is a partial update (done === false),
              // replace the previous partial from the same msgId
              const existing = prev.findIndex((m) => m.msgId === payload.msgId);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = payload;
                return updated;
              }
              return [...prev, payload];
            });
          });

          zoomClient.on('caption-status', (payload: any) => {
            if (!mounted) return;
            console.log('caption-status:', payload);
          });

          zoomClient.on('caption-enable', (payload: any) => {
            if (!mounted) return;
            console.log('caption-enable:', payload);
          });

          zoomClient.on('caption-host-disable', () => {
            if (!mounted) return;
            console.log('caption-host-disable: host disabled captions');
          });
        } catch (lttErr) {
          console.warn(
            'Could not initialize live transcription client:',
            lttErr
          );
        }

        // Initialize AI client (smart summary & meeting query)
        try {
          const ai = (zoomClient as any).getAIClient();
          setAiClient(ai);
          setIsSummaryEnabled(ai.isSummaryEnabled());

          // Sync initial status
          const status = ai.getSummaryStatus();
          if (status) setSummaryStatus(status);

          zoomClient.on('summary-status-change', (payload: any) => {
            if (!mounted) return;
            console.log('summary-status-change:', payload);
            if (payload.status) {
              setSummaryStatus(payload.status);
            }
          });
        } catch (aiErr) {
          console.warn('Could not initialize AI client:', aiErr);
        }

        // Initialize command channel for emoji reactions
        try {
          const cmd = zoomClient.getCommandClient();
          setCmdClient(cmd);

          zoomClient.on('command-channel-message', (payload: any) => {
            if (!mounted) return;
            try {
              const data = JSON.parse(payload.text || payload.message);
              if (data.type === 'reaction') {
                setReactions((prev) => [
                  ...prev,
                  {
                    id: `r-${Date.now()}-${Math.random()}`,
                    emoji: data.emoji,
                    userName: data.userName,
                    userId: data.userId,
                    timestamp: Date.now(),
                    left: Math.random() * 85 + 5,
                  },
                ]);
              }
            } catch {
              // not a reaction payload — ignore
            }
          });
        } catch (cmdErr) {
          console.warn('Could not initialize command channel:', cmdErr);
        }

        // Initialize subsession client for breakout rooms
        try {
          const ss = zoomClient.getSubsessionClient();
          setSsClient(ss);

          const initialStatus = ss.getSubsessionStatus();
          if (initialStatus) setSubsessionStatus(initialStatus);

          const refreshSubsessions = () => {
            try {
              setSubsessions(ss.getSubsessionList() || []);
              setUnassignedUsers(ss.getUnassignedUserList() || []);
            } catch {
              // not available yet
            }
          };

          zoomClient.on('subsession-state-change', (payload: any) => {
            if (!mounted) return;
            if (payload?.status) setSubsessionStatus(payload.status);
            refreshSubsessions();
            if (payload?.status === 4) {
              setSsClosingCountdown(null);
              setSsRoomCountdown(null);
            }
          });

          zoomClient.on('subsession-invite-to-join', (payload: any) => {
            if (!mounted) return;
            setSsInvite({
              subsessionId: payload.subsessionId,
              subsessionName: payload.subsessionName,
            });
          });

          zoomClient.on('subsession-countdown', (payload: any) => {
            if (!mounted) return;
            setSsRoomCountdown(payload.countdown);
          });

          zoomClient.on('subsession-time-up', () => {
            if (!mounted) return;
            setSsRoomCountdown(null);
          });

          zoomClient.on('closing-subsession-countdown', (payload: any) => {
            if (!mounted) return;
            setSsClosingCountdown(payload.countdown);
          });

          zoomClient.on('subsession-broadcast-message', (payload: any) => {
            if (!mounted) return;
            setSsBroadcastMsg(payload.message);
            setTimeout(() => setSsBroadcastMsg(null), 10000);
          });

          zoomClient.on('subsession-ask-for-help', (payload: any) => {
            if (!mounted) return;
            setHelpRequests((prev) => [
              ...prev,
              { ...payload, timestamp: Date.now() },
            ]);
          });

          zoomClient.on('subsession-user-update', () => {
            if (!mounted) return;
            refreshSubsessions();
          });

          zoomClient.on('subsession-invite-back-to-main-session', () => {
            if (!mounted) return;
            // Auto-handled or prompt depending on options
          });
        } catch (ssErr) {
          console.warn('Could not initialize subsession client:', ssErr);
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

  const handleSendFile = useCallback(
    async (file: File) => {
      if (!chatClient) return;
      await chatClient.sendFile(file, 0);
    },
    [chatClient]
  );

  const handleDownloadFile = useCallback(
    (msgId: string, fileUrl: string) => {
      if (!chatClient) return;
      const msg = chatMessages.find((m) => m.id === msgId);
      const fileName = msg?.file?.name || '';
      const isImage =
        fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ||
        msg?.file?.type?.startsWith('image/');

      chatClient.downloadFile(msgId, fileUrl, !!isImage);
    },
    [chatClient, chatMessages]
  );

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (!stream) return;

    try {
      if (isSharing) {
        await stream.stopShareScreen();
        setIsSharing(false);
        setActiveShareUserId(null);
        // Remove the hidden share element
        if (shareCanvasRef.current) {
          shareCanvasRef.current.remove();
          shareCanvasRef.current = null;
        }
      } else {
        // Use a <video> element if the SDK supports it, otherwise <canvas>
        const useVideoElement = stream.isStartShareScreenWithVideoElement?.();

        let shareElement: HTMLCanvasElement | HTMLVideoElement;
        if (useVideoElement) {
          shareElement = document.createElement('video');
        } else {
          shareElement = document.createElement('canvas');
        }
        shareElement.style.width = '1px';
        shareElement.style.height = '1px';
        shareElement.style.position = 'absolute';
        shareElement.style.opacity = '0';
        document.body.appendChild(shareElement);
        shareCanvasRef.current = shareElement as HTMLCanvasElement;

        const result = await stream.startShareScreen(shareElement);

        // Check if Chrome extension is required
        if (
          result &&
          typeof result === 'object' &&
          'type' in result &&
          result.type === 'INVALID_OPERATION' &&
          'extensionUrl' in result
        ) {
          alert(
            `Please install the Chrome extension to share screen: ${result.extensionUrl}`
          );
          shareElement.remove();
          return;
        }

        setIsSharing(true);
        // The current user's share will trigger 'active-share-change' for others,
        // but we also set our own state so we know to show a "stop sharing" button.
        const sessionInfo = (client as any)?.getSessionInfo?.();
        if (sessionInfo) {
          setActiveShareUserId(sessionInfo.userId);
        }
      }
    } catch (err: any) {
      console.error('Error toggling screen share:', err);
      if (
        err?.type === 'DENIED_BY_BROWSER' ||
        err?.message?.includes('denied') ||
        err?.message?.includes('permission')
      ) {
        alert(
          'Screen sharing permission was denied. Please allow screen sharing.'
        );
      }
      setIsSharing(false);
    }
  }, [stream, isSharing, client]);

  const toggleParticipants = useCallback(() => {
    setIsParticipantsOpen((prev) => !prev);
  }, []);

  const toggleCaptions = useCallback(() => {
    setIsCaptionsOpen((prev) => !prev);
  }, []);

  // ─── AI Summary actions ───
  const toggleSummary = useCallback(async () => {
    if (!aiClient) return;
    try {
      if (summaryStatus === 'Start') {
        await aiClient.stopSummary();
      } else {
        await aiClient.startSummary();
      }
    } catch (err: any) {
      console.error('Error toggling AI summary:', err);
      const reason = err?.reason || err?.message || 'Unknown error';
      alert(`AI Summary error: ${reason}`);
    }
  }, [aiClient, summaryStatus]);

  // ─── Host / Manager actions ───
  const handleMuteUser = useCallback(
    async (userId: number) => {
      if (!stream) return;
      await stream.muteAudio(userId);
    },
    [stream]
  );

  const handleMuteAll = useCallback(async () => {
    if (!stream) return;
    await stream.muteAllAudio();
  }, [stream]);

  const handleUnmuteAll = useCallback(async () => {
    if (!stream) return;
    await stream.unmuteAllAudio();
  }, [stream]);

  const handleRemoveUser = useCallback(
    async (userId: number) => {
      if (!client) return;
      await (client as any).removeUser(userId);
    },
    [client]
  );

  const handleMakeHost = useCallback(
    async (userId: number) => {
      if (!client) return;
      await (client as any).makeHost(userId);
    },
    [client]
  );

  const handleMakeManager = useCallback(
    async (userId: number) => {
      if (!client) return;
      await (client as any).makeManager(userId);
    },
    [client]
  );

  const handleRevokeManager = useCallback(
    async (userId: number) => {
      if (!client) return;
      await (client as any).revokeManager(userId);
    },
    [client]
  );

  // ─── Recording actions ───
  const toggleRecording = useCallback(async () => {
    if (!recordingClient) return;
    try {
      if (recordingStatus === 'Recording') {
        await recordingClient.stopCloudRecording();
        setRecordingStatus('Stopped');
      } else if (recordingStatus === 'Paused') {
        await recordingClient.resumeCloudRecording();
        setRecordingStatus('Paused');
      } else {
        await recordingClient.startCloudRecording();
        setRecordingStatus('Recording');
      }
    } catch (err: any) {
      console.error('Error toggling recording:', err);
      const reason = err?.reason || err?.message || 'Unknown error';
      alert(`Recording error: ${reason}`);
    }
  }, [recordingClient, recordingStatus]);

  const pauseRecording = useCallback(async () => {
    if (!recordingClient) return;
    try {
      await recordingClient.pauseCloudRecording();
    } catch (err: any) {
      console.error('Error pausing recording:', err);
    }
  }, [recordingClient]);

  // ─── Reaction actions ───
  const handleReact = useCallback(
    async (emoji: string) => {
      const sessionInfo = (client as any)?.getSessionInfo?.();
      const myUserId = sessionInfo?.userId ?? 0;
      const myName = sessionInfo?.userName ?? userName;

      const payload = JSON.stringify({
        type: 'reaction',
        emoji,
        userName: myName,
        userId: myUserId,
      });

      // Show locally immediately
      setReactions((prev) => [
        ...prev,
        {
          id: `r-${Date.now()}-${reactionIdCounter.current++}`,
          emoji,
          userName: myName,
          userId: myUserId,
          timestamp: Date.now(),
          left: Math.random() * 85 + 5,
        },
      ]);

      // Broadcast to other participants
      if (cmdClient) {
        try {
          await cmdClient.send(payload);
        } catch (err) {
          console.warn('Failed to send reaction via command channel:', err);
        }
      }
    },
    [client, cmdClient, userName]
  );

  const handleReactionExpire = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ─── Breakout room actions ───
  const toggleBreakoutRooms = useCallback(() => {
    setIsBreakoutRoomsOpen((prev) => !prev);
  }, []);

  const handleCreateSubsessions = useCallback(
    async (names: string[]) => {
      if (!ssClient) return;
      const result = await ssClient.createSubsessions(names);
      if (!(result instanceof Error)) {
        setSubsessions(result);
        try {
          setUnassignedUsers(ssClient.getUnassignedUserList() || []);
        } catch {
          /* ignore */
        }
      }
    },
    [ssClient]
  );

  const handleOpenSubsessions = useCallback(
    async (options: {
      isAutoJoinSubsession: boolean;
      isBackToMainSessionEnabled: boolean;
      isTimerEnabled: boolean;
      timerDuration: number;
    }) => {
      if (!ssClient) return;
      await ssClient.openSubsessions(subsessions, options);
    },
    [ssClient, subsessions]
  );

  const handleAssignUser = useCallback(
    async (userId: number, subsessionId: string) => {
      if (!ssClient) return;
      await ssClient.assignUserToSubsession(userId, subsessionId);
      try {
        setSubsessions(ssClient.getSubsessionList() || []);
        setUnassignedUsers(ssClient.getUnassignedUserList() || []);
      } catch {
        /* ignore */
      }
    },
    [ssClient]
  );

  const handleMoveUser = useCallback(
    async (userId: number, subsessionId: string) => {
      if (!ssClient) return;
      await ssClient.moveUserToSubsession(userId, subsessionId);
    },
    [ssClient]
  );

  const handleMoveBackToMain = useCallback(
    async (userId: number) => {
      if (!ssClient) return;
      await ssClient.moveBackToMainSession(userId);
    },
    [ssClient]
  );

  const handleCloseAllSubsessions = useCallback(async () => {
    if (!ssClient) return;
    await ssClient.closeAllSubsessions();
  }, [ssClient]);

  const handleBroadcast = useCallback(
    async (message: string) => {
      if (!ssClient) return;
      await ssClient.broadcast(message);
    },
    [ssClient]
  );

  const handleJoinSubsession = useCallback(
    async (subsessionId: string) => {
      if (!ssClient) return;
      await ssClient.joinSubsession(subsessionId);
      setSsInvite(null);
    },
    [ssClient]
  );

  const handleLeaveSubsession = useCallback(async () => {
    if (!ssClient) return;
    await ssClient.leaveSubsession();
  }, [ssClient]);

  const handleAskForHelp = useCallback(async () => {
    if (!ssClient) return;
    await ssClient.askForHelp();
  }, [ssClient]);

  // Derive current user's subsession status and info
  let userSubsessionStatus = 'initial';
  let currentSubsession: {
    subsessionName: string;
    subsessionId: string;
  } | null = null;
  try {
    if (ssClient) {
      userSubsessionStatus = ssClient.getUserStatus() || 'initial';
      const cur = ssClient.getCurrentSubsession();
      if (cur?.subsessionId) currentSubsession = cur;
    }
  } catch {
    // not available
  }

  // Get current user ID for chat
  let currentUserId = 0;
  try {
    currentUserId = (client as any)?.getSessionInfo?.()?.userId ?? 0;
  } catch {
    // not ready
  }

  // Check if current user is host or manager
  let amHost = false;
  let amManager = false;
  try {
    amHost = (client as any)?.isHost?.() ?? false;
    amManager = (client as any)?.isManager?.() ?? false;
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
            isChatOpen ||
            isParticipantsOpen ||
            isCaptionsOpen ||
            isBreakoutRoomsOpen
              ? 'w-[70%]'
              : 'w-full'
          } transition-all duration-300 flex flex-col relative`}
          ref={videoContainerRef}
        >
          {/* Emoji reaction overlay */}
          <ReactionOverlay
            reactions={reactions}
            onExpire={handleReactionExpire}
          />
          {/* Subsession invite banner */}
          {ssInvite && (
            <div className='bg-teal-700 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-3 z-20'>
              You are invited to join &quot;{ssInvite.subsessionName}&quot;
              <button
                onClick={() => handleJoinSubsession(ssInvite.subsessionId)}
                className='px-3 py-1 bg-teal-500 rounded hover:bg-teal-400 transition-colors text-xs font-semibold'
              >
                Join
              </button>
              <button
                onClick={() => setSsInvite(null)}
                className='px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 transition-colors text-xs'
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Subsession broadcast message banner */}
          {ssBroadcastMsg && (
            <div className='bg-yellow-700 text-white text-center py-1.5 text-sm flex items-center justify-center gap-2 z-20'>
              <span className='font-medium'>Host:</span> {ssBroadcastMsg}
            </div>
          )}

          {/* Closing countdown banner */}
          {ssClosingCountdown !== null && (
            <div className='bg-red-700 text-white text-center py-1.5 text-sm font-medium z-20'>
              Breakout rooms closing in {Math.floor(ssClosingCountdown / 60)}:
              {(ssClosingCountdown % 60).toString().padStart(2, '0')}
            </div>
          )}

          {/* Recording indicator banner */}
          {recordingStatus !== 'Stopped' && (
            <div
              className={`text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-3 ${
                recordingStatus === 'Paused' ? 'bg-yellow-700' : 'bg-red-700'
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  recordingStatus === 'Paused'
                    ? 'bg-yellow-300'
                    : 'bg-red-400 animate-pulse'
                }`}
              />
              {recordingStatus === 'Paused'
                ? 'Recording Paused'
                : 'Recording in Progress'}
            </div>
          )}

          {/* AI Summary banner */}
          {summaryStatus === 'Start' && (
            <div className='bg-purple-700 text-white text-center py-1.5 text-sm font-medium flex items-center justify-center gap-3'>
              <span className='inline-block w-2 h-2 bg-purple-300 rounded-full animate-pulse' />
              AI Summary Active
            </div>
          )}

          {/* Screen share view — shown when someone else is sharing */}
          {activeShareUserId && activeShareUserId !== currentUserId && (
            <div className='flex-1 min-h-0 relative'>
              <ScreenShareView
                stream={stream}
                activeShareUserId={activeShareUserId}
              />
              <div className='absolute top-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded text-sm z-10'>
                {participants.find((p) => p.userId === activeShareUserId)
                  ?.userName || 'Someone'}{' '}
                is sharing their screen
              </div>
            </div>
          )}

          {/* Self-sharing banner */}
          {isSharing && (
            <div className='bg-green-700 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-3'>
              <span className='inline-block w-2 h-2 bg-red-400 rounded-full animate-pulse' />
              You are sharing your screen
              <button
                onClick={toggleScreenShare}
                className='ml-2 px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition-colors text-xs font-semibold'
              >
                Stop Sharing
              </button>
            </div>
          )}

          {/* Video grid — shrink when share is visible */}
          <div
            className={
              activeShareUserId && activeShareUserId !== currentUserId
                ? 'h-[200px] shrink-0'
                : 'flex-1 min-h-0'
            }
          >
            <VideoGrid
              stream={stream}
              participants={participants}
              client={client}
            />
          </div>
        </div>
        {/* Right side panel(s) */}
        {(isChatOpen ||
          isParticipantsOpen ||
          isCaptionsOpen ||
          isBreakoutRoomsOpen) && (
          <div className='w-[30%] min-w-[280px] flex flex-col'>
            {isBreakoutRoomsOpen && (
              <div
                className={
                  isChatOpen || isParticipantsOpen || isCaptionsOpen
                    ? 'h-[50%] border-b border-gray-700'
                    : 'flex-1'
                }
              >
                <BreakoutRoomPanel
                  isHost={amHost}
                  subsessionStatus={subsessionStatus}
                  subsessions={subsessions}
                  unassignedUsers={unassignedUsers}
                  helpRequests={helpRequests}
                  broadcastMsg={ssBroadcastMsg}
                  closingCountdown={ssClosingCountdown}
                  roomCountdown={ssRoomCountdown}
                  userSubsessionStatus={userSubsessionStatus}
                  currentSubsession={currentSubsession}
                  onClose={toggleBreakoutRooms}
                  onCreateSubsessions={handleCreateSubsessions}
                  onOpenSubsessions={handleOpenSubsessions}
                  onAssignUser={handleAssignUser}
                  onMoveUser={handleMoveUser}
                  onMoveBackToMain={handleMoveBackToMain}
                  onCloseAll={handleCloseAllSubsessions}
                  onBroadcast={handleBroadcast}
                  onJoinSubsession={handleJoinSubsession}
                  onLeaveSubsession={handleLeaveSubsession}
                  onAskForHelp={handleAskForHelp}
                />
              </div>
            )}
            {isParticipantsOpen && (
              <div
                className={
                  isChatOpen || isCaptionsOpen
                    ? 'h-[40%] border-b border-gray-700'
                    : 'flex-1'
                }
              >
                <ParticipantPanel
                  participants={participants}
                  currentUserId={currentUserId}
                  isHost={amHost}
                  isManager={amManager}
                  onClose={toggleParticipants}
                  onMuteUser={handleMuteUser}
                  onMuteAll={handleMuteAll}
                  onUnmuteAll={handleUnmuteAll}
                  onRemoveUser={handleRemoveUser}
                  onMakeHost={handleMakeHost}
                  onMakeManager={handleMakeManager}
                  onRevokeManager={handleRevokeManager}
                />
              </div>
            )}
            {isCaptionsOpen && (
              <div
                className={
                  isChatOpen || isParticipantsOpen
                    ? 'h-[30%] border-b border-gray-700'
                    : 'flex-1'
                }
              >
                <CaptionPanel
                  messages={captionMessages}
                  lttClient={lttClient}
                  isHost={amHost}
                  onClose={toggleCaptions}
                />
              </div>
            )}
            {isChatOpen && (
              <div
                className={
                  isParticipantsOpen || isCaptionsOpen ? 'h-[30%]' : 'flex-1'
                }
              >
                <ChatPanel
                  messages={chatMessages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onClose={toggleChat}
                  onSendFile={handleSendFile}
                  onDownloadFile={handleDownloadFile}
                  isFileTransferEnabled={isFileTransferEnabled}
                  fileTransferSetting={fileTransferSetting}
                  imageBlobs={imageBlobs}
                />
              </div>
            )}
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
        onToggleScreenShare={toggleScreenShare}
        isSharing={isSharing}
        onToggleParticipants={toggleParticipants}
        isParticipantsOpen={isParticipantsOpen}
        participantCount={participants.length}
        onToggleRecording={toggleRecording}
        onPauseRecording={pauseRecording}
        recordingStatus={recordingStatus}
        canRecord={canRecord}
        isHost={amHost}
        onToggleCaptions={toggleCaptions}
        isCaptionsOpen={isCaptionsOpen}
        onToggleSummary={toggleSummary}
        summaryStatus={summaryStatus}
        isSummaryEnabled={isSummaryEnabled}
        onReact={handleReact}
        onToggleBreakoutRooms={toggleBreakoutRooms}
        isBreakoutRoomsOpen={isBreakoutRoomsOpen}
        subsessionStatus={subsessionStatus}
      />
    </div>
  );
}
