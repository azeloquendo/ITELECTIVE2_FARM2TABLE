"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import styles from './checkEmail.module.css';

// Firebase imports
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from "../../../../utils/lib/firebase";

export default function CheckEmail() {
  const router = useRouter();
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState('your email');
  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Extract params from URL on client side
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    const mode = urlParams.get('mode');
    const emailParam = urlParams.get('email');
    
    if (emailParam) setEmail(emailParam);
    
    if (code && mode === 'resetPassword') {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          console.log('Valid reset code for:', email);
          if (!emailParam) setEmail(email);
        })
        .catch((error) => {
          console.error('Invalid reset code:', error);
          setError('Invalid or expired reset link. Please request a new one.');
        });
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, []);

  // Handle digit input
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(''); // Clear error when user types

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace auto-focus
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend Handler
  const handleResend = () => {
    alert(`Please go back to the forgot password page to request a new reset link for: ${email}`);
    setCooldown(60);
  };

  // Countdown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Verify Handler with Firebase
  const handleVerify = async () => {
    if (!oobCode) {
      setError('No valid reset code found. Please request a new password reset.');
      return;
    }

    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Redirect to reset password page with the OOB code
      router.push(`/roleSelection/forgotPassword/resetPassword?oobCode=${oobCode}&mode=resetPassword`);
      
    } catch (error: any) {
      console.error('Verification error:', error);
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isComplete = digits.every((d) => d !== '');

  return (
    <div className={styles.mainContainer}>
      {/* Left Side - Image */}
      <div className={styles.imageSection}>
        <div className={styles.imageContent}>
          <img 
            src="/images/sample.jpg" 
            alt="Check Email" 
            className={styles.image}
          />
        </div>
      </div>

      {/* Right Side - Check Email Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.message}>
            We've sent a verification code to <strong>{email}</strong>.
          </p>

          <div className={styles.codeInputs}>
            {digits.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => {
                  if (el) {
                    inputRefs.current[i] = el;
                  }
                }}
                className={styles.digitInput}
                disabled={loading}
              />
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.verifyBtn}
            onClick={handleVerify}
            disabled={!isComplete || loading}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <p className={styles.resend}>
            Didn't get the code?{' '}
            <button
              className={styles.resendBtn}
              disabled={cooldown > 0 || loading}
              onClick={handleResend}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </p>

          {/* Progress Steps */}
          <div className={styles.progressContainer}>
            <div className={styles.progressSteps}>
              {/* Step 1 - Completed */}
              <div className={`${styles.step} ${styles.completed}`}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepLabel}>Enter Email</div>
              </div>
              
              {/* Step 2 - Current */}
              <div className={`${styles.step} ${styles.active}`}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepLabel}>Check Email</div>
              </div>
              
              {/* Step 3 - Inactive */}
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepLabel}>Reset Password</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{width: '66%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}