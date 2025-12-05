"use client";

import { useState } from "react";
import styles from "./resetPassword.module.css";
import SuccessModal from "../../../../components/organisms/auth/modals/SuccessModal/SuccessModal";
import { useRouter } from 'next/navigation';

// Firebase imports
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from "../../../../utils/lib/firebase"; // Adjust path as needed

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Password strength rules
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isStrong = hasMinLength && hasNumber && hasSpecialChar;

    // Handle password input
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setError(""); // Clear error when user types
    };

    // Handle reset submit with Firebase
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("❌ Passwords do not match.");
            setLoading(false);
            return;
        }

        if (!isStrong) {
            setError("❌ Password does not meet all requirements.");
            setLoading(false);
            return;
        }

        try {
            // Get the OOB code from URL (Firebase sends this in the reset link)
            const urlParams = new URLSearchParams(window.location.search);
            const oobCode = urlParams.get('oobCode');
            const mode = urlParams.get('mode');

            if (!oobCode || mode !== 'resetPassword') {
                setError("❌ Invalid reset link. Please request a new password reset.");
                setLoading(false);
                return;
            }

            // Confirm password reset with Firebase
            await confirmPasswordReset(auth, oobCode, password);
            
            setShowSuccess(true);
            
        } catch (error: any) {
            console.error('Password reset error:', error);
            
            // Handle specific Firebase auth errors
            switch (error.code) {
                case 'auth/expired-action-code':
                    setError("❌ The reset link has expired. Please request a new one.");
                    break;
                case 'auth/invalid-action-code':
                    setError("❌ Invalid reset link. Please request a new password reset.");
                    break;
                case 'auth/weak-password':
                    setError("❌ Password is too weak. Please choose a stronger password.");
                    break;
                case 'auth/user-disabled':
                    setError("❌ This account has been disabled. Please contact support.");
                    break;
                case 'auth/user-not-found':
                    setError("❌ No account found with this email address.");
                    break;
                default:
                    setError("❌ Failed to reset password. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.mainContainer}>
            {/* Left Side - Image */}
            <div className={styles.imageSection}>
                <div className={styles.imageContent}>
                    {/* Actual image from public folder */}
                    <img 
                        src="/images/sample.jpg" 
                        alt="Reset Password" 
                        className={styles.image}
                    />
                </div>
            </div>

            {/* Right Side - Reset Password Form */}
            <div className={styles.formSection}>
                <div className={styles.formContainer}>
                    <h1 className={styles.title}>Create New Password</h1>
                    <p className={styles.message}>Your identity has been verified</p>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Password input with show/hide toggle */}
                        <div className={styles.inputGroup}>
                            <input
                            className={styles.input}
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            required
                            />

                            <button
                            type="button"
                            className={styles.toggleBtn}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowPassword((s) => !s)}
                            >
                            {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        {/* Password strength indicator */}
                        {passwordFocused && (
                            <div className={styles.strengthWrapper}>
                                <div className={styles.strengthBar}>
                                    <div
                                        className={`${styles.strengthFill} ${
                                        hasMinLength && hasNumber && hasSpecialChar
                                        ? styles.strong
                                        : hasMinLength || hasNumber
                                        ? styles.medium
                                        : styles.weak
                                        }`}
                                    />
                                    </div>

                                    <ul className={styles.requirements}>
                                        <li className={hasMinLength ? styles.valid : styles.invalid}>
                                        At least 8 characters
                                        </li>
                                        <li className={hasNumber ? styles.valid : styles.invalid}>
                                        Contains a number
                                        </li>
                                        <li className={hasSpecialChar ? styles.valid : styles.invalid}>
                                        Contains a special character
                                        </li>
                                    </ul>
                                </div>
                        )}

                        {/* Confirm Password input with show/hide toggle */}
                        <div className={styles.inputGroup}>
                            <input
                            className={styles.input}
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            />
                    
                            <button
                            type="button"
                            className={styles.toggleBtn}
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            >
                            {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && <p className={styles.error}>{error}</p>}

                        <button 
                            type="submit" 
                            className={styles.submitBtn}
                            disabled={loading}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>

                    {/* Progress Steps */}
                    <div className={styles.progressContainer}>
                        <div className={styles.progressSteps}>
                            {/* Step 1 - Completed */}
                            <div className={`${styles.step} ${styles.completed}`}>
                                <div className={styles.stepNumber}>1</div>
                                <div className={styles.stepLabel}>Enter Email</div>
                            </div>
                            
                            {/* Step 2 - Completed */}
                            <div className={`${styles.step} ${styles.completed}`}>
                                <div className={styles.stepNumber}>2</div>
                                <div className={styles.stepLabel}>Check Email</div>
                            </div>
                            
                            {/* Step 3 - Current */}
                            <div className={`${styles.step} ${styles.active}`}>
                                <div className={styles.stepNumber}>3</div>
                                <div className={styles.stepLabel}>Reset Password</div>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{width: '100%'}}></div>
                        </div>
                    </div>

                    {/* Success Modal */}
                    {showSuccess && (
                        <SuccessModal onClose={() => (window.location.href = "/signin")} />
                    )}
                </div>
            </div>
        </div>
    );
}