import { memo, useEffect, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const FeatureCard = memo(({ emoji, title, description, onClick, isMobile, isSmallPhone }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 ${isMobile ? (isSmallPhone ? 'p-3' : 'p-4') : 'p-3'} rounded-lg bg-skin-bg-accent border border-skin-border hover:bg-skin-accent/20 active:bg-skin-accent/30 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95`}
  >
    <span className={`${isMobile ? (isSmallPhone ? 'text-xl' : 'text-2xl') : 'text-2xl'}`}>{emoji}</span>
    <div className="flex-1 min-w-0">
      <div className={`font-semibold text-skin-text ${isMobile ? (isSmallPhone ? 'text-sm' : 'text-sm') : ''} truncate`}>{title}</div>
      <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'} text-skin-text-muted line-clamp-2`}>{description}</div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

const WelcomeScreen = memo(({ onDiagramTypeSelect, onOpenSidebar }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 768;
  const isSmallPhone = windowSize.width < 375;
  const isMediumPhone = windowSize.width >= 375 && windowSize.width < 425;

  const handleCardClick = (diagramType) => {
    if (onDiagramTypeSelect) {
      onDiagramTypeSelect(diagramType);
    }
    if (onOpenSidebar) {
      onOpenSidebar();
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-transparent pointer-events-none"
    >
      <div className={`text-center ${isMobile ? (isSmallPhone ? 'max-w-xs px-3' : 'max-w-xs px-4') : 'max-w-md'} w-full animate-fade-in-panel pointer-events-auto`}>
        <div className={`${isMobile ? (isSmallPhone ? 'mb-3' : 'mb-4') : 'mb-6'}`}>
          <div className={`${isMobile ? (isSmallPhone ? 'text-3xl mb-2' : 'text-4xl mb-3') : 'text-6xl mb-4'}`}>🕸️</div>
          <h2 className={`${isMobile ? (isSmallPhone ? 'text-base' : 'text-lg') : 'text-2xl'} font-bold text-skin-text mb-2`}>Welcome to Synapse</h2>
          <p className={`text-skin-text-muted mb-2 ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : ''}`}>
            Transform your text, images, and audio into interactive diagrams
          </p>
          <p className={`text-skin-accent font-semibold mt-3 ${isMobile ? (isSmallPhone ? 'text-sm' : 'text-sm') : 'text-lg'} animate-pulse`}>
            Select a diagram type to begin
          </p>
        </div>
        <div className={`${isMobile ? (isSmallPhone ? 'space-y-2' : 'space-y-2') : 'space-y-4'} text-left`}>
          <FeatureCard
            emoji="📊"
            title="Flowcharts"
            description="Visualize processes and workflows"
            onClick={() => handleCardClick('flowchart')}
            isMobile={isMobile}
            isSmallPhone={isSmallPhone}
          />
          <FeatureCard
            emoji="🧠"
            title="Mind Maps"
            description="Organize ideas hierarchically"
            onClick={() => handleCardClick('mindmap')}
            isMobile={isMobile}
            isSmallPhone={isSmallPhone}
          />
          <FeatureCard
            emoji="🕸️"
            title="Knowledge Graphs"
            description="Explore entity relationships"
            onClick={() => handleCardClick('knowledge-graph')}
            isMobile={isMobile}
            isSmallPhone={isSmallPhone}
          />
        </div>
        <button 
          className={`${isMobile ? (isSmallPhone ? 'mt-3 p-3' : 'mt-3 p-3') : 'mt-6 p-4'} rounded-lg bg-skin-accent/10 border border-skin-accent/20 cursor-pointer hover:bg-skin-accent/20 active:bg-skin-accent/30 transition-all duration-200 w-full transform hover:scale-105 active:scale-95`}
          onClick={() => onOpenSidebar && onOpenSidebar()}
          type="button"
        >
          <div className="flex items-center justify-center gap-2 text-skin-accent font-semibold">
            <Bars3Icon className={`${isMobile ? (isSmallPhone ? 'h-4 w-4' : 'h-5 w-5') : 'h-5 w-5'}`} />
            <span className={isMobile ? (isSmallPhone ? 'text-sm' : 'text-sm') : ''}>Start making</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';
export default WelcomeScreen; 