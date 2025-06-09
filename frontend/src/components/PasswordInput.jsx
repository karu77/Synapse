import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const PasswordInput = ({ label, value, onChange, required = false, id, name }) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div>
      <label htmlFor={id || name} className="block text-sm font-medium text-skin-text">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id || name}
          name={name || id}
          value={value}
          onChange={onChange}
          required={required}
          className="block w-full rounded-md border border-skin-border bg-skin-bg px-3 py-2 pr-10 text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-skin-btn-primary focus:border-skin-btn-primary"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-skin-text-muted hover:text-skin-text transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default PasswordInput 