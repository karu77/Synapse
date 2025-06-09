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

const EdgeInfoPanel = ({ edge, nodes, onClose }) => {
  if (!edge) {
    return null
  }

  const sourceNode = nodes.find((n) => n.id === edge.source)
  const targetNode = nodes.find((n) => n.id === edge.target)

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
              <div className="flex justify-between items-start gap-4 bg-skin-bg p-2 rounded-md">
                <span className="font-semibold text-skin-text">Source:</span>
                <span className="break-all text-right">{sourceNode?.label || edge.source}</span>
              </div>
              <div className="flex justify-between items-start gap-4 bg-skin-bg p-2 rounded-md">
                <span className="font-semibold text-skin-text">Target:</span>
                <span className="break-all text-right">{targetNode?.label || edge.target}</span>
              </div>
              <div className="flex justify-between items-start gap-4 bg-skin-bg p-2 rounded-md">
                <span className="font-semibold text-skin-text">Sentiment:</span>
                <span className="break-all text-right capitalize">{edge.sentiment || 'neutral'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EdgeInfoPanel 