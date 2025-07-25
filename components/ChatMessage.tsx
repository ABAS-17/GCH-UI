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
  const isAssistant = message.role === 'assistant'

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-200 text-gray-600'
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
            ? 'bg-primary-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
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
        {showSuggestions && isAssistant && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-full text-sm transition-colors duration-200 border border-primary-200"
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
