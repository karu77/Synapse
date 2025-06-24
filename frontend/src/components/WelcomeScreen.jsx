import { memo } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

const FeatureCard = memo(({ emoji, title, description, onClick }) => (
  <div 
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg bg-skin-bg-accent border border-skin-border hover:bg-skin-accent/20 transition-colors cursor-pointer"
  >
    <span className="text-2xl">{emoji}</span>
    <div>
      <div className="font-semibold text-skin-text">{title}</div>
      <div className="text-sm text-skin-text-muted">{description}</div>
    </div>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

const WelcomeScreen = memo(({ onDiagramTypeSelect, onOpenSidebar }) => {
  const handleCardClick = (diagramType) => {
    if (onDiagramTypeSelect) {
      onDiagramTypeSelect(diagramType);
    }
    if (onOpenSidebar) {
      onOpenSidebar();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 5 }}>
      <div className="text-center max-w-md animate-fade-in-panel pointer-events-auto">
        <div className="mb-6">
          <div className="text-6xl mb-4">🕸️</div>
          <h2 className="text-2xl font-bold text-skin-text mb-2">Welcome to Synapse</h2>
          <p className="text-skin-text-muted mb-2">
            Transform your text, images, and audio into interactive diagrams
          </p>
          <p className="text-skin-accent font-semibold mt-4 text-lg animate-pulse">
            Select a diagram type to begin
          </p>
        </div>
        <div className="space-y-4 text-left">
          <FeatureCard
            emoji="📊"
            title="Flowcharts"
            description="Visualize processes and workflows"
            onClick={() => handleCardClick('flowchart')}
          />
          <FeatureCard
            emoji="🧠"
            title="Mind Maps"
            description="Organize ideas hierarchically"
            onClick={() => handleCardClick('mindmap')}
          />
          <FeatureCard
            emoji="🕸️"
            title="Knowledge Graphs"
            description="Explore entity relationships"
            onClick={() => handleCardClick('knowledge-graph')}
          />
        </div>
        <button 
          className="mt-6 p-4 rounded-lg bg-skin-accent/10 border border-skin-accent/20 cursor-pointer hover:bg-skin-accent/20 transition-colors w-full"
          onClick={() => onOpenSidebar && onOpenSidebar()}
          type="button"
        >
          <div className="flex items-center justify-center gap-2 text-skin-accent font-semibold">
            <Bars3Icon className="h-5 w-5" />
            <span>Start making</span>
          </div>
        </button>
      </div>
    </div>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';
export default WelcomeScreen; 