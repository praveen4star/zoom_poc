'use client';

import { useState } from 'react';

interface Participant {
  userId: number;
  displayName: string;
  audio: '' | 'computer' | 'phone';
  muted?: boolean;
  isHost: boolean;
  isManager: boolean;
  bVideoOn: boolean;
  sharerOn: boolean;
}

interface ParticipantPanelProps {
  participants: Participant[];
  currentUserId: number;
  isHost: boolean;
  isManager: boolean;
  onClose: () => void;
  onMuteUser: (userId: number) => Promise<void>;
  onMuteAll: () => Promise<void>;
  onUnmuteAll: () => Promise<void>;
  onRemoveUser: (userId: number) => Promise<void>;
  onMakeHost: (userId: number) => Promise<void>;
  onMakeManager: (userId: number) => Promise<void>;
  onRevokeManager: (userId: number) => Promise<void>;
}

export default function ParticipantPanel({
  participants,
  currentUserId,
  isHost,
  isManager,
  onClose,
  onMuteUser,
  onMuteAll,
  onUnmuteAll,
  onRemoveUser,
  onMakeHost,
  onMakeManager,
  onRevokeManager,
}: ParticipantPanelProps) {
  const [openMenuUserId, setOpenMenuUserId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    userId: number;
    action: string;
    label: string;
  } | null>(null);

  const canManage = isHost || isManager;

  const getRoleBadge = (p: Participant) => {
    if (p.isHost)
      return (
        <span className='text-[10px] bg-yellow-600 text-white px-1.5 py-0.5 rounded font-semibold'>
          Host
        </span>
      );
    if (p.isManager)
      return (
        <span className='text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-semibold'>
          Manager
        </span>
      );
    return null;
  };

  const handleAction = async (
    userId: number,
    action: string,
    label: string
  ) => {
    // For destructive actions, confirm first
    if (action === 'remove' || action === 'makeHost') {
      setConfirmAction({ userId, action, label });
      setOpenMenuUserId(null);
      return;
    }

    setOpenMenuUserId(null);
    try {
      switch (action) {
        case 'mute':
          await onMuteUser(userId);
          break;
        case 'makeManager':
          await onMakeManager(userId);
          break;
        case 'revokeManager':
          await onRevokeManager(userId);
          break;
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    try {
      switch (confirmAction.action) {
        case 'remove':
          await onRemoveUser(confirmAction.userId);
          break;
        case 'makeHost':
          await onMakeHost(confirmAction.userId);
          break;
      }
    } catch (err) {
      console.error(`Error performing ${confirmAction.action}:`, err);
    }
    setConfirmAction(null);
  };

  // Sort: host first, then managers, then self, then alphabetical
  const sorted = [...participants].sort((a, b) => {
    if (a.isHost !== b.isHost) return a.isHost ? -1 : 1;
    if (a.isManager !== b.isManager) return a.isManager ? -1 : 1;
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  return (
    <div className='flex flex-col h-full bg-gray-800 border-l border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
        <h3 className='text-white font-semibold text-sm'>
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className='text-gray-400 hover:text-white transition-colors'
          title='Close'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      </div>

      {/* Host bulk actions */}
      {canManage && (
        <div className='flex items-center gap-2 px-4 py-2 border-b border-gray-700'>
          <button
            onClick={onMuteAll}
            className='text-xs bg-gray-700 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-600 transition-colors'
          >
            Mute All
          </button>
          <button
            onClick={onUnmuteAll}
            className='text-xs bg-gray-700 text-gray-200 px-3 py-1.5 rounded hover:bg-gray-600 transition-colors'
          >
            Ask All to Unmute
          </button>
        </div>
      )}

      {/* Participant list */}
      <div className='flex-1 overflow-y-auto'>
        {sorted.map((p) => {
          const isMe = p.userId === currentUserId;
          const menuOpen = openMenuUserId === p.userId;

          return (
            <div
              key={p.userId}
              className='group relative flex items-center gap-3 px-4 py-2.5 hover:bg-gray-750 hover:bg-white/5 transition-colors'
            >
              {/* Avatar */}
              <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0'>
                {(p.displayName || 'U').charAt(0).toUpperCase()}
              </div>

              {/* Name + role */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-1.5'>
                  <span className='text-white text-sm truncate'>
                    {p.displayName || `User ${p.userId}`}
                    {isMe && (
                      <span className='text-gray-400 text-xs ml-1'>(You)</span>
                    )}
                  </span>
                  {getRoleBadge(p)}
                </div>
              </div>

              {/* Status indicators */}
              <div className='flex items-center gap-1.5 shrink-0'>
                {/* Audio */}
                {p.audio ? (
                  p.muted ? (
                    <svg
                      className='w-4 h-4 text-red-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      title='Muted'
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
                  ) : (
                    <svg
                      className='w-4 h-4 text-green-400'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      title='Audio on'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                      />
                    </svg>
                  )
                ) : (
                  <svg
                    className='w-4 h-4 text-gray-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    title='No audio'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                    />
                  </svg>
                )}

                {/* Video */}
                {p.bVideoOn ? (
                  <svg
                    className='w-4 h-4 text-green-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    title='Video on'
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
                    className='w-4 h-4 text-red-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    title='Video off'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                    />
                  </svg>
                )}

                {/* Sharing indicator */}
                {p.sharerOn && (
                  <svg
                    className='w-4 h-4 text-blue-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    title='Sharing screen'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                    />
                  </svg>
                )}
              </div>

              {/* Action menu trigger — only for hosts/managers on other users */}
              {canManage && !isMe && (
                <button
                  onClick={() =>
                    setOpenMenuUserId(menuOpen ? null : p.userId)
                  }
                  className='shrink-0 p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity'
                  title='More actions'
                >
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <circle cx='12' cy='6' r='1.5' />
                    <circle cx='12' cy='12' r='1.5' />
                    <circle cx='12' cy='18' r='1.5' />
                  </svg>
                </button>
              )}

              {/* Dropdown menu */}
              {menuOpen && canManage && !isMe && (
                <div className='absolute right-4 top-10 z-20 bg-gray-700 rounded-lg shadow-lg border border-gray-600 py-1 min-w-[180px]'>
                  {/* Mute */}
                  {p.audio && !p.muted && (
                    <button
                      onClick={() => handleAction(p.userId, 'mute', 'Mute')}
                      className='w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors'
                    >
                      Mute
                    </button>
                  )}

                  {/* Make Manager (host only, not already manager) */}
                  {isHost && !p.isHost && !p.isManager && (
                    <button
                      onClick={() =>
                        handleAction(
                          p.userId,
                          'makeManager',
                          'Make Manager'
                        )
                      }
                      className='w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors'
                    >
                      Make Manager
                    </button>
                  )}

                  {/* Revoke Manager (host only) */}
                  {isHost && p.isManager && (
                    <button
                      onClick={() =>
                        handleAction(
                          p.userId,
                          'revokeManager',
                          'Revoke Manager'
                        )
                      }
                      className='w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors'
                    >
                      Revoke Manager
                    </button>
                  )}

                  {/* Make Host (host only) */}
                  {isHost && !p.isHost && (
                    <>
                      <div className='border-t border-gray-600 my-1' />
                      <button
                        onClick={() =>
                          handleAction(
                            p.userId,
                            'makeHost',
                            `Make ${p.displayName || 'this user'} the Host`
                          )
                        }
                        className='w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-600 transition-colors'
                      >
                        Make Host
                      </button>
                    </>
                  )}

                  {/* Remove */}
                  <div className='border-t border-gray-600 my-1' />
                  <button
                    onClick={() =>
                      handleAction(
                        p.userId,
                        'remove',
                        `Remove ${p.displayName || 'this user'}`
                      )
                    }
                    className='w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 transition-colors'
                  >
                    Remove from Session
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      {confirmAction && (
        <div className='absolute inset-0 bg-black/60 flex items-center justify-center z-30'>
          <div className='bg-gray-700 rounded-xl p-5 mx-4 max-w-sm w-full shadow-2xl'>
            <h4 className='text-white font-semibold mb-2'>Confirm Action</h4>
            <p className='text-gray-300 text-sm mb-4'>
              {confirmAction.action === 'remove'
                ? `Are you sure you want to remove this participant? They will be kicked from the session.`
                : `Are you sure you want to transfer the host role? You will no longer be the host.`}
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmAction(null)}
                className='px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  confirmAction.action === 'remove'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {confirmAction.action === 'remove' ? 'Remove' : 'Transfer Host'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
