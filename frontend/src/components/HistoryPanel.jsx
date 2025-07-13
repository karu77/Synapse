import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const HistoryPanel = ({ history = [], onSelect, onDelete, onClear }) => {
  // PATCH: Always use lowercase for filter value
  const [filter, setFilterRaw] = useState('all')
  const setFilter = (val) => setFilterRaw((val || '').toLowerCase())
  
  // Ensure history is always an array and handle empty state
  const safeHistory = Array.isArray(history) ? history : []

  const getHistoryItemLabel = (item) => {
    if (item.name && item.name.trim()) {
      return item.name
    }
    const { textInput, question, imageFileName, audioFileName, answer } = item.inputs || {}
    if (question) {
      const label = answer
        ? `A: ${answer.substring(0, 25)}...`
        : `Q: ${question.substring(0, 30)}...`
      return label
    }
    if (textInput) {
      return `Text: "${textInput.substring(0, 30)}..."`
    }
    if (imageFileName) {
      return `Image: "${imageFileName}"`
    }
    if (audioFileName) {
      return `Media: "${audioFileName}"`
    }
    return 'Graph'
  }

  const getBaseDiagramType = (typeString) => {
    if (!typeString || typeof typeString !== 'string' || !typeString.trim()) return 'knowledge-graph'
    if (typeString.startsWith('knowledge-graph')) return 'knowledge-graph'
    return typeString.split('-')[0]
  }

  const getDiagramTypeIcon = (diagramType) => {
    switch (getBaseDiagramType(diagramType)) {
      case 'flowchart':
        return '📊'
      case 'mindmap':
        return '🧠'
      case 'knowledge-graph':
      default:
        return '🕸️'
    }
  }

  const getDiagramTypeLabel = (diagramType) => {
    switch (getBaseDiagramType(diagramType)) {
      case 'flowchart':
        return 'Flowchart'
      case 'mindmap':
        return 'Mind Map'
      case 'knowledge-graph':
      default:
        return 'Knowledge Graph'
    }
  }

  // PATCH: Log the filter value
  console.log('Current filter value:', filter)

  // PATCH: Robust filter for knowledge-graph
  const filteredHistory = safeHistory.filter(item => {
    if (filter === 'all') return true;
    let itemType = item.inputs?.diagramType || item.graphData?.diagramType || 'knowledge-graph';
    if (!itemType || typeof itemType !== 'string' || !itemType.trim()) itemType = 'knowledge-graph';
    return getBaseDiagramType(itemType) === filter;
  });
  console.log('Filtered history for', filter, filteredHistory);

  const FilterButton = ({ type, label, icon }) => (
    <button
      onClick={() => setFilter(type)}
      className={`flex-1 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
        filter === type.toLowerCase()
          ? 'bg-skin-accent text-white shadow-sm'
          : 'bg-skin-bg text-skin-text-muted hover:bg-skin-border'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-skin-text">History</h3>
        <button
          onClick={onClear}
          className="text-sm font-semibold text-skin-text-muted hover:text-skin-text transition-colors flex items-center gap-1"
        >
          <TrashIcon className="h-4 w-4" />
          Clear All
        </button>
      </div>

      <div className="flex gap-1.5 p-1 bg-skin-bg-accent rounded-xl border border-skin-border">
        <FilterButton type="all" label="All" icon="📂" />
        <FilterButton type="knowledge-graph" label="Graphs" icon="🕸️" />
        <FilterButton type="mindmap" label="Maps" icon="🧠" />
        <FilterButton type="flowchart" label="Flows" icon="📊" />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => {
            const diagramType = item.inputs?.diagramType || item.graphData?.diagramType || 'knowledge-graph'
            return (
              <div
                key={item._id}
                className="p-3 rounded-lg bg-skin-bg flex justify-between items-center group cursor-pointer hover:bg-skin-border transition-colors duration-200"
                onClick={() => onSelect(item)}
              >
                <div className="flex items-center space-x-3 flex-grow min-w-0">
                  <div className="flex-shrink-0 text-lg">
                    {getDiagramTypeIcon(diagramType)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div
                      className="text-sm font-medium text-skin-text truncate"
                      style={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                      title={getHistoryItemLabel(item)}
                    >
                      {getHistoryItemLabel(item)}
                    </div>
                    <div className="text-xs text-skin-text-muted">
                      {getDiagramTypeLabel(diagramType)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation() // Prevent onSelect from firing
                    onDelete(item._id)
                  }}
                  className="text-skin-text-muted hover:text-red-500 ml-4 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Delete history item"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )
          })
        ) : (
          <div className="mt-4 text-center text-sm text-skin-text-muted py-4">
            No history items match this filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryPanel