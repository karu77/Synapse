import { XMarkIcon, InformationCircleIcon, ArrowRightIcon, HeartIcon, LinkIcon, HashtagIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

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

const EdgeInfoPanel = ({ edge, nodes = [], onClose }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 768;

  console.log('EdgeInfoPanel rendered with edge:', edge);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!edge) return null

  const fromNode = nodes.find((n) => n.id === edge.from || n.id === edge.source)
  const toNode = nodes.find((n) => n.id === edge.to || n.id === edge.target)

  const getRelationshipIcon = (label) => {
    const icons = {
      'IS_RELATED_TO': '🔗', 'WORKS_AT': '💼', 'LOCATED_IN': '📍', 'FOUNDED_BY': '🏗️',
      'PART_OF': '🧩', 'LEADS_TO': '➡️', 'DEPENDS_ON': '🔄', 'SIMILAR_TO': '🔗',
      'OPPOSITE_OF': '⚡', 'CONTAINS': '📦', 'HAS_BRANCH': '🌳', 'INCLUDES': '📋',
      'RESULTS_IN': '🎯', 'INFLUENCES': '💫', 'COLLABORATES_WITH': '🤝', 'COMPETES_WITH': '⚔️',
      'SUPPORTS': '🤲', 'CONTRADICTS': '❌', 'PRECEDES': '⏮️', 'FOLLOWS': '⏭️'
    }
    return icons[label?.toUpperCase()] || '🔗'
  }

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😔'
      default: return '😐'
    }
  }

  const renderProperty = (Icon, label, value, valueClassName = '', title = '') => (
    <div className="flex justify-between items-center bg-skin-bg/50 dark:bg-skin-bg/30 p-2 rounded-lg">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-skin-text-muted" />
        <span className="font-medium text-skin-text text-sm">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold text-skin-text-muted truncate max-w-[150px] ${valueClassName}`}
        title={title || value}
      >
        {value}
      </span>
    </div>
  )

  return (
    <motion.div
      key="edge-info-panel"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`fixed ${isMobile ? 'top-20 left-4 right-4' : 'top-24 right-4'} z-40 ${isMobile ? 'w-auto' : 'w-80'} max-w-[calc(100vw-2rem)]`}
    >
      <div className={`${isMobile ? 'p-4' : 'p-5'} relative overflow-hidden rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300`}>
        {/* Ultra-translucent glass background - same for both themes */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/3 backdrop-blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/8 via-transparent to-white/5"></div>
        
        {/* Subtle border - same for both themes */}
        <div className="absolute inset-0 rounded-2xl border border-white/20"></div>
        
        {/* Content container */}
        <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getRelationshipIcon(edge.label)}</span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-skin-accent -mb-1">
                Relationship
              </p>
              <h3 className="text-lg font-bold text-skin-text break-words">
                {edge.label || 'Connection'}
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
        <div className={`space-y-4 ${isMobile ? 'max-h-[calc(100vh-14rem)]' : 'max-h-[calc(100vh-20rem)]'} overflow-y-auto pr-2`}>
          {/* Description */}
          <div className="p-3 bg-skin-bg/50 dark:bg-skin-bg/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <InformationCircleIcon className="h-5 w-5 text-skin-accent" />
              <h4 className="font-semibold text-skin-text">Connection Flow</h4>
            </div>
            {fromNode && toNode ? (
              <div className="flex items-center justify-between text-sm font-medium text-skin-text">
                <span className="truncate font-semibold">{fromNode.label}</span>
                <ArrowRightIcon className="h-4 w-4 mx-2 text-skin-text-muted flex-shrink-0" />
                <span className="truncate font-semibold text-right">{toNode.label}</span>
              </div>
            ) : (
              <p className="text-sm text-skin-text-muted">Defines a link between two entities.</p>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-2">
            {edge.sentiment && renderProperty(HeartIcon, "Sentiment", `${getSentimentIcon(edge.sentiment)} ${edge.sentiment}`, `capitalize`)}
            {edge.description && renderProperty(InformationCircleIcon, "Details", edge.description)}
            {renderProperty(HashtagIcon, "ID", edge.id, 'font-mono text-xs')}
          </div>
        </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EdgeInfoPanel