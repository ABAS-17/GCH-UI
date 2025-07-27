'use client'

import { Bot, User as UserIcon, Clock } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestions?: string[]
}

interface ChatMessageProps {
  message: Message
  onSuggestionClick: (suggestion: string) => void
  showSuggestions: boolean
}

export default function ChatMessage({ message, onSuggestionClick, showSuggestions }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
      }`}>
        {isUser ? (
          <UserIcon className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-200'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
          isUser ? 'justify-end' : ''
        }`}>
          <Clock className="w-3 h-3" />
          {formatTime(message.timestamp)}
        </div>

        {/* Suggestions */}
        {showSuggestions && !isUser && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 px-3 py-2 rounded-full text-sm transition-all duration-200 border border-blue-200 hover:border-blue-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}