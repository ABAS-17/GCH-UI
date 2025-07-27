'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestions?: string[]
}

interface CardContext {
  card_context: {
    id: string
    title: string
    summary: string
    topic: string
    priority: string
    insight?: string
    event_count?: number
    user_location?: string
  }
  topic_focus: string
  user_intent: string
  chat_starter?: string
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [cardContext, setCardContext] = useState<CardContext | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const contextParam = searchParams?.get('context')
    if (contextParam) {
      try {
        const context = JSON.parse(decodeURIComponent(contextParam))
        setCardContext(context)
        
        // Create personalized initial message based on context
        const contextMessage: Message = {
          id: 'context-init',
          role: 'assistant',
          content: generateContextualWelcome(context),
          timestamp: new Date().toISOString(),
          suggestions: generateContextSuggestions(context)
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

  const generateContextualWelcome = (context: CardContext): string => {
    const { card_context } = context
    const location = card_context.user_location || 'your area'
    
    switch (card_context.topic) {
      case 'traffic':
        return `I understand you're concerned about the traffic situation: "${card_context.title}". This is a ${card_context.priority} priority issue in ${location}. I can help you with route alternatives, timing suggestions, and real-time updates. What specific aspect would you like to know more about?`
      
      case 'weather':
        return `I see there's a weather situation: "${card_context.title}". This is a ${card_context.priority} priority alert for ${location}. I can help you understand the impact and provide preparation tips. How can I assist you?`
      
      case 'infrastructure':
        return `There's an infrastructure issue: "${card_context.title}" in ${location}. This might affect your daily routine. I can explain the implications and suggest workarounds. What would you like to know?`
      
      case 'events':
        return `I notice there's an event situation: "${card_context.title}" near ${location}. I can provide details about how this might impact the area and your activities. What information would be helpful?`
      
      default:
        return `I'm here to help with "${card_context.title}". This is a ${card_context.priority} priority item in ${location}. What specific information or assistance would you like?`
    }
  }

  const generateContextSuggestions = (context: CardContext): string[] => {
    switch (context.card_context.topic) {
      case 'traffic':
        return [
          "Show alternative routes",
          "When will traffic clear?",
          "Best departure time",
          "Real-time updates"
        ]
      
      case 'weather':
        return [
          "How will this affect traffic?",
          "Should I change my plans?",
          "What should I prepare?",
          "Duration of conditions"
        ]
      
      case 'infrastructure':
        return [
          "When will this be fixed?",
          "How does this affect me?",
          "Alternative solutions",
          "Service updates"
        ]
      
      case 'events':
        return [
          "Event details",
          "Traffic impact",
          "Parking information", 
          "Alternative routes"
        ]
      
      default:
        return [
          "Tell me more",
          "How does this affect me?",
          "What should I do?",
          "Get updates"
        ]
    }
  }

  const initializeWithWelcome = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your Bengaluru city assistant. I can help with traffic conditions, weather forecasts, local events, infrastructure updates, and more. What would you like to know?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "Traffic to Electronic City",
        "Weather forecast",
        "Events this weekend",
        "Infrastructure updates"
      ]
    }
    setMessages([welcomeMessage])
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
      // Use ADK chat endpoint with context
      const requestBody = {
        user_id: 'arjun_user_id',
        message: content,
        location: {
          lat: 12.9120,
          lng: 77.6365
        },
        context: cardContext || {}
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
      
      const fallbackMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: generateFallbackResponse(content, cardContext),
        timestamp: new Date().toISOString(),
        suggestions: generateFollowUpSuggestions(content, cardContext)
      }

      setMessages(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateFallbackResponse = (userMessage: string, context: CardContext | null): string => {
    if (context?.card_context) {
      const { card_context } = context
      return `I understand you're asking about "${card_context.title}". While I'm having trouble accessing real-time data right now, I can tell you this is a ${card_context.priority} priority ${card_context.topic} issue in your area. For the most current information, I recommend checking local traffic apps or city services.`
    }
    
    return "I'm currently having trouble accessing real-time data, but I'm here to help with general information about Bengaluru's traffic, weather, and city services. What would you like to know?"
  }

  const generateFollowUpSuggestions = (userMessage: string, context: CardContext | null): string[] => {
    if (context?.card_context.topic === 'traffic') {
      return ["Alternative routes", "Traffic updates", "Best travel time"]
    }
    return ["More details", "Related info", "What should I do?"]
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Enhanced Header with Context */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                🤖 AI Assistant
                {cardContext?.card_context && (
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(cardContext.card_context.priority)}`}>
                    {cardContext.card_context.priority}
                  </span>
                )}
              </h1>
              
              {cardContext?.card_context && (
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {cardContext.card_context.topic.charAt(0).toUpperCase() + cardContext.card_context.topic.slice(1)} Topic
                  </span>
                  {cardContext.card_context.event_count && (
                    <span className="flex items-center gap-1">
                      📊 {cardContext.card_context.event_count} events
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Context Card (if from dashboard) */}
      {cardContext?.card_context && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="text-lg">
                {cardContext.card_context.priority === 'critical' ? '🚨' : 
                 cardContext.card_context.priority === 'high' ? '⚠️' : 
                 cardContext.card_context.priority === 'medium' ? '📢' : 'ℹ️'}
              </div>
              <div>
                <h3 className="font-medium text-blue-900">{cardContext.card_context.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{cardContext.card_context.summary}</p>
                {cardContext.card_context.insight && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">💡 {cardContext.card_context.insight}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-sm text-white">🤖</span>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
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
            placeholder={cardContext?.card_context ? 
              `Ask about ${cardContext.card_context.topic}...` : 
              "Ask me anything about Bengaluru..."
            }
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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading chat...</p>
      </div>
    }>
      <ChatContent />
    </Suspense>
  )
}