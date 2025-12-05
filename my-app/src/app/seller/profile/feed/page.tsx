'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { FarmDescription } from '../../../../components/molecules';
import { EditProfileModal, FarmerProfiles, FeaturedProducts, FeedHeader, Gallery } from '../../../../components/organisms';
import { useSellerProfile } from '../../../../hooks/seller';
import { FeedProps } from '../../../../interface/seller/profile';
import styles from './feed.module.css';

export default function Feed({ viewerRole = 'seller', farmId }: FeedProps) {
  const params = useParams();
  const targetFarmId = farmId || (viewerRole === 'buyer' ? params.farmId as string : undefined);
  
  const { sellerData, loading, error, currentUserId, updateSellerData, isBuyerView } = useSellerProfile({
    viewerRole,
    farmId: targetFarmId
  });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const toggleEditMode = () => {
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className={styles.feedPage}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>
            {isBuyerView ? 'Loading farm profile...' : 'Loading your farm profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.feedPage}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Unable to load profile</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.feedPage}>
      {/* Feed Container */}
      <div className={styles.feedContainer}>
        {/* Edit Mode button at top right */}
        {!isBuyerView && (
          <div className={styles.editModeContainer}>
            <button 
              className={styles.editModeButton}
              onClick={toggleEditMode}
            >
              Edit Mode
            </button>
          </div>
        )}
        <FeedHeader 
          profile={sellerData} 
          viewerRole={viewerRole}
          currentUserId={currentUserId}
          profileOwnerId={sellerData.id}
        />
        
        <FeaturedProducts 
          viewerRole={viewerRole}
          farmId={isBuyerView ? sellerData.id : undefined}
        />
        
        <FarmDescription 
          description={sellerData.description} 
          viewerRole={viewerRole}
        />
        
        <Gallery 
          images={sellerData.gallery} 
          viewerRole={viewerRole}
          currentUserId={currentUserId}
          profileOwnerId={sellerData.id}
        />
        
        {/* Farmers Section */}
        <div className={styles.farmersSection}>
          <FarmerProfiles 
            farmers={sellerData.farmers} 
            viewerRole={viewerRole}
          />
        </div>
      </div>
      {/* Edit Modal - Only for sellers */}
      {!isBuyerView && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          sellerData={sellerData}
          onSave={updateSellerData}
        />
      )}
    </div>
  );
}
