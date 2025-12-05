"use client";
import { useState } from "react";
import styles from "./forgot-password.module.css";
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from "../../../utils/lib/firebase";

export default function AdminForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess("Password reset email sent! Please check your inbox.");
        } catch (error: any) {
            console.error('Password reset error:', error);
            switch (error.code) {
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/user-not-found':
                    setError('No admin account found with this email address.');
                    break;
                case 'auth/network-request-failed':
                    setError('Network error. Please check your connection and try again.');
                    break;
                default:
                    setError('Failed to send password reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContainer}>
                <div className={styles.formSection}>
                    <div className={styles.formContainer}>
                        <div className={styles.logoContainer}>
                            <img 
                                src="/images/Farm2Table_Logo.png" 
                                alt="Farm2Table" 
                                className={styles.logo}
                            />
                        </div>
                        <h2 className={styles.formTitle}>Reset Admin Password</h2>
                        
                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className={styles.successMessage}>
                                {success}
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address</label>
                                <input 
                                    className={styles.input} 
                                    type="email" 
                                    placeholder="Enter your admin email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>

                            <button 
                                type="submit" 
                                className={styles.submitButton}
                                disabled={loading}
                            >
                                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                            </button>

                            <div className={styles.signinPrompt}>
                                <span>Remember your password? </span>
                                <a href="/roleSelection/admin/signin" className={styles.signinLink}>
                                    Back to Sign In
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}