import { memo, useEffect, useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const FeatureCard = memo(({ emoji, title, description, onClick, isMobile }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 ${isMobile ? 'p-4' : 'p-3'} rounded-lg bg-skin-bg-accent border border-skin-border hover:bg-skin-accent/20 active:bg-skin-accent/30 transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95`}
  >
    <span className={`${isMobile ? 'text-3xl' : 'text-2xl'}`}>{emoji}</span>
    <div>
      <div className={`font-semibold text-skin-text ${isMobile ? 'text-base' : ''}`}>{title}</div>
      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-skin-text-muted`}>{description}</div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

const WelcomeScreen = memo(({ onDiagramTypeSelect, onOpenSidebar }) => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const isMobile = windowSize.width < 768;

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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-transparent pointer-events-none">
      <div className={`text-center ${isMobile ? 'max-w-sm px-4' : 'max-w-md'} w-full animate-fade-in-panel pointer-events-auto`}>
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <div className={`${isMobile ? 'text-5xl mb-3' : 'text-6xl mb-4'}`}>🕸️</div>
          <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-skin-text mb-2`}>Welcome to Synapse</h2>
          <p className={`text-skin-text-muted mb-2 ${isMobile ? 'text-sm' : ''}`}>
            Transform your text, images, and audio into interactive diagrams
          </p>
          <p className={`text-skin-accent font-semibold mt-4 ${isMobile ? 'text-base' : 'text-lg'} animate-pulse`}>
            Select a diagram type to begin
          </p>
        </div>
        <div className={`${isMobile ? 'space-y-3' : 'space-y-4'} text-left`}>
          <FeatureCard
            emoji="📊"
            title="Flowcharts"
            description="Visualize processes and workflows"
            onClick={() => handleCardClick('flowchart')}
            isMobile={isMobile}
          />
          <FeatureCard
            emoji="🧠"
            title="Mind Maps"
            description="Organize ideas hierarchically"
            onClick={() => handleCardClick('mindmap')}
            isMobile={isMobile}
          />
          <FeatureCard
            emoji="🕸️"
            title="Knowledge Graphs"
            description="Explore entity relationships"
            onClick={() => handleCardClick('knowledge-graph')}
            isMobile={isMobile}
          />
        </div>
        <button 
          className={`${isMobile ? 'mt-4 p-4' : 'mt-6 p-4'} rounded-lg bg-skin-accent/10 border border-skin-accent/20 cursor-pointer hover:bg-skin-accent/20 active:bg-skin-accent/30 transition-all duration-200 w-full transform hover:scale-105 active:scale-95`}
          onClick={() => onOpenSidebar && onOpenSidebar()}
          type="button"
        >
          <div className="flex items-center justify-center gap-2 text-skin-accent font-semibold">
            <Bars3Icon className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
            <span className={isMobile ? 'text-base' : ''}>Start making</span>
          </div>
        </button>
      </div>
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';
export default WelcomeScreen; 