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
            <div className="space-y-2 text-sm text-skin-text-muted max-h-48 overflow-y-auto pr-2">
              {Object.entries(node)
                .filter(
                  ([key]) => !['id', 'label', 'x', 'y', 'vx', 'vy', 'fx', 'fy', 'type'].includes(key)
                )
                .map(([key, value]) => {
                  const formattedKey = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())

                  return (
                    <div
                      key={key}
                      className="flex justify-between items-center bg-skin-bg p-2 rounded-md"
                    >
                      <span className="font-semibold text-skin-text">{formattedKey}:</span>
                      <span className="truncate pl-4 text-right">{String(value)}</span>
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

export default NodeInfoPanel 