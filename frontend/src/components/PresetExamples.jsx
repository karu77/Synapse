import { motion } from 'framer-motion';
import { PlayIcon, EyeIcon } from '@heroicons/react/24/outline';

const PresetExamples = ({ onLoadExample, onPreviewExample, isMobile = false, isSmallPhone = false, isMediumPhone = false }) => {
  const examples = {
    'knowledge-graph': [
      {
        id: 'kg-1',
        title: 'Expanded Knowledge Graph',
        description: 'A clear, open network with more nodes and connections.',
        diagramType: 'knowledge-graph',
        sample: {
          nodes: [
            { id: '1', label: 'Dog', type: 'ANIMAL' },
            { id: '2', label: 'Mammal', type: 'CLASS' },
            { id: '3', label: 'Cat', type: 'ANIMAL' },
            { id: '4', label: 'Pet', type: 'CONCEPT' },
            { id: '5', label: 'Wolf', type: 'ANIMAL' },
            { id: '6', label: 'Carnivore', type: 'CLASS' },
            { id: '7', label: 'Lion', type: 'ANIMAL' },
            { id: '8', label: 'Wild', type: 'CONCEPT' }
          ],
          edges: [
            { source: '1', target: '2', label: 'is a' },
            { source: '3', target: '2', label: 'is a' },
            { source: '5', target: '2', label: 'is a' },
            { source: '7', target: '2', label: 'is a' },
            { source: '2', target: '6', label: 'is a' },
            { source: '1', target: '4', label: 'can be' },
            { source: '3', target: '4', label: 'can be' },
            { source: '5', target: '8', label: 'is' },
            { source: '7', target: '8', label: 'is' },
            { source: '1', target: '6', label: 'is' },
            { source: '3', target: '6', label: 'is' },
            { source: '5', target: '6', label: 'is' },
            { source: '7', target: '6', label: 'is' }
          ]
        }
      }
    ],
    'flowchart': [
      {
        id: 'fc-1',
        title: 'Expanded Flowchart',
        description: 'A clear flowchart with more steps.',
        diagramType: 'flowchart',
        sample: {
          nodes: [
            { id: '1', label: 'Start', type: 'START_END', level: 0 },
            { id: '2', label: 'Enter Data', type: 'PROCESS', level: 1 },
            { id: '3', label: 'Validate', type: 'PROCESS', level: 2 },
            { id: '4', label: 'Valid?', type: 'DECISION', level: 3 },
            { id: '5', label: 'Save', type: 'PROCESS', level: 4 },
            { id: '6', label: 'End', type: 'START_END', level: 5 },
            { id: '7', label: 'Retry', type: 'PROCESS', level: 2 }
          ],
          edges: [
            { source: '1', target: '2', label: '' },
            { source: '2', target: '3', label: '' },
            { source: '3', target: '4', label: '' },
            { source: '4', target: '5', label: 'Yes' },
            { source: '5', target: '6', label: '' },
            { source: '4', target: '7', label: 'No' },
            { source: '7', target: '2', label: '' }
          ]
        }
      }
    ],
    'mindmap': [
      {
        id: 'mm-1',
        title: 'Expanded Mind Map (Tree)',
        description: 'A tree mind map with more branches and leaves.',
        diagramType: 'mindmap-traditional',
        sample: {
          nodes: [
            { id: '1', label: 'Fruit', type: 'MAIN_TOPIC', level: 0 },
            { id: '2', label: 'Citrus', type: 'TOPIC', level: 1 },
            { id: '3', label: 'Berry', type: 'TOPIC', level: 1 },
            { id: '4', label: 'Tropical', type: 'TOPIC', level: 1 },
            { id: '5', label: 'Orange', type: 'SUBTOPIC', level: 2 },
            { id: '6', label: 'Lemon', type: 'SUBTOPIC', level: 2 },
            { id: '7', label: 'Strawberry', type: 'SUBTOPIC', level: 2 },
            { id: '8', label: 'Blueberry', type: 'SUBTOPIC', level: 2 },
            { id: '9', label: 'Mango', type: 'SUBTOPIC', level: 2 },
            { id: '10', label: 'Pineapple', type: 'SUBTOPIC', level: 2 }
          ],
          edges: [
            { source: '1', target: '2', label: '' },
            { source: '1', target: '3', label: '' },
            { source: '1', target: '4', label: '' },
            { source: '2', target: '5', label: '' },
            { source: '2', target: '6', label: '' },
            { source: '3', target: '7', label: '' },
            { source: '3', target: '8', label: '' },
            { source: '4', target: '9', label: '' },
            { source: '4', target: '10', label: '' }
          ]
        }
      },
      {
        id: 'mm-2',
        title: 'Expanded Mind Map (Radial)',
        description: 'A radial mind map with more branches.',
        diagramType: 'mindmap-radial',
        sample: {
          nodes: [
            { id: '1', label: 'Travel', type: 'MAIN_TOPIC', level: 0 },
            { id: '2', label: 'Car', type: 'TOPIC', level: 1 },
            { id: '3', label: 'Plane', type: 'TOPIC', level: 1 },
            { id: '4', label: 'Train', type: 'TOPIC', level: 1 },
            { id: '5', label: 'Bus', type: 'TOPIC', level: 1 },
            { id: '6', label: 'Sedan', type: 'SUBTOPIC', level: 2 },
            { id: '7', label: 'SUV', type: 'SUBTOPIC', level: 2 },
            { id: '8', label: 'Jet', type: 'SUBTOPIC', level: 2 },
            { id: '9', label: 'Propeller', type: 'SUBTOPIC', level: 2 },
            { id: '10', label: 'Express', type: 'SUBTOPIC', level: 2 },
            { id: '11', label: 'Local', type: 'SUBTOPIC', level: 2 }
          ],
          edges: [
            { source: '1', target: '2', label: '' },
            { source: '1', target: '3', label: '' },
            { source: '1', target: '4', label: '' },
            { source: '1', target: '5', label: '' },
            { source: '2', target: '6', label: '' },
            { source: '2', target: '7', label: '' },
            { source: '3', target: '8', label: '' },
            { source: '3', target: '9', label: '' },
            { source: '4', target: '10', label: '' },
            { source: '4', target: '11', label: '' }
          ]
        }
      }
    ]
  };

  const getDiagramTypeIcon = (type) => {
    switch (type) {
      case 'knowledge-graph': return '🕸️';
      case 'flowchart': return '📊';
      case 'mindmap': return '🧠';
      default: return '📋';
    }
  };

  const getDiagramTypeName = (type) => {
    switch (type) {
      case 'knowledge-graph': return 'Knowledge Graph';
      case 'flowchart': return 'Flowchart';
      case 'mindmap': return 'Mind Map';
      default: return 'Diagram';
    }
  };

  return (
    <div className={`space-y-${isMobile ? (isSmallPhone ? '2' : '4') : '6'}`}>
      <div className="text-center">
        <h3 className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-base') : 'text-lg'} font-semibold text-skin-text mb-1`}>Preset Examples</h3>
        <p className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'} text-skin-text-muted`}>See what different diagram types look like</p>
      </div>
      
      {Object.entries(examples).map(([diagramType, typeExamples]) => (
        <div key={diagramType} className={`space-y-${isMobile ? (isSmallPhone ? '1' : '2') : '3'}`}>
          <div className="flex items-center gap-2">
            <span className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-lg') : 'text-xl'}`}>{getDiagramTypeIcon(diagramType)}</span>
            <h4 className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : ''} font-semibold text-skin-text`}>{getDiagramTypeName(diagramType)} Examples</h4>
          </div>
          
          <div className={`grid gap-${isMobile ? (isSmallPhone ? '1' : '2') : '3'}`}>
            {typeExamples.map((example) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-skin-bg-accent rounded-lg border border-skin-border ${isMobile ? (isSmallPhone ? 'p-1.5' : 'p-3') : 'p-4'} hover:border-skin-accent/50 transition-colors`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <h5 className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : ''} font-semibold text-skin-text truncate`}>{example.title}</h5>
                    <p className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-sm'} text-skin-text-muted line-clamp-1`}>{example.description}</p>
                  </div>
                  <div className={`flex gap-${isMobile ? (isSmallPhone ? '0.5' : '1') : '2'} ml-1`}>
                    <button
                      onClick={() => onPreviewExample(example.sample, example.diagramType)}
                      className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-2') : 'p-2'} text-skin-text-muted hover:text-skin-text hover:bg-skin-border rounded-lg transition-colors`}
                      title="Preview"
                    >
                      <EyeIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
                    </button>
                    <button
                      onClick={() => onLoadExample(example.sample, example.diagramType)}
                      className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-2') : 'p-2'} text-skin-accent hover:bg-skin-accent/10 rounded-lg transition-colors`}
                      title="Load Example"
                    >
                      <PlayIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
                    </button>
                  </div>
                </div>
                
                <div className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-xs') : 'text-xs'} text-skin-text-muted`}>
                  {example.sample.nodes.length} nodes • {example.sample.edges.length} connections
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PresetExamples; 