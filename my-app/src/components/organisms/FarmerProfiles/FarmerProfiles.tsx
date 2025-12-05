'use client';
import { FileText, X } from 'lucide-react';
import { useState } from 'react';
import { Farmer, FarmerProfilesProps } from '../../../interface/seller/profile';
import styles from './FarmerProfiles.module.css';

export default function FarmerProfiles({ farmers, viewerRole }: FarmerProfilesProps) {
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  const openFarmerModal = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setShowFarmerModal(true);
  };

  const closeFarmerModal = () => {
    setShowFarmerModal(false);
    setSelectedFarmer(null);
  };

  if (!farmers || farmers.length === 0) {
    return (
      <div className={styles.farmersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Farm Team</h2>
        </div>
        <div className={styles.noFarmers}>
          <p>No team members added yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.farmersSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Meet Our Farm Team</h2>
        </div>
        
        <div className={styles.farmersGrid}>
          {farmers.map((farmer) => (
            <div key={farmer.id} className={styles.farmerCard}>
              <div className={styles.farmerImageContainer}>
                <img 
                  src={farmer.photo} 
                  alt={farmer.name}
                  className={styles.farmerImage}
                />
              </div>
              <div className={styles.farmerInfo}>
                <h3 className={styles.farmerName}>{farmer.name}</h3>
                <p className={styles.farmerRole}>{farmer.role}</p>
                <p className={styles.farmerBioPreview}>
                  {farmer.bio.length > 100 ? `${farmer.bio.substring(0, 100)}...` : farmer.bio}
                </p>
                <button 
                  className={styles.viewMoreButton}
                  onClick={() => openFarmerModal(farmer)}
                >
                  View More
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Farmer Detail Modal */}
      {showFarmerModal && selectedFarmer && (
        <div className={styles.farmerModalOverlay} onClick={closeFarmerModal}>
          <div className={styles.farmerModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalButton} onClick={closeFarmerModal}>
              <X size={20} />
            </button>
            
            <div className={styles.farmerModalHeader}>
              <div className={styles.modalFarmerImageContainer}>
                <img 
                  src={selectedFarmer.photo} 
                  alt={selectedFarmer.name}
                  className={styles.modalFarmerImage}
                />
              </div>
              <div className={styles.modalFarmerInfo}>
                <h2 className={styles.modalFarmerName}>{selectedFarmer.name}</h2>
                <p className={styles.modalFarmerRole}>{selectedFarmer.role}</p>
              </div>
            </div>

            <div className={styles.farmerModalBody}>
              <div className={styles.bioSection}>
                <div className={styles.sectionTitle}>
                  <FileText size={18} />
                  <span>About</span>
                </div>
                <p className={styles.modalFarmerBio}>{selectedFarmer.bio}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

