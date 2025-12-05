'use client';
import styles from './PasswordStrength.module.css';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  const strengthText = 
    strengthScore >= 4 ? "Strong" : 
    strengthScore >= 2 ? "Medium" : "Weak";

  const strengthPercentage = (strengthScore / 5) * 100;

  return (
    <div className={styles.strengthWrapper}>
      <div className={styles.strengthHeader}>
        <span className={styles.strengthLabel}>Password Strength</span>
        <span className={`${styles.strengthText} ${styles[strengthText.toLowerCase()]}`}>
          {strengthText}
        </span>
      </div>
      
      <div className={styles.strengthBar}>
        <div 
          className={`${styles.strengthFill} ${styles[strengthText.toLowerCase()]}`}
          style={{ width: `${strengthPercentage}%` }}
        />
      </div>
      
      <ul className={styles.requirements}>
        <li className={hasMinLength ? styles.valid : styles.invalid}>
          At least 8 characters
        </li>
        <li className={hasUppercase ? styles.valid : styles.invalid}>
          Uppercase letter
        </li>
        <li className={hasLowercase ? styles.valid : styles.invalid}>
          Lowercase letter
        </li>
        <li className={hasNumber ? styles.valid : styles.invalid}>
          Contains a number
        </li>
        <li className={hasSpecialChar ? styles.valid : styles.invalid}>
          Special character
        </li>
      </ul>
    </div>
  );
}