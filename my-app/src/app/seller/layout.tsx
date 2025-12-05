import { CategoryProvider } from "../context/CategoryContext";
import SellerLayout from "../../components/organisms/layouts/SellerLayout";

export default function SellerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CategoryProvider>
      <SellerLayout>{children}</SellerLayout>
    </CategoryProvider>
  );
}