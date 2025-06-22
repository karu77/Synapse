import { useEffect, useState } from 'react'

const Tooltip = ({ visible, content, x, y }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (visible && x !== undefined && y !== undefined) {
      // Calculate optimal position to keep tooltip in viewport
      const tooltipWidth = 280
      const tooltipHeight = 120
      const padding = 16
      
      let adjustedX = x
      let adjustedY = y - tooltipHeight - 10 // Position above cursor by default
      
      // Adjust horizontal position if tooltip would overflow
      if (adjustedX + tooltipWidth > window.innerWidth - padding) {
        adjustedX = window.innerWidth - tooltipWidth - padding
      }
      if (adjustedX < padding) {
        adjustedX = padding
      }
      
      // Adjust vertical position if tooltip would overflow
      if (adjustedY < padding) {
        adjustedY = y + 20 // Position below cursor instead
      }
      if (adjustedY + tooltipHeight > window.innerHeight - padding) {
        adjustedY = window.innerHeight - tooltipHeight - padding
      }
      
      setPosition({ x: adjustedX, y: adjustedY })
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [visible, x, y])

  if (!isVisible || !content) return null

  return (
    <div
      className="fixed z-[100] pointer-events-none transition-all duration-200 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white rounded-lg shadow-2xl border border-gray-700/50 dark:border-gray-600/50 p-3 max-w-xs animate-fade-in">
        <div 
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900/95 dark:border-t-gray-800/95"></div>
        </div>
      </div>
      
      <style jsx>{`
        .tooltip-content {
          line-height: 1.4;
        }
        .tooltip-title {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
          color: #ffffff;
        }
        .tooltip-type {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .tooltip-desc {
          font-size: 12px;
          color: #e2e8f0;
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .tooltip-sentiment {
          font-size: 11px;
          color: #cbd5e1;
          font-style: italic;
        }
        .animate-fade-in {
          animation: fadeInTooltip 0.2s ease-out;
        }
        @keyframes fadeInTooltip {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(4px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

export default Tooltip 