"use client";
import { Megaphone, MessageCircle, HelpCircle, Bell } from "lucide-react";
import SellerSidebar from "../../layouts/SellerSidebar";
import { SellerProfile } from "../../../../utils/lib/sellerProfileService"; 

interface ProfileSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  sellerProfile?: SellerProfile | null; 
}

export default function ProfileSubmenu({ 
  isMobileOpen = false, 
  onMobileClose,
  selectedCategory = "feed",
  onCategoryChange,
  sellerProfile 
}: ProfileSubmenuProps) {
  
  const profileItems = [
    { 
      id: "profile-feed", 
      href: "/seller/profile/feed", 
      label: "Your Feed", 
      icon: Megaphone
    },
    { 
      id: "profile-notifications", 
      href: "/seller/profile/notification", 
      label: "Notifications", 
      icon: Bell
    },
    { 
      id: "profile-messages", 
      href: "/seller/profile/messages", 
      label: "Messages", 
      icon: MessageCircle
    },
    { 
      id: "profile-help", 
      href: "/seller/profile/helpCenter", 
      label: "Help Center", 
      icon: HelpCircle
    },
  ];

  console.log("📦 ProfileSubmenu received sellerProfile:", sellerProfile); // 🟢 ADD DEBUG LOG

  return (
    <SellerSidebar // 🟢 CHANGE TO SELLER SIDEBAR
      title="Profile"
      items={profileItems}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      sellerProfile={sellerProfile} // 🟢 PASS THE PROFILE DATA
    />
  );
}