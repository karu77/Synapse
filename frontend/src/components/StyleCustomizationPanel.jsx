import { useState } from 'react'

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

const StyleCustomizationPanel = ({ options, onUpdate, onReset }) => {
  const [isOpen, setIsOpen] = useState(false)

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

  if (!isOpen) {
    return (
      <div className="mt-6 pt-6 border-t border-skin-border">
        <button
          onClick={() => setIsOpen(true)}
          className="text-lg font-bold text-skin-text w-full text-left"
        >
          Style Customization &raquo;
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-skin-border">
      <div className="flex justify-between items-center mb-4">
        <h3
          className="text-xl font-bold text-skin-text cursor-pointer"
          onClick={() => setIsOpen(false)}
        >
          Style Customization
        </h3>
        <button onClick={onReset} className="text-sm text-skin-text-muted hover:text-skin-text">
          Reset to Default
        </button>
      </div>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
        <div>
          <label className="block text-sm font-medium text-skin-text mb-2">Edge Style</label>
          <select
            value={options.edgeStyle}
            onChange={handleEdgeStyleChange}
            className="w-full p-2 bg-skin-bg-accent border border-skin-border rounded-lg text-skin-text"
          >
            {EDGE_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </div>
        <h4 className="text-base font-semibold text-skin-text pt-2">Node Shapes</h4>
        {ENTITY_TYPES.map((type) => (
          <div key={type} className="grid grid-cols-2 items-center">
            <label className="text-sm text-skin-text-muted">{type}</label>
            <select
              value={options.nodeShapes[type] || 'sphere'}
              onChange={(e) => handleNodeShapeChange(type, e.target.value)}
              className="w-full p-2 bg-skin-bg-accent border border-skin-border rounded-lg text-skin-text"
            >
              {NODE_SHAPES.map((shape) => (
                <option key={shape} value={shape}>
                  {shape}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StyleCustomizationPanel 