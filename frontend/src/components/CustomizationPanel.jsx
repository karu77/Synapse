

const CustomizationPanel = ({ options, onUpdate, onReset }) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target
    const parsedValue = type === 'range' || type === 'number' ? parseFloat(value) : value
    onUpdate({
      ...options,
      [name]: parsedValue,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="text-sm font-semibold text-skin-text-muted hover:text-skin-text transition-colors"
        >
          Reset
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-skin-text-muted">
          Gravity: <span className="font-semibold text-skin-text">{options.gravitationalConstant}</span>
        </label>
        <input
          type="range"
          name="gravitationalConstant"
          min={-40000}
          max={-1000}
          step={500}
          value={options.gravitationalConstant}
          onChange={handleChange}
          className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-skin-text-muted">
          Spring Length: <span className="font-semibold text-skin-text">{options.springLength}</span>
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
        <label className="block text-sm font-medium text-skin-text-muted">
          Damping: <span className="font-semibold text-skin-text">{options.damping}</span>
        </label>
        <input
          type="range"
          name="damping"
          min={0.05}
          max={0.5}
          step={0.01}
          value={options.damping}
          onChange={handleChange}
          className="w-full h-2 bg-skin-border rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}

export default CustomizationPanel 