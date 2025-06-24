import { XMarkIcon, InformationCircleIcon, TagIcon, HeartIcon, HashtagIcon, ChartBarIcon, CubeTransparentIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

const panelVariants = {
  hidden: { opacity: 0, x: '100%' },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 250 },
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
}

const NodeInfoPanel = ({ node, onClose }) => {
  if (!node) return null

  const getTypeIcon = (type) => {
    const icons = {
      'PERSON': '👤', 'ORG': '🏢', 'LOCATION': '📍', 'DATE': '📅', 'EVENT': '🎉',
      'PRODUCT': '📦', 'CONCEPT': '💡', 'JOB_TITLE': '💼', 'FIELD_OF_STUDY': '📚',
      'THEORY': '🧠', 'ART_WORK': '🎨', 'TOPIC': '🎯', 'SUBTOPIC': '🔸',
      'START_END': '🔴', 'PROCESS': '⚙️', 'DECISION': '❓', 'INPUT_OUTPUT': '📥',
      'DISPLAY': '📺', 'SUBROUTINE': '🔧', 'DATABASE': '🗄️', 'DOCUMENT': '📄',
      'DELAY': '⏱️', 'MERGE': '🔄', 'MANUAL_LOOP': '🔁'
    }
    return icons[type?.toUpperCase()] || '🔹'
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const renderProperty = (Icon, label, value, valueClassName = '', title = '') => {
    if (value === null || value === undefined || value === '') return null
    return (
      <div className="flex justify-between items-center bg-skin-bg/50 dark:bg-skin-bg/30 p-2 rounded-lg">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="h-4 w-4 text-skin-text-muted flex-shrink-0" />
          <span className="font-medium text-skin-text text-sm truncate" title={label}>{label}</span>
        </div>
        <span
          className={`text-sm font-semibold text-skin-text-muted truncate max-w-[150px] ${valueClassName}`}
          title={title || String(value)}
        >
          {String(value)}
        </span>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key="node-info-panel"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed top-24 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]"
        >
          <div className="p-5 bg-skin-bg-accent/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-skin-border">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(node.type)}</span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-skin-accent -mb-1">
                    {node.type || 'Entity'}
                  </p>
                  <h3 className="text-lg font-bold text-skin-text break-words">
                    {node.label}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text transition-colors flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
              {/* Description */}
              {node.description && (
                <div className="p-3 bg-skin-bg/50 dark:bg-skin-bg/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <InformationCircleIcon className="h-5 w-5 text-skin-accent" />
                    <h4 className="font-semibold text-skin-text">About</h4>
                  </div>
                  <p className="text-sm text-skin-text-muted whitespace-pre-wrap">
                    {node.description}
                  </p>
                </div>
              )}

              {/* Properties */}
              <div className="space-y-2">
                {renderProperty(TagIcon, "Type", node.type)}
                {node.sentiment && renderProperty(HeartIcon, "Sentiment", `${getSentimentIcon(node.sentiment)} ${node.sentiment}`, `capitalize`)}
                {node.level !== undefined && renderProperty(ChartBarIcon, "Level", node.level)}
                {node.importance !== undefined && renderProperty(ChartBarIcon, "Importance", node.importance)}
                {node.properties && typeof node.properties === 'object' && Object.entries(node.properties).map(([key, value]) => 
                  renderProperty(CubeTransparentIcon, key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value, '', String(value))
                )}
                {renderProperty(HashtagIcon, "ID", node.id, 'font-mono text-xs')}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NodeInfoPanel