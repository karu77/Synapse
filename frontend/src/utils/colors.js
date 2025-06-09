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
  DEFAULT: '#64748b', // Slate 500
}

// Edge colors that work well on both light and dark backgrounds
const edgeSentimentColors = {
  positive: '#22c55e', // Green 500
  negative: '#ef4444', // Red 500
  neutral: '#a1a1aa', // Zinc 400
}

export const getNodeColor = (type, theme = 'dark') => {
  const colors = theme === 'light' ? lightThemeColors : darkThemeColors
  return colors[type] || colors.DEFAULT
}

export const getEdgeColor = (sentiment) => {
  return sentiment ? edgeSentimentColors[sentiment] : edgeSentimentColors.neutral
} 