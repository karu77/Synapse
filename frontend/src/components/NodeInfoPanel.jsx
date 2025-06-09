import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { getNodeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

const NodeInfoPanel = ({ node, onClose }) => {
  const { theme } = useTheme()
  if (!node) return null

  const nodeColor = getNodeColor(node.type, theme)

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-sm p-6 bg-skin-bg-accent rounded-2xl shadow-2xl border border-skin-border"
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-lg font-bold text-skin-text truncate pr-4"
              style={{ borderLeft: `4px solid ${nodeColor}`, paddingLeft: '10px' }}
            >
              {node.label || 'Node Information'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3 text-sm text-skin-text-muted">
            {Object.entries(node).map(([key, value]) => {
              // Filter out properties we don't want to display directly
              if (['id', 'label', 'x', 'y', 'vx', 'vy', 'fx', 'fy'].includes(key)) {
                return null
              }
              // Nicely format the key
              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())

              return (
                <div key={key} className="flex justify-between">
                  <span className="font-semibold text-skin-text">{formattedKey}:</span>
                  <span className="truncate pl-4">{String(value)}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NodeInfoPanel 