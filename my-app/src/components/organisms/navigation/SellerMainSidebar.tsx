"use client";
import { Home, LogOut, Menu, User, X, Box, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./SellerMainSidebar.module.css";

// 🟢 Backend imports - added Firebase
import { auth } from "../../../utils/lib/firebase";

interface MainSidebarProps {
  onLogoutClick: () => void;
  onSubmenuToggle?: () => void;
  showSubmenuToggle?: boolean;
  isSubmenuOpen?: boolean;
}

export default function MainSidebar({ onLogoutClick }: MainSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // 🟢 Backend state - added user data
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // 🟢 Backend integration - Firebase user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
        // You can fetch additional user profile data here from Firestore if needed
      } else {
        setUserEmail(null);
        setProfilePicture(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🟢 Frontend responsive detection - kept exactly the same
  useEffect(() => {
    setIsMounted(true);
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 🟢 SELLER-ONLY: Navigation items - ONLY seller routes
  const navItems = [
    { href: "/seller", label: "Dashboard", icon: Home },
    { href: "/seller/products", label: "Products", icon: Box },
    { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
    { href: "/seller/profile", label: "Profile", icon: User },
  ];

  // 🟢 SELLER-ONLY: Active state logic - ONLY seller routes
  const isActive = (href: string) => {
    // For seller dashboard, match exactly or subpages
    if (href === "/seller") {
      return pathname === "/seller" || pathname?.startsWith("/seller/dashboard");
    }
    // For seller profile, match profile and all subpages
    if (href === "/seller/profile") {
      return pathname?.startsWith("/seller/profile");
    }
    // For other seller pages, use startsWith
    return pathname?.startsWith(href);
  };

  // 🟢 FIXED: Only opens modal, doesn't sign out immediately
  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🖱️ Seller Logout button clicked - opening modal only");
    
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }

    // 🟢 ONLY open the modal - signOut will happen in layout if confirmed
    onLogoutClick();
  };

  // 🟢 Frontend mobile handlers - kept exactly the same
  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // 🟢 Frontend SSR fallback - kept exactly the same
  if (!isMounted) {
    return (
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <img src="/Farm2Table_Logo.png" alt="Logo" className={styles.logo} />
        </div>
        
        <div className={styles.navContainer}>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navItem}>
                <item.icon size={20} />
                <span className={styles.navText}>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  // 🟢 Frontend JSX - kept exactly the same structure with improvements
  return (
    <>
      {isMobile && (
        <header className={styles.mobileHeader}>
          <button 
            className={styles.menuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Logo in mobile header - left side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/Farm2Table_Logo.png" 
              alt="Logo" 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
            />
            <h1 className={styles.mobileTitle}>Farm2Table</h1>
          </div>
          
          <div className={styles.headerSpacer}></div>
        </header>
      )}
      
      {isMobile && isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={`${styles.sidebar} ${isMobile ? styles.mobile : ""} ${isMobileMenuOpen ? styles.mobileOpen : ""}`}>
        {/* Logo in sidebar (hidden on mobile since it's in header) */}
        {!isMobile && (
          <div className={styles.logoContainer}>
            <img src="/Farm2Table_Logo.png" alt="Logo" className={styles.logo} />
          </div>
        )}
        
        <div className={styles.navContainer}>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive(item.href) ? styles.active : ""}`}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span className={styles.navText}>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className={styles.bottomActions}>
            {/* 🟢 FIXED: Using the corrected handleLogoutClick function */}
            <button onClick={handleLogoutClick} className={styles.logoutBtn}>
              <LogOut size={20} />
              <span className={styles.navText}>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}