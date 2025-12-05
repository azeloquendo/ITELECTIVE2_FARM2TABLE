"use client";
import { Bell, Home, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./MainSidebar.module.css";
import { auth } from "../../../utils/lib/firebase";

interface MainSidebarProps {
  onLogoutClick: () => void;
  onSubmenuToggle?: () => void;
  showSubmenuToggle?: boolean;
  isSubmenuOpen?: boolean;
}

export default function MainSidebar({ onLogoutClick, onSubmenuToggle, showSubmenuToggle, isSubmenuOpen }: MainSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // 🟢 REMOVED: userEmail state since we don't want to display it

  useEffect(() => {
    setIsMounted(true);
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 🟢 SIMPLIFIED: Only two navigation items
  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/notification", label: "Notifications", icon: Bell },
  ];

  // Active state logic
  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname?.startsWith("/admin/dashboard");
    }
    if (href === "/admin/notification") {
      return pathname?.startsWith("/admin/notification");
    }
    return pathname === href;
  };

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🖱️ Admin Logout button clicked");
    
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }

    onLogoutClick();
  };

  const handleSubmenuToggle = () => {
    if (onSubmenuToggle) {
      onSubmenuToggle();
    }
  };

  const handleOverlayClick = () => {
    setIsMobileMenuOpen(false);
  };

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
            <h1 className={styles.mobileTitle}>Farm2Table Admin</h1>
          </div>
          
          {/* Submenu toggle button for mobile */}
          {showSubmenuToggle && (
            <button 
              className={styles.submenuToggle}
              onClick={handleSubmenuToggle}
            >
              <Menu size={20} />
            </button>
          )}
          
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
            {/* 🟢 REMOVED: User email display section */}
            
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