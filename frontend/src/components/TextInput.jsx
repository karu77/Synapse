import { useState, useRef, useEffect } from 'react'

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
    console.log('File input button clicked!')
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
        className={`mt-1 block w-full text-left rounded-lg border shadow-sm text-sm p-2 truncate pointer-events-auto ${
          disabled
            ? 'bg-skin-bg border-skin-border text-skin-text-muted cursor-not-allowed'
            : 'bg-skin-bg-accent border-skin-border focus:border-skin-accent focus:ring-skin-accent text-skin-text'
        }`}
      >
        {fileName || 'Choose a file...'}
      </button>
    </div>
  )
}

const TextInput = ({ onSubmit, isProcessing, onDiagramTypeChange, currentDiagramType }) => {
  const [inputValue, setInputValue] = useState('')
  const [processDescription, setProcessDescription] = useState('')
  const [code, setCode] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [diagramType, setDiagramType] = useState(currentDiagramType || 'knowledge-graph')
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [inputType, setInputType] = useState('text')
  const [mindmapType, setMindmapType] = useState('traditional')

  useEffect(() => {
    if (currentDiagramType) {
      setDiagramType(currentDiagramType);
    }
  }, [currentDiagramType]);

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

  const handleDocumentFileChange = (file) => {
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid document file (PDF, Word, or text file).')
        return
      }
      
      // Check file size (20MB limit for documents)
      if (file.size > 20 * 1024 * 1024) {
        setError('Document file size should not exceed 20MB.')
        return
      }
      
      setDocumentFile(file)
      setError(null)
    } else {
      setDocumentFile(null)
    }
  }

  const handleInputValueChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleProcessDescriptionChange = (e) => {
    setProcessDescription(e.target.value);
    if (e.target.value !== '') {
      setCode('');
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value)
    if (e.target.value !== '') {
      setProcessDescription('')
    }
  }

  const handleDiagramTypeChange = (newDiagramType) => {
    console.log('Diagram type changed to:', newDiagramType)
    setDiagramType(newDiagramType)
    // Clear code input when switching away from flowchart
    if (newDiagramType !== 'flowchart') {
      setCode('')
    }
    // Immediately notify parent component about the change
    if (onDiagramTypeChange) {
      onDiagramTypeChange(newDiagramType)
    }
  }

  // Helper to determine if any input is present
  const hasInput =
    !!inputValue?.trim() ||
    !!processDescription?.trim() ||
    !!code?.trim() ||
    !!imageFile ||
    !!audioFile ||
    !!documentFile ||
    (typeof imageUrl === 'string' && imageUrl.trim().length > 0) ||
    (typeof audioUrl === 'string' && audioUrl.trim().length > 0)

  const handleSubmit = async () => {
    if (!hasInput) {
      alert('Please provide some input before submitting.')
      return
    }

    const effectiveDiagramType = diagramType === 'mindmap' ? `${diagramType}-${mindmapType}` : diagramType

    let textToSend = ''
    let questionToSend = ''

    if (inputType === 'question') {
      questionToSend = inputValue
    } else { // inputType === 'text'
      if (diagramType === 'flowchart') {
        textToSend = processDescription || code
      } else {
        textToSend = inputValue
      }
    }
    
    await onSubmit(textToSend, questionToSend, imageFile, audioFile, documentFile, imageUrl, audioUrl, effectiveDiagramType)
  }

  const getDiagramDescription = (type) => {
    switch (type) {
      case 'knowledge-graph':
        return 'Explore entities and their relationships in an interconnected network'
      case 'flowchart':
        return 'Visualize processes, code logic, decisions, and workflows step-by-step'
      case 'mindmap':
        return 'Organize ideas hierarchically around a central topic'
      default:
        return ''
    }
  }

  const getMindmapTypeDescription = (type) => {
    const descriptions = {
      traditional: 'Classic hierarchical structure with a central topic and branching subtopics.',
      radial: 'Central concept with themes radiating outward in all directions.',
      organizational: 'Top-down structure, ideal for org charts and hierarchies.',
      'concept-map': 'Web of concepts with explicit relationships, showing how ideas connect.',
      timeline: 'Chronological layout for visualizing events or processes over time.',
    }
    return descriptions[type] || 'Select a mind map type.'
  }

  const mindmapTypes = [
    { id: 'traditional', name: 'Traditional (Classic)' },
    { id: 'radial', name: 'Radial Structure' },
    { id: 'organizational', name: 'Organizational Chart' },
    { id: 'concept-map', name: 'Concept Map' },
    { id: 'timeline', name: 'Timeline' },
  ]

  // Update selectedMindmapType if it's no longer valid
  useEffect(() => {
    if (currentDiagramType) {
      setDiagramType(currentDiagramType);
    }
  }, [currentDiagramType]);

  return (
    <div className="space-y-6 pointer-events-auto">
      <div>
        <label className="block text-base font-semibold text-skin-text mb-3">
          Diagram Type
        </label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'knowledge-graph', label: 'Knowledge Graph', icon: '🕸️' },
            { value: 'flowchart', label: 'Flowchart', icon: '📊' },
            { value: 'mindmap', label: 'Mind Map', icon: '🧠' },
          ].map((option) => (
            <div key={option.value} className="relative">
              <input
                type="radio"
                id={option.value}
                name="diagramType"
                value={option.value}
                checked={diagramType === option.value}
                onChange={(e) => handleDiagramTypeChange(e.target.value)}
                disabled={isProcessing}
                className="sr-only"
              />
              <label
                htmlFor={option.value}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all pointer-events-auto ${
                  diagramType === option.value
                    ? 'border-skin-accent bg-skin-accent/10'
                    : 'border-skin-border bg-skin-bg-accent hover:border-skin-accent/50'
                } ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="text-2xl mr-3">{option.icon}</span>
                <div className="flex-grow">
                  <div className="text-sm font-semibold text-skin-text">
                    {option.label}
                  </div>
                  <div className="text-xs text-skin-text-muted">
                    {getDiagramDescription(option.value)}
                  </div>
                </div>
                {diagramType === option.value && (
                  <div className="w-4 h-4 rounded-full bg-skin-accent flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Mind Map Type Selection - only show when mindmap is selected */}
      {diagramType === 'mindmap' && (
        <div>
          <label className="block text-sm font-medium text-skin-text mb-2">
            Mind Map Structure
          </label>
          <select
            value={mindmapType}
            onChange={(e) => setMindmapType(e.target.value)}
            className="w-full p-3 border border-skin-border rounded-lg bg-skin-bg text-skin-text focus:outline-none focus:ring-2 focus:ring-skin-accent"
          >
            {mindmapTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-skin-text-muted mt-1">
            {getMindmapTypeDescription(mindmapType)}
          </p>
        </div>
      )}

      {/* Input Type Selection */}
      <div>
        <label className="block text-base font-semibold text-skin-text mb-2">
          Input Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setInputType('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === 'text'
                ? 'bg-skin-accent text-white'
                : 'bg-skin-border text-skin-text hover:bg-skin-accent/20'
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setInputType('question')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === 'question'
                ? 'bg-skin-accent text-white'
                : 'bg-skin-border text-skin-text hover:bg-skin-accent/20'
            }`}
          >
            Question
          </button>
        </div>
      </div>

      {/* Conditional Inputs */}
      {inputType === 'question' ? (
        <div>
          <label htmlFor="input-value" className="block text-base font-semibold text-skin-text mb-1">
            Ask a Question
          </label>
          <textarea
            id="input-value"
            rows={6}
            className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-accent focus:ring-skin-accent text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical pointer-events-auto"
            placeholder={`e.g., How does photosynthesis work?`}
            value={inputValue}
            onChange={handleInputValueChange}
            disabled={isProcessing}
          />
        </div>
      ) : (
        <>
          {diagramType === 'flowchart' ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="text" className="block text-base font-semibold text-skin-text mb-1">
                  Describe a Process or Workflow
                </label>
                <textarea
                  id="text"
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-accent focus:ring-skin-accent text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical pointer-events-auto"
                  placeholder="Describe a process, workflow, or procedure (e.g., 'How to make coffee', 'User registration process', etc.)..."
                  value={processDescription}
                  onChange={handleProcessDescriptionChange}
                  disabled={isProcessing || code !== ''}
                />
              </div>
              
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-skin-border"></div>
                <span className="flex-shrink mx-4 text-skin-text-muted font-semibold text-sm">OR</span>
                <div className="flex-grow border-t border-skin-border"></div>
              </div>

              <div>
                <label htmlFor="code" className="block text-base font-semibold text-skin-text mb-1">
                  Paste Your Code
                </label>
                <textarea
                  id="code"
                  rows={6}
                  className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-accent focus:ring-skin-accent text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical font-mono pointer-events-auto"
                  placeholder="Paste your code here to generate a flowchart (supports Python, JavaScript, Java, C++, etc.)..."
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isProcessing || processDescription !== ''}
                />
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="input-value" className="block text-base font-semibold text-skin-text mb-1">
                Analyze Text & Files
              </label>
              <textarea
                id="input-value"
                rows={6}
                className="mt-1 block w-full rounded-lg border border-skin-border shadow-sm focus:border-skin-accent focus:ring-skin-accent text-base p-3 bg-skin-bg-accent text-skin-text resize-vertical pointer-events-auto"
                placeholder="Paste text here, or provide an image/audio file below..."
                value={inputValue}
                onChange={handleInputValueChange}
                disabled={isProcessing}
              />
            </div>
          )}
        </>
      )}

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
            className="mt-2 block w-full rounded-lg border border-skin-border shadow-sm text-sm p-2 bg-skin-bg-accent text-skin-text pointer-events-auto"
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
            className="mt-2 block w-full rounded-lg border border-skin-border shadow-sm text-sm p-2 bg-skin-bg-accent text-skin-text pointer-events-auto"
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

      {/* Document Upload Section */}
      <div className={isProcessing ? 'file-input-disabled' : ''}>
        <FileInput
          id="document-upload"
          label="Document File (PDF, Word, Text)"
          accept=".pdf,.doc,.docx,.txt,.md,.csv"
          onFileChange={handleDocumentFileChange}
          disabled={isProcessing}
        />
        <div className="text-xs text-skin-text-muted mt-1">
          Upload PDF, Word documents, or text files to extract content and generate graphs. Max 20MB.
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing || !hasInput}
          className={`inline-flex justify-center rounded-lg border border-transparent px-6 py-2 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform pointer-events-auto
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
          ) : `Generate ${diagramType === 'knowledge-graph' ? 'Graph' : diagramType === 'flowchart' ? 'Flowchart' : 'Mind Map'}`}
        </button>
      </div>

      {/* Modern input focus and panel animation styles */}
      <style>{`
        .file-input-disabled {
          pointer-events: none;
          opacity: 0.6;
        }
        textarea:focus, input[type='url']:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 2px var(--color-accent);
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