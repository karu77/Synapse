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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="text-sm font-semibold text-skin-text-muted hover:text-skin-text transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
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
      </div>
    </div>
  )
}

export default StyleCustomizationPanel 