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

const NodeInfoPanel = ({ node, onClose, panelClassName }) => {
  const { theme } = useTheme()

  if (!node) return null
  return (
    <div
      className={`fixed right-4 top-4 z-40 w-80 max-w-full bg-skin-bg-accent rounded-xl shadow-2xl border border-skin-border p-6 ${
        panelClassName || ''
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-skin-accent">
          {node.type}
        </span>
        <button
          onClick={onClose}
          className="text-skin-text-muted hover:text-skin-accent text-lg"
        >
          ×
        </button>
      </div>
      <div className="text-2xl font-bold mb-2 text-skin-accent-light">
        {node.label}
      </div>
      {node.description && (
        <div className="mb-4 p-3 rounded bg-skin-bg border border-skin-border text-skin-text text-sm">
          <span className="font-semibold block mb-1">About:</span>
          {node.description}
        </div>
      )}
      <div className="mb-2 text-skin-text-muted text-xs font-semibold">
        Details
      </div>
      <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
        <span className="font-semibold">Id:</span>
        <span className="text-skin-text-muted">{node.id}</span>
      </div>
      <div className="mb-2 flex items-center justify-between bg-skin-bg rounded p-2 text-sm">
        <span className="font-semibold">Sentiment:</span>
        <span className="text-skin-text-muted">{node.sentiment}</span>
      </div>
    </div>
  )
}

const EdgeInfoPanel = ({ edge, nodes, onClose }) => {
  if (!edge) return null
  const fromNode = nodes.find((n) => n.id === edge.from || n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.to || n.id === edge.target)
  return (
    <div className="fixed right-4 top-4 z-40 w-80 max-w-full bg-skin-bg-accent rounded-xl shadow-2xl border border-skin-border p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-skin-accent">
          {edge.label}
        </span>
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