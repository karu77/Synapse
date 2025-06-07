const darkThemeColors = {
  PERSON: '#4f46e5', // Vibrant Indigo
  ORG: '#10b981', // Strong Emerald
  LOCATION: '#0ea5e9', // Bright Sky Blue
  DATE: '#a855f7', // Rich Purple
  EVENT: '#ec4899', // Vibrant Pink
  PRODUCT: '#22d3ee', // Bright Cyan
  CONCEPT: '#A2D9CE', // Soft Teal
  JOB_TITLE: '#f59e0b', // Amber
  FIELD_OF_STUDY: '#84cc16', // Lime
  THEORY: '#d946ef', // Fuchsia
  ART_WORK: '#fb923c', // Orange
  SPECIAL: '#FFD700', // Gold
  DEFAULT: '#6366f1', // Default
}

const lightThemeColors = {
  PERSON: '#3730a3', // Dark Indigo
  ORG: '#059669', // Dark Emerald
  LOCATION: '#0284c7', // Dark Sky Blue
  DATE: '#7e22ce', // Dark Purple
  EVENT: '#db2777', // Dark Pink
  PRODUCT: '#0891b2', // Dark Cyan
  CONCEPT: '#52525b', // Dark Zinc
  JOB_TITLE: '#b45309', // Dark Amber
  FIELD_OF_STUDY: '#65a30d', // Dark Lime
  THEORY: '#a21caf', // Dark Fuchsia
  ART_WORK: '#ea580c', // Dark Orange
  SPECIAL: '#ca8a04', // Dark Gold
  DEFAULT: '#4338ca', // Default
}

export const getNodeColor = (type, theme = 'dark') => {
  const colors = theme === 'light' ? lightThemeColors : darkThemeColors
  return colors[type] || colors.DEFAULT
}

export const getEdgeColor = (sentiment) => {
  const colors = {
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#9E9E9E',
  }
  return sentiment ? colors[sentiment] : '#9E9E9E'
} 