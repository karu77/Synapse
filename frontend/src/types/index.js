/**
 * @typedef {'PERSON' | 'ORG' | 'LOCATION' | 'DATE' | 'EVENT' | 'PRODUCT' | 'CONCEPT' | 'JOB_TITLE' | 'FIELD_OF_STUDY' | 'THEORY' | 'ART_WORK' | 'PROCESS' | 'DECISION' | 'START_END' | 'TOPIC' | 'SUBTOPIC'} EntityType
 */

/**
 * @typedef {'positive' | 'negative' | 'neutral'} Sentiment
 */

/**
 * @typedef {'knowledge-graph' | 'flowchart' | 'mindmap'} DiagramType
 */

/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} label
 * @property {EntityType} type
 * @property {Sentiment} [sentiment]
 * @property {string} [description]
 * @property {number} [level] - For mindmaps: hierarchy level (0 = center, 1 = main branches, etc.)
 * @property {boolean} [isDecision] - For flowcharts: whether this is a decision node
 * @property {boolean} [isStartEnd] - For flowcharts: whether this is a start/end node
 */

/**
 * @typedef {Object} Edge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {string} label
 * @property {Sentiment} [sentiment]
 * @property {string} [description]
 * @property {string} [condition] - For flowcharts: condition for decision branches (yes/no/true/false)
 * @property {number} [order] - For flowcharts: order of execution
 */

/**
 * @typedef {Object} GraphData
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 * @property {DiagramType} [diagramType]
 */

/**
 * @typedef {Object} TextInputProps
 * @property {(text: string, question: string, imageFile: File, audioFile: File, imageUrl: string, audioUrl: string, diagramType: DiagramType) => Promise<void>} onSubmit
 * @property {boolean} isProcessing
 */

/**
 * @typedef {Object} GraphVisualizationProps
 * @property {GraphData} data
 * @property {boolean} isLoading
 * @property {DiagramType} [diagramType]
 */

// This file is for JSDoc type definitions.
export {}; 