import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

const HistoryPanel = ({ history = [], onSelect, onDelete, onClear }) => {
  // Ensure history is always an array and handle empty state
  const safeHistory = Array.isArray(history) ? history : [];

  if (!safeHistory || safeHistory.length === 0) {
    return (
      <div className="mt-4 text-center text-sm text-skin-text-muted">
        Your generated graphs will appear here.
      </div>
    )
  }

  const getHistoryItemLabel = (item) => {
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

  const getDiagramTypeIcon = (diagramType) => {
    switch (diagramType) {
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
    switch (diagramType) {
      case 'flowchart':
        return 'Flowchart'
      case 'mindmap':
        return 'Mind Map'
      case 'knowledge-graph':
      default:
        return 'Knowledge Graph'
    }
  }

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
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {history.map((item) => {
          const diagramType = item.inputs?.diagramType || item.graphData?.diagramType || 'knowledge-graph'
          return (
            <div
              key={item._id}
              className="p-3 rounded-lg bg-skin-bg flex justify-between items-center group cursor-pointer hover:bg-skin-border transition-colors duration-200"
              onClick={() => onSelect(item)}
            >
              <div className="flex items-center space-x-3 flex-grow">
                <div className="flex-shrink-0 text-lg">
                  {getDiagramTypeIcon(diagramType)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium text-skin-text truncate">
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
        })}
      </div>
    </div>
  )
}

export default HistoryPanel