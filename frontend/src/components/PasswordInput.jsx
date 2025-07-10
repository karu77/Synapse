import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const PasswordInput = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  id,
  name,
  placeholder = "Enter your password",
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible)

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-skin-text-muted mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPasswordVisible ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-2 bg-skin-bg/80 border rounded-lg focus:outline-none focus:ring-2 transition text-black dark:text-white !opacity-100 ${
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-skin-border focus:border-skin-accent focus:ring-skin-accent/50'
          }`}
          required
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-skin-text-muted hover:text-skin-text"
        >
          {isPasswordVisible ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default PasswordInput