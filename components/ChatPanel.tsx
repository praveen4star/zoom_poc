'use client';

import { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id?: string;
  message?: string;
  sender: { name: string; userId: number };
  receiver: { name: string; userId: number };
  timestamp: number;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: number;
  onSendMessage: (text: string) => Promise<void>;
  onClose: () => void;
}

export default function ChatPanel({
  messages,
  currentUserId,
  onSendMessage,
  onClose,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm wrap-break-word ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-100 rounded-bl-none'
                }`}
              >
                {msg.message}
              </div>
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
