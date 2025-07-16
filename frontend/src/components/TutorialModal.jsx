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
      <div className="relative flex items-center justify-center h-full w-full p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-2xl sm:text-3xl">🕸️</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Welcome to Synapse
              </h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4 overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
            <div className="text-center">
              {/* Step Icon */}
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-3">
                {step.icon}
              </div>
              {/* Step Title */}
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                {step.title}
              </h3>
              {/* Step Description */}
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed px-1">
                {step.description}
              </p>
              {/* Step Content */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 mx-1">
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 dark:text-gray-200">
                  {step.content}
                </p>
              </div>
              {/* GIF Section: Only for steps with a gif property */}
              {step.gif && (
                <div className="flex items-center justify-center w-full">
                  <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl w-full h-40 sm:h-48 md:h-56 lg:h-64 flex items-center justify-center overflow-hidden">
                    {!gifError ? (
                      <img
                        src={step.gif}
                        alt={step.gifAlt}
                        className="w-full h-full rounded-md object-fill"
                        style={{ background: 'rgba(255,255,255,0.95)' }}
                        onError={() => setGifError(true)}
                      />
                    ) : (
                      <div className="text-center w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-4">🖼️</div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 font-medium">
                          {step.gifAlt}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                          GIF could not be loaded
                        </p>
                      </div>
                    )}
                    {/* Semi-transparent overlay on top of GIF */}
                    <div className="absolute inset-0 rounded-md bg-black bg-opacity-20 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 lg:p-6 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0">
            {/* Progress */}
            <div className="flex space-x-1 sm:space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
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
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleSkip}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-xs sm:text-sm"
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