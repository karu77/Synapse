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
        {label} <span className="text-skin-text-muted">(Optional)</span>
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
  const [audioVideoURL, setAudioVideoURL] = useState('')

  const handleURLChange = (e) => {
    setAudioVideoURL(e.target.value)
    if (e.target.value !== '') {
      setAudioFile(null) // Clear file input if URL is being used
    }
  }

  const handleFileChange = (file) => {
    setAudioFile(file)
    if (file !== null) {
      setAudioVideoURL('') // Clear URL input if file is being used
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

  const hasInput =
    text.trim() !== '' ||
    question.trim() !== '' ||
    imageFile !== null ||
    audioFile !== null ||
    audioVideoURL.trim() !== ''

  const handleSubmit = async () => {
    if (!hasInput) return
    await onSubmit(text, question, imageFile, audioFile, audioVideoURL)
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
          disabled={isProcessing || text !== '' || imageFile !== null || audioFile !== null || audioVideoURL !== ''}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileInput
          label="Image File"
          accept="image/*"
          onFileChange={setImageFile}
          disabled={isProcessing || question !== ''}
        />
        {/* Audio/Video Input Section */}
        <div className="space-y-2">
          <FileInput
            label="Audio/Video File"
            accept="audio/*,video/*"
            onFileChange={handleFileChange}
            disabled={isProcessing || audioVideoURL !== '' || question !== ''}
          />
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-skin-border"></div>
            <span className="flex-shrink mx-2 text-skin-text-muted text-xs">OR</span>
            <div className="flex-grow border-t border-skin-border"></div>
          </div>
          <input
            type="text"
            placeholder="Paste Audio/Video URL..."
            value={audioVideoURL}
            onChange={handleURLChange}
            disabled={isProcessing || audioFile !== null || question !== ''}
            className={`block w-full text-left rounded-lg border shadow-sm text-sm p-2 ${
              isProcessing || audioFile !== null || question !== ''
                ? 'bg-skin-bg border-skin-border text-skin-text-muted cursor-not-allowed'
                : 'bg-skin-bg-accent border-skin-border focus:border-skin-btn-primary focus:ring-skin-btn-primary text-skin-text'
            }`}
          />
          <div className="text-center text-xs text-skin-text-muted p-2 bg-skin-bg rounded-lg">
            Note: The URL feature may not work on deployed servers. For best results, upload the file directly.
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing || !hasInput}
          className={`inline-flex justify-center rounded-lg border border-transparent px-6 py-2 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
            isProcessing || !hasInput
              ? 'bg-skin-border text-skin-text-muted cursor-not-allowed'
              : 'bg-skin-btn-primary text-skin-btn-primary-text hover:opacity-90 focus:ring-skin-btn-primary'
          }`}
        >
          {isProcessing ? 'Generating...' : 'Generate Graph'}
        </button>
      </div>
    </div>
  )
}

export default TextInput 