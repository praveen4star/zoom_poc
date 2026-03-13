'use client';

import { useEffect, useRef } from 'react';

export interface Reaction {
  id: string;
  emoji: string;
  userName: string;
  userId: number;
  timestamp: number;
  left: number; // random horizontal position (0-90%)
}

interface ReactionOverlayProps {
  reactions: Reaction[];
  onExpire: (id: string) => void;
}

const ANIMATION_DURATION = 3000;

function FloatingEmoji({
  reaction,
  onExpire,
}: {
  reaction: Reaction;
  onExpire: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => onExpire(reaction.id), ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [reaction.id, onExpire]);

  return (
    <div
      ref={ref}
      className="reaction-float absolute pointer-events-none flex flex-col items-center"
      style={{ left: `${reaction.left}%`, bottom: '10%' }}
    >
      <span className="text-4xl drop-shadow-lg">{reaction.emoji}</span>
      <span className="text-xs text-white/80 bg-black/40 rounded px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
        {reaction.userName}
      </span>
    </div>
  );
}

export default function ReactionOverlay({
  reactions,
  onExpire,
}: ReactionOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-30">
      {reactions.map((r) => (
        <FloatingEmoji key={r.id} reaction={r} onExpire={onExpire} />
      ))}
    </div>
  );
}
