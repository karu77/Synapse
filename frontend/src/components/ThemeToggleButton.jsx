import { useTheme } from '../contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallPhone, setIsSmallPhone] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsSmallPhone(width < 375)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <button
      onClick={(e) => {
        console.log('Theme toggle button clicked!')
        e.preventDefault()
        e.stopPropagation()
        toggleTheme()
      }}
      className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded-full text-skin-text hover:bg-skin-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-skin-border transition-all hover:scale-110 pointer-events-auto flex items-center justify-center`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className={`${isMobile ? (isSmallPhone ? 'h-3.5 w-3.5' : 'h-4 w-4') : 'h-6 w-6'} flex-shrink-0`} />
      ) : (
        <SunIcon className={`${isMobile ? (isSmallPhone ? 'h-3.5 w-3.5' : 'h-4 w-4') : 'h-6 w-6'} flex-shrink-0`} />
      )}
    </button>
  )
}

export default ThemeToggleButton 