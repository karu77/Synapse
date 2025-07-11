import { XMarkIcon, LinkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 250 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

const AiInfoPanel = ({ answer, references = [], onClose }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 768;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!answer) return null;

  return (
    <motion.div
      key="ai-info-modal"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        className="bg-skin-bg-accent/90 rounded-2xl shadow-2xl border border-skin-border max-w-lg w-full mx-4 p-6 relative"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-skin-text-muted hover:bg-skin-border hover:text-skin-text transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        {/* Title */}
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-white break-words drop-shadow">AI Response</h2>
        </div>
        {/* Scrollable Content */}
        <div className={`mb-2 ${isMobile ? 'max-h-[60vh]' : 'max-h-[70vh]'} overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-skin-accent scrollbar-track-skin-bg rounded-lg`}>
          {/* About Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <InformationCircleIcon className="h-5 w-5 text-skin-accent" />
              <h4 className="font-semibold text-white">Answer</h4>
            </div>
            <p className="text-base text-gray-100 whitespace-pre-wrap leading-relaxed">{answer}</p>
          </div>
          {/* References */}
          {references.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-5 w-5 text-skin-accent" />
                <h4 className="font-semibold text-white">References</h4>
              </div>
              <ul className="list-disc list-inside space-y-1">
                {references.map((ref, i) => (
                  <li key={i} className="text-sm text-blue-200 break-all">
                    {typeof ref === 'string' ? (
                      <a href={ref} target="_blank" rel="noopener noreferrer" className="underline hover:text-skin-accent">{ref}</a>
                    ) : ref.label && ref.url ? (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-skin-accent">{ref.label}</a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AiInfoPanel; 