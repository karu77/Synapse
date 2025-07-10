import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Typewriter } from 'react-simple-typewriter';

const appDescription = `Synapse is a modern web application that transforms text and multimodal inputs (images, audio) into interactive visual diagrams in real-time using advanced AI capabilities. Create knowledge graphs, mind maps, and flowcharts from your ideas, and explore your information visually!`;

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/app');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-skin-bg px-4">
      <div className="max-w-2xl w-full text-center p-8 rounded-2xl shadow-2xl bg-skin-bg-accent/80 border border-skin-border">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-skin-accent">
          <Typewriter
            words={[
              'Real-time Graph Intelligence',
              'Turn Ideas into Interactive Diagrams',
              'Visualize Knowledge Instantly',
            ]}
            loop={0}
            cursor
            cursorStyle='|'
            typeSpeed={60}
            deleteSpeed={40}
            delaySpeed={1800}
          />
        </h1>
        <p className="text-lg text-skin-text-muted mb-8">
          {appDescription}
        </p>
        <button
          className="bg-skin-accent text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition text-lg"
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage; 