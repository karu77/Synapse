import {
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  CursorArrowRaysIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import CustomizationPanel from './CustomizationPanel'
import HistoryPanel from './HistoryPanel'
import StyleCustomizationPanel from './StyleCustomizationPanel'
import TextInput from './TextInput'
import { deleteAccount } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

// Simplified sidebar animation variants - mobile-aware
const getSidebarVariants = (isMobile) => ({
  hidden: {
    x: isMobile ? '-100vw' : '-100%',
    opacity: 0,
    transition: {
      type: 'tween',
      ease: 'easeInOut',
      duration: 0.3,
    },
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      ease: 'easeInOut',
      duration: 0.4,
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
})

// Simplified item animation variants
const itemVariants = {
  hidden: {
    y: 10,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      ease: 'easeOut',
      duration: 0.3,
    },
  },
}

// Overlay animation variants
const overlayVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
}

const Section = ({ icon, title, children, isMobile }) => (
  <motion.section
    variants={itemVariants}
    className={`${isMobile ? 'mt-4 pt-4' : 'mt-6 pt-6'} border-t border-gray-200 dark:border-skin-border first:mt-0 first:pt-0 first:border-t-0`}
  >
    <h3 className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 dark:text-skin-text ${isMobile ? 'mb-3' : 'mb-4'}`}>
      {icon}
      {title}
    </h3>
    {children}
  </motion.section>
)

const ControlSidebar = ({
  isOpen,
  onClose,
  onSubmit,
  isProcessing,
  selectedNode,
  selectedEdge,
  history,
  loadFromHistory,
  onDelete,
  onClear,
  styleOptions,
  setStyleOptions,
  resetStyles,
  physicsOptions,
  setPhysicsOptions,
  resetPhysics,
  user,
  logout,
  currentDiagramType,
  onDiagramTypeChange,
  onDownloadSVG,
  onDownloadJSON,
  onDownloadNodesCSV,
  onDownloadEdgesCSV,
  hasGraphData,
}) => {
  const { logout: authLogout } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action is irreversible and will remove all your data.'
      )
    ) {
      try {
        await deleteAccount()
        alert('Your account has been successfully deleted.')
        authLogout() // This will redirect to login page
      } catch (error) {
        alert(error.message || 'Failed to delete account. Please try again.')
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
    <>
          {/* Overlay for mobile/tablet and desktop */}
      <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`fixed inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm z-30 ${isMobile ? 'mobile-overlay' : ''}`}
        onClick={onClose}
      />
          
      {/* Sidebar Panel */}
      <motion.div
        variants={getSidebarVariants(isMobile)}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-40 flex flex-col pointer-events-auto safe-area-inset-left ${
              isMobile 
                ? 'mobile-sidebar w-screen max-w-none' 
                : 'w-full sm:max-w-md border-r-2 border-gray-200 dark:border-gray-700'
            } scrollbar-hide`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
            <motion.div 
              variants={itemVariants}
              className={`${isMobile ? 'p-4' : 'p-4 sm:p-6'} flex justify-between items-center border-b-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/80`}
            >
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} font-bold text-skin-text`}>Controls</h2>
          <button
            onClick={onClose}
                className={`${isMobile ? 'p-3' : 'p-2'} rounded-full text-gray-500 dark:text-skin-text-muted hover:bg-gray-200 dark:hover:bg-skin-border hover:text-gray-700 dark:hover:text-skin-text transition-all duration-200 hover:scale-110 pointer-events-auto`}
          >
            <XMarkIcon className={`${isMobile ? 'h-6 w-6' : 'h-6 w-6'}`} />
          </button>
            </motion.div>

        {/* Content Body */}
            <div className={`overflow-y-auto flex-grow ${isMobile ? 'p-4' : 'p-4 sm:p-6'} scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 dark:scrollbar-thumb-skin-border bg-white dark:bg-transparent`}>
          <Section icon={<SparklesIcon className="h-6 w-6" />} title="Generate" isMobile={isMobile}>
                <TextInput onSubmit={onSubmit} isProcessing={isProcessing} alwaysShowMediaInputs={true} onDiagramTypeChange={onDiagramTypeChange} currentDiagramType={currentDiagramType} />
          </Section>
          
          {hasGraphData && (
            <Section icon={<ArrowDownTrayIcon className="h-6 w-6" />} title="Export" isMobile={isMobile}>
              <div className="space-y-2">
                <button
                  onClick={onDownloadSVG}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download SVG
                </button>
                <button
                  onClick={onDownloadJSON}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download JSON
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onDownloadNodesCSV}
                    className="flex items-center justify-center gap-1 px-2 py-2 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <TableCellsIcon className="h-3 w-3" />
                    Nodes CSV
                  </button>
                  <button
                    onClick={onDownloadEdgesCSV}
                    className="flex items-center justify-center gap-1 px-2 py-2 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <TableCellsIcon className="h-3 w-3" />
                    Edges CSV
                  </button>
                </div>
              </div>
            </Section>
          )}
          
          {(selectedNode || selectedEdge) && (
            <Section icon={<CursorArrowRaysIcon className="h-6 w-6" />} title="Selection Details" isMobile={isMobile}>
              <div className="p-3 rounded-lg bg-skin-border/40">
                {selectedNode && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-skin-text">{selectedNode.label}</div>
                    <div className="text-xs text-skin-text-muted">Type: {selectedNode.type}</div>
                  </div>
                )}
                {selectedEdge && (
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-skin-text">{selectedEdge.label || 'Connection'}</div>
                    <div className="text-xs text-skin-text-muted">Type: Edge</div>
                  </div>
                )}
              </div>
            </Section>
          )}

          <Section icon={<ClockIcon className="h-6 w-6" />} title="History" isMobile={isMobile}>
            <HistoryPanel
              history={history}
              onSelect={loadFromHistory}
              onDelete={onDelete}
              onClear={onClear}
              isMobile={isMobile}
              isSmallPhone={window.innerWidth < 375}
              isMediumPhone={window.innerWidth >= 375 && window.innerWidth < 425}
            />
          </Section>

          <Section
            icon={<AdjustmentsHorizontalIcon className="h-6 w-6" />}
            title="Graph Styles"
            isMobile={isMobile}
          >
            <StyleCustomizationPanel
              options={styleOptions}
              onUpdate={setStyleOptions}
              onReset={resetStyles}
              diagramType={currentDiagramType}
              isMobile={isMobile}
              isSmallPhone={window.innerWidth < 375}
              isMediumPhone={window.innerWidth >= 375 && window.innerWidth < 425}
            />
          </Section>

              {currentDiagramType === 'knowledge-graph' && (
          <Section icon={<Cog6ToothIcon className="h-6 w-6" />} title="Physics Engine" isMobile={isMobile}>
            <CustomizationPanel
              options={physicsOptions}
              onUpdate={setPhysicsOptions}
              onReset={resetPhysics}
              isMobile={isMobile}
              isSmallPhone={window.innerWidth < 375}
              isMediumPhone={window.innerWidth >= 375 && window.innerWidth < 425}
            />
          </Section>
              )}
        </div>

        {/* Footer */}
            <motion.div 
              variants={itemVariants}
              className={`${isMobile ? 'p-4' : 'p-4 sm:p-6'} border-t-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/60`}
            >
          <div className="flex justify-between items-center">
                <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-skin-text-muted truncate`}>
              Welcome, {user?.name ? user.name.split(' ')[0] : 'Guest'}
            </span>
          </div>
            </motion.div>
      </motion.div>
    </>
      )}
    </AnimatePresence>
  )
}

export default ControlSidebar