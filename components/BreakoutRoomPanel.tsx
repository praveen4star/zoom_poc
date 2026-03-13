'use client';

import { useState, useCallback } from 'react';

export interface SubsessionInfo {
  subsessionId: string;
  subsessionName: string;
  userList: Array<{ userId: number; displayName: string }>;
}

export interface HelpRequest {
  userId: number;
  displayName: string;
  subsessionName: string;
  subsessionId: string;
  timestamp: number;
}

interface BreakoutRoomPanelProps {
  isHost: boolean;
  subsessionStatus: number; // 1=NotStarted, 2=InProgress, 3=Closing, 4=Closed
  subsessions: SubsessionInfo[];
  unassignedUsers: Array<{ userId: number; displayName: string }>;
  helpRequests: HelpRequest[];
  broadcastMsg: string | null;
  closingCountdown: number | null;
  roomCountdown: number | null;
  userSubsessionStatus: string;
  currentSubsession: { subsessionName: string; subsessionId: string } | null;
  onClose: () => void;
  onCreateSubsessions: (names: string[]) => Promise<void>;
  onOpenSubsessions: (options: {
    isAutoJoinSubsession: boolean;
    isBackToMainSessionEnabled: boolean;
    isTimerEnabled: boolean;
    timerDuration: number;
  }) => Promise<void>;
  onAssignUser: (userId: number, subsessionId: string) => Promise<void>;
  onMoveUser: (userId: number, subsessionId: string) => Promise<void>;
  onMoveBackToMain: (userId: number) => Promise<void>;
  onCloseAll: () => Promise<void>;
  onBroadcast: (message: string) => Promise<void>;
  onJoinSubsession: (subsessionId: string) => Promise<void>;
  onLeaveSubsession: () => Promise<void>;
  onAskForHelp: () => Promise<void>;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function BreakoutRoomPanel({
  isHost,
  subsessionStatus,
  subsessions,
  unassignedUsers,
  helpRequests,
  broadcastMsg,
  closingCountdown,
  roomCountdown,
  userSubsessionStatus,
  currentSubsession,
  onClose,
  onCreateSubsessions,
  onOpenSubsessions,
  onAssignUser,
  onMoveUser,
  onMoveBackToMain,
  onCloseAll,
  onBroadcast,
  onJoinSubsession,
  onLeaveSubsession,
  onAskForHelp,
}: BreakoutRoomPanelProps) {
  const [roomNamesInput, setRoomNamesInput] = useState('');
  const [roomCount, setRoomCount] = useState(2);
  const [useNamedRooms, setUseNamedRooms] = useState(false);
  const [autoJoin, setAutoJoin] = useState(false);
  const [allowReturn, setAllowReturn] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [roomsCreated, setRoomsCreated] = useState(false);

  const handleCreate = useCallback(async () => {
    setIsCreating(true);
    try {
      if (useNamedRooms) {
        const names = roomNamesInput
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean);
        if (names.length === 0) return;
        await onCreateSubsessions(names);
      } else {
        const names = Array.from(
          { length: roomCount },
          (_, i) => `Room ${i + 1}`
        );
        await onCreateSubsessions(names);
      }
      setRoomsCreated(true);
    } catch (err) {
      console.error('Error creating subsessions:', err);
    } finally {
      setIsCreating(false);
    }
  }, [useNamedRooms, roomNamesInput, roomCount, onCreateSubsessions]);

  const handleOpen = useCallback(async () => {
    setIsOpening(true);
    try {
      await onOpenSubsessions({
        isAutoJoinSubsession: autoJoin,
        isBackToMainSessionEnabled: allowReturn,
        isTimerEnabled: timerEnabled,
        timerDuration: timerMinutes * 60,
      });
    } catch (err) {
      console.error('Error opening subsessions:', err);
    } finally {
      setIsOpening(false);
    }
  }, [onOpenSubsessions, autoJoin, allowReturn, timerEnabled, timerMinutes]);

  const handleBroadcast = useCallback(async () => {
    const msg = broadcastInput.trim();
    if (!msg) return;
    await onBroadcast(msg);
    setBroadcastInput('');
  }, [broadcastInput, onBroadcast]);

  const statusLabel =
    subsessionStatus === 2
      ? 'In Progress'
      : subsessionStatus === 3
      ? 'Closing'
      : subsessionStatus === 4
      ? 'Closed'
      : 'Not Started';

  // ── Participant (non-host) view ──
  if (!isHost) {
    return (
      <div className='flex flex-col h-full bg-gray-800 border-l border-gray-700'>
        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
          <h3 className='text-white font-semibold text-sm'>Breakout Rooms</h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white transition-colors'
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

        <div className='flex-1 overflow-y-auto px-4 py-3 space-y-4'>
          {broadcastMsg && (
            <div className='bg-yellow-900/50 border border-yellow-600 rounded-lg p-3'>
              <p className='text-yellow-200 text-xs font-medium mb-1'>
                Host Broadcast
              </p>
              <p className='text-white text-sm'>{broadcastMsg}</p>
            </div>
          )}

          {closingCountdown !== null && (
            <div className='bg-red-900/50 border border-red-600 rounded-lg p-3 text-center'>
              <p className='text-red-200 text-sm'>
                Rooms closing in {formatCountdown(closingCountdown)}
              </p>
            </div>
          )}

          {userSubsessionStatus === 'in room' && currentSubsession ? (
            <div className='space-y-3'>
              <div className='bg-green-900/30 border border-green-700 rounded-lg p-3'>
                <p className='text-green-300 text-xs font-medium'>
                  Currently in
                </p>
                <p className='text-white text-lg font-semibold'>
                  {currentSubsession.subsessionName}
                </p>
              </div>
              <button
                onClick={onLeaveSubsession}
                className='w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm'
              >
                Return to Main Session
              </button>
              <button
                onClick={onAskForHelp}
                className='w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm'
              >
                Ask Host for Help
              </button>
            </div>
          ) : subsessions.length > 0 ? (
            <div className='space-y-2'>
              <p className='text-gray-400 text-xs'>Your assigned room:</p>
              {subsessions.map((room) => (
                <div
                  key={room.subsessionId}
                  className='bg-gray-700 rounded-lg p-3 flex items-center justify-between'
                >
                  <span className='text-white text-sm font-medium'>
                    {room.subsessionName}
                  </span>
                  {subsessionStatus === 2 && (
                    <button
                      onClick={() => onJoinSubsession(room.subsessionId)}
                      className='px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition-colors'
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-500 text-sm text-center py-8'>
              {subsessionStatus === 2
                ? 'You have not been assigned to a room yet.'
                : 'No breakout rooms active.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Host view ──
  return (
    <div className='flex flex-col h-full bg-gray-800 border-l border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
        <div>
          <h3 className='text-white font-semibold text-sm'>Breakout Rooms</h3>
          <span
            className={`text-[10px] font-medium ${
              subsessionStatus === 2
                ? 'text-green-400'
                : subsessionStatus === 3
                ? 'text-yellow-400'
                : 'text-gray-500'
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <button
          onClick={onClose}
          className='text-gray-400 hover:text-white transition-colors'
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

      <div className='flex-1 overflow-y-auto px-4 py-3 space-y-4'>
        {/* Countdowns */}
        {roomCountdown !== null && (
          <div className='bg-blue-900/50 border border-blue-600 rounded-lg p-2 text-center'>
            <p className='text-blue-200 text-xs'>
              Room timer: {formatCountdown(roomCountdown)}
            </p>
          </div>
        )}
        {closingCountdown !== null && (
          <div className='bg-red-900/50 border border-red-600 rounded-lg p-2 text-center'>
            <p className='text-red-200 text-xs'>
              Closing in: {formatCountdown(closingCountdown)}
            </p>
          </div>
        )}

        {/* Help Requests */}
        {helpRequests.length > 0 && (
          <div className='space-y-2'>
            <p className='text-orange-400 text-xs font-semibold'>
              Help Requests
            </p>
            {helpRequests.map((req) => (
              <div
                key={`${req.userId}-${req.timestamp}`}
                className='bg-orange-900/30 border border-orange-700 rounded-lg p-2 flex items-center justify-between'
              >
                <div>
                  <p className='text-white text-sm'>{req.displayName}</p>
                  <p className='text-orange-300 text-[10px]'>
                    {req.subsessionName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phase 1: Setup */}
        {(subsessionStatus === 1 || subsessionStatus === 4) &&
          !roomsCreated && (
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <label className='flex items-center gap-2 text-gray-300 text-sm cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={useNamedRooms}
                    onChange={(e) => setUseNamedRooms(e.target.checked)}
                    className='rounded'
                  />
                  Named rooms
                </label>
              </div>

              {useNamedRooms ? (
                <div>
                  <label className='text-gray-400 text-xs block mb-1'>
                    Room names (comma-separated)
                  </label>
                  <input
                    type='text'
                    value={roomNamesInput}
                    onChange={(e) => setRoomNamesInput(e.target.value)}
                    placeholder='Room A, Room B, Room C'
                    className='w-full bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>
              ) : (
                <div>
                  <label className='text-gray-400 text-xs block mb-1'>
                    Number of rooms
                  </label>
                  <input
                    type='number'
                    min={1}
                    max={50}
                    value={roomCount}
                    onChange={(e) => setRoomCount(Number(e.target.value))}
                    className='w-24 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500'
                  />
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className='w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm font-medium'
              >
                {isCreating ? 'Creating...' : 'Create Rooms'}
              </button>
            </div>
          )}

        {/* Phase 1b: Rooms created, assign + options before opening */}
        {(subsessionStatus === 1 || subsessionStatus === 4) &&
          roomsCreated &&
          subsessions.length > 0 && (
            <div className='space-y-4'>
              {/* Assignment */}
              <div className='space-y-2'>
                <p className='text-gray-300 text-xs font-semibold'>Rooms</p>
                {subsessions.map((room) => (
                  <div
                    key={room.subsessionId}
                    className='bg-gray-700 rounded-lg p-2'
                  >
                    <p className='text-white text-sm font-medium mb-1'>
                      {room.subsessionName}
                    </p>
                    {room.userList.length > 0 ? (
                      <div className='flex flex-wrap gap-1'>
                        {room.userList.map((u) => (
                          <span
                            key={u.userId}
                            className='bg-gray-600 text-gray-200 text-[10px] px-1.5 py-0.5 rounded'
                          >
                            {u.displayName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className='text-gray-500 text-[10px]'>
                        No participants
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Unassigned users */}
              {unassignedUsers.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-gray-300 text-xs font-semibold'>
                    Unassigned ({unassignedUsers.length})
                  </p>
                  {unassignedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className='bg-gray-700 rounded-lg p-2 flex items-center justify-between'
                    >
                      <span className='text-white text-sm'>
                        {user.displayName}
                      </span>
                      <select
                        onChange={(e) => {
                          if (e.target.value)
                            onAssignUser(user.userId, e.target.value);
                          e.target.value = '';
                        }}
                        defaultValue=''
                        className='bg-gray-600 text-white text-xs rounded px-1 py-0.5'
                      >
                        <option value='' disabled>
                          Assign...
                        </option>
                        {subsessions.map((r) => (
                          <option key={r.subsessionId} value={r.subsessionId}>
                            {r.subsessionName}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Options */}
              <div className='space-y-2 border-t border-gray-700 pt-3'>
                <p className='text-gray-300 text-xs font-semibold'>Options</p>
                <label className='flex items-center gap-2 text-gray-300 text-sm cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={autoJoin}
                    onChange={(e) => setAutoJoin(e.target.checked)}
                    className='rounded'
                  />
                  Auto-join participants
                </label>
                <label className='flex items-center gap-2 text-gray-300 text-sm cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={allowReturn}
                    onChange={(e) => setAllowReturn(e.target.checked)}
                    className='rounded'
                  />
                  Allow return to main session
                </label>
                <label className='flex items-center gap-2 text-gray-300 text-sm cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className='rounded'
                  />
                  Timer
                </label>
                {timerEnabled && (
                  <div className='flex items-center gap-2 pl-6'>
                    <input
                      type='number'
                      min={1}
                      max={120}
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Number(e.target.value))}
                      className='w-16 bg-gray-700 text-white text-sm rounded px-2 py-1 outline-none'
                    />
                    <span className='text-gray-400 text-xs'>minutes</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleOpen}
                disabled={isOpening}
                className='w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors text-sm font-medium'
              >
                {isOpening ? 'Opening...' : 'Open All Rooms'}
              </button>
            </div>
          )}

        {/* Phase 2: Active */}
        {subsessionStatus === 2 && (
          <div className='space-y-4'>
            {/* Room list with participants */}
            <div className='space-y-2'>
              {subsessions.map((room) => (
                <div
                  key={room.subsessionId}
                  className='bg-gray-700 rounded-lg p-2'
                >
                  <p className='text-white text-sm font-medium mb-1'>
                    {room.subsessionName}
                    <span className='text-gray-400 text-[10px] ml-1'>
                      ({room.userList.length})
                    </span>
                  </p>
                  {room.userList.length > 0 ? (
                    <div className='space-y-1'>
                      {room.userList.map((u) => (
                        <div
                          key={u.userId}
                          className='flex items-center justify-between'
                        >
                          <span className='text-gray-200 text-xs'>
                            {u.displayName}
                          </span>
                          <div className='flex gap-1'>
                            <select
                              onChange={(e) => {
                                if (e.target.value === '__main__') {
                                  onMoveBackToMain(u.userId);
                                } else if (e.target.value) {
                                  onMoveUser(u.userId, e.target.value);
                                }
                                e.target.value = '';
                              }}
                              defaultValue=''
                              className='bg-gray-600 text-white text-[10px] rounded px-1 py-0.5'
                            >
                              <option value='' disabled>
                                Move...
                              </option>
                              <option value='__main__'>Main Session</option>
                              {subsessions
                                .filter(
                                  (r) => r.subsessionId !== room.subsessionId
                                )
                                .map((r) => (
                                  <option
                                    key={r.subsessionId}
                                    value={r.subsessionId}
                                  >
                                    {r.subsessionName}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 text-[10px]'>Empty</p>
                  )}
                </div>
              ))}
            </div>

            {/* Unassigned */}
            {unassignedUsers.length > 0 && (
              <div className='space-y-1'>
                <p className='text-gray-400 text-xs'>
                  Unassigned ({unassignedUsers.length})
                </p>
                {unassignedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className='flex items-center justify-between bg-gray-700 rounded px-2 py-1'
                  >
                    <span className='text-gray-200 text-xs'>
                      {user.displayName}
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value)
                          onAssignUser(user.userId, e.target.value);
                        e.target.value = '';
                      }}
                      defaultValue=''
                      className='bg-gray-600 text-white text-[10px] rounded px-1 py-0.5'
                    >
                      <option value='' disabled>
                        Assign...
                      </option>
                      {subsessions.map((r) => (
                        <option key={r.subsessionId} value={r.subsessionId}>
                          {r.subsessionName}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Broadcast */}
            <div className='border-t border-gray-700 pt-3'>
              <p className='text-gray-300 text-xs font-semibold mb-1'>
                Broadcast Message
              </p>
              <div className='flex gap-1'>
                <input
                  type='text'
                  value={broadcastInput}
                  onChange={(e) => setBroadcastInput(e.target.value)}
                  placeholder='Message to all rooms...'
                  className='flex-1 bg-gray-700 text-white text-xs rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-500'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBroadcast();
                  }}
                />
                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastInput.trim()}
                  className='px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 disabled:opacity-40 transition-colors'
                >
                  Send
                </button>
              </div>
            </div>

            {/* Close All */}
            <button
              onClick={onCloseAll}
              className='w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors text-sm font-medium'
            >
              Close All Rooms
            </button>
          </div>
        )}

        {/* Phase 3: Closing */}
        {subsessionStatus === 3 && (
          <div className='text-center py-8'>
            <p className='text-yellow-400 text-sm font-medium'>
              Rooms are closing...
            </p>
            {closingCountdown !== null && (
              <p className='text-yellow-200 text-2xl font-mono mt-2'>
                {formatCountdown(closingCountdown)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
