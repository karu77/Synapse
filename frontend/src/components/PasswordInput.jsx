import { useState } from 'react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const PasswordInput = ({ label, value, onChange, required = false, id, name }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState)
  }

  return (
    <div className="mb-4">
      <label htmlFor={id || name} className="block text-sm font-medium text-skin-text-muted mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPasswordVisible ? 'text' : 'password'}
          id={id || name}
          name={name || id}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-2 border border-skin-border rounded-lg bg-skin-bg-accent focus:ring-2 focus:ring-skin-accent focus:border-skin-accent transition-colors duration-200"
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-skin-text-muted hover:text-skin-text"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? (
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