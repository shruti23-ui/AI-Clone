'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/store/chatStore';

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${isUser
          ? 'bg-slate-700 text-slate-300'
          : 'bg-gradient-to-br from-cyan-400 to-purple-600 text-white'
        }`}
      >
        {isUser ? 'You' : 'S'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-slate-700/60 text-slate-200 rounded-tr-sm'
            : 'bg-gradient-to-br from-cyan-950/60 to-purple-950/60 border border-cyan-500/10 text-slate-100 rounded-tl-sm'
          }`}
      >
        {message.content ? (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="text-cyan-300 font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-black/30 rounded px-1 py-0.5 font-mono text-xs text-cyan-300">
                  {children}
                </code>
              ),
              ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
              li: ({ children }) => <li className="text-slate-300">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          // Empty streaming placeholder
          <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse rounded-sm" />
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1.5 font-mono opacity-30 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
