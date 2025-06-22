import { useTheme } from '../contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={(e) => {
        console.log('Theme toggle button clicked!')
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }}
      className="p-2 rounded-full text-skin-text hover:bg-skin-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-border transition-all hover:scale-110 pointer-events-auto"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="h-6 w-6" />
      ) : (
        <SunIcon className="h-6 w-6" />
      )}
    </button>
  )
}

export default ThemeToggleButton 