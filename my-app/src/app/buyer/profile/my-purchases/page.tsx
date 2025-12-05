"use client";
import { useState, useEffect } from "react";
import styles from "./myPurchases.module.css";
import { Clock, Truck, CheckCircle, Star, Package, ShoppingBag, MessageSquare, Loader, X } from "lucide-react";

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define TypeScript interfaces
interface TrackingItem {
  location: string;
  time: string;
  description: string;
}

interface Product {
  id?: string;
  name: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  unit: string;
  image?: string;
  productImage?: string;
  images?: string[];
  imageUrls?: string[];
  notes?: string;
  productId?: string;
}

interface Seller {
  sellerId: string;
  sellerName: string;
  items: Product[];
  subtotal: number;
  // ADDED: Seller location data
  location?: {
    lat: number;
    lng: number;
    accuracy: 'exact' | 'approximate' | 'barangay';
    address: string;
  };
}

interface Order {
  id: string;
  status: string;
  sellerName: string;
  sellerLogo?: string;
  productImage?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  totalPrice: number;
  orderDate: string;
  createdAt?: string;
  tracking?: TrackingItem[];
  products?: Product[];
  sellers?: Seller[];
  buyerId?: string;
  buyerInfo?: {
    name: string;
    address: string;
    contact: string;
    email: string;
    id: string;
    // ADDED: Buyer location coordinates
    location?: {
      lat: number;
      lng: number;
      accuracy: 'exact' | 'approximate' | 'barangay';
      address: string;
    };
  };
  
  logistics?: {
    courier: string;
    tracking_number: string;
    cold_chain: boolean;
    delivery_status: string;
  };

  // Add missing properties that are used in the code
  deliveryMethod?: string;
  deliveryFee?: number;
  paymentMethod?: string;
  itemCount?: number;
  productCount?: number;
  specialInstructions?: string;
  deliveryOption?: string;
  deliveryTime?: string;
  deliveryDate?: string;
  unitPrice?: number;
}

interface ReviewState {
  [key: string]: number;
}

interface ReviewTextState {
  [key: string]: string;
}

// 🔥 IMPROVED: TRACKING MODAL INTERFACE
interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

// 🔥 UPDATED: REAL MAP COMPONENT WITH ACTUAL LOCATIONS FROM DATABASE
const SimulationMap: React.FC<{ 
  currentLocation: number;
  order: Order;
}> = ({ currentLocation, order }) => {
  
  // 🟢 GET REAL FARM LOCATION FROM SELLER DATA
  const getFarmLocation = (): [number, number] => {
    // Try to get from seller's location data first
    if (order.sellers?.[0]?.location?.lat && order.sellers?.[0]?.location?.lng) {
      const sellerLocation = order.sellers[0].location;
      console.log('📍 Using seller farm location:', sellerLocation);
      return [sellerLocation.lat, sellerLocation.lng];
    }
    
    // Try to get from buyer's address geocoding (fallback)
    if (order.buyerInfo?.location?.lat && order.buyerInfo?.location?.lng) {
      // Use a location near the buyer as farm location (for simulation)
      const buyerLocation = order.buyerInfo.location;
      const farmLat = buyerLocation.lat - 0.02 + (Math.random() * 0.04); // Random nearby location
      const farmLng = buyerLocation.lng - 0.02 + (Math.random() * 0.04);
      console.log('📍 Using simulated farm location near buyer');
      return [farmLat, farmLng];
    }
    
    // Final fallback - use Zambales coordinates (your app's region)
    console.log('📍 Using default Zambales farm location');
    return [14.8300, 120.2800]; // Zambales area coordinates
  };

  // 🟢 GET REAL DELIVERY LOCATION FROM BUYER DATA
  const getDeliveryLocation = (): [number, number] => {
    // Try to get from buyer's location data first
    if (order.buyerInfo?.location?.lat && order.buyerInfo?.location?.lng) {
      const buyerLocation = order.buyerInfo.location;
      console.log('🏠 Using buyer delivery location:', buyerLocation);
      return [buyerLocation.lat, buyerLocation.lng];
    }
    
    // Fallback - try to extract coordinates from address string
    if (order.buyerInfo?.address) {
      // Simple geocoding simulation based on address keywords
      const address = order.buyerInfo.address.toLowerCase();
      if (address.includes('olongapo') || address.includes('subic')) {
        return [14.8295, 120.2828]; // Olongapo area
      } else if (address.includes('iba')) {
        return [15.3276, 119.9780]; // Iba area
      } else if (address.includes('botolan')) {
        return [15.2896, 120.0249]; // Botolan area
      }
    }
    
    // Final fallback - use Zambales coordinates
    console.log('🏠 Using default Zambales delivery location');
    return [14.8600, 120.3100]; // Different Zambales area
  };

  const farmPosition = getFarmLocation();
  const deliveryPosition = getDeliveryLocation();
  
  // Calculate truck position based on progress
  const getTruckPosition = (): [number, number] => {
    const progress = currentLocation / 100;
    return [
      farmPosition[0] + (deliveryPosition[0] - farmPosition[0]) * progress,
      farmPosition[1] + (deliveryPosition[1] - farmPosition[1]) * progress
    ];
  };

  // Calculate actual distance in kilometers
  const calculateDistance = (): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (deliveryPosition[0] - farmPosition[0]) * Math.PI / 180;
    const dLon = (deliveryPosition[1] - farmPosition[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(farmPosition[0] * Math.PI / 180) * Math.cos(deliveryPosition[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return parseFloat(distance.toFixed(1));
  };

  const totalDistance = calculateDistance();
  const distanceCovered = (currentLocation / 100) * totalDistance;
  const distanceRemaining = totalDistance - distanceCovered;

  // Calculate ETA based on distance and progress
  const calculateETA = (): string => {
    const averageSpeed = 40; // km/h average delivery speed
    const remainingTimeHours = distanceRemaining / averageSpeed;
    const remainingMinutes = Math.round(remainingTimeHours * 60);
    
    if (remainingMinutes <= 0) return "Arrived";
    if (remainingMinutes < 60) return `${remainingMinutes} min`;
    
    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Custom icons with better styling
  const createCustomIcon = (emoji: string, color: string, label: string) => {
    return L.divIcon({
      html: `
        <div style="
          background: ${color};
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: bold;
        ">
          ${emoji}
          <div style="
            font-size: 8px;
            margin-top: 2px;
            background: rgba(0,0,0,0.7);
            padding: 1px 4px;
            border-radius: 4px;
            white-space: nowrap;
          ">${label}</div>
        </div>
      `,
      className: 'custom-marker-icon',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  // Calculate optimal map bounds to show both points
  const getMapBounds = (): [number, number][] => {
    const padding = 0.02; // Add padding around points
    return [
      [
        Math.min(farmPosition[0], deliveryPosition[0]) - padding,
        Math.min(farmPosition[1], deliveryPosition[1]) - padding
      ],
      [
        Math.max(farmPosition[0], deliveryPosition[0]) + padding,
        Math.max(farmPosition[1], deliveryPosition[1]) + padding
      ]
    ];
  };

  // Get location accuracy info
  const getLocationAccuracy = () => {
    const farmAccuracy = order.sellers?.[0]?.location?.accuracy || 'barangay';
    const deliveryAccuracy = order.buyerInfo?.location?.accuracy || 'barangay';
    
    return {
      farm: farmAccuracy,
      delivery: deliveryAccuracy,
      hasExactLocations: farmAccuracy === 'exact' && deliveryAccuracy === 'exact'
    };
  };

  const accuracyInfo = getLocationAccuracy();

  return (
    <div className={styles.mapSection}>
      <div className={styles.mapHeader}>
        <h3>Live Delivery Tracking</h3>
        <div className={styles.mapStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{distanceCovered.toFixed(1)} km</span>
            <span className={styles.statLabel}>Covered</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{distanceRemaining.toFixed(1)} km</span>
            <span className={styles.statLabel}>Remaining</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalDistance} km</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{calculateETA()}</span>
            <span className={styles.statLabel}>ETA</span>
          </div>
        </div>
      </div>

      {/* Location Accuracy Indicator */}
      <div className={styles.accuracyIndicator}>
        <div className={`${styles.accuracyBadge} ${
          accuracyInfo.hasExactLocations ? styles.exact : styles.approximate
        }`}>
          {accuracyInfo.hasExactLocations ? '📍 Exact Locations' : '📍 Approximate Locations'}
        </div>
        {!accuracyInfo.hasExactLocations && (
          <div className={styles.accuracyNote}>
            Using {accuracyInfo.farm}-level farm and {accuracyInfo.delivery}-level delivery locations
          </div>
        )}
      </div>
      
      <div className={styles.mapContainer}>
        <MapContainer 
          bounds={getMapBounds()}
          style={{ height: '350px', width: '100%', borderRadius: '12px' }}
          scrollWheelZoom={true}
          dragging={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Farm Marker */}
          <Marker 
            position={farmPosition}
            icon={createCustomIcon('🌱', '#10B981', 'Farm')}
          >
            <Popup>
              <div className={styles.popupContent}>
                <div className={styles.popupIcon}>🌱</div>
                <strong>{order.sellerName || 'Fresh Farms Co.'}</strong>
                <div>Farm Location</div>
                <div className={styles.popupAddress}>
                  {order.sellers?.[0]?.location?.address || 'Farm Location'}<br />
                  Accuracy: {accuracyInfo.farm}<br />
                  Coordinates: {farmPosition[0].toFixed(6)}, {farmPosition[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Delivery Truck Marker */}
          <Marker 
            position={getTruckPosition()}
            icon={createCustomIcon('🚚', '#3B82F6', 'Delivery')}
          >
            <Popup>
              <div className={styles.popupContent}>
                <div className={styles.popupIcon}>🚚</div>
                <strong>Delivery Vehicle #F2T-{Math.random().toString(36).substr(2, 6).toUpperCase()}</strong>
                <div>On the way to you</div>
                <div className={styles.progressText}>
                  {currentLocation}% complete • ETA: {calculateETA()}
                </div>
                <div className={styles.coordinates}>
                  Current Position:<br />
                  {getTruckPosition()[0].toFixed(6)}, {getTruckPosition()[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
          
          {/* Delivery Location Marker */}
          <Marker 
            position={deliveryPosition}
            icon={createCustomIcon('🏠', '#EC4899', 'You')}
          >
            <Popup>
              <div className={styles.popupContent}>
                <div className={styles.popupIcon}>🏠</div>
                <strong>Delivery Location</strong>
                <div>Your address</div>
                <div className={styles.popupAddress}>
                  {order.buyerInfo?.address || 'Customer Location'}<br />
                  Accuracy: {accuracyInfo.delivery}<br />
                  Coordinates: {deliveryPosition[0].toFixed(6)}, {deliveryPosition[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Draw a line between farm and delivery location */}
          <Polyline
            positions={[farmPosition, deliveryPosition]}
            color="#3B82F6"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />

          {/* Draw a line from farm to current truck position */}
          <Polyline
            positions={[farmPosition, getTruckPosition()]}
            color="#10B981"
            weight={3}
            opacity={0.9}
          />
        </MapContainer>
      </div>

      {/* Enhanced Route Progress */}
      <div className={styles.routeProgressBar}>
        <div className={styles.routeLabels}>
          <span>🌱 {order.sellerName || 'Farm'}</span>
          <span>🏠 Your Location</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${currentLocation}%` }}
          ></div>
        </div>
        <div className={styles.progressDetails}>
          <div className={styles.progressText}>
            Delivery Progress: {currentLocation}% • ETA: {calculateETA()}
          </div>
          <div className={styles.distanceText}>
            {distanceCovered.toFixed(1)} km of {totalDistance} km
          </div>
        </div>
      </div>

      {/* Real-time Distance Information */}
      <div className={styles.distanceInfo}>
        <div className={styles.distanceCard}>
          <div className={styles.distanceItem}>
            <span className={styles.distanceLabel}>Distance from Farm:</span>
            <span className={styles.distanceValue}>{distanceCovered.toFixed(1)} km</span>
          </div>
          <div className={styles.distanceItem}>
            <span className={styles.distanceLabel}>Distance to You:</span>
            <span className={styles.distanceValue}>{distanceRemaining.toFixed(1)} km</span>
          </div>
          <div className={styles.distanceItem}>
            <span className={styles.distanceLabel}>Total Route:</span>
            <span className={styles.distanceValue}>{totalDistance} km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔥 UPDATED: MODERN TRACKING MODAL WITH REAL LOCATIONS FROM DATABASE
const TrackingModal: React.FC<TrackingModalProps> = ({ isOpen, onClose, order }) => {
  const [currentLocation, setCurrentLocation] = useState(0);
  const [isDelivered, setIsDelivered] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // 🟢 CALCULATE REAL DISTANCE BASED ON ACTUAL COORDINATES
  const calculateRealDistance = (): number => {
    const getFarmCoords = (): [number, number] => {
      if (order.sellers?.[0]?.location?.lat && order.sellers?.[0]?.location?.lng) {
        return [order.sellers[0].location.lat, order.sellers[0].location.lng];
      }
      return [14.8300, 120.2800]; // Default Zambales
    };

    const getDeliveryCoords = (): [number, number] => {
      if (order.buyerInfo?.location?.lat && order.buyerInfo?.location?.lng) {
        return [order.buyerInfo.location.lat, order.buyerInfo.location.lng];
      }
      return [14.8600, 120.3100]; // Default Zambales
    };

    const farmPos = getFarmCoords();
    const deliveryPos = getDeliveryCoords();
    
    const R = 6371;
    const dLat = (deliveryPos[0] - farmPos[0]) * Math.PI / 180;
    const dLon = (deliveryPos[1] - farmPos[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(farmPos[0] * Math.PI / 180) * Math.cos(deliveryPos[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return parseFloat((R * c).toFixed(1));
  };

  const realDistance = calculateRealDistance();
  
  // ✅ IMPROVED: Enhanced timeline with realistic times based on actual distance
  const getTrackingSteps = (distance: number) => {
    const baseTime = 7; // 7:00 AM start
    const timePerStep = Math.max(1.5, distance / 25); // Adjust time based on distance
    
    return [
      { 
        name: "Farm Preparation", 
        position: 0, 
        time: `${baseTime}:00 AM`, 
        description: "Fresh products harvested and prepared at the farm",
        icon: "🌱", 
        color: "#10B981"
      },
      { 
        name: "Quality Check", 
        position: 20, 
        time: `${baseTime + 2}:30 AM`, 
        description: "Quality inspection and premium packaging completed",
        icon: "✅",
        color: "#3B82F6"
      },
      { 
        name: "Dispatch", 
        position: 40, 
        time: `${baseTime + 4}:00 AM`, 
        description: "Package dispatched from farm to delivery hub",
        icon: "🚚",
        color: "#8B5CF6"
      },
      { 
        name: "In Transit", 
        position: 60, 
        time: `${baseTime + 6}:00 AM`, 
        description: `On the way to your location - ${distance}km journey`,
        icon: "📦",
        color: "#F59E0B"
      },
      { 
        name: "Out for Delivery", 
        position: 80, 
        time: `${baseTime + 8}:30 AM`, 
        description: "Driver is in your area with your fresh package",
        icon: "🏍️",
        color: "#EC4899"
      },
      { 
        name: "Delivered", 
        position: 100, 
        time: `${baseTime + 10}:00 AM`, 
        description: "Fresh package successfully delivered to you!",
        icon: "🎉",
        color: "#059669"
      }
    ];
  };

  const trackingSteps = getTrackingSteps(realDistance);

  useEffect(() => {
    if (!isOpen) return;

    // Reset animation when modal opens
    setCurrentLocation(0);
    setIsDelivered(false);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentLocation(prev => {
        const newLocation = prev + 1;
        
        // Update current step based on location
        const activeStep = trackingSteps.findIndex(step => newLocation <= step.position);
        setCurrentStep(activeStep >= 0 ? activeStep : trackingSteps.length - 1);
        
        if (newLocation >= 100) {
          clearInterval(interval);
          setIsDelivered(true);
          setCurrentStep(trackingSteps.length - 1);
          return 100;
        }
        return newLocation;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.trackingModalOverlay}>
      <div className={styles.trackingModal}>
        {/* Enhanced Header */}
        <div className={styles.trackingHeader}>
          <div className={styles.trackingTitle}>
            <div className={styles.titleIcon}>
              <Truck size={28} />
            </div>
            <div>
              <h2>Live Delivery Tracking</h2>
              <p className={styles.titleSubtitle}>Real-time GPS • {realDistance}km Route • Farm2Table Express</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.trackingCloseBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Order Info Card */}
        <div className={styles.orderInfoCard}>
          <div className={styles.orderInfoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Order ID</span>
              <span className={styles.infoValue}>#{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Route Distance</span>
              <span className={styles.infoValue}>
                <span className={styles.distanceBadge}>🗺️ {realDistance} km</span>
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Service</span>
              <span className={styles.infoValue}>
                <span className={styles.expressBadge}>🚚 Real-time GPS Tracking</span>
              </span>
            </div>
          </div>
          
          {/* Location Accuracy Info */}
          <div className={styles.locationAccuracyInfo}>
            <div className={styles.accuracyItem}>
              <span>Farm Location:</span>
              <strong>{order.sellers?.[0]?.location?.accuracy || 'barangay'}-level accuracy</strong>
            </div>
            <div className={styles.accuracyItem}>
              <span>Delivery Location:</span>
              <strong>{order.buyerInfo?.location?.accuracy || 'barangay'}-level accuracy</strong>
            </div>
          </div>

          {order.logistics?.cold_chain && (
            <div className={styles.coldChainNotice}>
              <span className={styles.coldChainIcon}>❄️</span>
              Temperature Controlled Delivery • Freshness Guaranteed
            </div>
          )}
        </div>

        {/* 🔥 UPDATED: LEAFLET MAP WITH REAL DATABASE LOCATIONS */}
        <SimulationMap 
          currentLocation={currentLocation}
          order={order}
        />

        {/* Main Progress Visualization */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <div className={styles.progressStatus}>
              {isDelivered ? (
                <div className={styles.deliveredStatus}>
                  <div className={styles.statusIcon}>🎉</div>
                  <div>
                    <div className={styles.statusTitle}>Delivered Successfully!</div>
                    <div className={styles.statusTime}>Completed at {trackingSteps[5]?.time}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.inProgressStatus}>
                  <div className={styles.statusIcon}>📦</div>
                  <div>
                    <div className={styles.statusTitle}>Delivery in Progress</div>
                    <div className={styles.statusSubtitle}>
                      {trackingSteps[currentStep]?.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.etaContainer}>
              <div className={styles.etaLabel}>Estimated Delivery</div>
              <div className={styles.etaTime}>Today, {trackingSteps[5]?.time}</div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${currentLocation}%` }}
              >
                <div className={styles.progressGlow}></div>
              </div>
            </div>
            <div className={styles.progressPercentage}>
              {Math.round(currentLocation)}% Complete • {realDistance}km Route
            </div>
          </div>
        </div>

        {/* Enhanced Timeline */}
        <div className={styles.timelineSection}>
          <div className={styles.timelineHeader}>
            <h3>Today's Delivery Journey</h3>
            <div className={styles.timelineStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{trackingSteps.length}</span>
                <span className={styles.statLabel}>Steps</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{realDistance}</span>
                <span className={styles.statLabel}>km</span>
              </div>
            </div>
          </div>
          
          <div className={styles.timeline}>
            {trackingSteps.map((step, index) => (
              <div 
                key={index} 
                className={`${styles.timelineStep} ${
                  currentStep >= index ? styles.active : ''
                } ${currentStep === index ? styles.current : ''}`}
              >
                <div className={styles.stepIndicator}>
                  <div 
                    className={styles.stepIcon}
                    style={{ 
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`,
                      borderColor: step.color
                    }}
                  >
                    <span>{step.icon}</span>
                  </div>
                  {index < trackingSteps.length - 1 && (
                    <div 
                      className={styles.stepConnector}
                      style={{
                        background: currentStep > index 
                          ? `linear-gradient(to bottom, ${step.color}, ${trackingSteps[index + 1].color})`
                          : '#E5E7EB'
                      }}
                    ></div>
                  )}
                </div>
                
                <div className={styles.stepContent}>
                  <div className={styles.stepHeader}>
                    <div className={styles.stepInfo}>
                      <span className={styles.stepName}>{step.name}</span>
                      <span className={styles.stepTime}>{step.time}</span>
                    </div>
                    {currentStep > index && (
                      <div className={styles.completedBadge}>
                        <CheckCircle size={14} />
                        Completed
                      </div>
                    )}
                    {currentStep === index && (
                      <div className={styles.currentBadge}>
                        <div className={styles.pulsingDot}></div>
                        Live
                      </div>
                    )}
                  </div>
                  <div className={styles.stepDescription}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Guarantee Card */}
        <div className={styles.guaranteeSection}>
          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeHeader}>
              <div className={styles.guaranteeIcon}>⚡</div>
              <div>
                <h4>Farm2Table Delivery Promise</h4>
                <p>Fresh from farm to your doorstep in one day • {realDistance}km route</p>
              </div>
            </div>
            <div className={styles.guaranteeFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🌅</div>
                <span>Morning Harvest</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>📏</div>
                <span>{realDistance}km Route</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>❄️</div>
                <span>Temperature Controlled</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⭐</div>
                <span>Quality Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionSection}>
          <div className={styles.actionButtons}>
            <button className={styles.secondaryBtn} onClick={onClose}>
              <span>Close Tracking</span>
            </button>
            
            {!isDelivered ? (
              <>
                <button className={styles.primaryBtn}>
                  <div className={styles.btnIcon}>📞</div>
                  <span>Contact Driver</span>
                </button>
                <button className={styles.outlineBtn}>
                  <div className={styles.btnIcon}>🔔</div>
                  <span>Get Notifications</span>
                </button>
              </>
            ) : (
              <button className={styles.successBtn}>
                <div className={styles.btnIcon}>✓</div>
                <span>Order Completed</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ CORRECTED: Status mapping function
const mapSellerStatusToBuyer = (sellerStatus: string): string => {
  switch (sellerStatus) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'to-ship';
    case 'ready_for_pickup':
      return 'to-ship';
    case 'shipped':
      return 'to-receive';
    case 'to-review':  // ✅ This should map to 'to-review'
      return 'to-review';
    case 'completed':  // ✅ 'completed' should stay as 'completed'
      return 'completed';
    case 'canceled':
      return 'canceled';
    default:
      return sellerStatus;
  }
};

// Utility function to convert Firestore Timestamps
const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000);
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (typeof timestamp === 'string') {
    return new Date(timestamp);
  } else {
    return new Date();
  }
};

// Seller service to fetch actual seller logos using sellerId
const sellerService = {
  async getSellerById(sellerId: string): Promise<any> {
    try {
      console.log('🔄 Fetching seller from Firestore:', sellerId);
      
      const { db } = await import("../../../../utils/lib/firebase");
      const { doc, getDoc } = await import("firebase/firestore");
      
      const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
      
      if (sellerDoc.exists()) {
        const sellerData = sellerDoc.data();
        console.log('✅ Seller data found in Firestore:', {
          sellerId,
          farmLogo: sellerData.farm?.logo,
          logo: sellerData.logo,
          farmName: sellerData.farm?.farmName,
          fullName: sellerData.fullName
        });
        return sellerData;
      } else {
        console.log('❌ Seller not found in Firestore:', sellerId);
        throw new Error('Seller not found');
      }
    } catch (error) {
      console.error('❌ Error fetching seller from Firestore:', error);
      throw error;
    }
  },

  async getSellerLogo(sellerId: string): Promise<string | null> {
    try {
      console.log('🔄 Fetching seller logo for sellerId:', sellerId);
      
      const seller = await this.getSellerById(sellerId);
      
      const logo = seller.farm?.logo || 
                   seller.logo || 
                   seller.profilePicture || 
                   seller.avatar || 
                   null;
      
      console.log('✅ Found seller logo:', logo);
      return logo;
      
    } catch (error) {
      console.error('❌ Error getting seller logo:', error);
      return null;
    }
  },

  async getSellerName(sellerId: string): Promise<string> {
    try {
      const seller = await this.getSellerById(sellerId);
      return seller.farm?.farmName || seller.fullName || "Seller";
    } catch (error) {
      console.error('❌ Error getting seller name:', error);
      return "Seller";
    }
  }
};

// UPDATED: Get product details function that handles both structures
const getProductDetails = (order: Order, productIndex: number) => {
  // FIRST: Try sellers[0].items (new structure)
  if (order.sellers && order.sellers.length > 0) {
    const seller = order.sellers[0];
    if (seller.items && seller.items.length > productIndex) {
      const item = seller.items[productIndex];
      return {
        name: item.name || "Product",
        quantity: item.quantity || 1,
        unit: item.unit || "pc",
        price: item.price || item.unitPrice || 0,
        notes: item.notes || ""
      };
    }
  }

  // SECOND: Try products array directly (old structure)
  if (order.products && order.products.length > productIndex) {
    const product = order.products[productIndex];
    return {
      name: product.name || "Product",
      quantity: product.quantity || 1,
      unit: product.unit || "pc",
      price: product.unitPrice || product.price || 0,
      notes: product.notes || ""
    };
  }

  // THIRD: Fallback - check if there's any product data at root level
  if (order.productName && productIndex === 0) {
    return {
      name: order.productName || "Product",
      quantity: order.quantity || 1,
      unit: "pc",
      price: order.price || order.unitPrice || 0,
      notes: ""
    };
  }

  // Default fallback
  return {
    name: "Product",
    quantity: 1,
    unit: "pc",
    price: 0,
    notes: ""
  };
};

// UPDATED: Image utility functions to handle both structures
const imageUtils = {
  getProductImage(order: Order, productIndex: number): string {
    // FIRST: Check sellers[0].items[productIndex].image (new structure)
    if (order.sellers && order.sellers.length > 0) {
      const seller = order.sellers[0];
      if (seller.items && seller.items.length > productIndex) {
        const sellerItem = seller.items[productIndex];
        if (sellerItem.image) {
          return sellerItem.image;
        }
      }
    }

    // SECOND: Check if there's a productImage in the main order
    if (order.productImage) {
      return order.productImage;
    }

    // THIRD: Check products array if it exists (old structure)
    if (order.products && order.products.length > productIndex) {
      const mainProduct = order.products[productIndex];
      if (mainProduct.image) {
        return mainProduct.image;
      }
      if (mainProduct.productImage) {
        return mainProduct.productImage;
      }
    }

    // FINAL: Use fallback
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
  },

  handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const target = e.target as HTMLImageElement;
    console.warn('🖼️ Image failed to load, using fallback:', target.src);
    target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    target.onerror = null;
  },

  handleSellerImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    const target = e.target as HTMLImageElement;
    console.warn('🏪 Seller image failed to load, using fallback:', target.src);
    target.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
    target.onerror = null;
  }
};

const orderCategories = [
  { key: "all", label: "All", icon: ShoppingBag },
  { key: "pending", label: "Pending", icon: Clock },
  { key: "to-ship", label: "To Ship", icon: Package },
  { key: "to-receive", label: "To Receive", icon: Truck },
  { key: "to-review", label: "To Review", icon: MessageSquare },
  { key: "completed", label: "Completed", icon: CheckCircle }
];

// Component for seller info with logo
const SellerInfoWithLogo = ({ order }: { order: Order }) => {
  const [sellerLogo, setSellerLogo] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(true);
  const [sellerName, setSellerName] = useState<string>(order.sellerName || order.sellers?.[0]?.sellerName || "Seller");

  useEffect(() => {
    const loadSellerLogo = async () => {
      try {
        setLogoLoading(true);
        
        const sellerId = order.sellers?.[0]?.sellerId;
        
        if (sellerId) {
          console.log('🔄 Loading seller logo for sellerId:', sellerId);
          
          if (order.sellerLogo) {
            console.log('✅ Using sellerLogo from order data:', order.sellerLogo);
            setSellerLogo(order.sellerLogo);
            setLogoLoading(false);
            return;
          }
          
          try {
            const logo = await sellerService.getSellerLogo(sellerId);
            if (logo) {
              console.log('✅ Fetched seller logo from Firestore:', logo);
              setSellerLogo(logo);
              
              const updatedSellerName = await sellerService.getSellerName(sellerId);
              if (updatedSellerName && updatedSellerName !== "Seller") {
                setSellerName(updatedSellerName);
              }
            } else {
              console.log('⚠️ No logo found for seller, using fallback');
              setSellerLogo("https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
            }
          } catch (error) {
            console.error('❌ Error fetching seller logo from Firestore:', error);
            setSellerLogo("https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
          }
        } else {
          console.log('❌ No sellerId found in order');
          setSellerLogo("https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
        }
      } catch (error) {
        console.error('❌ Error loading seller logo:', error);
        setSellerLogo("https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
      } finally {
        setLogoLoading(false);
      }
    };

    loadSellerLogo();
  }, [order]);

  const handleImageError = () => {
    console.warn('🏪 Seller logo failed to load:', sellerLogo);
    setSellerLogo("https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
  };

  return (
    <div className={styles.sellerInfo}>
      <div className={styles.farmInfo}>
        {logoLoading ? (
          <div className={styles.sellerLogoLoading}>
            <Loader size={16} className={styles.spinner} />
          </div>
        ) : (
          <img 
            src={sellerLogo}
            alt={sellerName}
            className={styles.sellerLogo}
            onError={handleImageError}
          />
        )}
        <span className={styles.farmName}>
          {sellerName}
        </span>
      </div>
    </div>
  );
};

// Component for individual product with image loading
const ProductWithImage = ({ order, productIndex }: { order: Order, productIndex: number }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadProductImage = async () => {
      try {
        setImageLoading(true);
        
        const url = imageUtils.getProductImage(order, productIndex);
        setImageUrl(url);
        
      } catch (error) {
        console.error('❌ Error loading product image:', error);
        setImageUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
      } finally {
        setImageLoading(false);
      }
    };

    loadProductImage();
  }, [order, productIndex]);

  const handleImageError = () => {
    console.warn('🖼️ Product image failed to load:', imageUrl);
    setImageUrl("https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80");
  };

  // UPDATED: Use the shared getProductDetails function
  const productDetails = getProductDetails(order, productIndex);

  if (imageLoading) {
    return (
      <div className={styles.productDetails}>
        <div className={styles.imageLoading}>
          <Loader size={20} className={styles.spinner} />
        </div>
        <div className={styles.productInfo}>
          <div className={styles.productText}>
            <h3 className={styles.productName}>{productDetails.name}</h3>
            <span className={styles.quantity}>
              Quantity: {productDetails.quantity} {productDetails.unit}
            </span>
            {productDetails.notes && (
              <span className={styles.notes}>
                Notes: {productDetails.notes}
              </span>
            )}
          </div>
          <div className={styles.priceInfo}>
            <div className={styles.price}>
              ₱{productDetails.price} each
            </div>
            <div className={styles.totalPrice}>
              <span className={styles.totalLabel}>Total:</span> 
              ₱{productDetails.price * productDetails.quantity}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productDetails}>
      <img 
        src={imageUrl}
        alt={productDetails.name}
        className={styles.productImage}
        onError={handleImageError}
      />
      <div className={styles.productInfo}>
        <div className={styles.productText}>
          <h3 className={styles.productName}>{productDetails.name}</h3>
          <span className={styles.quantity}>
            Quantity: {productDetails.quantity} {productDetails.unit}
          </span>
          {productDetails.notes && (
            <span className={styles.notes}>
              Notes: {productDetails.notes}
            </span>
          )}
        </div>
        <div className={styles.priceInfo}>
          <div className={styles.price}>
            ₱{productDetails.price} each
          </div>
          <div className={styles.totalPrice}>
            <span className={styles.totalLabel}>Total:</span> 
            ₱{productDetails.price * productDetails.quantity}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyPurchasesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [ratings, setRatings] = useState<ReviewState>({});
  const [reviewTexts, setReviewTexts] = useState<ReviewTextState>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // 🔥 ADD TRACKING MODAL STATE
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // 🔥 ADD TRACK PACKAGE HANDLER
  const handleTrackPackage = (order: Order) => {
    setTrackingOrder(order);
    setShowTrackingModal(true);
  };

  // 🔥 ADD CLOSE TRACKING HANDLER
  const handleCloseTracking = () => {
    setShowTrackingModal(false);
    setTrackingOrder(null);
  };

  // UPDATED: Real-time Firestore listener with corrected status mapping
  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const { auth, db } = await import("../../../../utils/lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        const { collection, query, where, onSnapshot, orderBy } = await import("firebase/firestore");
        
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setCurrentUser(user);
            console.log("🔥 Current user:", user.uid);
            
            try {
              // Create real-time query for user's orders
              const ordersQuery = query(
                collection(db, "orders"),
                where("buyerId", "==", user.uid),
                orderBy("createdAt", "desc")
              );
              
              console.log("🔄 Setting up real-time listener for user:", user.uid);
              
              // Set up real-time listener
              const unsubscribe = onSnapshot(ordersQuery, 
                (snapshot) => {
                  console.log("🔄 Real-time order update received, documents:", snapshot.size);
                  
                  const ordersData: Order[] = [];
                  snapshot.forEach((doc) => {
                    const orderData = doc.data();
                    
                    console.log("📦 Processing order from Firestore:", {
                      firebaseDocId: doc.id,
                      customOrderId: orderData.id,
                      status: orderData.status,
                      buyerId: orderData.buyerId
                    });
                    
                    const processedOrder: Order = {
                      id: doc.id,
                      status: mapSellerStatusToBuyer(orderData.status || 'pending'), // ✅ Uses corrected mapping
                      sellerName: orderData.sellerName || orderData.sellers?.[0]?.sellerName || "Seller",
                      totalPrice: orderData.totalPrice || 0,
                      orderDate: orderData.orderDate || orderData.createdAt,
                      createdAt: orderData.createdAt,
                      tracking: orderData.tracking,
                      products: orderData.products,
                      sellers: orderData.sellers,
                      buyerId: orderData.buyerId,
                      buyerInfo: orderData.buyerInfo,
                      logistics: orderData.logistics,
                      deliveryMethod: orderData.deliveryMethod,
                      deliveryFee: orderData.deliveryFee,
                      paymentMethod: orderData.paymentMethod,
                      itemCount: orderData.itemCount,
                      productCount: orderData.productCount,
                      specialInstructions: orderData.specialInstructions,
                      deliveryOption: orderData.deliveryOption,
                      deliveryTime: orderData.deliveryTime,
                      deliveryDate: orderData.deliveryDate,
                      unitPrice: orderData.unitPrice,
                      productName: orderData.productName,
                      quantity: orderData.quantity,
                      price: orderData.price,
                      productImage: orderData.productImage,
                      sellerLogo: orderData.sellerLogo
                    };
                    
                    ordersData.push(processedOrder);
                  });
                  
                  console.log("✅ Real-time orders updated:", ordersData.length);
                  console.log("📋 Final Order Statuses:", ordersData.map(o => ({ id: o.id, status: o.status })));
                  setOrders(ordersData);
                  setLoading(false);
                  setFirebaseError(null);
                },
                (error) => {
                  console.error("❌ Real-time listener error:", error);
                  
                  // Handle index creation prompts
                  if (error.code === 'failed-precondition') {
                    const errorMsg = `Firestore index required: ${error.message}. Please check the Firebase console for a link to create the required index.`;
                    setFirebaseError(errorMsg);
                    console.error('🔧 Index creation required:', errorMsg);
                  } else {
                    setFirebaseError('Failed to load orders. Please try again.');
                  }
                  setLoading(false);
                }
              );
              
              // Cleanup listener on unmount
              return () => {
                console.log("🧹 Cleaning up real-time listener");
                unsubscribe();
              };
            } catch (queryError) {
              console.error("❌ Error creating query:", queryError);
              setFirebaseError('Error setting up order query. Please refresh the page.');
              setLoading(false);
            }
          } else {
            console.log("❌ No user logged in");
            setOrders([]);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error setting up real-time listener:", error);
        setFirebaseError('Failed to initialize Firebase. Please check your connection.');
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    if (selectedCategory === "all") return true;
    return order.status === selectedCategory;
  });

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} />;
      case "to-ship":
        return <Package size={16} />;
      case "to-receive":
        return <Truck size={16} />;
      case "to-review":
        return <MessageSquare size={16} />;
      case "completed":
        return <CheckCircle size={16} />;
      default:
        return <ShoppingBag size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "to-ship":
        return "#3B82F6";
      case "to-receive":
        return "#8B5CF6";
      case "to-review":
        return "#10B981";
      case "completed":
        return "#059669";
      default:
        return "#6B7280";
    }
  };

  const getLatestTracking = (tracking: TrackingItem[] | undefined) => {
    if (!tracking || tracking.length === 0) {
      return {
        location: "Order Placed",
        time: new Date().toLocaleString(),
        description: "Your order has been received"
      };
    }
    
    const latestTrack = tracking[tracking.length - 1];
    return {
      location: latestTrack.location,
      time: latestTrack.time,
      description: latestTrack.description
    };
  };

  const handleStarClick = (orderId: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [orderId]: rating
    }));
  };

  const handleReviewTextChange = (orderId: string, text: string) => {
    setReviewTexts(prev => ({
      ...prev,
      [orderId]: text
    }));
  };

  const handleContactSeller = (order: Order) => {
    const sellerId = order.sellers?.[0]?.sellerId;
    const sellerName = order.sellerName || order.sellers?.[0]?.sellerName || "Seller";
    
    const products = order.sellers?.[0]?.items || order.products || [];
    const productDetails = products.map(product => ({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      price: product.price || product.unitPrice
    }));

    const orderSummary = `Order #${order.id}\n\nProducts:\n${productDetails.map(p => 
      `• ${p.name} - ${p.quantity} ${p.unit} - ₱${p.price} each`
    ).join('\n')}\n\nTotal: ₱${order.totalPrice}\nOrder Date: ${convertFirestoreTimestamp(order.orderDate).toLocaleDateString()}`;

    const encodedMessage = encodeURIComponent(orderSummary);
    
    window.location.href = `/buyer/profile/messages?sellerId=${sellerId}&sellerName=${encodeURIComponent(sellerName)}&message=${encodedMessage}`;
  };

  const renderStars = (orderId: string) => {
    const currentRating = ratings[orderId] || 0;
    return (
      <div className={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${styles.star} ${star <= currentRating ? styles.active : ''}`}
            onClick={() => handleStarClick(orderId, star)}
            type="button"
          >
            <Star size={20} fill={star <= currentRating ? "#FFB319" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  const handleConfirmReceipt = async (orderId: string) => {
    setUpdatingOrder(orderId);
    try {
      const { db } = await import("../../../../utils/lib/firebase");
      const { doc, updateDoc, Timestamp } = await import("firebase/firestore");
      
      await updateDoc(doc(db, "orders", orderId), {
        status: 'to-review',
        updatedAt: Timestamp.now()
      });

      // 🔥 CRITICAL FIX: Update local state immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'to-review' }
            : order
        )
      );
      
    } catch (error: any) {
      console.error('❌ Error confirming receipt:', error);
      if (error.code === 'failed-precondition') {
        alert('Index required. Please check Firebase console for index creation link.');
      } else {
        alert('Failed to confirm receipt. Please try again.');
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  // UPDATED: Enhanced handleSubmitReview with immediate local state updates
  const handleSubmitReview = async (orderId: string) => {
    const rating = ratings[orderId];
    const reviewText = reviewTexts[orderId] || '';
    
    if (!rating) {
      alert('Please select a rating before submitting your review.');
      return;
    }

    setUpdatingOrder(orderId);
    try {
      const { db } = await import("../../../../utils/lib/firebase");
      const { doc, updateDoc, Timestamp, collection, addDoc, getDoc } = await import("firebase/firestore");
      
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      console.log('🔍 DEBUG - Order structure:', order);

      // Enhanced product ID extraction
      const getProductId = () => {
        // Try sellers[0].items[0].productId (new structure)
        if (order.sellers?.[0]?.items?.[0]?.productId) {
          return order.sellers[0].items[0].productId;
        }
        // Try sellers[0].items[0].id
        if (order.sellers?.[0]?.items?.[0]?.id) {
          return order.sellers[0].items[0].id;
        }
        // Try products[0].productId (old structure)
        if (order.products?.[0]?.productId) {
          return order.products[0].productId;
        }
        // Try products[0].id
        if (order.products?.[0]?.id) {
          return order.products[0].id;
        }
        
        // Last resort
        const productDetails = getProductDetails(order, 0);
        return `temp-product-${orderId}-${Date.now()}`;
      };

      const sellerId = order.sellers?.[0]?.sellerId || 'unknown-seller';
      const sellerName = order.sellerName || order.sellers?.[0]?.sellerName || "Seller";
      const productDetails = getProductDetails(order, 0);
      const productId = getProductId();

      console.log('📋 Review data:', {
        productId,
        sellerId,
        sellerName,
        productName: productDetails.name
      });

      // 1. Save the review to the reviews collection
      const reviewData = {
        orderId: orderId,
        buyerId: currentUser?.uid || 'unknown-buyer',
        buyerName: currentUser?.displayName || currentUser?.email || 'Anonymous Buyer',
        buyerEmail: currentUser?.email || '',
        sellerId: sellerId,
        sellerName: sellerName,
        productId: productId,
        productName: productDetails.name || 'Product',
        rating: rating,
        reviewText: reviewText,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        orderTotal: order.totalPrice || 0,
        productQuantity: productDetails.quantity || 1,
        productUnit: productDetails.unit || 'pc',
        farmName: sellerName,
        category: 'General',
        isActive: true,
        productImage: imageUtils.getProductImage(order, 0)
      };

      console.log('📝 Saving review to reviews collection...');
      
      // This will automatically create the reviews collection
      const reviewRef = await addDoc(collection(db, "reviews"), reviewData);
      console.log('✅ Review saved with ID:', reviewRef.id);

      // 2. Update product review stats if we have a valid product ID
      try {
        if (!productId.startsWith('temp-product-')) {
          const productDoc = doc(db, "products", productId);
          const productSnapshot = await getDoc(productDoc);
          
          if (productSnapshot.exists()) {
            const productData = productSnapshot.data();
            const currentRating = productData.averageRating || 0;
            const currentReviewCount = productData.reviewCount || 0;
            
            const newReviewCount = currentReviewCount + 1;
            const newAverageRating = ((currentRating * currentReviewCount) + rating) / newReviewCount;
            
            await updateDoc(productDoc, {
              averageRating: Math.round(newAverageRating * 10) / 10,
              reviewCount: newReviewCount,
              updatedAt: Timestamp.now()
            });
            
            console.log('✅ Product review stats updated');
          }
        }
      } catch (productUpdateError: any) {
        console.warn('⚠️ Could not update product review stats:', productUpdateError);
        // Continue even if product update fails
      }

      // 3. Update the order status to 'completed' in Firebase
      await updateDoc(doc(db, "orders", orderId), {
        status: 'completed', // 🔥 This updates Firebase to 'completed'
        updatedAt: Timestamp.now(),
        review: {
          rating: rating,
          text: reviewText,
          submittedAt: Timestamp.now(),
          buyerId: currentUser?.uid || 'unknown-buyer',
          buyerName: currentUser?.displayName || currentUser?.email || 'Anonymous Buyer',
          productId: productId,
          productName: productDetails.name || 'Product',
          reviewId: reviewRef.id
        }
      });

      // 🔥 CRITICAL FIX: Update local state immediately
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'completed' }
            : order
        )
      );

      // Clear review form data
      setRatings(prev => {
        const newRatings = { ...prev };
        delete newRatings[orderId];
        return newRatings;
      });
      setReviewTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[orderId];
        return newTexts;
      });

      // Also collapse the expanded order if it's open
      if (expandedOrder === orderId) {
        setExpandedOrder(null);
      }
      
      alert('Thank you for your review! Your order is now complete. Review saved successfully.');
      
    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      
      if (error.code === 'failed-precondition') {
        const errorMessage = `Firestore index required for reviews: ${error.message}. Please check the Firebase console for a link to create the required index.`;
        setFirebaseError(errorMessage);
        alert('Index required. Please check the console and create the required Firestore index.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Please make sure you are logged in and have permission to write reviews.');
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } finally {
      setUpdatingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size={32} className={styles.spinner} />
        <p>Loading your purchases...</p>
      </div>
    );
  }

  return (
    <div className={styles.purchasesContent}>
      {/* Firebase Error Display */}
      {firebaseError && (
        <div className={styles.firebaseError}>
          <div className={styles.errorHeader}>
            <span>🔧 Firebase Configuration Required</span>
          </div>
          <div className={styles.errorMessage}>
            {firebaseError}
          </div>
          <div className={styles.errorActions}>
            <button 
              className={styles.errorButton}
              onClick={() => window.open('https://console.firebase.google.com', '_blank')}
            >
              Open Firebase Console
            </button>
            <button 
              className={styles.secondaryErrorButton}
              onClick={() => setFirebaseError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Order Categories */}
      <div className={styles.categories}>
        {orderCategories.map(category => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.key}
              className={`${styles.categoryButton} ${
                selectedCategory === category.key ? styles.active : ""
              }`}
              onClick={() => setSelectedCategory(category.key)}
            >
              <IconComponent size={18} />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            {orders.length === 0 ? (
              <>
                <ShoppingBag size={48} className={styles.emptyIcon} />
                <h3>No Orders Yet</h3>
                <p>Start shopping to see your orders here!</p>
                <button 
                  className={styles.shopButton}
                  onClick={() => window.location.href = '/buyer/marketplace'}
                >
                  Start Shopping
                </button>
              </>
            ) : (
              <>
                <Package size={48} className={styles.emptyIcon} />
                <h3>No Orders in This Category</h3>
                <p>Try selecting a different category to see more orders.</p>
              </>
            )}
          </div>
        ) : (
          filteredOrders.map(order => {
            const latestTracking = getLatestTracking(order.tracking);
            
            return (
              <div key={order.id} className={styles.orderCard}>
                {/* Order Header */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderId}>Order #{order.id}</span>
                    <span className={styles.orderDate}>
                      {convertFirestoreTimestamp(order.orderDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <span 
                    className={styles.orderStatus}
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    {orderCategories.find(cat => cat.key === order.status)?.label || order.status}
                  </span>
                </div>

                {/* Seller Info */}
                <SellerInfoWithLogo order={order} />

                {/* Tracking Section */}
                <div className={styles.trackingSection}>
                  <button
                    className={styles.latestTracking}
                    onClick={() => toggleOrderExpansion(order.id)}
                  >
                    <div className={styles.trackingIcon}>
                      <Truck size={16} />
                    </div>
                    <div className={styles.trackingContent}>
                      <div className={styles.trackDescription}>
                        {latestTracking.description}
                      </div>
                      <div className={styles.trackTime}>
                        {latestTracking.time}
                      </div>
                      {order.status === 'to-receive' && (
                        <div className={styles.logisticsInfo}>
                          <span className={styles.trackingBadge}>🚚 Same-Day Delivery</span>
                          <span className={styles.trackingNote}>Track your delivery</span>
                        </div>
                      )}
                    </div>
                    <span className={`${styles.arrow} ${
                      expandedOrder === order.id ? styles.expanded : ""
                    }`}>
                      ▼
                    </span>
                  </button>

                  {expandedOrder === order.id && (
                    <div className={styles.fullTracking}>
                      {order.logistics?.tracking_number && (
                        <div className={styles.trackingInfo}>
                          <div className={styles.trackingNumber}>
                            <span>Tracking #: </span>
                            <strong>{order.logistics.tracking_number}</strong>
                          </div>
                          <div className={styles.courierInfo}>
                            <span>Service: </span>
                            <strong>Farm2Table Express Delivery</strong>
                            {order.logistics?.cold_chain && (
                              <span className={styles.coldChainIndicator}> ❄️ Temperature Controlled</span>
                            )}
                          </div>
                          <button 
                            className={styles.trackButton}
                            onClick={() => handleTrackPackage(order)}
                          >
                            📱 Track Package
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'to-receive' && (
                        <div className={styles.logisticsDetails}>
                          <div className={styles.logisticsHeader}>
                            <Truck size={20} />
                            <span>Delivery Information</span>
                          </div>
                          <div className={styles.logisticsContent}>
                            <div className={styles.logisticsItem}>
                              <span>Status:</span>
                              <span className={styles.shippingStatus}>Out for Delivery</span>
                            </div>
                            <div className={styles.logisticsItem}>
                              <span>Estimated Delivery:</span>
                              <span>Today, 5:00 PM - 6:00 PM</span>
                            </div>
                            {!order.logistics?.tracking_number && (
                              <button 
                                className={styles.trackButton}
                                onClick={() => handleTrackPackage(order)}
                              >
                                📱 Track Package
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {order.tracking && (
                        <div className={styles.trackingTimeline}>
                          {order.tracking.map((track, index) => (
                            <div key={index} className={styles.trackingStep}>
                              <div className={styles.timelineTime}>
                                {track.time}
                              </div>
                              <div className={styles.timelineContent}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.stepContent}>
                                  <div className={styles.stepLocation}>
                                    {track.location}
                                  </div>
                                  <div className={styles.stepDescription}>
                                    {track.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className={styles.productSection}>
                  {(() => {
                    let productsToShow: any[] = [];
                    
                    if (order.sellers && order.sellers.length > 0) {
                      const seller = order.sellers[0];
                      if (seller.items && seller.items.length > 0) {
                        productsToShow = seller.items;
                      }
                    }
                    
                    if (productsToShow.length === 0 && order.products && order.products.length > 0) {
                      productsToShow = order.products;
                    }
                    
                    if (productsToShow.length === 0 && order.productName) {
                      productsToShow = [{
                        name: order.productName,
                        quantity: order.quantity || 1,
                        unit: "pc",
                        price: order.price || 0,
                        image: order.productImage
                      }];
                    }

                    return productsToShow.map((_, index) => (
                      <ProductWithImage 
                        key={index} 
                        order={order} 
                        productIndex={index} 
                      />
                    ));
                  })()}
                </div>

                {/* Order Summary */}
                <div className={styles.orderSummary}>
                  <div className={styles.summaryTotal}>
                    <span>Total Amount:</span>
                    <span>₱{order.totalPrice}</span>
                  </div>
                </div>

                {/* Action Buttons and Review Section */}
                <div className={styles.bottomSection}>
                  {/* Review Section for To-Review Orders */}
                  {order.status === "to-review" && (
                    <div className={styles.reviewContainer}>
                      <span className={styles.reviewTitle}>Rate your order</span>
                      {renderStars(order.id)}
                      <textarea
                        placeholder="Share your experience with this order (optional)"
                        value={reviewTexts[order.id] || ''}
                        onChange={(e) => handleReviewTextChange(order.id, e.target.value)}
                        className={styles.reviewTextarea}
                        rows={3}
                      />
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.secondaryButton}
                      onClick={() => handleContactSeller(order)}
                    >
                      Contact Seller
                    </button>
                    
                    {order.status === "to-receive" && (
                      <button 
                        className={styles.primaryButton}
                        onClick={() => handleConfirmReceipt(order.id)}
                        disabled={updatingOrder === order.id}
                      >
                        {updatingOrder === order.id ? (
                          <>
                            <Loader size={16} className={styles.buttonSpinner} />
                            Confirming...
                          </>
                        ) : (
                          'Confirm Receipt'
                        )}
                      </button>
                    )}
                    
                    {order.status === "to-review" && (
                      <button 
                        className={styles.primaryButton}
                        onClick={() => handleSubmitReview(order.id)}
                        disabled={updatingOrder === order.id || !ratings[order.id]}
                      >
                        {updatingOrder === order.id ? (
                          <>
                            <Loader size={16} className={styles.buttonSpinner} />
                            Submitting...
                          </>
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    )}
                    
                    {order.status === "completed" && (
                      <button className={styles.secondaryButton}>
                        Buy Again
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🔥 IMPROVED TRACKING MODAL WITH REAL LEAFLET MAP */}
      {trackingOrder && (
        <TrackingModal
          isOpen={showTrackingModal}
          onClose={handleCloseTracking}
          order={trackingOrder as Order}
        />
      )}
    </div>
  );
}