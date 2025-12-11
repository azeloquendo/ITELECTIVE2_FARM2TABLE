'use client';
import { MapPin, Star, Users, Verified } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeedHeaderProps } from '../../../interface/seller/profile';
import styles from './FeedHeader.module.css';

export default function FeedHeader({ profile, viewerRole, currentUserId, profileOwnerId }: FeedHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={styles.feedHeader}>
      <div className={styles.profileInfo}>
        <div className={styles.profileContent}>
          {/* Logo and Info Container */}
          <div className={styles.logoInfoContainer}>
            {/* Logo */}
            <div className={styles.logoContainer}>
              <img 
                src={profile.logo} 
                alt="Farm logo" 
                className={styles.logo}
              />
            </div>

            {/* Farm Information */}
            <div className={styles.farmInfo}>
              <div className={styles.farmNameContainer}>
                <h1 className={styles.farmName}>
                  {profile.farmName}
                  {profile.isVerified && (
                    <Verified className={styles.verifiedBadge} size={20} />
                  )}
                </h1>
              </div>

              <div className={styles.farmDetails}>
                <div className={styles.detailItem}>
                  <MapPin size={16} className={styles.detailIcon} />
                  <span>{profile.location}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <Star size={16} className={styles.detailIcon} />
                  <span>{profile.rating.toFixed(1)}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <Users size={16} className={styles.detailIcon} />
                  <span>{profile.followerCount} followers</span>
                </div>
              </div>

              {/* ✅ REMOVED: Action buttons since they're handled in the main page */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

