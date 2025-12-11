"use client";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, History, Heart, MessageCircle, HelpCircle } from "lucide-react";
import SubmenuSidebar from "../../layouts/SubmenuSidebar";

interface ProfileSubmenuProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function ProfileSubmenu({ 
  isMobileOpen = false, 
  onMobileClose 
}: ProfileSubmenuProps) {
  const pathname = usePathname();
  
  const items = [
    { href: "/buyer/profile", label: "My Profile", icon: User },
    { href: "/buyer/profile/my-purchases", label: "My Purchases", icon: ShoppingBag },
    { href: "/buyer/profile/saved-items", label: "Saved Items", icon: Heart },
    { href: "/buyer/profile/messages", label: "Messages", icon: MessageCircle },
    { href: "/buyer/profile/help-center", label: "Help Center", icon: HelpCircle },
  ];

  return (
    <SubmenuSidebar 
      title="Profile"
      items={items}
      type="navigation"
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}