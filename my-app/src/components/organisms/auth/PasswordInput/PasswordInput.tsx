'use client';
import { useState } from 'react';
import PasswordStrength from '../PasswordStrength/PasswordStrength';
import styles from './PasswordInput.module.css';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  showStrength = false,
  required = false,
  disabled = false,
  error,
  onFocus,
  onBlur
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <div className={styles.passwordInput}>
      <div className={styles.inputContainer}>
        <input
          type={showPassword ? "text" : "password"}
          className={`${styles.input} ${error ? styles.error : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      
      {showStrength && focused && value && (
        <PasswordStrength password={value} />
      )}
      
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}