const HistoryPanel = ({ history, onSelect, onDelete, onClear }) => {
  if (history.length === 0) {
    return null // Don't render if there's no history
  }

  const getHistoryItemLabel = (item) => {
    const { textInput, audioVideoURL, imageFileName, audioFileName } = item.inputs || {}
    if (textInput) {
      return `Text: "${textInput.substring(0, 30)}..."`
    }
    if (audioVideoURL) {
      return `URL: ${audioVideoURL.substring(0, 30)}...`
    }
    if (imageFileName && audioFileName) {
      return `Files: ${imageFileName}, ${audioFileName}`
    }
    if (imageFileName) {
      return `Image: ${imageFileName}`
    }
    if (audioFileName) {
      return `Audio: ${audioFileName}`
    }
    return 'Graph from Media'
  }

  return (
    <div className="mt-6 pt-6 border-t border-skin-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-skin-text">History</h3>
        <button
          onClick={onClear}
          className="text-sm text-skin-text-muted hover:text-skin-text"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {history.map((item) => (
          <div
            key={item._id}
            className="p-3 rounded-lg bg-skin-bg flex justify-between items-center cursor-pointer hover:bg-skin-border"
            onClick={() => onSelect(item)}
          >
            <span className="text-sm font-medium text-skin-text truncate">
              {getHistoryItemLabel(item)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent onSelect from firing
                onDelete(item._id)
              }}
              className="text-skin-text-muted hover:text-skin-text ml-4"
              aria-label="Delete history item"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryPanel 