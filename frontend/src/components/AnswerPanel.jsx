import { XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, motion } from 'framer-motion'

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

const AnswerPanel = ({ answer, onClose }) => {
  return (
    <AnimatePresence>
      {answer && (
        <motion.div
          key="answer-panel"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="p-6 bg-skin-bg-accent/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-skin-border">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div className="flex-grow">
                <p className="text-sm font-semibold uppercase tracking-wider text-skin-accent">
                  AI Answer
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text transition-colors flex-shrink-0"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-skin-text-muted max-h-48 overflow-y-auto pr-2">
              <p className="text-base text-skin-text whitespace-pre-wrap">{answer}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnswerPanel 