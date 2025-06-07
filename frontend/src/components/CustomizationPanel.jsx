import { useState } from 'react'

const CustomizationPanel = ({ options, onUpdate, onReset }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'range' || type === 'number' ? parseFloat(value) : value
    onUpdate({
      ...options,
      [name]: parsedValue,
    })
  }

  if (!isOpen) {
    return (
      <div className="mt-6 pt-6 border-t border-skin-border">
        <button
          onClick={() => setIsOpen(true)}
          className="text-lg font-bold text-skin-text w-full text-left"
        >
          Graph Customization &raquo;
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 pt-6 border-t border-skin-border">
      <div className="flex justify-between items-center mb-4">
        <h3
          className="text-xl font-bold text-skin-text cursor-pointer"
          onClick={() => setIsOpen(false)}
        >
          Graph Customization
        </h3>
        <button onClick={onReset} className="text-sm text-skin-text-muted hover:text-skin-text">
          Reset to Default
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-skin-text">
            Gravity: {options.gravitationalConstant}
          </label>
          <input
            type="range"
            name="gravitationalConstant"
            min={-20000}
            max={0}
            step={100}
            value={options.gravitationalConstant}
            onChange={handleChange}
            className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-skin-text">
            Spring Length: {options.springLength}
          </label>
          <input
            type="range"
            name="springLength"
            min={50}
            max={500}
            step={10}
            value={options.springLength}
            onChange={handleChange}
            className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-skin-text">
            Damping: {options.damping}
          </label>
          <input
            type="range"
            name="damping"
            min={0}
            max={1}
            step={0.01}
            value={options.damping}
            onChange={handleChange}
            className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}

export default CustomizationPanel 