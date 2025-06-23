import { XMarkIcon, InformationCircleIcon, TagIcon, HeartIcon, HashtagIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const NodeInfoPanel = ({ node, onClose, panelClassName }) => {
  if (!node) return null

  console.log('NodeInfoPanel rendering with node:', node)
  
  // Detect theme
  const isDarkMode = document.documentElement.classList.contains('dark')

  // Enhanced description with more details
  const getEnhancedDescription = (node) => {
    let description = node.description || 'This entity represents a key concept or object in the graph.'
    
    // Add contextual information based on node type
    const typeDescriptions = {
      'PERSON': 'This represents an individual person, including their roles, relationships, and activities.',
      'ORG': 'This represents an organization, company, or institution with its associated activities and connections.',
      'LOCATION': 'This represents a geographical location, place, or area with its significance and connections.',
      'DATE': 'This represents a specific date, time period, or temporal reference point.',
      'EVENT': 'This represents an occurrence, happening, or significant event with its context and impact.',
      'PRODUCT': 'This represents a product, service, or offering with its features and market presence.',
      'CONCEPT': 'This represents an abstract idea, theory, or conceptual framework.',
      'JOB_TITLE': 'This represents a professional role, position, or occupation.',
      'FIELD_OF_STUDY': 'This represents an academic discipline, area of research, or knowledge domain.',
      'THEORY': 'This represents a theoretical framework, principle, or scientific theory.',
      'ART_WORK': 'This represents a creative work, artistic piece, or cultural artifact.',
      'TOPIC': 'This represents a main subject or theme in a mind map structure.',
      'SUBTOPIC': 'This represents a secondary topic that branches from a main theme.',
      'START_END': 'This represents the beginning or end point of a process or workflow.',
      'PROCESS': 'This represents an action, task, or operation in a workflow.',
      'DECISION': 'This represents a decision point or choice in a process flow.',
      'INPUT_OUTPUT': 'This represents data input or output in a system or process.',
      'DISPLAY': 'This represents information display or presentation.',
      'SUBROUTINE': 'This represents a sub-process or function call.',
      'DATABASE': 'This represents data storage or database operations.',
      'DOCUMENT': 'This represents documentation or file operations.',
      'DELAY': 'This represents a waiting period or delay in a process.',
      'MERGE': 'This represents a merge point where multiple paths converge.',
      'MANUAL_LOOP': 'This represents a manual operation or loop in a process.'
    }
    
    const typeDescription = typeDescriptions[node.type]
    if (typeDescription) {
      description = `${description}\n\n${typeDescription}`
    }
    
    // Add level information for hierarchical diagrams
    if (node.level !== undefined) {
      const levelDescriptions = {
        0: 'This is the central or root element of the diagram.',
        1: 'This is a primary branch or main category.',
        2: 'This is a secondary branch or subcategory.',
        3: 'This is a detailed element or specific item.'
      }
      const levelDesc = levelDescriptions[node.level] || `This is at level ${node.level} in the hierarchy.`
      description += `\n\n${levelDesc}`
    }
    
    return description
  }

  // Get sentiment color and icon
  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400'
      case 'negative': return 'text-red-400'
      default: return 'text-gray-400'
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
      'EVENT': '🎉',
      'PRODUCT': '📦',
      'CONCEPT': '💡',
      'JOB_TITLE': '💼',
      'FIELD_OF_STUDY': '📚',
      'THEORY': '🧠',
      'ART_WORK': '🎨',
      'TOPIC': '🎯',
      'SUBTOPIC': '🔸',
      'START_END': '🔴',
      'PROCESS': '⚙️',
      'DECISION': '❓',
      'INPUT_OUTPUT': '📥',
      'DISPLAY': '📺',
      'SUBROUTINE': '🔧',
      'DATABASE': '🗄️',
      'DOCUMENT': '📄',
      'DELAY': '⏱️',
      'MERGE': '🔄',
      'MANUAL_LOOP': '🔁'
    }
    return icons[type] || '🔹'
  }

  // Theme-based styling
  const getThemeStyles = () => {
    if (isDarkMode) {
      return {
        panelBg: 'rgba(17, 24, 39, 0.85)',
        panelBorder: '1px solid rgba(59, 130, 246, 0.3)',
        headerBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1))',
        headerBorder: 'rgba(59, 130, 246, 0.3)',
        accentColor: 'text-blue-300',
        textPrimary: 'text-white',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400',
        aboutBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.05))',
        aboutBorder: '1px solid rgba(59, 130, 246, 0.2)',
        aboutAccent: 'text-blue-400',
        propertyBg: 'linear-gradient(135deg, rgba(75, 85, 99, 0.3), rgba(55, 65, 81, 0.3))',
        propertyBorder: '1px solid rgba(75, 85, 99, 0.4)',
        propertyValueBg: 'rgba(75, 85, 99, 0.4)',
        typeAccentBg: 'rgba(59, 130, 246, 0.2)',
        levelAccentBg: 'rgba(59, 130, 246, 0.6)',
        hoverBg: 'hover:bg-white/10'
      }
    } else {
      return {
        panelBg: 'rgba(255, 255, 255, 0.85)',
        panelBorder: '1px solid rgba(234, 179, 8, 0.3)',
        headerBg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(202, 138, 4, 0.1))',
        headerBorder: 'rgba(234, 179, 8, 0.3)',
        accentColor: 'text-yellow-600',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-600',
        aboutBg: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(202, 138, 4, 0.05))',
        aboutBorder: '1px solid rgba(234, 179, 8, 0.2)',
        aboutAccent: 'text-yellow-600',
        propertyBg: 'linear-gradient(135deg, rgba(229, 231, 235, 0.3), rgba(209, 213, 219, 0.3))',
        propertyBorder: '1px solid rgba(209, 213, 219, 0.4)',
        propertyValueBg: 'rgba(209, 213, 219, 0.4)',
        typeAccentBg: 'rgba(234, 179, 8, 0.2)',
        levelAccentBg: 'rgba(234, 179, 8, 0.6)',
        hoverBg: 'hover:bg-black/10'
      }
    }
  }

  const themeStyles = getThemeStyles()

  return (
    <div 
      className={`fixed top-1/2 right-4 transform -translate-y-1/2 z-[90] w-64 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl transition-all duration-300 ease-out liquid-glass-panel ${
        panelClassName || ''
      }`}
      style={{ 
        maxHeight: 'calc(100vh - 4rem)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div 
        className="p-2 border-b rounded-t-xl"
        style={{
          borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
          background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(234, 179, 8, 0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">{getTypeIcon(node.type)}</span>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-blue-300' : 'text-yellow-600'}`}>
                {node.type || 'Entity'}
              </span>
            </div>
          </div>
        <button
          onClick={onClose}
            className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} hover:bg-white/10 rounded-full w-6 h-6 flex items-center justify-center transition-all duration-200`}
        >
            <XMarkIcon className="h-4 w-4" />
        </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2">
        <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'} break-words flex items-center gap-2`}>
          <span className="text-base">{getTypeIcon(node.type)}</span>
          {node.label}
        </div>
        
        {/* About Section */}
        <div className={`mb-3 p-2 rounded-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-xs`} style={{
          background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(234, 179, 8, 0.12)',
          border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(234, 179, 8, 0.25)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}>
          <div className="flex items-center gap-1 mb-1">
            <InformationCircleIcon className={`h-3 w-3 ${isDarkMode ? 'text-blue-400' : 'text-yellow-600'}`} />
            <span className={`font-semibold text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About</span>
        </div>
          <p className="leading-relaxed text-xs line-clamp-3">
            {node.description || `This is a ${node.type?.toLowerCase() || 'node'} entity in the graph with various properties and connections.`}
          </p>
        </div>
        
        {/* Node Details */}
        <div className="space-y-1">
          <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-xs font-semibold uppercase tracking-wide mb-1`}>
            <ChartBarIcon className="h-3 w-3" />
            Properties
          </div>
          
          <div className="grid gap-1">
            <div className="flex items-center justify-between rounded-lg p-1.5 text-xs" style={{
              background: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.15)',
              border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.25)' : '1px solid rgba(209, 213, 219, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}>
              <div className="flex items-center gap-1">
                <TagIcon className={`h-3 w-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Type:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">{getTypeIcon(node.type)}</span>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium px-1.5 py-0.5 rounded text-xs`} style={{
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }} title={node.type}>
                  {node.type || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between rounded-lg p-1.5 text-xs" style={{
              background: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.15)',
              border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.25)' : '1px solid rgba(209, 213, 219, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}>
              <div className="flex items-center gap-1">
                <HeartIcon className={`h-3 w-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sentiment:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">{getSentimentIcon(node.sentiment)}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  node.sentiment === 'positive' 
                    ? 'text-green-300' :
                  node.sentiment === 'negative' 
                    ? 'text-red-300' :
                    (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                }`} style={{
                  backgroundColor: node.sentiment === 'positive' 
                    ? 'rgba(34, 197, 94, 0.2)' :
                  node.sentiment === 'negative' 
                    ? 'rgba(239, 68, 68, 0.2)' :
                    (isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)'),
                  border: `1px solid ${
                    node.sentiment === 'positive' 
                      ? 'rgba(34, 197, 94, 0.3)' :
                    node.sentiment === 'negative' 
                      ? 'rgba(239, 68, 68, 0.3)' :
                      (isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)')
                  }`
                }}>
                  {node.sentiment || 'neutral'}
                </span>
              </div>
            </div>

        {node.level !== undefined && (
              <div className="flex items-center justify-between rounded-md p-2 text-xs" style={{
                background: themeStyles.propertyBg,
                border: themeStyles.propertyBorder
              }}>
                <span className={`font-semibold ${themeStyles.textPrimary}`}>Level:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'text-white' : 'text-white'} text-xs font-bold flex items-center justify-center`} style={{
                    backgroundColor: themeStyles.levelAccentBg
                  }}>
                    {node.level}
                  </div>
                </div>
          </div>
        )}

            {node.id && (
              <div className="flex items-center justify-between rounded-md p-2 text-xs" style={{
                background: themeStyles.propertyBg,
                border: themeStyles.propertyBorder
              }}>
                <div className="flex items-center gap-2">
                  <HashtagIcon className={`h-3 w-3 ${themeStyles.textMuted}`} />
                  <span className={`font-semibold ${themeStyles.textPrimary}`}>ID:</span>
                </div>
                <span className={`${themeStyles.textSecondary} font-mono text-xs px-2 py-0.5 rounded truncate max-w-[120px]`} style={{
                  backgroundColor: themeStyles.propertyValueBg
                }} title={node.id}>
                  {node.id}
                </span>
          </div>
        )}

            {/* Additional properties */}
            {Object.entries(node).filter(([key]) => 
              !['id', 'label', 'type', 'description', 'sentiment', 'level', 'color', 'size', 'font', 'shape', 'borderWidth', 'borderWidthSelected', 'chosen', 'fixed', 'physics', 'x', 'y', 'vx', 'vy'].includes(key)
            ).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md p-2 text-xs" style={{
                background: themeStyles.propertyBg,
                border: themeStyles.propertyBorder
              }}>
                <span className={`font-semibold ${themeStyles.textPrimary} capitalize`}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className={`${themeStyles.textSecondary} font-mono text-xs px-2 py-0.5 rounded truncate max-w-[120px]`} style={{
                  backgroundColor: themeStyles.propertyValueBg
                }} title={String(value)}>
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