"use client";
import { useState } from "react";
import styles from "./signin.module.css";
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from "../../../../utils/lib/firebase"; 
import { doc, getDoc } from 'firebase/firestore';

export default function BuyerSignIn() {
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
      
      let isBuyer = false;
      let isSeller = false;
      let isAdmin = false;

      // Check buyers collection
      try {
        const buyerDoc = await getDoc(doc(db, "buyers", user.uid));
        isBuyer = buyerDoc.exists();
      } catch (error) {
        console.error("Error checking buyers collection:", error);
      }

      // Check sellers collection
      try {
        const sellerDoc = await getDoc(doc(db, "sellers", user.uid));
        isSeller = sellerDoc.exists();
      } catch (error) {
        console.error("Error checking sellers collection:", error);
      }

      // Check admin collection
      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        isAdmin = adminDoc.exists();
      } catch (error) {
        console.error("Error checking admin collection:", error);
      }

      console.log('📊 Role check results:', { isBuyer, isSeller, isAdmin });

      // Handle role validation - BLOCK ADMIN USERS
      if (isAdmin) {
        console.log('❌ Admin trying to access buyer portal - signing out');
        await auth.signOut();
        setError('Admin accounts cannot access the buyer portal. Please use the admin panel.');
        setLoading(false);
        return;
      }

      if (isSeller && !isBuyer) {
        console.log('❌ Seller trying to access buyer portal - signing out');
        await auth.signOut();
        setError('This is a seller account. Please login using the seller sign-in page.');
        setLoading(false);
        return;
      }

      if (!isBuyer && !isSeller && !isAdmin) {
        console.log('❌ User not found in any collection - signing out');
        await auth.signOut();
        setError('Account not found. Please sign up first.');
        setLoading(false);
        return;
      }

      if (!isBuyer) {
        console.log('❌ User not found in buyers collection - signing out');
        await auth.signOut();
        setError('This account is not registered as a buyer. Please sign up as a buyer first.');
        setLoading(false);
        return;
      }

      console.log('✅ Buyer authentication successful - proceeding to dashboard');

      // 🟢 Set cookies for middleware
      const token = await user.getIdToken();
      const cookieOptions = `max-age=${60 * 60 * 24}; path=/; SameSite=Lax`;
      
      document.cookie = `auth-token=${token}; ${cookieOptions}`;
      document.cookie = `user-role=buyer; ${cookieOptions}`;
      document.cookie = `firebase-auth-token=${token}; ${cookieOptions}`;
      document.cookie = `user-id=${user.uid}; ${cookieOptions}`;
      
      console.log('🍪 Cookies set for middleware - role: buyer');

      // Wait a moment for auth state to update and cookies to be set
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force token refresh to ensure middleware gets latest claims
      await user.getIdToken(true);

      console.log('🚀 Redirecting to buyer dashboard...');
      
      // Use window.location for more reliable redirect
      window.location.href = '/buyer/dashboard';

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
          setError('No account found with this email. Please sign up first.');
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
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
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
            <h2 className={styles.formTitle}>Buyer Sign In</h2>
            
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
                <a href="/roleSelection/buyer/signup" className={styles.signupLink}>
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