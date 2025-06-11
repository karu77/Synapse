import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { getEdgeColor } from '../utils/colors'

const panelVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 180 },
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

const EdgeInfoPanel = ({ edge, nodes, onClose, panelClassName }) => {
  if (!edge) return null
  const fromNode = nodes.find((n) => n.id === edge.from || n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.to || n.id === edge.target)
  return (
    <AnimatePresence>
      {edge && (
        <motion.div
          key={edge.id}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:left-auto sm:bottom-4 sm:right-4 sm:w-full sm:max-w-sm"
        >
          <div className="p-6 bg-skin-bg-accent/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-skin-border">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex-grow">
                <p
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: getEdgeColor(edge.sentiment) }}
                >
                  RELATIONSHIP
                </p>
                <h3 className="text-xl font-bold text-skin-text break-words">
                  {edge.label || 'Connection Information'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text transition-colors flex-shrink-0"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-skin-text-muted max-h-48 overflow-y-auto pr-2">
              <h4 className="text-sm font-semibold text-skin-text border-b border-skin-border pb-2 mb-2">
                Details
              </h4>
              {edge.description && (
                <div className="mb-2 p-2 rounded bg-skin-bg border border-skin-border text-skin-text">
                  <span className="font-semibold text-skin-text">About:</span>
                  <span className="block mt-1">{edge.description}</span>
                </div>
              )}
              <div className="mb-2 text-skin-text-muted text-xs font-semibold">
                Connection
              </div>
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">Id:</span>
                <span className="text-skin-text-muted">{edge.id}</span>
              </div>
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">From:</span>
                <span className="text-skin-text-muted">
                  {fromNode ? fromNode.label : edge.from || edge.source}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">To:</span>
                <span className="text-skin-text-muted">
                  {toNode ? toNode.label : edge.to || edge.target}
                </span>
              </div>
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">Sentiment:</span>
                <span className="text-skin-text-muted">{edge.sentiment}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EdgeInfoPanel