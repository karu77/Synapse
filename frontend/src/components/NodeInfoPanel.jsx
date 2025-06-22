import { XMarkIcon, InformationCircleIcon, TagIcon, HeartIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const NodeInfoPanel = ({ node, onClose, panelClassName }) => {
  console.log('NodeInfoPanel rendering with node:', node)
  
  if (!node) return null

  // Enhanced description with more details
  const getEnhancedDescription = (node) => {
    let description = node.description || 'No description available for this entity.'
    
    // Add contextual information based on node type
    const typeDescriptions = {
      'PERSON': 'This represents an individual person mentioned in the content.',
      'ORG': 'This represents an organization, company, or institution.',
      'LOCATION': 'This represents a geographical location or place.',
      'DATE': 'This represents a specific date or time period.',
      'EVENT': 'This represents an event, occurrence, or happening.',
      'PRODUCT': 'This represents a product, service, or offering.',
      'CONCEPT': 'This represents an abstract concept or idea.',
      'JOB_TITLE': 'This represents a professional role or position.',
      'FIELD_OF_STUDY': 'This represents an academic or professional field.',
      'THEORY': 'This represents a scientific or academic theory.',
      'ART_WORK': 'This represents a creative work or artistic piece.',
      'TOPIC': 'This represents a main topic or subject area.',
      'SUBTOPIC': 'This represents a subtopic or subdivision of a larger subject.',
      'START_END': 'This represents the beginning or end of a process.',
      'PROCESS': 'This represents a step or action in a workflow.',
      'DECISION': 'This represents a decision point or choice in the process.',
      'INPUT_OUTPUT': 'This represents data input or output in the system.',
      'CONNECTOR': 'This represents a connection or flow between elements.',
      'DOCUMENT': 'This represents a document or file in the process.',
      'DELAY': 'This represents a waiting period or delay in the process.',
      'MERGE': 'This represents a merging point where multiple flows combine.',
      'SUBROUTINE': 'This represents a subprocess or subroutine call.',
      'MANUAL_LOOP': 'This represents a manual operation or loop.',
      'DATABASE': 'This represents a data storage or database operation.',
      'DISPLAY': 'This represents a display or output operation.'
    }
    
    const typeDescription = typeDescriptions[node.type]
    if (typeDescription && description === 'No description available for this entity.') {
      description = typeDescription
    } else if (typeDescription) {
      description = `${description}\n\n${typeDescription}`
    }
    
    return description
  }

  // Get sentiment color and icon
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400'
      case 'negative': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  // Get type icon
  const getTypeIcon = (type) => {
    const icons = {
      'PERSON': '👤',
      'ORG': '🏢',
      'LOCATION': '📍',
      'DATE': '📅',
      'EVENT': '🎯',
      'PRODUCT': '📦',
      'CONCEPT': '💡',
      'JOB_TITLE': '💼',
      'FIELD_OF_STUDY': '📚',
      'THEORY': '🧠',
      'ART_WORK': '🎨',
      'TOPIC': '📋',
      'SUBTOPIC': '📄',
      'START_END': '🔘',
      'PROCESS': '⚙️',
      'DECISION': '❓',
      'INPUT_OUTPUT': '📥',
      'CONNECTOR': '🔗',
      'DOCUMENT': '📄',
      'DELAY': '⏱️',
      'MERGE': '🔀',
      'SUBROUTINE': '🔧',
      'MANUAL_LOOP': '🔄',
      'DATABASE': '🗄️',
      'DISPLAY': '🖥️'
    }
    return icons[type] || '🔍'
  }

  return (
    <div
      className={`fixed top-1/2 right-4 transform -translate-y-1/2 z-[90] w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl ${
        panelClassName || ''
      }`}
      style={{
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto'
      }}
    >
      {/* Enhanced Header */}
      <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-750 dark:to-gray-700 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full shadow-sm border-2 border-white dark:border-gray-600"
                style={{
                  backgroundColor: node.color || '#8b5cf6'
                }}
              ></div>
              <span className="text-xl">{getTypeIcon(node.type)}</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
                {node.type || 'Node'}
              </span>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 flex items-center gap-1">
                <InformationCircleIcon className="h-3 w-3" />
                Selected Entity
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <div className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100 break-words flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(node.type)}</span>
          {node.label}
        </div>
        
        {/* Enhanced About Section */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-blue-200 dark:border-blue-700/50 text-gray-700 dark:text-gray-200 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-100">About this entity:</span>
          </div>
          <div className="space-y-3">
            <p className="leading-relaxed whitespace-pre-wrap">
              {getEnhancedDescription(node)}
            </p>
            
            {/* Additional context based on node properties */}
            {node.level !== undefined && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-blue-400">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Hierarchy Level: {node.level} 
                  {node.level === 0 && ' (Central/Root)'}
                  {node.level === 1 && ' (Primary Branch)'}
                  {node.level === 2 && ' (Secondary Branch)'}
                  {node.level >= 3 && ' (Detail Level)'}
                </span>
              </div>
            )}
            
            {node.sentiment && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-purple-400">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Emotional Context: This entity carries a {node.sentiment} sentiment in the content.
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Node Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wide mb-3">
            <ChartBarIcon className="h-4 w-4" />
            Entity Properties
          </div>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Type:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{getTypeIcon(node.type)}</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {node.type || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <span className="font-semibold text-gray-800 dark:text-gray-100">Identifier:</span>
              <span className="text-gray-600 dark:text-gray-300 text-right flex-1 ml-2 truncate font-mono text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded" title={node.id}>
                {node.id}
              </span>
            </div>
            
            {node.sentiment && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <HeartIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100">Sentiment:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSentimentIcon(node.sentiment)}</span>
                  <span 
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      node.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700/50' :
                      node.sentiment === 'negative' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700/50' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50'
                    }`}
                  >
                    {node.sentiment}
                  </span>
                </div>
              </div>
            )}

            {node.level !== undefined && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Hierarchy Level:</span>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: Math.max(1, node.level + 1) }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full mr-1 ${
                          i <= node.level ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Level {node.level}
                  </span>
                </div>
              </div>
            )}

            {/* Additional properties with enhanced styling */}
            {Object.entries(node).filter(([key]) => 
              !['id', 'label', 'type', 'description', 'sentiment', 'level', 'color', 'x', 'y', 'vx', 'vy', 'fx', 'fy', 'shape', 'size', 'font', 'chosen', 'margin', 'borderWidth', 'borderWidthSelected', 'shapeProperties'].includes(key)
            ).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="text-gray-600 dark:text-gray-300 text-right flex-1 ml-2 truncate bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs" title={String(value)}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NodeInfoPanel