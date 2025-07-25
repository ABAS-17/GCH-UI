'use client'

interface SuggestedPromptsProps {
  prompts: string[]
  onPromptClick: (prompt: string) => void
}

export default function SuggestedPrompts({ prompts, onPromptClick }: SuggestedPromptsProps) {
  if (!prompts || prompts.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptClick(prompt)}
          className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-2 rounded-full text-sm transition-colors duration-200 border border-primary-200"
        >
          {prompt}
        </button>
      ))}
    </div>
  )
}
