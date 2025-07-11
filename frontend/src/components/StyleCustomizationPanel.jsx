

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

const StyleCustomizationPanel = ({ options, onUpdate, onReset, diagramType = 'knowledge-graph' }) => {
  const handleNodeShapeChange = (entityType, shape) => {
    onUpdate({
      ...options,
      nodeShapes: {
        ...options.nodeShapes,
        [entityType]: shape,
      },
    })
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
      <h4 className="text-base font-semibold text-skin-text pt-2">Node Shapes</h4>
      {ENTITY_TYPES.map((type) => (
        <div key={type} className="grid grid-cols-2 items-center gap-4">
          <label className="text-sm text-skin-text-muted">{type}</label>
          <select
            value={options.nodeShapes[type] || 'sphere'}
            onChange={(e) => handleNodeShapeChange(type, e.target.value)}
            className="w-full p-2 bg-skin-bg border border-skin-border rounded-lg text-skin-text"
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
      <h4 className="text-base font-semibold text-skin-text pt-2">Level Colors</h4>
      {MINDMAP_LEVELS.map(({ level, label }) => (
        <div key={level} className="grid grid-cols-2 items-center gap-4">
          <label className="text-sm text-skin-text-muted">{label}</label>
          <input
            type="color"
            value={options.mindmapColors?.[level] || '#7c3aed'}
            onChange={(e) => handleMindmapColorChange(level, e.target.value)}
            className="w-full h-8 p-1 bg-skin-bg border border-skin-border rounded-lg"
          />
        </div>
      ))}
      <div className="pt-4">
        <h4 className="text-base font-semibold text-skin-text mb-2">Branch Spacing</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-skin-text-muted mb-1">
              Node Spacing: <span className="font-semibold text-skin-text">{options.mindmapSpacing?.nodeSpacing || 180}</span>
            </label>
            <input
              type="range"
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
              className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm text-skin-text-muted mb-1">
              Level Separation: <span className="font-semibold text-skin-text">{options.mindmapSpacing?.levelSeparation || 200}</span>
            </label>
            <input
              type="range"
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
              className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </>
  )

  const renderFlowchartCustomization = () => (
    <>
      <h4 className="text-base font-semibold text-skin-text pt-2">Node Colors</h4>
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
          <div key={type} className="grid grid-cols-2 items-center gap-4">
            <label className="text-sm text-skin-text-muted">
              {getTypeLabel(type)}
            </label>
            <input
              type="color"
              value={options.flowchartColors?.[type] || '#2563eb'}
              onChange={(e) => handleFlowchartColorChange(type, e.target.value)}
              className="w-full h-8 p-1 bg-skin-bg border border-skin-border rounded-lg"
            />
          </div>
        )
      })}
      <div className="pt-4">
        <h4 className="text-base font-semibold text-skin-text mb-2">Flow Spacing</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm text-skin-text-muted mb-1">
              Node Spacing: <span className="font-semibold text-skin-text">{options.flowchartSpacing?.nodeSpacing || 100}</span>
            </label>
            <input
              type="range"
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
              className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm text-skin-text-muted mb-1">
              Level Separation: <span className="font-semibold text-skin-text">{options.flowchartSpacing?.levelSeparation || 150}</span>
            </label>
            <input
              type="range"
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
              className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
            />
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-skin-text">{getDiagramTypeName()} Styles</h3>
        <button
          onClick={onReset}
          className="text-sm font-semibold text-skin-text-muted hover:text-skin-text transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
        <div>
          <label className="block text-sm font-medium text-skin-text-muted mb-1">
            Edge Style
          </label>
          <select
            value={options.edgeStyle}
            onChange={handleEdgeStyleChange}
            className="w-full p-2 bg-skin-bg border border-skin-border rounded-lg text-skin-text"
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