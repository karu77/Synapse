import {
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
  CursorArrowRaysIcon,
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import CustomizationPanel from './CustomizationPanel'
import HistoryPanel from './HistoryPanel'
import StyleCustomizationPanel from './StyleCustomizationPanel'
import TextInput from './TextInput'

// Simplified sidebar animation variants
const sidebarVariants = {
  hidden: {
    x: '-100%',
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
}

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

const Section = ({ icon, title, children }) => (
  <motion.section
    variants={itemVariants}
    className="mt-6 pt-6 border-t border-gray-200 dark:border-skin-border first:mt-0 first:pt-0 first:border-t-0"
  >
    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-skin-text mb-4">
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
}) => {
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
            className="fixed inset-0 bg-black/40 dark:bg-black/30 backdrop-blur-sm z-30"
        onClick={onClose}
      />
          
      {/* Sidebar Panel */}
      <motion.div
        variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-0 left-0 h-full bg-white dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-40 w-full max-w-md border-r-2 border-gray-200 dark:border-gray-700 flex flex-col pointer-events-auto"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
            <motion.div 
              variants={itemVariants}
              className="p-6 md:p-8 flex justify-between items-center border-b-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/80"
            >
          <h2 className="text-2xl font-bold text-skin-text">Controls</h2>
          <button
            onClick={onClose}
                className="p-2 rounded-full text-gray-500 dark:text-skin-text-muted hover:bg-gray-200 dark:hover:bg-skin-border hover:text-gray-700 dark:hover:text-skin-text transition-all duration-200 hover:scale-110 pointer-events-auto"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
            </motion.div>

        {/* Content Body */}
            <div className="overflow-y-auto flex-grow p-6 md:p-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 dark:scrollbar-thumb-skin-border bg-white dark:bg-transparent">
          <Section icon={<SparklesIcon className="h-6 w-6" />} title="Generate">
                <TextInput onSubmit={onSubmit} isProcessing={isProcessing} alwaysShowMediaInputs={true} onDiagramTypeChange={onDiagramTypeChange} />
          </Section>
          
          {(selectedNode || selectedEdge) && (
            <Section icon={<CursorArrowRaysIcon className="h-6 w-6" />} title="Selection Details">
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

          <Section icon={<ClockIcon className="h-6 w-6" />} title="History">
            <HistoryPanel
              history={history}
              onSelect={loadFromHistory}
              onDelete={onDelete}
              onClear={onClear}
            />
          </Section>

          <Section
            icon={<AdjustmentsHorizontalIcon className="h-6 w-6" />}
            title="Graph Styles"
          >
            <StyleCustomizationPanel
              options={styleOptions}
              onUpdate={setStyleOptions}
              onReset={resetStyles}
                  diagramType={currentDiagramType}
            />
          </Section>

              {currentDiagramType === 'knowledge-graph' && (
          <Section icon={<Cog6ToothIcon className="h-6 w-6" />} title="Physics Engine">
            <CustomizationPanel
              options={physicsOptions}
              onUpdate={setPhysicsOptions}
              onReset={resetPhysics}
            />
          </Section>
              )}
        </div>

        {/* Footer */}
            <motion.div 
              variants={itemVariants}
              className="p-6 md:p-8 border-t-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/60"
            >
          <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-skin-text-muted truncate">
              Welcome, {user?.name || 'Guest'}
            </span>
            <button
              onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-skin-text-muted bg-gray-100 dark:bg-skin-bg hover:bg-gray-200 dark:hover:bg-skin-border hover:text-gray-800 dark:hover:text-skin-text transition-all duration-200 pointer-events-auto"
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
            </motion.div>
      </motion.div>
    </>
      )}
    </AnimatePresence>
  )
}

export default ControlSidebar