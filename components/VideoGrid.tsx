'use client';

import { useEffect, useRef } from 'react';
import { VideoQuality } from '@zoom/videosdk';

interface VideoGridProps {
  stream: any;
  participants: any[];
  client: any;
}

export default function VideoGrid({
  stream,
  participants,
  client,
}: VideoGridProps) {
  const localVideoRef = useRef<Node | null>(null);
  const videoElementsRef = useRef<Map<number, Node>>(new Map());
  const localTileRef = useRef<HTMLDivElement | null>(null);
  const remoteTileRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  let currentUserId: number | undefined;
  try {
    currentUserId = client?.getSessionInfo()?.userId;
  } catch {
    // client not ready yet
  }

  // Attach local video (self-view)
  useEffect(() => {
    if (!stream || !client) return;

    let cancelled = false;

    async function setupLocalVideo() {
      try {
        const sessionInfo = client.getSessionInfo();
        if (!sessionInfo || cancelled) return;

        const tile = localTileRef.current;
        if (!tile) return;

        // Detach any previous video
        if (localVideoRef.current) {
          try {
            await stream.detachVideo(sessionInfo.userId);
            localVideoRef.current.parentNode?.removeChild(
              localVideoRef.current
            );
          } catch {
            // ignore
          }
          localVideoRef.current = null;
        }

        // attachVideo without 3rd param returns a VideoPlayer custom element
        const videoPlayer = await stream.attachVideo(
          sessionInfo.userId,
          VideoQuality.Video_720P
        );

        if (cancelled) return;

        // VideoPlayer is a custom HTMLElement — append it inside the tile
        if (videoPlayer && videoPlayer instanceof HTMLElement) {
          tile.innerHTML = '';
          tile.appendChild(videoPlayer);
          localVideoRef.current = videoPlayer;
        }
      } catch (err) {
        console.error('Error setting up local video:', err);
      }
    }

    const timer = setTimeout(setupLocalVideo, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (localVideoRef.current) {
        try {
          const sessionInfo = client?.getSessionInfo();
          if (sessionInfo) {
            stream
              .detachVideo(sessionInfo.userId)
              .then((detached: any) => {
                if (Array.isArray(detached)) {
                  detached.forEach((e: any) => e?.remove?.());
                } else if (detached?.remove) {
                  detached.remove();
                }
              })
              .catch(() => {});
          }
        } catch {
          // ignore
        }
        localVideoRef.current = null;
      }
    };
  }, [stream, client]);

  // Attach remote participant videos
  useEffect(() => {
    if (!stream || !client) return;

    let cancelled = false;

    async function setupRemoteVideos() {
      try {
        const sessionInfo = client.getSessionInfo();
        if (!sessionInfo || cancelled) return;

        for (const participant of participants) {
          if (!participant?.userId || participant.userId === sessionInfo.userId)
            continue;
          if (cancelled) break;

          const userId = participant.userId;

          // Skip if already attached
          if (videoElementsRef.current.has(userId)) continue;

          const tile = remoteTileRefs.current.get(userId);
          if (!tile) continue;

          try {
            const videoPlayer = await stream.attachVideo(
              userId,
              VideoQuality.Video_720P
            );

            if (cancelled) return;

            if (videoPlayer && videoPlayer instanceof HTMLElement) {
              tile.innerHTML = '';
              tile.appendChild(videoPlayer);
              videoElementsRef.current.set(userId, videoPlayer);
            }
          } catch (err) {
            console.error(`Error attaching video for user ${userId}:`, err);
          }
        }
      } catch (err) {
        console.error('Error setting up remote videos:', err);
      }
    }

    const timer = setTimeout(setupRemoteVideos, 800);
    const elementsSnapshot = videoElementsRef.current;

    return () => {
      cancelled = true;
      clearTimeout(timer);
      const currentVideoElements = new Map(elementsSnapshot);
      currentVideoElements.forEach((_el, userId) => {
        stream
          .detachVideo(userId)
          .then((detached: any) => {
            if (Array.isArray(detached)) {
              detached.forEach((e: any) => e?.remove?.());
            } else if (detached?.remove) {
              detached.remove();
            }
          })
          .catch(() => {});
      });
      elementsSnapshot.clear();
    };
  }, [participants, stream, client]);

  const remoteParticipants = participants.filter(
    (p) => p?.userId && p.userId !== currentUserId
  );

  const totalVideos = 1 + remoteParticipants.length;

  const gridCols =
    totalVideos === 1
      ? 'grid-cols-1'
      : totalVideos === 2
      ? 'grid-cols-2'
      : totalVideos <= 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-2 p-2 h-full`}>
      {/* Local video (self-view) — must use <video-player-container> custom element */}
      <div className='relative bg-black rounded-lg overflow-hidden w-full h-full min-h-[200px]'>
        <video-player-container
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <div
            className='video-tile'
            ref={localTileRef}
            style={{ width: '100%', height: '100%' }}
          />
        </video-player-container>
        <div className='absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10'>
          You
        </div>
      </div>

      {/* Remote participants */}
      {remoteParticipants.map((participant) => {
        if (!participant?.userId) return null;
        const userId = participant.userId;

        return (
          <div
            key={userId}
            className='relative bg-black rounded-lg overflow-hidden w-full h-full min-h-[200px]'
          >
            <video-player-container
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <div
                className='video-tile'
                ref={(el) => {
                  if (el) remoteTileRefs.current.set(userId, el);
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </video-player-container>
            <div className='absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm z-10'>
              {participant.userName || `User ${userId}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
