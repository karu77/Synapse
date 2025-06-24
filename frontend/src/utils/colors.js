// A modern, vibrant, and accessible color palette based on Tailwind CSS colors.

const darkThemeColors = {
  PERSON: '#818cf8', // Indigo 400
  ORG: '#34d399', // Emerald 400
  LOCATION: '#38bdf8', // Sky 400
  DATE: '#c084fc', // Purple 400
  EVENT: '#f472b6', // Pink 400
  PRODUCT: '#22d3ee', // Cyan 400
  CONCEPT: '#a78bfa', // Violet 400
  JOB_TITLE: '#fbbf24', // Amber 400
  FIELD_OF_STUDY: '#a3e635', // Lime 400
  THEORY: '#e879f9', // Fuchsia 400
  ART_WORK: '#fb923c', // Orange 400
  // Flowchart node types
  START_END: '#10b981', // Emerald 500 - Start/End (oval)
  PROCESS: '#60a5fa', // Blue 400 - Process (rectangle)
  DECISION: '#f59e0b', // Amber 500 - Decision (diamond)
  INPUT_OUTPUT: '#8b5cf6', // Violet 500 - Input/Output (parallelogram)
  CONNECTOR: '#6b7280', // Gray 500 - Connector (circle)
  DOCUMENT: '#f472b6', // Pink 400 - Document (rectangle with wavy bottom)
  DELAY: '#fb923c', // Orange 400 - Delay (D-shape)
  MERGE: '#22d3ee', // Cyan 400 - Merge (inverted triangle)
  SUBROUTINE: '#34d399', // Emerald 400 - Subroutine (double rectangle)
  MANUAL_LOOP: '#c084fc', // Purple 400 - Manual Loop (trapezoid)
  DATABASE: '#a78bfa', // Violet 400 - Database (cylinder)
  DISPLAY: '#38bdf8', // Sky 400 - Display (rounded rectangle)
  // Mindmap node types
  TOPIC: '#8b5cf6', // Violet 500
  SUBTOPIC: '#06b6d4', // Cyan 500
  DEFAULT: '#94a3b8', // Slate 400
}

const lightThemeColors = {
  PERSON: '#6366f1', // Indigo 500
  ORG: '#10b981', // Emerald 500
  LOCATION: '#0ea5e9', // Sky 500
  DATE: '#a855f7', // Purple 500
  EVENT: '#ec4899', // Pink 500
  PRODUCT: '#06b6d4', // Cyan 500
  CONCEPT: '#8b5cf6', // Violet 500
  JOB_TITLE: '#f59e0b', // Amber 500
  FIELD_OF_STUDY: '#84cc16', // Lime 500
  THEORY: '#d946ef', // Fuchsia 500
  ART_WORK: '#f97316', // Orange 500
  // Flowchart node types
  START_END: '#059669', // Emerald 600 - Start/End (oval)
  PROCESS: '#3b82f6', // Blue 500 - Process (rectangle)
  DECISION: '#d97706', // Amber 600 - Decision (diamond)
  INPUT_OUTPUT: '#7c3aed', // Violet 600 - Input/Output (parallelogram)
  CONNECTOR: '#4b5563', // Gray 600 - Connector (circle)
  DOCUMENT: '#db2777', // Pink 600 - Document (rectangle with wavy bottom)
  DELAY: '#ea580c', // Orange 600 - Delay (D-shape)
  MERGE: '#0891b2', // Cyan 600 - Merge (inverted triangle)
  SUBROUTINE: '#047857', // Emerald 700 - Subroutine (double rectangle)
  MANUAL_LOOP: '#9333ea', // Purple 600 - Manual Loop (trapezoid)
  DATABASE: '#6d28d9', // Violet 700 - Database (cylinder)
  DISPLAY: '#0284c7', // Sky 600 - Display (rounded rectangle)
  // Mindmap node types
  TOPIC: '#7c3aed', // Violet 600
  SUBTOPIC: '#0891b2', // Cyan 600
  DEFAULT: '#64748b', // Slate 500
}

// Mind map level colors for dark theme
const darkMindmapLevelColors = {
  0: '#a855f7', // Central topic - Purple 500 (most important)
  1: '#3b82f6', // Level 1 - Blue 500 (main branches)
  2: '#10b981', // Level 2 - Emerald 500 (secondary branches)
  3: '#f59e0b', // Level 3 - Amber 500 (details)
  4: '#ef4444', // Level 4 - Red 500 (specific details)
  5: '#ec4899', // Level 5+ - Pink 500 (deepest details)
}

// Mind map level colors for light theme
const lightMindmapLevelColors = {
  0: '#7c3aed', // Central topic - Purple 600 (most important)
  1: '#2563eb', // Level 1 - Blue 600 (main branches)
  2: '#059669', // Level 2 - Emerald 600 (secondary branches)
  3: '#d97706', // Level 3 - Amber 600 (details)
  4: '#dc2626', // Level 4 - Red 600 (specific details)
  5: '#db2777', // Level 5+ - Pink 600 (deepest details)
}

// Edge colors that work well on both light and dark backgrounds
const edgeSentimentColors = {
  positive: '#22c55e', // Green 500
  negative: '#ef4444', // Red 500
  neutral: '#a1a1aa', // Zinc 400
}

export const getNodeColor = (node, diagramType = 'knowledge-graph', theme = 'dark') => {
  if (diagramType === 'mindmap' && node.level !== undefined) {
    const levelColors = theme === 'light' ? lightMindmapLevelColors : darkMindmapLevelColors
    return levelColors[node.level] || levelColors[5] // Default to level 5+ color if level is higher
  }
  
  const colors = theme === 'light' ? lightThemeColors : darkThemeColors
  const nodeType = node.type || node
  return colors[nodeType] || colors.DEFAULT
}

export const getEdgeColor = (sentiment) => {
  return sentiment ? edgeSentimentColors[sentiment] : edgeSentimentColors.neutral
} 