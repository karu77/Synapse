import { XMarkIcon, InformationCircleIcon, ArrowRightIcon, HeartIcon, LinkIcon, ChartBarIcon, HashtagIcon } from '@heroicons/react/24/outline'

const EdgeInfoPanel = ({ edge, nodes, onClose, panelClassName }) => {
  if (!edge) return null
  
  console.log('EdgeInfoPanel rendering with edge:', edge)
  
  // Detect theme
  const isDarkMode = document.documentElement.classList.contains('dark')
  
  const fromNode = nodes.find((n) => n.id === edge.from || n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.to || n.id === edge.target)

  // Enhanced description with more details
  const getEnhancedDescription = (edge) => {
    let description = edge.description || 'This connection represents a relationship between two entities in the graph.'
    
    // Add contextual information based on edge properties
    if (edge.label) {
      const relationshipDescriptions = {
        'IS_RELATED_TO': 'This indicates a general relationship or association between the connected entities.',
        'WORKS_AT': 'This represents an employment or professional relationship.',
        'LOCATED_IN': 'This indicates a geographical or spatial relationship.',
        'FOUNDED_BY': 'This represents a founding or creation relationship.',
        'PART_OF': 'This indicates that one entity is a component or subset of another.',
        'LEADS_TO': 'This represents a causal or sequential relationship.',
        'DEPENDS_ON': 'This indicates a dependency or requirement relationship.',
        'SIMILAR_TO': 'This represents a similarity or comparison relationship.',
        'OPPOSITE_OF': 'This indicates a contrasting or opposing relationship.',
        'CONTAINS': 'This represents a containment or inclusion relationship.',
        'HAS_BRANCH': 'This indicates a hierarchical branching relationship.',
        'INCLUDES': 'This represents an inclusion or membership relationship.',
        'RESULTS_IN': 'This indicates a cause-and-effect relationship.',
        'INFLUENCES': 'This represents an influence or impact relationship.',
        'COLLABORATES_WITH': 'This indicates a collaborative or partnership relationship.',
        'COMPETES_WITH': 'This represents a competitive relationship.',
        'SUPPORTS': 'This indicates a supportive or reinforcing relationship.',
        'CONTRADICTS': 'This represents a contradictory or conflicting relationship.',
        'PRECEDES': 'This indicates a temporal or sequential relationship.',
        'FOLLOWS': 'This represents a following or consequent relationship.'
      }
      
      const relationshipDescription = relationshipDescriptions[edge.label.toUpperCase()]
      if (relationshipDescription) {
        description = `${description}\n\n${relationshipDescription}`
      }
    }
    
    // Add information about the connection direction
    if (fromNode && toNode) {
      description += `\n\nThis relationship connects "${fromNode.label}" to "${toNode.label}", indicating the flow or direction of the relationship.`
    }
    
    return description
  }

  // Get sentiment color and icon
  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  // Get relationship type icon
  const getRelationshipIcon = (label) => {
    const icons = {
      'IS_RELATED_TO': '🔗',
      'WORKS_AT': '💼',
      'LOCATED_IN': '📍',
      'FOUNDED_BY': '🏗️',
      'PART_OF': '🧩',
      'LEADS_TO': '➡️',
      'DEPENDS_ON': '🔄',
      'SIMILAR_TO': '🔗',
      'OPPOSITE_OF': '⚡',
      'CONTAINS': '📦',
      'HAS_BRANCH': '🌳',
      'INCLUDES': '📋',
      'RESULTS_IN': '🎯',
      'INFLUENCES': '💫',
      'COLLABORATES_WITH': '🤝',
      'COMPETES_WITH': '⚔️',
      'SUPPORTS': '🤲',
      'CONTRADICTS': '❌',
      'PRECEDES': '⏮️',
      'FOLLOWS': '⏭️'
    }
    return icons[label?.toUpperCase()] || '🔗'
  }

  // Get condition icon
  const getConditionIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'yes': return '✅'
      case 'no': return '❌'
      case 'true': return '✅'
      case 'false': return '❌'
      default: return '❓'
    }
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
        flowBg: 'rgba(255, 255, 255, 0.05)',
        flowBorder: 'rgba(59, 130, 246, 0.6)',
        flowText: 'text-blue-300',
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
        flowBg: 'rgba(0, 0, 0, 0.05)',
        flowBorder: 'rgba(234, 179, 8, 0.6)',
        flowText: 'text-yellow-700',
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
            <span className="text-sm">{getRelationshipIcon(edge.label)}</span>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-blue-300' : 'text-yellow-600'}`}>
                Connection
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
          <span className="text-base">{getRelationshipIcon(edge.label)}</span>
          {edge.label || 'Connection'}
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
            {edge.description || `This connection represents a ${edge.label?.toLowerCase() || 'relationship'} between two entities in the graph.`}
          </p>
          
          {/* Connection Flow Visualization */}
          {fromNode && toNode && (
            <div className="mt-2 p-1.5 rounded border-l-2" style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDarkMode ? 'rgba(59, 130, 246, 0.6)' : 'rgba(234, 179, 8, 0.6)'
            }}>
              <div className={`flex items-center justify-between text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-yellow-700'}`}>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="truncate font-semibold text-xs">{fromNode.label}</span>
                </div>
                <div className="flex items-center gap-1 px-1">
                  <ArrowRightIcon className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
                  <span className="truncate font-semibold text-xs">{toNode.label}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Connection Details */}
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
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>From:</span>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium px-1.5 py-0.5 rounded text-xs truncate max-w-[120px]`} style={{
                backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.25)' : 'rgba(209, 213, 219, 0.25)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }} title={fromNode ? fromNode.label : (edge.from || edge.source)}>
                {fromNode ? fromNode.label : (edge.from || edge.source)}
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-lg p-1.5 text-xs" style={{
              background: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.15)',
              border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.25)' : '1px solid rgba(209, 213, 219, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>To:</span>
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium px-1.5 py-0.5 rounded text-xs truncate max-w-[120px]`} style={{
                backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.25)' : 'rgba(209, 213, 219, 0.25)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }} title={toNode ? toNode.label : (edge.to || edge.target)}>
                {toNode ? toNode.label : (edge.to || edge.target)}
              </span>
            </div>
            
            <div className="flex items-center justify-between rounded-lg p-1.5 text-xs" style={{
              background: isDarkMode ? 'rgba(75, 85, 99, 0.15)' : 'rgba(229, 231, 235, 0.15)',
              border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.25)' : '1px solid rgba(209, 213, 219, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}>
              <div className="flex items-center gap-1">
                <LinkIcon className={`h-3 w-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Type:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs">{getRelationshipIcon(edge.label)}</span>
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium px-1.5 py-0.5 rounded text-xs`} style={{
                  backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(234, 179, 8, 0.25)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }} title={edge.label || 'Connected'}>
                  {edge.label || 'Connected'}
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
                <span className="text-xs">{getSentimentIcon(edge.sentiment)}</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  edge.sentiment === 'positive' 
                    ? 'text-green-300' :
                  edge.sentiment === 'negative' 
                    ? 'text-red-300' :
                    (isDarkMode ? 'text-gray-300' : 'text-gray-700')
                }`} style={{
                  backgroundColor: edge.sentiment === 'positive' 
                    ? 'rgba(34, 197, 94, 0.2)' :
                  edge.sentiment === 'negative' 
                    ? 'rgba(239, 68, 68, 0.2)' :
                    (isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)'),
                  border: `1px solid ${
                    edge.sentiment === 'positive' 
                      ? 'rgba(34, 197, 94, 0.3)' :
                    edge.sentiment === 'negative' 
                      ? 'rgba(239, 68, 68, 0.3)' :
                      (isDarkMode ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 0.4)')
                  }`
                }}>
                  {edge.sentiment || 'neutral'}
                </span>
              </div>
            </div>

            {edge.condition && (
              <div className="flex items-center justify-between rounded-md p-2 text-xs" style={{
                background: themeStyles.propertyBg,
                border: themeStyles.propertyBorder
              }}>
                <span className={`font-semibold ${themeStyles.textPrimary}`}>Condition:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm">{getConditionIcon(edge.condition)}</span>
                  <span className={`${themeStyles.textSecondary} font-medium px-2 py-0.5 rounded text-xs`} style={{
                    backgroundColor: themeStyles.propertyValueBg
                  }}>
                    {edge.condition}
                  </span>
                </div>
              </div>
            )}

            {edge.order !== undefined && (
              <div className="flex items-center justify-between rounded-md p-2 text-xs" style={{
                background: themeStyles.propertyBg,
                border: themeStyles.propertyBorder
              }}>
                <span className={`font-semibold ${themeStyles.textPrimary}`}>Order:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'text-white' : 'text-white'} text-xs font-bold flex items-center justify-center`} style={{
                    backgroundColor: themeStyles.levelAccentBg
                  }}>
                    {edge.order}
                  </div>
                </div>
              </div>
            )}

            {edge.id && (
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
                }} title={edge.id}>
                  {edge.id}
                </span>
              </div>
            )}

            {/* Additional properties */}
            {Object.entries(edge).filter(([key]) => 
              !['id', 'from', 'to', 'source', 'target', 'label', 'description', 'sentiment', 'condition', 'order', 'color', 'width', 'dashes', 'arrows', 'smooth', 'font', 'chosen', 'selectionWidth', 'hoverWidth'].includes(key)
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

export default EdgeInfoPanel