'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
/* Inline SVG icon helpers (no external icon library needed) */
function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  );
}

function GlobeIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='10' strokeWidth={2} />
      <path
        strokeWidth={2}
        d='M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z'
      />
    </svg>
  );
}

function LanguagesIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M3 5h12M9 3v2m1.048 3.5A18.024 18.024 0 016 21m5.969-8.953c.096.352.195.701.298 1.047M21 12l-4.5 4.5M16.5 12L21 16.5M3 5a18.015 18.015 0 017 8'
      />
    </svg>
  );
}

/* ─── Supported languages (subset matching SDK's LiveTranscriptionLanguage) ─── */
const SPEAKING_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish' },
  { code: 'ko', name: 'Korean' },
  { code: 'it', name: 'Italian' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'id', name: 'Indonesian' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'tr', name: 'Turkish' },
  { code: 'th', name: 'Thai' },
] as const;

const TRANSLATION_LANGUAGES = [
  { code: undefined as string | undefined, name: 'Off (no translation)' },
  ...SPEAKING_LANGUAGES,
];

export interface CaptionMessage {
  msgId: string;
  userId: number;
  displayName: string;
  text: string;
  language: number;
  timestamp: number;
  done?: boolean;
}

interface CaptionPanelProps {
  messages: CaptionMessage[];
  lttClient: any; // LiveTranscriptionClient
  isHost: boolean;
  onClose: () => void;
}

export default function CaptionPanel({
  messages,
  lttClient,
  isHost,
  onClose,
}: CaptionPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [speakingLang, setSpeakingLang] = useState('en');
  const [translationLang, setTranslationLang] = useState<string | undefined>(
    undefined
  );
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [statusInfo, setStatusInfo] = useState<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync current language from the client on mount (read-only, no state update in effect)
  const syncedRef = useRef(false);
  if (!syncedRef.current && lttClient) {
    try {
      const cur = lttClient.getCurrentTranscriptionLanguage?.();
      if (cur?.code) setSpeakingLang(cur.code);
      const curTrans = lttClient.getCurrentTranslationLanguage?.();
      if (curTrans?.code) setTranslationLang(curTrans.code);
      syncedRef.current = true;
    } catch {
      // not ready
    }
  }

  const handleStartTranscription = useCallback(async () => {
    if (!lttClient) return;
    try {
      await lttClient.startLiveTranscription();
      setIsTranscribing(true);
      setStatusInfo(null);
    } catch (err: any) {
      console.error('Error starting transcription:', err);
      setStatusInfo(err?.reason || err?.message || 'Failed to start');
    }
  }, [lttClient]);

  const handleSetSpeakingLanguage = useCallback(
    async (code: string) => {
      if (!lttClient) return;
      setSpeakingLang(code);
      try {
        await lttClient.setSpeakingLanguage(code);
      } catch (err: any) {
        console.error('Error setting speaking language:', err);
      }
    },
    [lttClient]
  );

  const handleSetTranslationLanguage = useCallback(
    async (code: string | undefined) => {
      if (!lttClient) return;
      setTranslationLang(code);
      try {
        await lttClient.setTranslationLanguage(code);
      } catch (err: any) {
        console.error('Error setting translation language:', err);
      }
    },
    [lttClient]
  );

  return (
    <div className='flex flex-col h-full bg-gray-800 text-white'>
      {/* Header */}
      <div className='flex items-center justify-between p-3 border-b border-gray-700'>
        <div className='flex items-center gap-2'>
          <LanguagesIcon size={18} />
          <h2 className='text-base font-semibold'>
            Captions &amp; Translation
          </h2>
        </div>
        <button onClick={onClose} className='p-1 rounded-md hover:bg-gray-700'>
          <XIcon size={18} />
        </button>
      </div>

      {/* Controls bar */}
      <div className='p-3 border-b border-gray-700 space-y-2'>
        {/* Start / status */}
        {!isTranscribing ? (
          <button
            onClick={handleStartTranscription}
            className='w-full py-2 bg-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors'
          >
            Enable Live Captions
          </button>
        ) : (
          <div className='flex items-center gap-2 text-green-400 text-sm'>
            <span className='inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse' />
            Live captions active
          </div>
        )}

        {statusInfo && <p className='text-xs text-red-400'>{statusInfo}</p>}

        {/* Language picker toggle */}
        <button
          onClick={() => setShowLangPicker((p) => !p)}
          className='flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors'
        >
          <GlobeIcon size={14} />
          {showLangPicker ? 'Hide language options' : 'Language settings'}
        </button>

        {showLangPicker && (
          <div className='space-y-3 pt-1'>
            {/* Speaking language */}
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Speaking language (your microphone)
              </label>
              <select
                value={speakingLang}
                onChange={(e) => handleSetSpeakingLanguage(e.target.value)}
                className='w-full bg-gray-700 text-white text-sm rounded-md px-2 py-1.5 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                {SPEAKING_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Translation language */}
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Translate captions to
              </label>
              <select
                value={translationLang ?? ''}
                onChange={(e) =>
                  handleSetTranslationLanguage(
                    e.target.value === '' ? undefined : e.target.value
                  )
                }
                className='w-full bg-gray-700 text-white text-sm rounded-md px-2 py-1.5 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500'
              >
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <option key={lang.code ?? 'off'} value={lang.code ?? ''}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Host-only: disable captions */}
            {isHost && (
              <button
                onClick={async () => {
                  try {
                    await lttClient.disableCaptions(true);
                    setIsTranscribing(false);
                  } catch (err: any) {
                    console.error('Error disabling captions:', err);
                  }
                }}
                className='text-xs text-red-400 hover:text-red-300'
              >
                Disable captions for everyone
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transcript messages */}
      <div className='flex-1 overflow-y-auto p-3 space-y-2'>
        {messages.length === 0 && (
          <p className='text-gray-500 text-sm text-center mt-8'>
            {isTranscribing
              ? 'Waiting for speech…'
              : 'Enable live captions to see transcription here.'}
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={msg.msgId || idx}
            className={`text-sm ${
              msg.done === false ? 'text-gray-400 italic' : 'text-white'
            }`}
          >
            <span className='font-semibold text-blue-400'>
              {msg.displayName}:{' '}
            </span>
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
