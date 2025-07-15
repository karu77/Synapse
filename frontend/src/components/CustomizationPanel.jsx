import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

const CustomizationPanel = ({ options, onUpdate, onReset, isMobile = false, isSmallPhone = false, isMediumPhone = false }) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'range' || type === 'number' ? parseFloat(value) : value
    onUpdate({
      ...options,
      [name]: parsedValue,
    })
  }

  const handleIncrement = (name, step = 1) => {
    const currentValue = options[name]
    const newValue = currentValue + step
    onUpdate({
      ...options,
      [name]: newValue,
    })
  }

  const handleDecrement = (name, step = 1) => {
    const currentValue = options[name]
    const newValue = currentValue - step
    onUpdate({
      ...options,
      [name]: newValue,
    })
  }

  return (
    <div className={`space-y-${isMobile ? (isSmallPhone ? '3' : '4') : '4'} ${isMobile ? (isSmallPhone ? 'pb-8' : 'pb-12') : 'pb-12'}`}>
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className={`${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-semibold text-skin-text-muted hover:text-skin-text transition-colors`}
        >
          Reset
        </button>
      </div>
      
      <div>
        <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-medium text-skin-text-muted mb-2`}>
          Gravity: <span className="font-semibold text-skin-text">{options.gravitationalConstant}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDecrement('gravitationalConstant', 500)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
          <input
            type="number"
            name="gravitationalConstant"
            min={-40000}
            max={-1000}
            step={500}
            value={options.gravitationalConstant}
            onChange={handleChange}
            className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
          />
          <button
            onClick={() => handleIncrement('gravitationalConstant', 500)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
        </div>
      </div>
      
      <div>
        <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-medium text-skin-text-muted mb-2`}>
          Spring Length: <span className="font-semibold text-skin-text">{options.springLength}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDecrement('springLength', 10)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
          <input
            type="number"
            name="springLength"
            min={50}
            max={500}
            step={10}
            value={options.springLength}
            onChange={handleChange}
            className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
          />
          <button
            onClick={() => handleIncrement('springLength', 10)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
        </div>
      </div>
      
      <div>
        <label className={`block ${isMobile ? (isSmallPhone ? 'text-xs' : 'text-sm') : 'text-sm'} font-medium text-skin-text-muted mb-2`}>
          Damping: <span className="font-semibold text-skin-text">{options.damping}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDecrement('damping', 0.01)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronDownIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
          <input
            type="number"
            name="damping"
            min={0.05}
            max={0.5}
            step={0.01}
            value={options.damping}
            onChange={handleChange}
            className={`flex-1 ${isMobile ? (isSmallPhone ? 'p-1.5 text-xs' : 'p-2 text-sm') : 'p-2 text-sm'} bg-skin-bg border border-skin-border rounded text-center`}
          />
          <button
            onClick={() => handleIncrement('damping', 0.01)}
            className={`${isMobile ? (isSmallPhone ? 'p-1' : 'p-1.5') : 'p-2'} rounded border border-skin-border hover:bg-skin-border transition-colors flex items-center justify-center`}
          >
            <ChevronUpIcon className={`${isMobile ? (isSmallPhone ? 'h-3 w-3' : 'h-4 w-4') : 'h-4 w-4'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomizationPanel 