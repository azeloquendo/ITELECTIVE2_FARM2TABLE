"use client";
import { useState } from "react";
import styles from "./signup.module.css";
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../../utils/lib/firebase";

export default function AdminSignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    // Password strength rules
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strengthScore = [
        hasMinLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar
    ].filter(Boolean).length;
    
    const strengthText = strengthScore >= 4 ? "Strong" : strengthScore >= 2 ? "Medium" : "Weak";

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        handleInputChange("password", value);
    };

    const validateForm = (): boolean => {
        if (!formData.fullName.trim()) {
            setError("Please enter your full name");
            return false;
        }
        if (!formData.email.trim()) {
            setError("Please enter your email address");
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError("Please enter a valid email address");
            return false;
        }
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        if (strengthScore < 3) {
            setError("Please choose a stronger password");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // 1. Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                formData.email, 
                formData.password
            );
            
            const user = userCredential.user;

            // 2. Update user profile with display name
            await updateProfile(user, {
                displayName: formData.fullName
            });

            // 3. Send email verification
            await sendEmailVerification(user);

            // 4. Save admin data to Firestore in the "users" collection (consistent with your structure)
            const userData = {
                uid: user.uid,
                fullName: formData.fullName,
                email: formData.email,
                role: "admin",
                emailVerified: false,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                verificationSentAt: new Date(),
                // Add optional fields that exist in your user structure
                contact: "", // Empty by default
                profilePic: "", // Empty by default
                // Add address structure to match your existing data
                address: {
                    barangay: "",
                    building: "",
                    city: "",
                    houseNo: "",
                    location: {
                        lat: 0,
                        lng: 0
                    },
                    postalCode: "",
                    province: "",
                    region: "",
                    streetName: ""
                },
                // Add other optional fields
                age: null,
                birthday: "",
                followingFarms: []
            };

            // Save to users collection with the user's UID as document ID
            await setDoc(doc(db, "users", user.uid), userData);

            // Also create a separate admin document if needed for admin-specific data
            const adminData = {
                uid: user.uid,
                fullName: formData.fullName,
                email: formData.email,
                role: "admin",
                permissions: {
                    canManageUsers: true,
                    canManageContent: true,
                    canManageOrders: true,
                    canViewAnalytics: true
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await setDoc(doc(db, "admins", user.uid), adminData);

            setSuccess("Admin account created successfully! Please check your email for verification.");
            
            // Redirect to admin dashboard after 3 seconds
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 3000);

        } catch (error: any) {
            console.error("Admin signup error:", error);
            
            // Enhanced error handling
            switch (error.code) {
                case "auth/email-already-in-use":
                    setError("This email is already registered. Please use a different email or sign in.");
                    break;
                case "auth/invalid-email":
                    setError("Please enter a valid email address.");
                    break;
                case "auth/weak-password":
                    setError("Password is too weak. Please choose a stronger password with at least 8 characters including uppercase, lowercase, numbers, and special characters.");
                    break;
                case "auth/operation-not-allowed":
                    setError("Email/password accounts are not enabled. Please contact support.");
                    break;
                case "auth/network-request-failed":
                    setError("Network error. Please check your internet connection and try again.");
                    break;
                case "auth/too-many-requests":
                    setError("Too many attempts. Please try again later.");
                    break;
                default:
                    setError("Failed to create admin account. Please try again. Error: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContainer}>
                {/* Right Side - Sign Up Form Only */}
                <div className={styles.formSection}>
                    <div className={styles.formContainer}>
                        <div className={styles.logoContainer}>
                            <img 
                                src="/images/Farm2Table_Logo.png" 
                                alt="Farm2Table" 
                                className={styles.logo}
                            />
                        </div>
                        <h2 className={styles.formTitle}>Admin Sign Up</h2>
                        <p className={styles.formSubtitle}>Create your admin account to manage the Farm2Table platform</p>
                        
                        {error && (
                            <div className={styles.errorMessage}>
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className={styles.successMessage}>
                                <strong>Success!</strong> {success}
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Full Name *</label>
                                <input 
                                    className={styles.input} 
                                    type="text" 
                                    placeholder="Enter your full name"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                                    required 
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email Address *</label>
                                <input 
                                    className={styles.input} 
                                    type="email" 
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    required 
                                    disabled={loading}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password *</label>
                                <div className={styles.passwordContainer}>
                                    <input
                                        className={styles.input}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        required
                                        disabled={loading}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.toggleBtn} 
                                        onClick={() => setShowPassword((s) => !s)}
                                        disabled={loading}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {passwordFocused && (
                                <div className={styles.strengthWrapper}>
                                    <div className={styles.strengthHeader}>
                                        <span className={styles.strengthLabel}>Password Strength</span>
                                        <span className={`${styles.strengthText} ${
                                            strengthText === "Strong" ? styles.strongText :
                                            strengthText === "Medium" ? styles.mediumText :
                                            styles.weakText
                                        }`}>
                                            {strengthText}
                                        </span>
                                    </div>
                        
                                    <div className={styles.strengthBar}>
                                        <div 
                                            className={`${styles.strengthFill} ${
                                                strengthText === "Strong" ? styles.strong :
                                                strengthText === "Medium" ? styles.medium :
                                                styles.weak
                                            }`}
                                            style={{ width: `${(strengthScore / 5) * 100}%` }}
                                        />
                                    </div>
                                    <ul className={styles.requirements}>
                                        <li className={hasMinLength ? styles.valid : styles.invalid}>
                                            {hasMinLength ? "✓" : "✗"} At least 8 characters
                                        </li>
                                        <li className={hasUppercase ? styles.valid : styles.invalid}>
                                            {hasUppercase ? "✓" : "✗"} At least one uppercase letter
                                        </li>
                                        <li className={hasLowercase ? styles.valid : styles.invalid}>
                                            {hasLowercase ? "✓" : "✗"} At least one lowercase letter
                                        </li>
                                        <li className={hasNumber ? styles.valid : styles.invalid}>
                                            {hasNumber ? "✓" : "✗"} At least one number
                                        </li>
                                        <li className={hasSpecialChar ? styles.valid : styles.invalid}>
                                            {hasSpecialChar ? "✓" : "✗"} At least one special character
                                        </li>
                                    </ul>
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Confirm Password *</label>
                                <div className={styles.passwordContainer}>
                                    <input
                                        className={styles.input}
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.toggleBtn} 
                                        onClick={() => setShowConfirmPassword((s) => !s)}
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {formData.confirmPassword && (
                                <div className={`${styles.passwordMatch} ${
                                    formData.password === formData.confirmPassword ? styles.match : styles.noMatch
                                }`}>
                                    {formData.password === formData.confirmPassword ? 
                                        "✓ Passwords match" : "✗ Passwords do not match"
                                    }
                                </div>
                            )}

                            <div className={styles.termsNotice}>
                                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
                            </div>

                            <button 
                                type="submit" 
                                className={`${styles.submitButton} ${loading ? styles.loading : ''}`}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className={styles.spinner}></div>
                                        Creating Admin Account...
                                    </>
                                ) : (
                                    'Create Admin Account'
                                )}
                            </button>

                            <div className={styles.signinPrompt}>
                                <span>Already have an admin account? </span>
                                <a 
                                    href="/roleSelection/admin/signin" 
                                    className={styles.signinLink}
                                    onClick={(e) => {
                                        if (loading) e.preventDefault();
                                    }}
                                >
                                    Sign In
                                </a>
                            </div>

                            <div className={styles.roleRedirect}>
                                <span>Not an admin? </span>
                                <a 
                                    href="/roleSelection" 
                                    className={styles.roleLink}
                                    onClick={(e) => {
                                        if (loading) e.preventDefault();
                                    }}
                                >
                                    Choose a different role
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}