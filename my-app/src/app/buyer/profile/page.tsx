"use client";
import { Camera, Loader2 } from "lucide-react";
import { useEffect } from "react";
import {
    PHILIPPINE_REGIONS,
    REGION_III_PROVINCES,
    ZAMBALES_BARANGAYS,
    ZAMBALES_CITIES_MUNICIPALITIES
} from "../../../constants/buyer/profile";
import { useBuyerProfile } from "../../../hooks/buyer";
import styles from "./profile.module.css";

// BARANGAYS DATA FOR ZAMBALES
const zambalesBarangays = ZAMBALES_BARANGAYS;

export default function ProfilePage() {
  const {
    formData,
    setFormData,
    deliveryAddress,
    setDeliveryAddress,
    profileImage,
    isLoading,
    isSaving,
    error,
    success,
    imageLoading,
    hasChanges,
    provinces,
    setProvinces,
    cities,
    setCities,
    barangays,
    setBarangays,
    originalFormData,
    originalDeliveryAddress,
    fileInputRef,
    handleImageChange,
    handleSaveChanges,
    handleCancelAll,
    handleImageError,
    handleImageLoad,
    handleImageClick,
  } = useBuyerProfile();

  // Initialize provinces
  useEffect(() => {
    setProvinces(REGION_III_PROVINCES);
  }, [setProvinces]);

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle address changes with cascading dropdowns
  const handleAddressChange = (field: string, value: string) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle dropdown cascading
    if (field === "region") {
      const selectedRegion = PHILIPPINE_REGIONS.find(r => r.region === value);
      if (selectedRegion) {
        setProvinces(REGION_III_PROVINCES);
        setDeliveryAddress(prev => ({
          ...prev,
          province: "",
          city: "",
          barangay: ""
        }));
        setCities([]);
        setBarangays([]);
      }
    }

    if (field === "province") {
      const selectedProvince = provinces.find(p => p.province === value);
      if (selectedProvince) {
        setCities(ZAMBALES_CITIES_MUNICIPALITIES);
        setDeliveryAddress(prev => ({
          ...prev,
          city: "",
          barangay: ""
        }));
        setBarangays([]);
      }
    }

    if (field === "city") {
      const selectedCity = cities.find(c => c.city === value);
      if (selectedCity) {
        const barangaysData = zambalesBarangays[selectedCity.city_code as keyof typeof zambalesBarangays] || [];
        setBarangays(barangaysData);
        setDeliveryAddress(prev => ({
          ...prev,
          barangay: ""
        }));
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.profileContent}>
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.spinner} size={32} />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileContent}>
      <div className={styles.header}>
        <h1 className={styles.title}>Personal Information</h1>
        <p className={styles.subtitle}>Manage your account settings and preferences</p>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          {success}
        </div>
      )}
      
      {/* Main Profile Container */}
      <div className={styles.profileContainer}>
        
        {/* Profile Picture Section - Centered */}
        <div className={styles.profilePictureSection}>
          <div className={styles.profileImageContainer}>
            <div className={styles.imageWrapper}>
              {imageLoading && (
                <div className={styles.imageLoading}>
                  <Loader2 className={styles.imageSpinner} size={20} />
                </div>
              )}
              <img 
                src={profileImage} 
                alt="Profile" 
                className={styles.profileImage}
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{ opacity: imageLoading ? 0.5 : 1 }}
              />
            </div>
            <button 
              className={styles.editImageButton}
              onClick={handleImageClick}
              type="button"
              disabled={isSaving || imageLoading}
            >
              <Camera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className={styles.fileInput}
            />
          </div>
          <p className={styles.imageHint}>Click the camera icon to change your profile picture</p>
        </div>

        {/* Personal Information Section */}
        <div className={styles.personalInfoSection}>
          <h3 className={styles.sectionTitle}>Personal Information</h3>
          
          {/* Full Name and Email on same line */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                className={styles.input}
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                className={styles.input}
                disabled={true} // Email should not be editable
                placeholder="Enter your email address"
              />
            </div>
          </div>

          {/* Phone Number - same width as full name */}
          <div className={styles.phoneNumberRow}>
            <div className={styles.formGroup}>
              <label htmlFor="contact" className={styles.label}>
                Phone Number
              </label>
              <input
                id="contact"
                type="tel"
                value={formData.contact}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                className={styles.input}
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className={styles.deliveryAddressSection}>
          <h3 className={styles.sectionTitle}>Delivery Address</h3>
          
          {/* First Line: Region, Province, City */}
          <div className={styles.formRowThree}>
            <div className={styles.formGroup}>
              <label htmlFor="region" className={styles.label}>
                Region
              </label>
              <select 
                id="region"
                className={styles.input}
                value={deliveryAddress.region}
                onChange={(e) => handleAddressChange("region", e.target.value)}
              >
                <option value="">Select Region</option>
                {PHILIPPINE_REGIONS.map(region => (
                  <option key={region.region_code} value={region.region}>
                    {region.region}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="province" className={styles.label}>
                Province
              </label>
              <select 
                id="province"
                className={styles.input}
                value={deliveryAddress.province}
                onChange={(e) => handleAddressChange("province", e.target.value)}
                disabled={!deliveryAddress.region}
              >
                <option value="">Select Province</option>
                {provinces.map(province => (
                  <option key={province.province_code} value={province.province}>
                    {province.province}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="city" className={styles.label}>
                City/Municipality
              </label>
              <select 
                id="city"
                className={styles.input}
                value={deliveryAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                disabled={!deliveryAddress.province}
              >
                <option value="">Select City/Municipality</option>
                {cities.map(city => (
                  <option key={city.city_code} value={city.city}>
                    {city.city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Line: Barangay, Postal Code, Street Name */}
          <div className={styles.formRowThree}>
            <div className={styles.formGroup}>
              <label htmlFor="barangay" className={styles.label}>
                Barangay
              </label>
              <select 
                id="barangay"
                className={styles.input}
                value={deliveryAddress.barangay}
                onChange={(e) => handleAddressChange("barangay", e.target.value)}
                disabled={!deliveryAddress.city}
              >
                <option value="">Select Barangay</option>
                {barangays.map(barangay => (
                  <option key={barangay.brgy_code} value={barangay.brgy}>
                    {barangay.brgy}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="postalCode" className={styles.label}>
                Postal Code
              </label>
              <input
                id="postalCode"
                type="text"
                value={deliveryAddress.postalCode}
                onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                className={styles.input}
                placeholder="Postal Code"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="streetName" className={styles.label}>
                Street Name
              </label>
              <input
                id="streetName"
                type="text"
                value={deliveryAddress.streetName}
                onChange={(e) => handleAddressChange("streetName", e.target.value)}
                className={styles.input}
                placeholder="Street Name"
              />
            </div>
          </div>

          {/* Last Line: House No. and Building (Optional) */}
          <div className={styles.formRowTwo}>
            <div className={styles.formGroup}>
              <label htmlFor="houseNo" className={styles.label}>
                House No.
              </label>
              <input
                id="houseNo"
                type="text"
                value={deliveryAddress.houseNo}
                onChange={(e) => handleAddressChange("houseNo", e.target.value)}
                className={styles.input}
                placeholder="House No."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="building" className={styles.label}>
                Building (Optional)
              </label>
              <input
                id="building"
                type="text"
                value={deliveryAddress.building}
                onChange={(e) => handleAddressChange("building", e.target.value)}
                className={styles.input}
                placeholder="Building"
              />
            </div>
          </div>
        </div>

        {/* Global Save/Cancel Buttons - Always show when there are changes */}
        {hasChanges && (
          <div className={styles.actionButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelAll}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.saveButton}
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className={styles.buttonSpinner} size={16} />
                  Saving...
                </>
              ) : (
                'Save All Changes'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
