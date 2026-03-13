'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export interface ChatFileInfo {
  name: string;
  size: number;
  type: string;
  fileUrl?: string;
  upload?: { status: number; progress: number };
  download?: { status: number; progress: number };
}

export interface ChatMessage {
  id?: string;
  message?: string;
  file?: ChatFileInfo;
  sender: { name: string; userId: number };
  receiver: { name: string; userId: number };
  timestamp: number;
}

interface FileTransferSetting {
  typeLimit?: string;
  sizeLimit?: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: number;
  onSendMessage: (text: string) => Promise<void>;
  onClose: () => void;
  onSendFile?: (file: File) => Promise<void>;
  onDownloadFile?: (msgId: string, fileUrl: string) => void;
  isFileTransferEnabled?: boolean;
  fileTransferSetting?: FileTransferSetting | null;
  imageBlobs?: Record<string, string>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(type);
}

export default function ChatPanel({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
  onSendFile,
  onDownloadFile,
  isFileTransferEnabled = false,
  fileTransferSetting = null,
  imageBlobs = {},
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(text);
      setInputText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      if (fileTransferSetting?.sizeLimit && file.size > fileTransferSetting.sizeLimit) {
        return `File is too large. Maximum size: ${formatFileSize(fileTransferSetting.sizeLimit)}`;
      }
      if (fileTransferSetting?.typeLimit) {
        const allowedExts = fileTransferSetting.typeLimit
          .split(',')
          .map((ext) => ext.trim().toLowerCase());
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        if (allowedExts.length > 0 && allowedExts[0] !== '' && !allowedExts.includes(fileExt)) {
          return `File type .${fileExt} is not allowed. Allowed: ${fileTransferSetting.typeLimit}`;
        }
      }
      return null;
    },
    [fileTransferSetting]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onSendFile) return;

      const error = validateFile(file);
      if (error) {
        alert(error);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setIsSending(true);
      try {
        await onSendFile(file);
      } catch (err) {
        console.error('Error sending file:', err);
      } finally {
        setIsSending(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onSendFile, validateFile]
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderFileMessage = (msg: ChatMessage, isOwn: boolean) => {
    const file = msg.file!;
    const isImage = isImageType(file.type || file.name);
    const blobUrl = msg.id ? imageBlobs[msg.id] : undefined;
    const isUploading =
      file.upload && file.upload.status !== 2 && file.upload.status !== 5;
    const uploadProgress = file.upload?.progress ?? 0;

    return (
      <div
        className={`max-w-[85%] rounded-lg overflow-hidden ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-100 rounded-bl-none'
        }`}
      >
        {/* Inline image preview */}
        {isImage && blobUrl && (
          <img
            src={blobUrl}
            alt={file.name}
            className='w-full max-h-48 object-cover cursor-pointer'
            onClick={() => window.open(blobUrl, '_blank')}
          />
        )}

        <div className='flex items-center gap-2 px-3 py-2'>
          {/* File icon */}
          {isImage && !blobUrl ? (
            <svg
              className='w-8 h-8 shrink-0 opacity-70'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z'
              />
            </svg>
          ) : (
            !isImage && (
              <svg
                className='w-8 h-8 shrink-0 opacity-70'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'
                />
              </svg>
            )
          )}

          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{file.name}</p>
            <p className='text-xs opacity-70'>{formatFileSize(file.size)}</p>
          </div>

          {/* Download button (for received files) */}
          {!isOwn && file.fileUrl && msg.id && onDownloadFile && (
            <button
              onClick={() => onDownloadFile(msg.id!, file.fileUrl!)}
              className='p-1.5 rounded-md hover:bg-white/20 transition-colors shrink-0'
              title='Download file'
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
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
            </button>
          )}
        </div>

        {/* Upload progress bar */}
        {isUploading && (
          <div className='px-3 pb-2'>
            <div className='w-full bg-black/20 rounded-full h-1.5'>
              <div
                className='bg-white/80 h-1.5 rounded-full transition-all duration-300'
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className='text-[10px] opacity-60 mt-0.5'>
              Uploading {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full bg-gray-800 border-l border-gray-700'>
      {/* Header */}
      <div className='flex items-center justify-between px-4 py-3 border-b border-gray-700'>
        <h3 className='text-white font-semibold text-sm'>In-Meeting Chat</h3>
        <button
          onClick={onClose}
          className='text-gray-400 hover:text-white transition-colors'
          title='Close chat'
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

      {/* Messages */}
      <div className='flex-1 overflow-y-auto px-3 py-2 space-y-3'>
        {messages.length === 0 && (
          <div className='flex items-center justify-center h-full'>
            <p className='text-gray-500 text-sm text-center'>
              No messages yet.
              <br />
              Send a message to start the conversation.
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isOwn = msg.sender.userId === currentUserId;
          return (
            <div
              key={msg.id || `msg-${index}`}
              className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
            >
              {!isOwn && (
                <span className='text-xs text-gray-400 mb-0.5 px-1'>
                  {msg.sender.name}
                </span>
              )}
              {msg.file ? (
                renderFileMessage(msg, isOwn)
              ) : (
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-sm wrap-break-word ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.message}
                </div>
              )}
              <span className='text-[10px] text-gray-500 mt-0.5 px-1'>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className='flex items-center gap-2 px-3 py-3 border-t border-gray-700'
      >
        {/* File attachment button */}
        {isFileTransferEnabled && onSendFile && (
          <>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className='p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-40 transition-colors'
              title='Attach file'
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
                  d='M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01a1.5 1.5 0 01-2.122-2.122l7.693-7.693'
                />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type='file'
              className='hidden'
              onChange={handleFileSelect}
              disabled={isSending}
            />
          </>
        )}
        <input
          type='text'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder='Type a message...'
          className='flex-1 bg-gray-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400'
          disabled={isSending}
        />
        <button
          type='submit'
          disabled={!inputText.trim() || isSending}
          className='p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          title='Send message'
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
              d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
