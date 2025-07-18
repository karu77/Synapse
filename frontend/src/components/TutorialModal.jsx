import React, { useState } from 'react';
import { X } from 'lucide-react';

const steps = [
  {
    title: "Welcome to Synapse 🕸️",
    description: "Your AI-powered knowledge graph platform. Transform documents into interactive visual knowledge networks.",
    icon: "🕸️",
    content: "Get ready to explore the future of document analysis and knowledge discovery."
    // No GIF for the first step
  },
  {
    title: "Choose Your Diagram",
    description: "Start by selecting the type of diagram that best fits your document. Our AI will guide you through the process.",
    icon: "📋",
    content: "Whether it's a flowchart, mind map, or custom structure - we've got you covered.",
    gif: "/tutorial/diagram-selection.gif",
    gifAlt: "Diagram Selection GIF"
  },
  {
    title: "Graph Generation",
    description: "Watch as our AI transforms your documents into beautiful, interactive knowledge graphs in real-time.",
    icon: "🔄",
    content: "Nodes and connections are automatically created based on your document content.",
    gif: "/tutorial/graph-generation.gif",
    gifAlt: "Graph Generation GIF"
  },
  {
    title: "AI Answers & Insights",
    description: "Ask questions about your documents and get instant AI-powered answers with highlighted connections.",
    icon: "💬",
    content: "Explore your knowledge graph through natural language queries.",
    gif: "/tutorial/ai-interaction.gif",
    gifAlt: "AI Interaction GIF"
  },
  {
    title: "Organize & Customize",
    description: "Rename files, organize your graphs, and customize the visualization to match your workflow.",
    icon: "✏️",
    content: "Keep your knowledge organized and easily accessible.",
    gif: "/tutorial/file-management.gif",
    gifAlt: "File Management GIF"
  },
  {
    title: "Download & Share",
    description: "Export your knowledge graphs in various formats and share them with your team or save for later use.",
    icon: "📥",
    content: "Download as PNG, PDF, or JSON to integrate with your existing workflows.",
    gif: "/tutorial/download-export.gif",
    gifAlt: "Download and Export GIF"
  }
];

const TutorialModal = ({ isOpen, onClose, onStartTutorial, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [gifError, setGifError] = useState(false);

  const handleNext = () => {
    setGifError(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onStartTutorial();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50">
      {/* Blurred and darkened overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
      <div className="relative flex items-center justify-center h-full w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] lg:max-h-[85vh] flex flex-col shadow-2xl mx-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl lg:text-4xl">🕸️</span>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Synapse
              </h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X size={24} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 lg:p-6 min-h-0 overflow-y-auto">
            <div className="text-center max-w-4xl mx-auto h-full flex flex-col">
              {/* Step Icon */}
              <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
                {step.icon}
              </div>
              {/* Step Title */}
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 lg:mb-4 flex-shrink-0">
                {step.title}
              </h3>
              {/* Step Description */}
              <p
                className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-300 mb-1 sm:mb-2 lg:mb-2 leading-relaxed px-2 sm:px-4 lg:px-8 flex-shrink-0"
                style={{
                  fontSize: 'clamp(12px, 1.1vw, 18px)',
                  marginBottom: '8px',
                  marginTop: '0',
                }}
              >
                {step.description}
              </p>
              {/* Step Content */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 lg:p-4 mb-1 sm:mb-2 lg:mb-2 mx-2 sm:mx-4 lg:mx-8 flex-shrink-0 border border-blue-100 dark:border-blue-900 shadow-sm">
                <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-700 dark:text-gray-200">
                  {step.content}
                </p>
              </div>
              {/* GIF Section: Only for steps with a gif property */}
              {step.gif && (
                <div className="flex items-center justify-center w-full flex-1 min-h-0 mt-0">
                  <div className="relative bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[320px] aspect-video flex items-center justify-center overflow-hidden mt-0 animate-fade-in"
                    style={{
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                      margin: '0 auto',
                      transition: 'box-shadow 0.3s',
                    }}
                  >
                    {!gifError ? (
                      <img
                        src={step.gif}
                        alt={step.gifAlt}
                        className="w-full h-full rounded-xl object-contain animate-fade-in"
                        style={{ background: 'rgba(255,255,255,0.95)', maxHeight: '320px', objectFit: 'contain' }}
                        onError={() => setGifError(true)}
                      />
                    ) : (
                      <div className="text-center w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                        <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl mb-3 sm:mb-4 lg:mb-6">🖼️</div>
                        <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-300 font-medium">
                          {step.gifAlt}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-3 lg:mt-4">
                          GIF could not be loaded
                        </p>
                      </div>
                    )}
                    {/* Semi-transparent overlay on top of GIF */}
                    <div className="absolute inset-0 rounded-xl bg-black bg-opacity-10 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 lg:p-6 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0 flex-shrink-0">
            {/* Progress */}
            <div className="flex space-x-2 sm:space-x-3">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-blue-500'
                      : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex space-x-3 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={handleSkip}
                className="flex-1 sm:flex-none px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none px-5 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 