"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SellerProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to feed by default when accessing /seller/profile
    router.push("/seller/profile/feed");
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '50vh',
      color: '#273F4F'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Redirecting to Your Feed...</h2>
        <p>Taking you to your farm profile management.</p>
      </div>
    </div>
  );
}