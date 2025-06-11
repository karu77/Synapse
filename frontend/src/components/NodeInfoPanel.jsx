import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { getNodeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

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

const NodeInfoPanel = ({ node, onClose }) => {
  const { theme } = useTheme()

  if (!node) return null
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          key={node.id}
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
                  style={{ color: getNodeColor(node.type, theme) }}
                >
                  {node.type || 'Entity'}
                </p>
                <h3 className="text-xl font-bold text-skin-text break-words">
                  {node.label || 'Node Information'}
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
              {node.description && (
                <div className="mb-2 p-2 rounded bg-skin-bg border border-skin-border text-skin-text">
                  <span className="font-semibold text-skin-text">About:</span>
                  <span className="block mt-1">{node.description}</span>
                </div>
              )}
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">Id:</span>
                <span className="text-skin-text-muted">{node.id}</span>
              </div>
              <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
                <span className="font-semibold">Sentiment:</span>
                <span className="text-skin-text-muted">{node.sentiment}</span>
              </div>
              {Object.entries(node)
                .filter(
                  ([key]) =>
                    ![
                      'label',
                      'type',
                      'x',
                      'y',
                      'vx',
                      'vy',
                      'fx',
                      'fy',
                      'color',
                      'shape',
                      'image',
                      'size',
                      'font',
                      'description', // Exclude description from generic list
                    ].includes(key)
                )
                .map(([key, value]) => {
                  if (value === null || value === undefined) return null

                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())

                  return (
                    <div
                      key={key}
                      className="flex justify-between items-start gap-4 bg-skin-bg p-2 rounded-md"
                    >
                      <span className="font-semibold text-skin-text">{formattedKey}:</span>
                      <span className="break-all text-right">{String(value)}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const EdgeInfoPanel = ({ edge, nodes, onClose }) => {
  if (!edge) return null
  const fromNode = nodes.find((n) => n.id === edge.from || n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.to || n.id === edge.target)
  return (
    <div className="fixed right-4 top-4 z-40 w-80 max-w-full bg-skin-bg-accent rounded-xl shadow-2xl border border-skin-border p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-skin-accent">{edge.label}</span>
        <button onClick={onClose} className="text-skin-text-muted hover:text-skin-accent text-lg">
          ×
        </button>
      </div>
      {edge.description && (
        <div className="mb-4 p-3 rounded bg-skin-bg border border-skin-border text-skin-text text-sm">
          <span className="font-semibold block mb-1">About this connection:</span>
          {edge.description}
        </div>
      )}
      <div className="mb-2 text-skin-text-muted text-xs font-semibold">Connection</div>
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
  )
}

export { NodeInfoPanel, EdgeInfoPanel }
export default NodeInfoPanel