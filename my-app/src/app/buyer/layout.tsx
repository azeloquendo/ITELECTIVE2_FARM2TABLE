"use client";
import { usePathname } from "next/navigation";
import DashboardSubmenu from "../../components/organisms/buyer-submenus/DashboardSubmenu";
import MarketplaceSubmenu, { MarketplaceCategoryProvider } from "../../components/organisms/buyer-submenus/MarketplaceSubmenu";
import ProfileSubmenu from "../../components/organisms/buyer-submenus/ProfileSubmenu";
import BuyerLayout from "../../components/organisms/layouts/BuyerLayout";
import { CartProvider } from "../context/CartContext";

export default function RootBuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const renderSubmenu = () => {
    if (pathname?.startsWith("/buyer/dashboard")) {
      return <DashboardSubmenu />;
    }
    
    if (pathname?.startsWith("/buyer/marketplace")) {
      return <MarketplaceSubmenu />;
    }
    
    if (pathname?.startsWith("/buyer/profile")) {
      return <ProfileSubmenu />;
    }
    
    return null;
  };

  const currentSubmenu = renderSubmenu();

  return (
    <CartProvider>
      <MarketplaceCategoryProvider>
        {/* Remove onLogoutClick prop since BuyerLayout handles its own logout */}
        <BuyerLayout> 
          {currentSubmenu}
          {children}
        </BuyerLayout>
      </MarketplaceCategoryProvider>
    </CartProvider>
  );
}