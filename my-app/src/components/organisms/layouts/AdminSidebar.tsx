"use client";
import Link from "next/link";
import { LucideIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./AdminSidebar.module.css";

interface SubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  category?: string;
}

interface AdminSidebarProps {
  title: string;
  items: SubmenuItem[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  type?: "navigation" | "category";
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  // 🟢 REMOVED: adminProfile prop since we don't need it anymore
}

export default function AdminSidebar({ 
  title, 
  items, 
  selectedCategory,
  onCategoryChange,
  type = "navigation",
  isMobileOpen = false,
  onMobileClose
  // 🟢 REMOVED: adminProfile from props
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🟢 IMPROVED: Better active state detection for nested routes
  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin/dashboard/";
    }
    return pathname?.startsWith(href);
  };

  const isCategoryActive = (category: string) => selectedCategory === category;

  if (!isMounted) {
    return null;
  }

  console.log("🎨 AdminSidebar rendering - Current Path:", pathname);

  return (
    <>
      {isMobileOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={onMobileClose}
        />
      )}
      
      <div className={`${styles.submenuSidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        
        {/* Mobile Header */}
        <div className={styles.mobileHeader}>
          <h3 className={styles.mobileTitle}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Desktop Header */}
        <h3 className={styles.desktopHeader}>{title}</h3>
        
        {/* Navigation Items */}
        <nav className={styles.submenuNav}>
          {items.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.href);
            
            if (type === "category" && onCategoryChange) {
              return (
                <button
                  key={item.category}
                  onClick={() => {
                    console.log("Admin category selected:", item.category);
                    onCategoryChange(item.category || "");
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`${styles.submenuItem} ${isCategoryActive(item.category || "") ? styles.active : ''}`}
                >
                  <IconComponent size={18} className={styles.submenuIcon} />
                  <span className={styles.submenuText}>{item.label}</span>
                </button>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.submenuItem} ${active ? styles.active : ''}`}
                onClick={onMobileClose}
              >
                <IconComponent size={18} className={styles.submenuIcon} />
                <span className={styles.submenuText}>{item.label}</span>
                {active && <div className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* 🟢 COMPLETELY REMOVED: Admin Profile Section */}
      </div>
    </>
  );
}