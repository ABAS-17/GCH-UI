'use client'

import { useState, useRef } from 'react'
import { Camera, Video, Mic, MapPin, Send, X, Plus, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react'
import { API_BASE_URL, DEFAULT_USER_ID, DEFAULT_LOCATION } from '@/lib/constants'

interface MediaFile {
  id: string
  file: File
  type: 'image' | 'video' | 'audio'
  preview: string
  analyzing?: boolean
  analysis?: {
    description: string
    confidence: number
    objects: string[]
  }
  uploadedUrl?: string  // Add this to track uploaded URLs
}

interface PostLocation {
  lat: number
  lng: number
  address: string
}

interface PostComponentProps {
  onSubmit?: (postData: any) => void
  onClose?: () => void
  className?: string
}

// Updated to match backend EventTopic enum exactly
const TOPIC_OPTIONS = [
  { value: 'traffic', label: '🚗 Traffic', icon: '🚗' },
  { value: 'infrastructure', label: '⚡ Infrastructure', icon: '⚡' },
  { value: 'weather', label: '🌧️ Weather', icon: '🌧️' },
  { value: 'safety', label: '🚨 Safety', icon: '🚨' },
  { value: 'events', label: '🎉 Events', icon: '🎉' }
]

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' }
]

export default function PostComponent({ onSubmit, onClose, className = '' }: PostComponentProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('events')
  const [severity, setSeverity] = useState('medium')
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [location, setLocation] = useState<PostLocation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Get user's current location
  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      
      const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)} • HSR Layout, Bengaluru`
      
      setLocation({
        lat: latitude,
        lng: longitude,
        address
      })
    } catch (error) {
      console.error('Location error:', error)
      setLocation(DEFAULT_LOCATION)
    } finally {
      setIsGettingLocation(false)
    }
  }

  // Upload media files to backend with proper format
  const uploadMediaFiles = async (files: MediaFile[]): Promise<string[]> => {
    if (files.length === 0) return []

    try {
      const formData = new FormData()
      
      // Add files to form data
      files.forEach((mediaFile, index) => {
        formData.append('files', mediaFile.file)
      })
      
      // Add metadata as strings (to match backend expectations)
      formData.append('user_id', DEFAULT_USER_ID)
      formData.append('event_id', `post_${Date.now()}`)

      console.log('🚀 Uploading files to backend...')

      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      console.log('📡 Upload response:', result)

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} - ${result.error || result.detail || response.statusText}`)
      }

      if (result.success) {
        console.log(`✅ Uploaded ${result.total_uploaded} files successfully`)
        return result.storage_urls || []
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('❌ Media upload error:', error)
      
      if (error.message.includes('validation error')) {
        throw new Error('Backend validation error - check file format and size')
      } else if (error.message.includes('413')) {
        throw new Error('File too large - maximum 50MB per file')
      } else if (error.message.includes('415')) {
        throw new Error('Unsupported media type')
      } else {
        throw error
      }
    }
  }

  // FIXED: Analyze uploaded media using backend with correct query parameters
  const analyzeMedia = async (mediaUrl: string, mediaType: string) => {
    try {
      console.log('🤖 Analyzing media:', mediaUrl)
      
      // FIX: Send media_url as query parameter, not in body
      const searchParams = new URLSearchParams({
        media_url: mediaUrl,
        media_type: mediaType
      })
      
      const response = await fetch(`${API_BASE_URL}/media/analyze?${searchParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        // No body needed since parameters are in query string
      })

      if (!response.ok) {
        const errorResult = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Analysis failed: ${response.status} - ${errorResult.error || errorResult.detail}`)
      }

      const result = await response.json()
      console.log('🧠 Analysis result:', result)
      
      return result.analysis_results
    } catch (error) {
      console.error('❌ Media analysis error:', error)
      return null
    }
  }

  // Handle file selection with better error handling
  const handleFileSelect = async (files: FileList | null, type: 'image' | 'video' | 'audio') => {
    if (!files) return

    Array.from(files).forEach(file => {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB.`)
        return
      }

      // Validate file type
      if (type === 'image' && !file.type.startsWith('image/')) {
        alert(`"${file.name}" is not a valid image file.`)
        return
      }
      if (type === 'video' && !file.type.startsWith('video/')) {
        alert(`"${file.name}" is not a valid video file.`)
        return
      }
      if (type === 'audio' && !file.type.startsWith('audio/')) {
        alert(`"${file.name}" is not a valid audio file.`)
        return
      }

      const mediaFile: MediaFile = {
        id: `${Date.now()}_${Math.random()}`,
        file,
        type,
        preview: URL.createObjectURL(file),
        analyzing: true
      }

      setMediaFiles(prev => [...prev, mediaFile])

      // Upload and analyze file
      uploadAndAnalyzeFile(mediaFile)
    })
  }

  const uploadAndAnalyzeFile = async (mediaFile: MediaFile) => {
    try {
      console.log('📤 Processing file:', mediaFile.file.name)
      
      // Upload file first
      const urls = await uploadMediaFiles([mediaFile])
      
      if (urls.length > 0) {
        const uploadedUrl = urls[0]
        console.log('✅ File uploaded:', uploadedUrl)
        
        // Store the uploaded URL in the media file
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? { ...f, uploadedUrl }
            : f
        ))
        
        // Analyze the uploaded media
        const analysis = await analyzeMedia(uploadedUrl, mediaFile.type)
        
        // Update the media file with analysis results
        setMediaFiles(prev => prev.map(f => 
          f.id === mediaFile.id 
            ? {
                ...f,
                analyzing: false,
                analysis: analysis ? {
                  description: analysis.description,
                  confidence: analysis.confidence_score || 0.85,
                  objects: analysis.detected_objects || []
                } : undefined
              }
            : f
        ))
        
        console.log(`✅ Media processing completed for ${mediaFile.file.name}`)
      }
    } catch (error) {
      console.error('❌ Upload and analysis failed:', error)
      
      // Update UI to show error
      setMediaFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, analyzing: false }
          : f
      ))
      
      // Show user-friendly error message
      alert(`Failed to process ${mediaFile.file.name}: ${error.message}`)
    }
  }

  // Remove media file
  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  // FIXED: Handle form submission for backend compatibility
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description')
      return
    }

    setIsSubmitting(true)

    try {
      // Check if any files are still analyzing
      const stillAnalyzing = mediaFiles.filter(f => f.analyzing)
      if (stillAnalyzing.length > 0) {
        alert(`Please wait for ${stillAnalyzing.length} media file(s) to finish processing.`)
        setIsSubmitting(false)
        return
      }

      // Get URLs of already uploaded media
      const mediaUrls = mediaFiles
        .filter(f => f.uploadedUrl)
        .map(f => f.uploadedUrl!)
      
      // FIX: Prepare event data to match EnhancedEventCreateRequest exactly
      const eventData = {
        topic, // EventTopic enum: traffic, infrastructure, weather, events, safety
        sub_topic: topic, // Use same as topic for now
        title: title.trim(),
        description: description.trim(),
        // FIX: Send location as plain object, backend will convert to Coordinates
        location: location ? {
          lat: location.lat,
          lng: location.lng
        } : {
          lat: DEFAULT_LOCATION.lat,
          lng: DEFAULT_LOCATION.lng
        },
        address: location?.address || DEFAULT_LOCATION.address,
        severity, // EventSeverity enum: low, medium, high, critical
        media_files: [], // Empty array - files already uploaded separately
        media_urls: mediaUrls, // URLs of uploaded media
        reporter_context: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      }

      console.log('🚀 Submitting event to backend:', eventData)

      // Submit to backend using the enhanced events endpoint
      const response = await fetch(`${API_BASE_URL}/events/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      })

      const result = await response.json()
      
      console.log('📡 Backend response:', result)

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} - ${result.error || result.detail || response.statusText}`)
      }

      if (result.success) {
        console.log('✅ Event created successfully:', result.event_id)
        
        // Call parent callback with result
        if (onSubmit) {
          await onSubmit({
            ...eventData,
            id: result.event_id,
            backend_response: result
          })
        }

        // Reset form
        setTitle('')
        setDescription('')
        setTopic('events')
        setSeverity('medium')
        setMediaFiles([])
        setLocation(null)

        if (onClose) {
          onClose()
        }
        
        alert(`Post created successfully! Event ID: ${result.event_id}`)
      } else {
        throw new Error(result.message || 'Failed to create event')
      }
    } catch (error) {
      console.error('❌ Error submitting event:', error)
      alert(`Failed to create post: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          📝 Create Post
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Topic & Severity Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TOPIC_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Choose from: Traffic, Infrastructure, Weather, Safety, or Events
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SEVERITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's happening in your area?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            maxLength={100}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {title.length}/100
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide more details about what you observed..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {description.length}/500
          </div>
        </div>

        {/* Media Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Add Media (Optional)
          </label>
          
          {/* Media Upload Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Photo</span>
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Video className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Video</span>
            </button>

            <button
              onClick={() => audioInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mic className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Audio</span>
            </button>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, 'image')}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, 'video')}
              className="hidden"
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, 'audio')}
              className="hidden"
            />
          </div>

          {/* Media Preview Grid */}
          {mediaFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {mediaFiles.map(media => (
                <div key={media.id} className="relative border border-gray-200 rounded-lg overflow-hidden">
                  {/* Media Preview */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {media.type === 'image' && (
                      <img
                        src={media.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {media.type === 'video' && (
                      <video
                        src={media.preview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    {media.type === 'audio' && (
                      <div className="text-center p-4">
                        <Mic className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <audio src={media.preview} controls className="w-full" />
                      </div>
                    )}
                  </div>

                  {/* Analysis Overlay */}
                  {media.analyzing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="text-xs">Uploading & Analyzing...</span>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis Badge */}
                  {media.analysis && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                        <div className="font-medium mb-1">
                          🤖 {Math.round(media.analysis.confidence * 100)}% confidence
                        </div>
                        <div className="text-xs opacity-75">
                          {media.analysis.description.substring(0, 50)}...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Status */}
                  {media.uploadedUrl && !media.analyzing && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        ✓ Uploaded
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeMediaFile(media.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          {location ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{location.address}</span>
              </div>
              <button
                onClick={() => setLocation(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 w-full"
            >
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">
                {isGettingLocation ? 'Getting location...' : 'Add current location'}
              </span>
              {isGettingLocation && (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin ml-auto" />
              )}
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !description.trim() || mediaFiles.some(f => f.analyzing)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Event...
              </>
            ) : mediaFiles.some(f => f.analyzing) ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Media...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Share Post
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Usage Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>Enhanced Upload:</strong> Files are uploaded and analyzed automatically. 
              The backend AI will analyze your media and create smart incident reports.
              {mediaFiles.some(f => f.analyzing) && (
                <div className="mt-2 text-yellow-700">
                  ⏳ Please wait for media processing to complete before submitting.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}