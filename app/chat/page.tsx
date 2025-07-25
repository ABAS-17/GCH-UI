'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatMessage from '@/components/ChatMessage'
import SuggestedPrompts from '@/components/SuggestedPrompts'
import ChatInput from '@/components/ChatInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestions?: string[]
}

interface CardContext {
  id: string
  title: string
  summary: string
  type: string
  priority: string
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cardContext, setCardContext] = useState<CardContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check if we have card context from navigation
    const contextParam = searchParams?.get('context')
    if (contextParam) {
      try {
        const context = JSON.parse(decodeURIComponent(contextParam))
        setCardContext(context)
        
        // Add initial context message
        const contextMessage: Message = {
          id: 'context-init',
          role: 'assistant',
          content: `I see you're interested in "${context.title}". ${context.summary} What would you like to know more about?`,
          timestamp: new Date().toISOString(),
          suggestions: generateContextSuggestions(context.type)
        }
        
        setMessages([contextMessage])
      } catch (error) {
        console.error('Error parsing card context:', error)
        initializeWithWelcome()
      }
    } else {
      initializeWithWelcome()
    }
  }, [searchParams])

  const initializeWithWelcome = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Bengaluru city assistant. I can help with traffic conditions, weather forecasts, local events, infrastructure updates, and more. What would you like to know?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "How's traffic to Electronic City?",
        "Weather forecast for today",
        "Any events this weekend?",
        "Power outages in my area"
      ]
    }
    setMessages([welcomeMessage])
  }

  const generateContextSuggestions = (cardType: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      traffic_synthesis: [
        "Show me alternative routes",
        "How long will these delays last?",
        "Best time to travel today"
      ],
      weather_warning: [
        "Should I carry an umbrella?",
        "How will this affect traffic?",
        "Weather for the whole day"
      ],
      event_recommendation: [
        "Show me event details",
        "How do I get there?",
        "Similar events nearby"
      ],
      infrastructure_update: [
        "When will this be fixed?",
        "What areas are affected?",
        "Alternative solutions"
      ]
    }
    
    return suggestions[cardType] || [
      "Tell me more",
      "What should I do?",
      "Any alternatives?"
    ]
  }

  const sendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Include card context in the request if available
      const requestBody = {
        user_id: 'arjun_user_id',
        message: content,
        location: {
          lat: 12.9120,
          lng: 77.6365
        },
        context: cardContext ? {
          card_context: cardContext,
          previous_card: true
        } : {}
      }

      const response = await fetch('http://localhost:8000/adk/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || 'I apologize, but I encountered an issue processing your request.',
          timestamp: new Date().toISOString(),
          suggestions: data.suggested_actions?.map((action: any) => action.text) || []
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      
      // Fallback response based on user input
      let fallbackContent = "I'm currently having trouble accessing real-time data. "
      
      if (content.toLowerCase().includes('traffic')) {
        fallbackContent += "For traffic information, I recommend checking current conditions on major routes like ORR, Sarjapur Road, and Electronic City Flyover. Would you like me to help with alternative routes?"
      } else if (content.toLowerCase().includes('weather')) {
        fallbackContent += "For weather updates, I suggest checking local forecasts. Bengaluru typically has pleasant weather, but monsoon season can bring sudden changes."
      } else {
        fallbackContent += "Let me help you with general information about Bengaluru. What specific area or topic would you like to know about?"
      }

      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
        suggestions: [
          "Traffic in Koramangala",
          "Weather updates",
          "Local events",
          "Infrastructure status"
        ]
      }

      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">🤖 AI Assistant</h1>
            {cardContext && (
              <p className="text-sm text-gray-600 mt-1">
                Context: {cardContext.type.replace('_', ' ')} • {cardContext.priority} priority
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message}
              onSuggestionClick={handleSuggestionClick}
              showSuggestions={message.id === messages[messages.length - 1]?.id}
            />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <ChatInput 
            onSendMessage={sendMessage}
            disabled={isLoading}
            placeholder="Ask me anything about Bengaluru..."
          />
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading chat...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}
