/**
 * @typedef {'PERSON' | 'ORG' | 'LOCATION' | 'DATE' | 'EVENT' | 'PRODUCT' | 'CONCEPT' | 'JOB_TITLE' | 'FIELD_OF_STUDY' | 'THEORY' | 'ART_WORK'} EntityType
 */

/**
 * @typedef {'positive' | 'negative' | 'neutral'} Sentiment
 */

/**
 * @typedef {Object} Node
 * @property {string} id
 * @property {string} label
 * @property {EntityType} type
 * @property {Sentiment} [sentiment]
 */

/**
 * @typedef {Object} Edge
 * @property {string} source
 * @property {string} target
 * @property {string} label
 * @property {Sentiment} [sentiment]
 */

/**
 * @typedef {Object} GraphData
 * @property {Node[]} nodes
 * @property {Edge[]} edges
 */

/**
 * @typedef {Object} TextInputProps
 * @property {(text: string, imageDesc?: string, audioDesc?: string) => Promise<void>} onSubmit
 * @property {boolean} isProcessing
 */

/**
 * @typedef {Object} GraphVisualizationProps
 * @property {GraphData} data
 * @property {boolean} isLoading
 */

// This file is for JSDoc type definitions.
export {}; 