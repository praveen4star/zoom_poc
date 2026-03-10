'use client';

import { useEffect, useRef } from 'react';

interface ScreenShareViewProps {
  stream: any;
  activeShareUserId: number;
}

/**
 * Renders the received screen share content using `attachShareView`.
 *
 * The returned VideoPlayer custom element MUST live inside a
 * <video-player-container> that is **separate** from any container
 * used for `attachVideo`.
 */
export default function ScreenShareView({
  stream,
  activeShareUserId,
}: ScreenShareViewProps) {
  const tileRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Node | null>(null);

  useEffect(() => {
    if (!stream || !activeShareUserId) return;

    let cancelled = false;

    async function attach() {
      const tile = tileRef.current;
      if (!tile || cancelled) return;

      try {
        const videoPlayer = await stream.attachShareView(activeShareUserId);

        if (cancelled) {
          // Already unmounted — clean up immediately
          if (videoPlayer && videoPlayer instanceof HTMLElement) {
            try {
              await stream.detachShareView(activeShareUserId);
              videoPlayer.remove();
            } catch {
              // ignore
            }
          }
          return;
        }

        if (videoPlayer && videoPlayer instanceof HTMLElement) {
          tile.innerHTML = '';
          tile.appendChild(videoPlayer);
          playerRef.current = videoPlayer;
        }
      } catch (err) {
        console.error('Error attaching share view:', err);
      }
    }

    // Small delay to ensure the DOM container is ready
    const timer = setTimeout(attach, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);

      // Detach and remove the player element
      if (playerRef.current) {
        stream
          .detachShareView(activeShareUserId)
          .then((detached: any) => {
            if (Array.isArray(detached)) {
              detached.forEach((e: any) => e?.remove?.());
            } else if (detached?.remove) {
              detached.remove();
            }
          })
          .catch(() => {});
        playerRef.current = null;
      }
    };
  }, [stream, activeShareUserId]);

  return (
    <div className='w-full h-full bg-black'>
      {/* video-player-container for share view must be separate from the one used for video */}
      <video-player-container
        className='share-container'
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <div
          className='share-tile'
          ref={tileRef}
          style={{ width: '100%', height: '100%' }}
        />
      </video-player-container>
    </div>
  );
}
