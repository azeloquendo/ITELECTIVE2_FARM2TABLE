'use client';
import { onAuthStateChanged } from 'firebase/auth';
import {
  BookOpen,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  MapPin,
  Plus,
  Save,
  Store,
  Upload,
  User,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { EditModalProps, SellerData } from '../../../../interface/seller/profile';
import { updateSellerProfile } from '../../../../services/seller/profileService';
import { auth } from '../../../../utils/lib/firebase';
import styles from './EditProfileModal.module.css';

// Cloudinary upload function
const uploadToCloudinary = async (file: File): Promise<string> => {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = 'farmconnect_products';
  
  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be less than 10MB');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('No URL returned from Cloudinary');
    }
    
    return data.secure_url;
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export default function EditProfileModal({ isOpen, onClose, sellerData, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<SellerData>(sellerData);
  const [galleryError, setGalleryError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(sellerData);
      setCurrentImageIndex(0);
    }
  }, [isOpen, sellerData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert('You must be logged in to save changes');
      return;
    }
    setSaving(true);
    try {
      await updateSellerProfile(currentUser.uid, formData);
      onSave(formData);
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving farm profile:', error);
      alert(`Error saving profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(sellerData);
    setGalleryError('');
    onClose();
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    if (formData.gallery.length + files.length > 6) {
      setGalleryError('Maximum 6 images allowed. Please remove some images first.');
      return;
    }
    
    setUploadingImages(true);
    setGalleryError('Uploading images...');
    try {
      const uploadPromises = files.map(file => uploadToCloudinary(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      const successfulUploads = uploadedUrls.filter(url => url !== null);
      
      if (successfulUploads.length > 0) {
        handleInputChange('gallery', [...formData.gallery, ...successfulUploads]);
        setGalleryError('');
      } else {
        setGalleryError('Failed to upload images. Please try again.');
      }
    } catch (error: any) {
      setGalleryError(error.message || 'Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = formData.gallery.filter((_, i) => i !== index);
    handleInputChange('gallery', newGallery);
    if (currentImageIndex >= newGallery.length) {
      setCurrentImageIndex(Math.max(0, newGallery.length - 1));
    }
    setGalleryError('');
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => Math.max(prev - 1, 0));
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => Math.min(prev + 1, formData.gallery.length - 1));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploadingImages(true);
    try {
      const logoUrl = await uploadToCloudinary(e.target.files[0]);
      if (logoUrl) {
        handleInputChange('logo', logoUrl);
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFarmerPhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploadingImages(true);
    try {
      const photoUrl = await uploadToCloudinary(e.target.files[0]);
      if (photoUrl) {
        const newFarmers = [...formData.farmers];
        newFarmers[index].photo = photoUrl;
        handleInputChange('farmers', newFarmers);
      }
    } catch (error: any) {
      console.error('Error uploading farmer photo:', error);
      alert(`Failed to upload farmer photo: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const addNewFarmer = () => {
    const newFarmer = {
      id: Date.now().toString(),
      name: 'New Farmer',
      role: 'Team Member',
      bio: 'Add bio here...',
      photo: '/images/farmer-default.jpg'
    };
    handleInputChange('farmers', [...formData.farmers, newFarmer]);
  };

  const removeFarmer = (index: number) => {
    const newFarmers = formData.farmers.filter((_, i) => i !== index);
    handleInputChange('farmers', newFarmers);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        <button className={styles.exitBtn} onClick={handleCancel}>
          <X size={18} />
        </button>
        
        <h2 className={styles.title}>Edit Farm Profile</h2>
        <p className={styles.subtitle}>Update your farm information and showcase your story.</p>

        <div className={styles.formContent}>
          {/* Farm Information Section */}
          <div className={styles.farmInfoSection}>
            <h3 className={styles.farmInfoTitle}>Farm Information</h3>
            <div className={styles.farmInfo}>
              <div className={styles.farmInfoItem}>
                <Store size={16} className={styles.farmInfoIcon} />
                <span className={styles.farmInfoLabel}>Farm Name:</span>
                <span className={styles.farmInfoValue}>{formData.farmName}</span>
              </div>
              <div className={styles.farmInfoItem}>
                <MapPin size={16} className={styles.farmInfoIcon} />
                <span className={styles.farmInfoLabel}>Location:</span>
                <span className={styles.farmInfoValue}>{formData.location}</span>
              </div>
            </div>
          </div>

          {/* Farm Details Form */}
          <div className={styles.textFieldsSection}>
            {/* Farm Name and Location */}
            <div className={styles.inlineFormGroup}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Home size={18} />
                  Farm Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.farmName}
                  onChange={(e) => handleInputChange('farmName', e.target.value)}
                  className={styles.input}
                  placeholder="Enter your farm name"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <MapPin size={18} />
                  Location <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={styles.input}
                  placeholder="Enter your farm location"
                  required
                />
              </div>
            </div>

            {/* Logo Upload - Side by Side Layout */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Farm Logo
              </label>
              <div className={styles.logoUploadContainer}>
                <div className={styles.logoSection}>
                  <div className={styles.logoPreview}>
                    <img 
                      src={formData.logo || '/images/default-logo.png'} 
                      alt="Farm logo" 
                      className={styles.logoImage}
                    />
                  </div>
                </div>
                <div className={styles.uploadSection}>
                  <label className={styles.uploadLogoButton}>
                    <Upload size={16} />
                    <span className={styles.uploadLogoText}>
                      {uploadingImages ? 'Uploading...' : 'Upload Logo'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      className={styles.fileInput}
                      disabled={uploadingImages}
                    />
                  </label>
                  <p className={styles.uploadHelpText}>
                    Recommended: Square image, 200x200px or larger
                  </p>
                </div>
              </div>
            </div>

            {/* Farm Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <BookOpen size={18} />
                Farm Story
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={styles.textarea}
                rows={5}
                placeholder="Tell your farm's story and what makes it special..."
              />
            </div>
          </div>

          {/* Gallery Section - Side by Side Layout */}
          <div className={styles.gallerySection}>
            <h4 className={styles.previewTitle}>Gallery</h4>
            <div className={styles.galleryContainer}>
              {/* Left Side: Gallery Preview */}
              <div className={styles.galleryPreview}>
                <div className={styles.carouselContainer}>
                  {formData.gallery.length > 0 ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.carouselArrow} ${styles.leftArrow}`}
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <img
                        src={formData.gallery[currentImageIndex]}
                        alt={`Gallery ${currentImageIndex + 1}`}
                        className={styles.carouselImage}
                      />
                      <button
                        type="button"
                        className={`${styles.carouselArrow} ${styles.rightArrow}`}
                        onClick={nextImage}
                        disabled={currentImageIndex === formData.gallery.length - 1}
                      >
                        <ChevronRight size={20} />
                      </button>
                      <button
                        type="button"
                        className={styles.removeCurrentBtn}
                        onClick={() => removeGalleryImage(currentImageIndex)}
                      >
                        <X size={16} />
                      </button>
                      <div className={styles.carouselDots}>
                        {formData.gallery.map((_, index) => (
                          <span
                            key={index}
                            className={`${styles.dot} ${index === currentImageIndex ? styles.activeDot : ""}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className={styles.placeholderBox}>
                      <p>No gallery images</p>
                      <p className={styles.placeholderSubtext}>
                        Upload images to showcase your farm
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Gallery Upload */}
              <div className={styles.galleryUpload}>
                <div className={styles.uploadInfo}>
                  <h5>Upload Gallery Images</h5>
                  <p className={styles.imageCount}>({formData.gallery.length}/6 images)</p>
                </div>
                
                {galleryError && (
                  <div className={styles.errorMessage}>
                    {galleryError}
                  </div>
                )}

                <label className={styles.fileLabel}>
                  <Upload size={24} />
                  <span className={styles.uploadText}>
                    {uploadingImages ? 'Uploading Images...' : 'Click to Upload'}
                  </span>
                  <span className={styles.uploadSubtext}>PNG, JPG up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    className={styles.fileInput}
                    disabled={uploadingImages || formData.gallery.length >= 6}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Farmers Section */}
          <div className={styles.formGroup}>
            <div className={styles.descriptionHeader}>
              <label className={styles.formLabel}>
                <Users size={18} />
                Farm Team ({formData.farmers.length})
              </label>
            </div>

            <div className={styles.farmersList}>
              {formData.farmers.map((farmer, index) => (
                <div key={farmer.id} className={styles.farmerCard}>
                  <div className={styles.farmerHeader}>
                    <h4 className={styles.farmerName}>{farmer.name}</h4>
                    <button 
                      className={styles.removeFarmer}
                      onClick={() => removeFarmer(index)}
                      title="Remove farmer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className={styles.farmerContent}>
                    {/* Left Side: Name and Role */}
                    <div className={styles.farmerDetails}>
                      <div className={styles.farmerBasicInfo}>
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <User size={16} />
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={farmer.name}
                            onChange={(e) => {
                              const newFarmers = [...formData.farmers];
                              newFarmers[index].name = e.target.value;
                              handleInputChange('farmers', newFarmers);
                            }}
                            className={styles.input}
                            placeholder="Enter full name"
                          />
                        </div>
                        
                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>
                            <Briefcase size={16} />
                            Role
                          </label>
                          <input
                            type="text"
                            value={farmer.role}
                            onChange={(e) => {
                              const newFarmers = [...formData.farmers];
                              newFarmers[index].role = e.target.value;
                              handleInputChange('farmers', newFarmers);
                            }}
                            className={styles.input}
                            placeholder="e.g., Farm Owner, Head Grower"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Photo and Change Photo button */}
                    <div className={styles.farmerImageSection}>
                      <div className={styles.farmerImageContainer}>
                        <img 
                          src={farmer.photo} 
                          alt={farmer.name} 
                          className={styles.farmerImage}
                        />
                      </div>
                      <label className={styles.uploadImageButton}>
                        <Upload size={14} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleFarmerPhotoUpload(index, e)}
                          className={styles.fileInput}
                          disabled={uploadingImages}
                        />
                        {uploadingImages ? 'Uploading...' : 'Change Photo'}
                      </label>
                    </div>
                  </div>

                  {/* Bio - Full width below */}
                  <div className={styles.farmerBioSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <FileText size={16} />
                        Bio
                      </label>
                      <textarea
                        value={farmer.bio}
                        onChange={(e) => {
                          const newFarmers = [...formData.farmers];
                          newFarmers[index].bio = e.target.value;
                          handleInputChange('farmers', newFarmers);
                        }}
                        className={styles.textarea}
                        rows={3}
                        placeholder="Tell us about this team member..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              className={styles.addFarmerButton}
              onClick={addNewFarmer}
              disabled={uploadingImages}
            >
              <Plus size={18} />
              Add New Farmer
            </button>
          </div>

          {/* Action Buttons */}
          <div className={styles.submitSection}>
            <button 
              className={styles.secondaryButton} 
              onClick={handleCancel} 
              disabled={saving || uploadingImages}
            >
              Cancel
            </button>
            <button 
              className={styles.submitBtn} 
              onClick={handleSave} 
              disabled={saving || uploadingImages}
            >
              <Save size={18} />
              {saving ? 'Saving...' : uploadingImages ? 'Uploading...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

