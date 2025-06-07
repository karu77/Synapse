import { getNodeColor } from '../utils/colors'
import { useTheme } from '../contexts/ThemeContext'

const NodeInfoPanel = ({ node }) => {
  const { theme } = useTheme()

  if (!node) {
    return (
      <div className="mt-6 pt-6 border-t border-skin-border">
        <h3 className="text-xl font-bold text-skin-text mb-2">Node Information</h3>
        <p className="text-skin-text-muted text-sm">
          Click a node in the graph to see its details here.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-skin-border">
      <h3 className="text-xl font-bold text-skin-text mb-4">Node Information</h3>
      <div className="space-y-3 text-base">
        <div className="flex items-center">
          <span className="font-semibold text-skin-text w-24">Label:</span>
          <span className="text-skin-text">{node.label}</span>
        </div>
        <div className="flex items-center">
          <span className="font-semibold text-skin-text w-24">Type:</span>
          <span
            className="text-white px-2 py-1 text-xs rounded-md font-semibold"
            style={{ backgroundColor: getNodeColor(node.type, theme) }}
          >
            {node.type}
          </span>
        </div>
        {node.sentiment && (
          <div className="flex items-center">
            <span className="font-semibold text-skin-text w-24">Sentiment:</span>
            <span className="text-skin-text capitalize">{node.sentiment}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default NodeInfoPanel 