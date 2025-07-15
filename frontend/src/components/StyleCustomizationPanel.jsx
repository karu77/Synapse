

import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const ENTITY_TYPES = [
  'PERSON',
  'ORG',
  'LOCATION',
  'DATE',
  'EVENT',
  'PRODUCT',
  'CONCEPT',
  'JOB_TITLE',
  'FIELD_OF_STUDY',
  'THEORY',
  'ART_WORK',
  // Flowchart types
  'START_END',
  'PROCESS',
  'DECISION',
  'INPUT_OUTPUT',
  'CONNECTOR',
  'DOCUMENT',
  'DELAY',
  'MERGE',
  'SUBROUTINE',
  'MANUAL_LOOP',
  'DATABASE',
  'DISPLAY',
  // Mindmap types
  'TOPIC',
  'SUBTOPIC',
]

const FLOWCHART_TYPES = [
  'START_END',
  'PROCESS',
  'DECISION',
  'INPUT_OUTPUT',
  'CONNECTOR',
  'DOCUMENT',
  'DELAY',
  'MERGE',
  'SUBROUTINE',
  'MANUAL_LOOP',
  'DATABASE',
  'DISPLAY',
]

const MINDMAP_LEVELS = [
  { level: 0, label: 'Central Topic' },
  { level: 1, label: 'Main Branches' },
  { level: 2, label: 'Secondary Branches' },
  { level: 3, label: 'Tertiary Branches' },
  { level: 4, label: 'Fourth Level' },
]

const NODE_SHAPES = [
  'sphere',
  'ellipse',
  'circle',
  'database',
  'box',
  'diamond',
  'dot',
  'star',
  'triangle',
  'square',
]

const EDGE_STYLES = ['continuous', 'curvedCW', 'curvedCCW', 'dynamic']

const StyleCustomizationPanel = ({ options, onUpdate, onReset, diagramType = 'knowledge-graph', isMobile = false, isSmallPhone = false, isMediumPhone = false }) => {
  const handleNodeShapeChange = (entityType, shape) => {
    onUpdate({
      ...options,
      nodeShapes: {
        ...options.nodeShapes,
        [entityType]: shape,
      },
    })
  }

  const handleIncrement = (path, step = 1) => {
    const keys = path.split('.')
    const currentValue = keys.reduce((obj, key) => obj?.[key], options) || 0
    const newValue = currentValue + step
    
    const newOptions = { ...options }
    let current = newOptions
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = newValue
    
    onUpdate(newOptions)
  }

  const handleDecrement = (path, step = 1) => {
    const keys = path.split('.')
    const currentValue = keys.reduce((obj, key) => obj?.[key], options) || 0
    const newValue = currentValue - step
    
    const newOptions = { ...options }
    let current = newOptions
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }
    current[keys[keys.length - 1]] = newValue
    
    onUpdate(newOptions)
  }

  const handleEdgeStyleChange = (e) => {
    onUpdate({
      ...options,
      edgeStyle: e.target.value,
    })
  }

  const handleMindmapColorChange = (level, color) => {
    onUpdate({
      ...options,
      mindmapColors: {
        ...options.mindmapColors,
        [level]: color,
      },
    })
  }

  const handleFlowchartColorChange = (type, color) => {
    onUpdate({
      ...options,
      flowchartColors: {
        ...options.flowchartColors,
        [type]: color,
      },
    })
  }

  const renderKnowledgeGraphCustomization = () => (
    <>
      <h4 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} font-semibold text-skin-text pt-2`}>Node Shapes</h4>
      {ENTITY_TYPES.map((type) => (
        <div key={type} className={`grid grid-cols-2 items-center ${isMobile ? (isSmallPhone ? 'gap-2' : 'gap-4') : 'gap-4'}`}>
          <label className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted`}>{type}</label>
          <select
            value={options.nodeShapes[type] || 'sphere'}
            onChange={(e) => handleNodeShapeChange(type, e.target.value)}
            className={`w-full ${isMobile ? (isSmallPhone ? 'p-1.5' : 'p-2') : 'p-2'} bg-skin-bg border border-skin-border rounded-lg text-skin-text ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'}`}
          >
            {NODE_SHAPES.map((shape) => (
              <option key={shape} value={shape}>
                {shape}
              </option>
            ))}
          </select>
        </div>
      ))}
    </>
  )

  const renderMindmapCustomization = () => (
    <>
      <h4 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} font-semibold text-skin-text pt-2`}>Level Colors</h4>
      {MINDMAP_LEVELS.map(({ level, label }) => (
        <div key={level} className={`grid grid-cols-2 items-center ${isMobile ? (isSmallPhone ? 'gap-2' : 'gap-4') : 'gap-4'}`}>
          <label className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted`}>{label}</label>
          <input
            type="color"
            value={options.mindmapColors?.[level] || '#7c3aed'}
            onChange={(e) => handleMindmapColorChange(level, e.target.value)}
            className={`w-full ${isMobile ? (isSmallPhone ? 'h-6' : 'h-8') : 'h-8'} p-1 bg-skin-bg border border-skin-border rounded-lg`}
          />
        </div>
      ))}
      <div className={`pt-${isMobile ? (isSmallPhone ? '3' : '4') : '4'}`}>
        <h4 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} font-semibold text-skin-text mb-2`}>Branch Spacing</h4>
        <div className={`space-y-${isMobile ? (isSmallPhone ? '1.5' : '2') : '2'}`}>
          <div>
            <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted mb-2`}>
              Node Spacing: <span className="font-semibold text-skin-text">{options.mindmapSpacing?.nodeSpacing || 180}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrement('mindmapSpacing.nodeSpacing', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
              <input
                type="number"
                min={100}
                max={300}
                step={10}
                value={options.mindmapSpacing?.nodeSpacing || 180}
                onChange={(e) => onUpdate({
                  ...options,
                  mindmapSpacing: {
                    ...options.mindmapSpacing,
                    nodeSpacing: parseInt(e.target.value),
                  },
                })}
                className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
              />
              <button
                onClick={() => handleIncrement('mindmapSpacing.nodeSpacing', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
            </div>
          </div>
          <div className={`${isMobile ? (isSmallPhone ? 'mb-1.5' : 'mb-2') : 'mb-2'}`}>
            <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted mb-2`}>
              Level Separation: <span className="font-semibold text-skin-text">{options.mindmapSpacing?.levelSeparation || 200}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrement('mindmapSpacing.levelSeparation', 20)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
              <input
                type="number"
                min={100}
                max={400}
                step={20}
                value={options.mindmapSpacing?.levelSeparation || 200}
                onChange={(e) => onUpdate({
                  ...options,
                  mindmapSpacing: {
                    ...options.mindmapSpacing,
                    levelSeparation: parseInt(e.target.value),
                  },
                })}
                className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
              />
              <button
                onClick={() => handleIncrement('mindmapSpacing.levelSeparation', 20)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const renderFlowchartCustomization = () => (
    <>
      <h4 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} font-semibold text-skin-text pt-2`}>Node Colors</h4>
      {FLOWCHART_TYPES.map((type) => {
        const getTypeLabel = (type) => {
          switch (type) {
            case 'START_END': return 'Start/End'
            case 'PROCESS': return 'Process'
            case 'DECISION': return 'Decision'
            case 'INPUT_OUTPUT': return 'Input/Output'
            case 'CONNECTOR': return 'Connector'
            case 'DOCUMENT': return 'Document'
            case 'DELAY': return 'Delay'
            case 'MERGE': return 'Merge'
            case 'SUBROUTINE': return 'Subroutine'
            case 'MANUAL_LOOP': return 'Manual Loop'
            case 'DATABASE': return 'Database'
            case 'DISPLAY': return 'Display'
            default: return type.charAt(0) + type.slice(1).toLowerCase()
          }
        }
        
        return (
          <div key={type} className={`grid grid-cols-2 items-center ${isMobile ? (isSmallPhone ? 'gap-2' : 'gap-4') : 'gap-4'}`}>
            <label className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted`}>
              {getTypeLabel(type)}
            </label>
            <input
              type="color"
              value={options.flowchartColors?.[type] || '#2563eb'}
              onChange={(e) => handleFlowchartColorChange(type, e.target.value)}
              className={`w-full ${isMobile ? (isSmallPhone ? 'h-6' : 'h-8') : 'h-8'} p-1 bg-skin-bg border border-skin-border rounded-lg`}
            />
          </div>
        )
      })}
      <div className={`pt-${isMobile ? (isSmallPhone ? '3' : '4') : '4'}`}>
        <h4 className={`${isMobile ? (isSmallPhone ? 'text-sm' : 'text-base') : 'text-base'} font-semibold text-skin-text mb-2`}>Flow Spacing</h4>
        <div className={`space-y-${isMobile ? (isSmallPhone ? '1.5' : '2') : '2'}`}>
          <div>
            <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted mb-2`}>
              Node Spacing: <span className="font-semibold text-skin-text">{options.flowchartSpacing?.nodeSpacing || 100}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrement('flowchartSpacing.nodeSpacing', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
              <input
                type="number"
                min={50}
                max={200}
                step={10}
                value={options.flowchartSpacing?.nodeSpacing || 100}
                onChange={(e) => onUpdate({
                  ...options,
                  flowchartSpacing: {
                    ...options.flowchartSpacing,
                    nodeSpacing: parseInt(e.target.value),
                  },
                })}
                className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
              />
              <button
                onClick={() => handleIncrement('flowchartSpacing.nodeSpacing', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
            </div>
          </div>
          <div className={`${isMobile ? (isSmallPhone ? 'mb-1.5' : 'mb-2') : 'mb-2'}`}>
            <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} text-skin-text-muted mb-2`}>
              Level Separation: <span className="font-semibold text-skin-text">{options.flowchartSpacing?.levelSeparation || 150}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDecrement('flowchartSpacing.levelSeparation', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
              <input
                type="number"
                min={100}
                max={300}
                step={10}
                value={options.flowchartSpacing?.levelSeparation || 150}
                onChange={(e) => onUpdate({
                  ...options,
                  flowchartSpacing: {
                    ...options.flowchartSpacing,
                    levelSeparation: parseInt(e.target.value),
                  },
                })}
                className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
              />
              <button
                onClick={() => handleIncrement('flowchartSpacing.levelSeparation', 10)}
                className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
              >
                <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  const getDiagramTypeName = () => {
    switch (diagramType) {
      case 'mindmap':
        return 'Mind Map'
      case 'flowchart':
        return 'Flowchart'
      default:
        return 'Knowledge Graph'
    }
  }

  return (
    <div className={`space-y-${isMobile ? (isSmallPhone ? '3' : '4') : '4'}`}>
      <div className="flex justify-between items-center">
        <h3 className={`${isMobile ? (isSmallPhone ? 'text-base' : 'text-lg') : 'text-lg'} font-semibold text-skin-text`}>{getDiagramTypeName()} Styles</h3>
        <button
          onClick={onReset}
          className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-semibold text-skin-text-muted hover:text-skin-text transition-colors`}
        >
          Reset
        </button>
      </div>
      <div className={`space-y-${isMobile ? (isSmallPhone ? '3' : '4') : '4'} max-h-60 overflow-y-auto pr-2 scrollbar-hide`}>
        <div>
          <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-medium text-skin-text-muted mb-1`}>
            Edge Style
          </label>
          <select
            value={options.edgeStyle}
            onChange={handleEdgeStyleChange}
            className={`w-full ${isMobile ? (isSmallPhone ? 'p-1.5' : 'p-2') : 'p-2'} bg-skin-bg border border-skin-border rounded-lg text-skin-text ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'}`}
          >
            {EDGE_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
        
        {diagramType === 'knowledge-graph' && renderKnowledgeGraphCustomization()}
        {diagramType === 'mindmap' && renderMindmapCustomization()}
        {diagramType === 'flowchart' && renderFlowchartCustomization()}
      </div>
    </div>
  )
}

export default StyleCustomizationPanel 