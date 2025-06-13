import {
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import CustomizationPanel from './CustomizationPanel'
import HistoryPanel from './HistoryPanel'
import StyleCustomizationPanel from './StyleCustomizationPanel'
import TextInput from './TextInput'

const sidebarVariants = {
  open: {
    x: 0,
    transition: {
      type: 'tween',
      ease: 'circOut',
      duration: 0.5,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  closed: {
    x: '-100%',
    transition: {
      type: 'tween',
      ease: 'circIn',
      duration: 0.3,
    },
  },
}

const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 20,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
}

const Section = ({ icon, title, children }) => (
  <motion.section
    variants={itemVariants}
    className="mt-6 pt-6 border-t border-skin-border first:mt-0 first:pt-0 first:border-t-0"
  >
    <h3 className="flex items-center gap-2 text-lg font-semibold text-skin-text mb-4">
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
  history,
  loadFromHistory,
  onDelete, // renamed from handleDeleteFromHistory for consistency
  onClear,  // renamed from clearHistory for consistency
  styleOptions,
  setStyleOptions,
  resetStyles,
  physicsOptions,
  setPhysicsOptions,
  resetPhysics,
  user,
  logout,
}) => {
  return (
    <>
      {/* Overlay for mobile/tablet */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        onClick={onClose}
      />
      {/* Sidebar Panel */}
      <motion.div
        variants={sidebarVariants}
        initial="closed"
        animate="open"
        exit="closed"
        className="fixed top-0 left-0 h-full bg-skin-bg shadow-2xl z-40 w-full max-w-md border-r border-skin-border flex flex-col"
      >
        {/* Header */}
        <div className="p-6 md:p-8 flex justify-between items-center border-b border-skin-border flex-shrink-0">
          <h2 className="text-2xl font-bold text-skin-text">Controls</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-grow p-6 md:p-8">
          <Section icon={<SparklesIcon className="h-6 w-6" />} title="Generate">
            <TextInput onSubmit={onSubmit} isProcessing={isProcessing} alwaysShowMediaInputs={true} />
          </Section>

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
            />
          </Section>

          <Section icon={<Cog6ToothIcon className="h-6 w-6" />} title="Physics Engine">
            <CustomizationPanel
              options={physicsOptions}
              onUpdate={setPhysicsOptions}
              onReset={resetPhysics}
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 border-t border-skin-border flex-shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-sm text-skin-text-muted truncate">
              Welcome, {user?.name || 'Guest'}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-skin-text-muted bg-skin-bg hover:bg-skin-border hover:text-skin-text transition-colors"
              aria-label="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default ControlSidebar