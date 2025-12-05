"use client";
import { useState } from "react";
import styles from "./signin.module.css";
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from "../../../../utils/lib/firebase"; 
import { doc, getDoc } from 'firebase/firestore';

export default function SellerSignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if user has seller role in Firestore
  const checkUserRole = async (userId: string) => {
    try {
      // Check sellers collection
      const sellerDoc = await getDoc(doc(db, "sellers", userId));
      if (sellerDoc.exists()) {
        return "seller";
      }
      // Check buyers collection
      const buyerDoc = await getDoc(doc(db, "buyers", userId));
      if (buyerDoc.exists()) {
        return "buyer";
      }
      return null; // User not found in either collection
    } catch (error) {
      console.error("Error checking user role:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      console.log('✅ User signed in successfully:', user);
      
      // Check if email is verified
      if (!user.emailVerified) {
        console.log('❌ Email not verified - signing out user');
        
        await auth.signOut();
        
        setError('Please verify your email address before signing in. Check your inbox for the verification email.');
        setLoading(false);
        return;
      }

      // Check user role in Firestore
      console.log('🔍 Checking user role...');
      const userRole = await checkUserRole(user.uid);
      
      if (userRole === "buyer") {
        console.log('❌ Buyer trying to access seller portal - signing out');
        await auth.signOut();
        setError('This is a buyer account. Please use the buyer sign-in page.');
        setLoading(false);
        return;
      }

      if (userRole !== "seller") {
        console.log('❌ User not found in sellers collection - signing out');
        await auth.signOut();
        setError('Account not found. Please sign up as a seller first.');
        setLoading(false);
        return;
      }

      console.log('✅ Seller authentication successful - proceeding to dashboard');
      
      // 🟢 CRITICAL: Set cookies for middleware
      const token = await user.getIdToken();
      document.cookie = `auth-token=${token}; max-age=${60 * 60 * 24}; path=/; SameSite=Lax`;
      document.cookie = `user-role=seller; max-age=${60 * 60 * 24}; path=/; SameSite=Lax`;
      document.cookie = `firebase-auth-token=${token}; max-age=${60 * 60 * 24}; path=/; SameSite=Lax`;
      
      console.log('🍪 Cookies set for middleware - role: seller');

      // Wait a moment for auth state to update and cookies to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        console.log('🚀 Redirecting to seller dashboard...');
        
        // Try router first - redirect to /seller (dashboard)
        router.push('/seller');
        
        // Fallback: if router doesn't work after 1 second, use window.location
        setTimeout(() => {
          if (window.location.pathname === '/roleSelection/seller/signin') {
            console.log('🔄 Router fallback - using window.location');
            window.location.href = '/seller';
          }
        }, 1000);
      } else {
        console.error('❌ User not authenticated after signin');
        setError('Authentication failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Signin error:', error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        case 'auth/user-not-found':
          setError('No seller account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later or reset your password.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection and try again.');
          break;
        case 'auth/email-not-verified':
          setError('Please verify your email address before signing in.');
          break;
        default:
          setError('Failed to sign in. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      alert(`Password reset email sent to ${formData.email}. Please check your inbox.`);
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        {/* Sign In Form Only */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <div className={styles.logoContainer}>
              <img 
                src="/images/Farm2Table_Logo.png" 
                alt="Farm2Table" 
                className={styles.logo}
              />
            </div>
            <h2 className={styles.formTitle}>Seller Sign In</h2>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <input 
                  className={styles.input} 
                  type="email" 
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordContainer}>
                  <input
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className={styles.toggleBtn} 
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                
                <div className={styles.forgotPasswordContainer}>
                  <button 
                    type="button" 
                    className={styles.forgotLink}
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className={styles.signupPrompt}>
                <span>Don't have an account? </span>
                <a href="/roleSelection/seller/signup" className={styles.signupLink}>
                  Sign Up
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}