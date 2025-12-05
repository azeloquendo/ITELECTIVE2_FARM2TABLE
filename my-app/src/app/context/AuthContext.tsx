'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../utils/lib/firebase';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  contact?: string;
  address?: string;
  role: 'seller' | 'buyer' | 'admin';
  farmName?: string;
  logo?: string;
  deliveryAddress?: {
    houseNo?: string;
    streetName?: string;
    barangay?: string;
    city?: string;
    province?: string;
    region?: string;
    postalCode?: string;
  };
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  userRole: 'seller' | 'buyer' | 'admin' | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'seller' | 'buyer' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 🟢 FIX: Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 🟢 CRITICAL FIX: Check ADMIN first with priority
  const detectUserRole = async (userId: string): Promise<'seller' | 'buyer' | 'admin' | null> => {
    try {
      console.log('🔍 Detecting role for user:', userId);
      
      // 🟢 CHECK ADMIN FIRST (HIGHEST PRIORITY)
      console.log('📁 Checking admin collection...');
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      if (adminDoc.exists()) {
        console.log('✅ User is an ADMIN - admin document found:', adminDoc.data());
        return 'admin';
      }
      console.log('❌ User not found in admin collection');

      // 🟢 THEN CHECK SELLER
      console.log('📁 Checking seller collection...');
      const sellerDoc = await getDoc(doc(db, 'sellers', userId));
      if (sellerDoc.exists()) {
        console.log('✅ User is a SELLER - seller document found');
        return 'seller';
      }
      console.log('❌ User not found in seller collection');

      // 🟢 FINALLY CHECK BUYER
      console.log('📁 Checking buyer collection...');
      const buyerDoc = await getDoc(doc(db, 'buyers', userId));
      if (buyerDoc.exists()) {
        console.log('✅ User is a BUYER - buyer document found');
        return 'buyer';
      }
      console.log('❌ User not found in buyer collection');
      
      console.log('⚠️ User not found in ANY role collection');
      return null; // No role found
      
    } catch (error) {
      console.error('Error detecting user role:', error);
      return null;
    }
  };

  // 🟢 FIX: Only set cookies on client side
  const setAuthCookies = async (currentUser: User, role: 'seller' | 'buyer' | 'admin') => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const token = await currentUser.getIdToken();
      
      document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24}; secure; samesite=lax`;
      document.cookie = `user-role=${role}; path=/; max-age=${60 * 60 * 24}; secure; samesite=lax`;
      
      console.log('✅ Auth cookies set for user:', currentUser.uid, 'Role:', role);
    } catch (error) {
      console.error('Error setting auth cookies:', error);
    }
  };

  // 🟢 FIX: Only clear cookies on client side
  const clearAuthCookies = () => {
    if (typeof window === 'undefined') return;
    
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('✅ Auth cookies cleared');
  };

  const fetchUserProfile = async (userId: string, currentUser: User, role: 'seller' | 'buyer' | 'admin') => {
    try {
      console.log(`📋 Fetching ${role} profile for user:`, userId);
      
      let collectionName = '';
      
      switch (role) {
        case 'seller':
          collectionName = 'sellers';
          break;
        case 'buyer':
          collectionName = 'buyers';
          break;
        case 'admin':
          collectionName = 'admins';
          break;
      }
      
      const userDoc = await getDoc(doc(db, collectionName, userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`✅ Found ${role} profile:`, userData);
        
        const profile: UserProfile = {
          id: userId,
          email: currentUser?.email || '',
          role: role,
          fullName: userData.fullName || userData.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || role,
          contact: userData.contact || userData.phone || '',
          address: userData.address || '',
        };

        if (role === 'seller') {
          profile.farmName = userData.farmName || userData.farm?.farmName || '';
          profile.logo = userData.logo || userData.farm?.logo || '';
        }
        
        if (role === 'buyer') {
          profile.deliveryAddress = userData.deliveryAddress || userData.address || {};
        }
        
        return profile;
      } else {
        console.log(`❌ No ${role} profile found for user:`, userId);
        
        return {
          id: userId,
          email: currentUser?.email || '',
          role: role,
          fullName: currentUser?.displayName || currentUser?.email?.split('@')[0] || role,
          contact: '',
          address: '',
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      return {
        id: userId,
        email: currentUser?.email || '',
        role: role,
        fullName: currentUser?.displayName || currentUser?.email?.split('@')[0] || role,
        contact: '',
        address: '',
      };
    }
  };

  const refreshUserProfile = async () => {
    if (user && userRole) {
      const profile = await fetchUserProfile(user.uid, user, userRole);
      setUserProfile(profile);
      await setAuthCookies(user, userRole);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      clearAuthCookies();
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    const initAuth = async () => {
      try {
        // Only initialize auth on client side
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        await setPersistence(auth, browserLocalPersistence);
        
        unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          console.log('🔄 Auth state changed:', currentUser?.email);
          
          setUser(currentUser);

          if (currentUser) {
            // DETECT USER ROLE FIRST
            const role = await detectUserRole(currentUser.uid);
            console.log('🎯 Detected role:', role, 'for user:', currentUser.uid);
            setUserRole(role);
            
            if (role) {
              // Only fetch profile if we found a valid role
              const profile = await fetchUserProfile(currentUser.uid, currentUser, role);
              setUserProfile(profile);
              await setAuthCookies(currentUser, role);
            } else {
              // No role found - this shouldn't happen for authenticated users
              console.log('⚠️ No role found for authenticated user, signing out');
              await auth.signOut();
              return;
            }
          } else {
            setUserProfile(null);
            setUserRole(null);
            clearAuthCookies();
          }

          setLoading(false);
        });

      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🟢 FIX: Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <AuthContext.Provider value={{ 
        user: null, 
        userProfile: null, 
        userRole: null,
        loading: true, 
        refreshUserProfile,
        logout 
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      userRole,
      loading, 
      refreshUserProfile,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};