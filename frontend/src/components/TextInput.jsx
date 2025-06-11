import { useState, useRef } from 'react'

const FileInput = ({ label, accept, onFileChange, disabled }) => {
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      onFileChange(file)
    } else {
      setFileName('')
      onFileChange(null)
    }
  }

  const handleButtonClick = () => {
    inputRef.current.click()
  }

  return (
    <div>
      <label className="block text-sm font-medium text-skin-text mb-1">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        ref={inputRef}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`mt-1 block w-full text-left rounded-lg border shadow-sm text-sm p-2 truncate ${
          disabled
            ? 'bg-skin-bg border-skin-border text-skin-text-muted cursor-not-allowed'
            : 'bg-skin-bg-accent border-skin-border focus:border-skin-btn-primary focus:ring-skin-btn-primary text-skin-text'
        }`}
      >
        {fileName || 'Choose a file...'}
      </button>
    </div>
  )
}

const TextInput = ({ onSubmit, isProcessing }) => {
  const [text, setText] = useState('')
  const [question, setQuestion] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [error, setError] = useState(null)

  // Add separate handlers for image and audio/video
  const handleImageFileChange = (file) => {
    setImageFile(file)
  }

  const handleAudioFileChange = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Audio/Video file size should not exceed 10MB.')
        return
      }
      setAudioFile(file)
      setError(null)
    } else {
      setAudioFile(null)
    }
  }

  const handleTextChange = (e) => {
    setText(e.target.value)
    if (e.target.value !== '') {
      setQuestion('')
    }
  }

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value)
    if (e.target.value !== '') {
      setText('')
    }
  }

  // Helper to determine if any input is present
  const hasInput =
    !!text?.trim() ||
    !!question?.trim() ||
    !!imageFile ||
    !!audioFile ||
    (typeof imageUrl === 'string' && imageUrl.trim().length > 0) ||
    (typeof audioUrl === 'string' && audioUrl.trim().length > 0)

  const handleSubmit = async () => {
    if (!hasInput) return
    await onSubmit(text, question, imageFile, audioFile, imageUrl, audioUrl)
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="text" className="block text-base font-semibold text-skin-text mb-1">
          Analyze Text & Files
        </label>
        <textarea
          id="text"
          rows={6}
          className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-btn-primary focus:ring-skin-btn-primary text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical"
          placeholder="Paste text here, or provide an image/audio file below..."
          value={text}
          onChange={handleTextChange}
          disabled={isProcessing || question !== ''}
        />
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-skin-border"></div>
        <span className="flex-shrink mx-4 text-skin-text-muted font-semibold">OR</span>
        <div className="flex-grow border-t border-skin-border"></div>
      </div>

      <div>
        <label htmlFor="question" className="block text-base font-semibold text-skin-text mb-1">
          Ask a Question
        </label>
        <textarea
          id="question"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-btn-primary focus:ring-skin-btn-primary text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical"
          placeholder="e.g., What is the powerhouse of the cell?"
          value={question}
          onChange={handleQuestionChange}
          disabled={isProcessing || text !== '' || imageFile !== null || audioFile !== null}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={isProcessing ? 'file-input-disabled' : ''}>
          <FileInput
            id="image-upload"
            label="Image File"
            accept="image/*"
            onFileChange={handleImageFileChange}
            disabled={isProcessing}
          />
          <input
            type="url"
            placeholder="Paste image URL..."
            className="mt-2 block w-full rounded-lg border border-skin-border shadow-sm text-sm p-2 bg-skin-bg-accent text-skin-text"
            onChange={e => {
              const url = e.target.value;
              setImageUrl(url);
              if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com\/.*\/videos\//i.test(url)) {
                alert('Only direct links to image files are supported. YouTube and other streaming/video platform URLs will not work.');
              }
            }}
            disabled={isProcessing}
          />
          <div className="text-xs text-skin-text-muted mt-1">
            Only direct links to image files are supported. YouTube and other streaming/video platform URLs will not work.
          </div>
        </div>
        <div className={isProcessing ? 'file-input-disabled' : ''}>
          <FileInput
            id="audio-upload"
            label="Audio/Video File"
            accept="audio/*,video/*"
            onFileChange={handleAudioFileChange}
            disabled={isProcessing}
          />
          <input
            type="url"
            placeholder="Paste audio/video URL..."
            className="mt-2 block w-full rounded-lg border border-skin-border shadow-sm text-sm p-2 bg-skin-bg-accent text-skin-text"
            onChange={e => {
              const url = e.target.value;
              setAudioUrl(url);
              if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|facebook\.com\/.*\/videos\//i.test(url)) {
                alert('Only direct links to audio/video files are supported. YouTube and other streaming/video platform URLs will not work.');
              }
            }}
            disabled={isProcessing}
          />
          <div className="text-xs text-skin-text-muted mt-1">
            Only direct links to audio/video files are supported. YouTube and other streaming/video platform URLs will not work.
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing || !hasInput}
          className={`inline-flex justify-center rounded-lg border border-transparent px-6 py-2 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform
            ${isProcessing || !hasInput
              ? 'bg-skin-border text-skin-text-muted cursor-not-allowed scale-100'
              : 'bg-skin-btn-primary text-skin-btn-primary-text hover:opacity-90 hover:scale-105 focus:ring-skin-btn-primary'}
          `}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
              Generating...
            </span>
          ) : 'Generate Graph'}
        </button>
      </div>

      {/* Modern input focus and panel animation styles */}
      <style>{`
        .file-input-disabled {
          pointer-events: none;
          opacity: 0.6;
        }
        textarea:focus, input[type='url']:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px #6366f1;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        button:active:not(:disabled) {
          transform: scale(0.97);
          transition: transform 0.1s;
        }
      `}</style>
    </div>
  )
}

export default TextInput