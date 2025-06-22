import { XMarkIcon, InformationCircleIcon, ArrowRightIcon, HeartIcon, LinkIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const EdgeInfoPanel = ({ edge, nodes, onClose, panelClassName }) => {
  if (!edge) return null
  
  console.log('EdgeInfoPanel rendering with edge:', edge)
  
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
      <div className="p-4 pb-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-750 dark:to-gray-700 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm border-2 border-white dark:border-gray-600"></div>
              <span className="text-xl">{getRelationshipIcon(edge.label)}</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
                Connection
              </span>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                Selected Relationship
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
          <span className="text-2xl">{getRelationshipIcon(edge.label)}</span>
          {edge.label || 'Connection'}
        </div>
        
        {/* Enhanced About Section */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-purple-900/20 border border-green-200 dark:border-green-700/50 text-gray-700 dark:text-gray-200 text-sm">
          <div className="flex items-center gap-2 mb-3">
            <InformationCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-100">About this relationship:</span>
          </div>
          <div className="space-y-3">
            <p className="leading-relaxed whitespace-pre-wrap">
              {getEnhancedDescription(edge)}
            </p>
            
            {/* Connection Flow Visualization */}
            {fromNode && toNode && (
              <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-green-400">
                <div className="flex items-center justify-between text-xs font-medium text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate font-semibold">{fromNode.label}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <ArrowRightIcon className="h-3 w-3" />
                    <span className="text-xs whitespace-nowrap">{edge.label || 'connects to'}</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span className="truncate font-semibold">{toNode.label}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional context based on edge properties */}
            {edge.sentiment && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-purple-400">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Emotional Context: This relationship carries a {edge.sentiment} sentiment, indicating the nature of the connection.
                </span>
              </div>
            )}
            
            {edge.condition && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-gray-800/50 rounded border-l-4 border-yellow-400">
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Conditional Flow: This connection is activated when the condition "{edge.condition}" is met.
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Connection Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-xs font-semibold uppercase tracking-wide mb-3">
            <ChartBarIcon className="h-4 w-4" />
            Connection Properties
          </div>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">From:</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300 text-right flex-1 ml-2 truncate font-medium bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded" title={fromNode ? fromNode.label : (edge.from || edge.source)}>
                {fromNode ? fromNode.label : (edge.from || edge.source)}
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-semibold text-gray-800 dark:text-gray-100">To:</span>
              </div>
              <span className="text-gray-600 dark:text-gray-300 text-right flex-1 ml-2 truncate font-medium bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded" title={toNode ? toNode.label : (edge.to || edge.target)}>
                {toNode ? toNode.label : (edge.to || edge.target)}
              </span>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Relationship:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getRelationshipIcon(edge.label)}</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded" title={edge.label || 'Connected'}>
                  {edge.label || 'Connected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <HeartIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Sentiment:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSentimentIcon(edge.sentiment)}</span>
                <span 
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    edge.sentiment === 'positive' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-700/50' :
                    edge.sentiment === 'negative' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-700/50' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300 border border-gray-200 dark:border-gray-600/50'
                  }`}
                >
                  {edge.sentiment || 'neutral'}
                </span>
              </div>
            </div>

            {edge.condition && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Condition:</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getConditionIcon(edge.condition)}</span>
                  <span className="text-gray-600 dark:text-gray-300 font-medium bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                    {edge.condition}
                  </span>
                </div>
              </div>
            )}

            {edge.order !== undefined && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Execution Order:</span>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                    {edge.order}
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    Step {edge.order}
                  </span>
                </div>
              </div>
            )}

            {edge.id && (
              <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3 text-sm border border-gray-200 dark:border-gray-600">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Identifier:</span>
                <span className="text-gray-600 dark:text-gray-300 text-right flex-1 ml-2 truncate font-mono text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded" title={edge.id}>
                  {edge.id}
                </span>
              </div>
            )}

            {/* Additional properties with enhanced styling */}
            {Object.entries(edge).filter(([key]) => 
              !['id', 'from', 'to', 'source', 'target', 'label', 'description', 'sentiment', 'condition', 'order', 'color', 'width', 'dashes', 'arrows', 'smooth', 'font', 'chosen', 'selectionWidth', 'hoverWidth'].includes(key)
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

export default EdgeInfoPanel