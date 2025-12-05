"use client";
import { useState, useEffect } from "react";
import PrivacyModal from "../../../../components/organisms/auth/modals/PrivacyModal/PrivacyModal";
import styles from "./signup.module.css";
import TermsModal from "../../../../components/organisms/auth/modals/TermsModal/TermsModal";
// Firebase imports
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../../../../utils/lib/firebase";
// ADDED: Barangay coordinates import
import { getBarangayCoordinates } from '../../../../utils/lib/brgyCoordinates';

// Limited Philippine regions data - Only Region III for now
const philippineRegions = [
  { region: "Region III - Central Luzon", region_code: "030000000" }
];

// Provinces in Region III - Only Zambales
const regionIIIProvinces = [
  { province: "Zambales", province_code: "037100000" }
];

// Cities and Municipalities in Zambales - FIXED DATA STRUCTURE
const zambalesCitiesMunicipalities = [
  { city: "Olongapo City", city_code: "037109000" },
  { city: "Botolan", city_code: "037101000" },
  { city: "Cabangan", city_code: "037102000" },
  { city: "Candelaria", city_code: "037103000" },
  { city: "Castillejos", city_code: "037104000" },
  { city: "Iba", city_code: "037105000" },
  { city: "Masinloc", city_code: "037106000" },
  { city: "Palauig", city_code: "037107000" },
  { city: "San Antonio", city_code: "037108000" },
  { city: "San Felipe", city_code: "037110000" },
  { city: "San Marcelino", city_code: "037111000" },
  { city: "San Narciso", city_code: "037112000" },
  { city: "Santa Cruz", city_code: "037113000" },
  { city: "Subic", city_code: "037114000" }
];

// BARANGAYS DATA FOR ZAMBALES
const zambalesBarangays = {
  // Olongapo City
  "037109000": [
    { brgy: "Asinan", brgy_code: "037109001" },
    { brgy: "Banicain", brgy_code: "037109002" },
    { brgy: "Barreto", brgy_code: "037109003" },
    { brgy: "East Bajac-bajac", brgy_code: "037109004" },
    { brgy: "East Tapinac", brgy_code: "037109005" },
    { brgy: "Gordon Heights", brgy_code: "037109006" },
    { brgy: "Kalaklan", brgy_code: "037109007" },
    { brgy: "Mabayuan", brgy_code: "037109008" },
    { brgy: "New Cabalan", brgy_code: "037109009" },
    { brgy: "New Ilalim", brgy_code: "037109010" },
    { brgy: "New Kababae", brgy_code: "037109011" },
    { brgy: "New Kalalake", brgy_code: "037109012" },
    { brgy: "Old Cabalan", brgy_code: "037109013" },
    { brgy: "Pag-asa", brgy_code: "037109014" },
    { brgy: "Santa Rita", brgy_code: "037109015" },
    { brgy: "West Bajac-bajac", brgy_code: "037109016" },
    { brgy: "West Tapinac", brgy_code: "037109017" }
  ],
  // Botolan
  "037101000": [
    { brgy: "Bangan", brgy_code: "037101001" },
    { brgy: "Batolilan", brgy_code: "037101002" },
    { brgy: "Beneg", brgy_code: "037101003" },
    { brgy: "Binuclutan", brgy_code: "037101004" },
    { brgy: "Burgos", brgy_code: "037101005" },
    { brgy: "Cabatuan", brgy_code: "037101006" },
    { brgy: "Capayawan", brgy_code: "037101007" },
    { brgy: "Carael", brgy_code: "037101008" },
    { brgy: "Danacbunga", brgy_code: "037101009" },
    { brgy: "Maguisguis", brgy_code: "037101010" },
    { brgy: "Malomboy", brgy_code: "037101011" },
    { brgy: "Mambog", brgy_code: "037101012" },
    { brgy: "Moraza", brgy_code: "037101013" },
    { brgy: "Nacolcol", brgy_code: "037101014" },
    { brgy: "Owaog-Nebloc", brgy_code: "037101015" },
    { brgy: "Paco", brgy_code: "037101016" },
    { brgy: "Palis", brgy_code: "037101017" },
    { brgy: "Panan", brgy_code: "037101018" },
    { brgy: "Poblacion", brgy_code: "037101019" },
    { brgy: "Porac", brgy_code: "037101020" },
    { brgy: "San Juan", brgy_code: "037101021" },
    { brgy: "San Miguel", brgy_code: "037101022" },
    { brgy: "Santiago", brgy_code: "037101023" },
    { brgy: "Tampo", brgy_code: "037101024" },
    { brgy: "Taugtog", brgy_code: "037101025" },
    { brgy: "Villat", brgy_code: "037101026" }
  ],
  // Cabangan
  "037102000": [
    { brgy: "Anonang", brgy_code: "037102001" },
    { brgy: "Apo-apo", brgy_code: "037102002" },
    { brgy: "Arew", brgy_code: "037102003" },
    { brgy: "Banuan", brgy_code: "037102004" },
    { brgy: "Cadmang-Reserva", brgy_code: "037102005" },
    { brgy: "Camiling", brgy_code: "037102006" },
    { brgy: "Casabaan", brgy_code: "037102007" },
    { brgy: "Dolores", brgy_code: "037102008" },
    { brgy: "Felmida-Diaz", brgy_code: "037102009" },
    { brgy: "Laoag", brgy_code: "037102010" },
    { brgy: "Lomboy", brgy_code: "037102011" },
    { brgy: "Longos", brgy_code: "037102012" },
    { brgy: "Mabanglit", brgy_code: "037102013" },
    { brgy: "New San Juan", brgy_code: "037102014" },
    { brgy: "San Isidro", brgy_code: "037102015" },
    { brgy: "Santa Rita", brgy_code: "037102016" },
    { brgy: "Tondo", brgy_code: "037102017" }
  ],
  // Candelaria
  "037103000": [
    { brgy: "Babancal", brgy_code: "037103001" },
    { brgy: "Binabalian", brgy_code: "037103002" },
    { brgy: "Catol", brgy_code: "037103003" },
    { brgy: "Dampay", brgy_code: "037103004" },
    { brgy: "Lauis", brgy_code: "037103005" },
    { brgy: "Libertador", brgy_code: "037103006" },
    { brgy: "Malabon", brgy_code: "037103007" },
    { brgy: "Malimanga", brgy_code: "037103008" },
    { brgy: "Pamibian", brgy_code: "037103009" },
    { brgy: "Panayonan", brgy_code: "037103010" },
    { brgy: "Pinagrealan", brgy_code: "037103011" },
    { brgy: "Poblacion", brgy_code: "037103012" },
    { brgy: "Sinabacan", brgy_code: "037103013" },
    { brgy: "Taposo", brgy_code: "037103014" },
    { brgy: "Uacon", brgy_code: "037103015" }
  ],
  // Castillejos
  "037104000": [
    { brgy: "Balaybay", brgy_code: "037104001" },
    { brgy: "Buengay", brgy_code: "037104002" },
    { brgy: "Del Pilar", brgy_code: "037104003" },
    { brgy: "Looc", brgy_code: "037104004" },
    { brgy: "Magsaysay", brgy_code: "037104005" },
    { brgy: "Nagbayan", brgy_code: "037104006" },
    { brgy: "Nagbunga", brgy_code: "037104007" },
    { brgy: "San Agustin", brgy_code: "037104008" },
    { brgy: "San Jose", brgy_code: "037104009" },
    { brgy: "San Juan", brgy_code: "037104010" },
    { brgy: "San Nicolas", brgy_code: "037104011" },
    { brgy: "San Pablo", brgy_code: "037104012" },
    { brgy: "San Roque", brgy_code: "037104013" },
    { brgy: "Santa Maria", brgy_code: "037104014" }
  ],
  // Iba
  "037105000": [
    { brgy: "Amungan", brgy_code: "037105001" },
    { brgy: "Bangantalinga", brgy_code: "037105002" },
    { brgy: "Dirita-Baloguen", brgy_code: "037105003" },
    { brgy: "Lipay-Dingin-Panibuatan", brgy_code: "037105004" },
    { brgy: "Palanginan", brgy_code: "037105005" },
    { brgy: "San Agustin", brgy_code: "037105006" },
    { brgy: "Santa Barbara", brgy_code: "037105007" },
    { brgy: "Santo Rosario", brgy_code: "037105008" },
    { brgy: "Zone 1 Poblacion", brgy_code: "037105009" },
    { brgy: "Zone 2 Poblacion", brgy_code: "037105010" },
    { brgy: "Zone 3 Poblacion", brgy_code: "037105011" },
    { brgy: "Zone 4 Poblacion", brgy_code: "037105012" },
    { brgy: "Zone 5 Poblacion", brgy_code: "037105013" },
    { brgy: "Zone 6 Poblacion", brgy_code: "037105014" }
  ],
  // Masinloc
  "037106000": [
    { brgy: "Baloganon", brgy_code: "037106001" },
    { brgy: "Bamban", brgy_code: "037106002" },
    { brgy: "Bani", brgy_code: "037106003" },
    { brgy: "Collat", brgy_code: "037106004" },
    { brgy: "Inhobol", brgy_code: "037106005" },
    { brgy: "North Poblacion", brgy_code: "037106006" },
    { brgy: "San Lorenzo", brgy_code: "037106007" },
    { brgy: "San Salvador", brgy_code: "037106008" },
    { brgy: "Santa Rita", brgy_code: "037106009" },
    { brgy: "Santo Rosario", brgy_code: "037106010" },
    { brgy: "South Poblacion", brgy_code: "037106011" },
    { brgy: "Taltal", brgy_code: "037106012" },
    { brgy: "Tapuac", brgy_code: "037106013" }
  ],
  // Palauig
  "037107000": [
    { brgy: "Alwa", brgy_code: "037107001" },
    { brgy: "Bato", brgy_code: "037107002" },
    { brgy: "Bulawen", brgy_code: "037107003" },
    { brgy: "Cauyan", brgy_code: "037107004" },
    { brgy: "East Poblacion", brgy_code: "037107005" },
    { brgy: "Garreta", brgy_code: "037107006" },
    { brgy: "Libaba", brgy_code: "037107007" },
    { brgy: "Liozon", brgy_code: "037107008" },
    { brgy: "Lipay", brgy_code: "037107009" },
    { brgy: "Locloc", brgy_code: "037107010" },
    { brgy: "Macarang", brgy_code: "037107011" },
    { brgy: "Magalawa", brgy_code: "037107012" },
    { brgy: "Pangolingan", brgy_code: "037107013" },
    { brgy: "Salaza", brgy_code: "037107014" },
    { brgy: "San Juan", brgy_code: "037107015" },
    { brgy: "Santo Niño", brgy_code: "037107016" },
    { brgy: "Santo Tomas", brgy_code: "037107017" },
    { brgy: "Tition", brgy_code: "037107018" },
    { brgy: "West Poblacion", brgy_code: "037107019" }
  ],
  // San Antonio
  "037108000": [
    { brgy: "Angeles", brgy_code: "037108001" },
    { brgy: "Antipolo", brgy_code: "037108002" },
    { brgy: "Burgos", brgy_code: "037108003" },
    { brgy: "East Dirita", brgy_code: "037108004" },
    { brgy: "Luna", brgy_code: "037108005" },
    { brgy: "Pundaquit", brgy_code: "037108006" },
    { brgy: "San Esteban", brgy_code: "037108007" },
    { brgy: "San Gregorio", brgy_code: "037108008" },
    { brgy: "San Juan", brgy_code: "037108009" },
    { brgy: "San Miguel", brgy_code: "037108010" },
    { brgy: "San Nicolas", brgy_code: "037108011" },
    { brgy: "Santiago", brgy_code: "037108012" },
    { brgy: "West Dirita", brgy_code: "037108013" }
  ],
  // San Felipe
  "037110000": [
    { brgy: "Amagna", brgy_code: "037110001" },
    { brgy: "Apostol", brgy_code: "037110002" },
    { brgy: "Balincaguing", brgy_code: "037110003" },
    { brgy: "Farañal", brgy_code: "037110004" },
    { brgy: "Feria", brgy_code: "037110005" },
    { brgy: "Maloma", brgy_code: "037110006" },
    { brgy: "Manglicmot", brgy_code: "037110007" },
    { brgy: "Rosete", brgy_code: "037110008" },
    { brgy: "San Rafael", brgy_code: "037110009" },
    { brgy: "Santo Niño", brgy_code: "037110010" },
    { brgy: "Villa Fidelia", brgy_code: "037110011" }
  ],
  // San Marcelino
  "037111000": [
    { brgy: "Aglao", brgy_code: "037111001" },
    { brgy: "Buhawen", brgy_code: "037111002" },
    { brgy: "Burgos", brgy_code: "037111003" },
    { brgy: "Central", brgy_code: "037111004" },
    { brgy: "Consuelo Norte", brgy_code: "037111005" },
    { brgy: "Consuelo Sur", brgy_code: "037111006" },
    { brgy: "La Paz", brgy_code: "037111007" },
    { brgy: "Laoag", brgy_code: "037111008" },
    { brgy: "Linasin", brgy_code: "037111009" },
    { brgy: "Linusungan", brgy_code: "037111010" },
    { brgy: "Lucero", brgy_code: "037111011" },
    { brgy: "Nagbunga", brgy_code: "037111012" },
    { brgy: "Rabanes", brgy_code: "037111013" },
    { brgy: "Rizal", brgy_code: "037111014" },
    { brgy: "San Guillermo", brgy_code: "037111015" },
    { brgy: "San Isidro", brgy_code: "037111016" },
    { brgy: "San Rafael", brgy_code: "037111017" },
    { brgy: "Santa Fe", brgy_code: "037111018" }
  ],
  // San Narciso
  "037112000": [
    { brgy: "Alusiis", brgy_code: "037112001" },
    { brgy: "Beddeng", brgy_code: "037112002" },
    { brgy: "Candelaria", brgy_code: "037112003" },
    { brgy: "Dallipawen", brgy_code: "037112004" },
    { brgy: "Grullo", brgy_code: "037112005" },
    { brgy: "La Paz", brgy_code: "037112006" },
    { brgy: "Libertad", brgy_code: "037112007" },
    { brgy: "Namatacan", brgy_code: "037112008" },
    { brgy: "Natividad", brgy_code: "037112009" },
    { brgy: "Omaya", brgy_code: "037112010" },
    { brgy: "Paite", brgy_code: "037112011" },
    { brgy: "Patrocinio", brgy_code: "037112012" },
    { brgy: "San Jose", brgy_code: "037112013" },
    { brgy: "San Juan", brgy_code: "037112014" },
    { brgy: "San Pascual", brgy_code: "037112015" },
    { brgy: "San Rafael", brgy_code: "037112016" },
    { brgy: "Siminublan", brgy_code: "037112017" }
  ],
  // Santa Cruz
  "037113000": [
    { brgy: "Babuyan", brgy_code: "037113001" },
    { brgy: "Bangan", brgy_code: "037113002" },
    { brgy: "Bayto", brgy_code: "037113003" },
    { brgy: "Biay", brgy_code: "037113004" },
    { brgy: "Bolitoc", brgy_code: "037113005" },
    { brgy: "Bulawon", brgy_code: "037113006" },
    { brgy: "Canaynayan", brgy_code: "037113007" },
    { brgy: "Gama", brgy_code: "037113008" },
    { brgy: "Guinabon", brgy_code: "037113009" },
    { brgy: "Guisguis", brgy_code: "037113010" },
    { brgy: "Lipay", brgy_code: "037113011" },
    { brgy: "Lomboy", brgy_code: "037113012" },
    { brgy: "Lucapon North", brgy_code: "037113013" },
    { brgy: "Lucapon South", brgy_code: "037113014" },
    { brgy: "Malabago", brgy_code: "037113015" },
    { brgy: "Naulo", brgy_code: "037113016" },
    { brgy: "Pamonoran", brgy_code: "037113017" },
    { brgy: "Poblacion North", brgy_code: "037113018" },
    { brgy: "Poblacion South", brgy_code: "037113019" },
    { brgy: "Sabang", brgy_code: "037113020" },
    { brgy: "San Fernando", brgy_code: "037113021" },
    { brgy: "Tabalong", brgy_code: "037113022" },
    { brgy: "Tubotubo North", brgy_code: "037113023" },
    { brgy: "Tubotubo South", brgy_code: "037113024" }
  ],
  // Subic
  "037114000": [
    { brgy: "Aningway", brgy_code: "037114001" },
    { brgy: "Asinan", brgy_code: "037114002" },
    { brgy: "Baraca-Camachile", brgy_code: "037114003" },
    { brgy: "Batiawan", brgy_code: "037114004" },
    { brgy: "Calapacuan", brgy_code: "037114005" },
    { brgy: "Calapandayan", brgy_code: "037114006" },
    { brgy: "Cawag", brgy_code: "037114007" },
    { brgy: "Ilwas", brgy_code: "037114008" },
    { brgy: "Mangan-Vaca", brgy_code: "037114009" },
    { brgy: "Matain", brgy_code: "037114010" },
    { brgy: "Naugsol", brgy_code: "037114011" },
    { brgy: "Pamatawan", brgy_code: "037114012" },
    { brgy: "San Isidro", brgy_code: "037114013" },
    { brgy: "Santo Tomas", brgy_code: "037114014" },
    { brgy: "Wawandue", brgy_code: "037114015" }
  ]
};

// ID Types for verification
const idTypes = [
  "Driver's License",
  "Passport",
  "SSS ID",
  "GSIS ID",
  "UMID",
  "Voter's ID",
  "PRC ID",
  "Postal ID",
  "PhilHealth ID",
  "TIN ID",
  "Senior Citizen ID",
  "OFW ID",
  "National ID (PhilSys)",
  "Student ID",
  "Company ID"
];

export default function SellerSignUp() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  // Step 1 states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthday: "",
    agreeToTerms: false,
    
    // Step 2 - MODIFIED: Location will be auto-set from barangay
    phoneNumber: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    postalCode: "",
    streetName: "",
    building: "",
    houseNo: "",
    location: { lat: null as number | null, lng: null as number | null },
    
    // Step 3
    farmName: "",
    description: "",
    logo: null as File | null,

    // ADDED: Step 4 - ID Verification
    idType: "",
    idNumber: "",
    idFront: null as File | null,
    idBack: null as File | null,
    selfieWithId: null as File | null,
  });
  // Modal states
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  // Loading, error, and success states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Form validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  // Philippine addresses data
  const [provinces, setProvinces] = useState<{ province: string; province_code: string }[]>([]);
  const [cities, setCities] = useState<{ city: string; city_code: string }[]>([]);
  const [barangays, setBarangays] = useState<{ brgy: string; brgy_code: string }[]>([]);
  // Email domain validation and auto-complete
  const [emailInput, setEmailInput] = useState("");
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false);
  // Resend email countdown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResendEmail, setCanResendEmail] = useState(true);
  // Common email domains for suggestions
  const commonDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com"
  ];
  // Pre-load provinces when component mounts
  useEffect(() => {
    setProvinces(regionIIIProvinces);
  }, []);
  // ADDED: Auto-set coordinates when city and barangay are selected
  useEffect(() => {
    if (formData.city && formData.barangay) {
      const coordinates = getBarangayCoordinates(formData.city, formData.barangay);
      setFormData(prev => ({
        ...prev,
        location: { lat: coordinates.lat, lng: coordinates.lng }
      }));
    }
  }, [formData.city, formData.barangay]);
  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else if (resendCooldown === 0 && !canResendEmail) {
      setCanResendEmail(true);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown, canResendEmail]);
  // Password strength rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;
  const strengthText = strengthScore >= 4 ? "Strong" : strengthScore >= 2 ? "Medium" : "Weak";
  // Calculate age from birthday
  const calculateAge = (birthday: string): number => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  // Validate birthday (must be 18+ and not in future)
  const validateBirthday = (birthday: string): boolean => {
    if (!birthday) return false;
    
    const birthDate = new Date(birthday);
    const today = new Date();
    
    if (birthDate > today) {
      return false;
    }
    
    const age = calculateAge(birthday);
    return age >= 18;
  };
  // Get maximum date for birthday input (18 years ago from today)
  const getMaxBirthdayDate = (): string => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };
  // Enhanced email validation with domain checking
  const validateEmail = (email: string) => {
    if (!email) return true;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    const [localPart, domain] = email.split('@');
    const commonTypos: { [key: string]: string } = {
      'gmai.com': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'outlook.cm': 'outlook.com',
      'hotmail.cm': 'hotmail.com'
    };
    if (commonTypos[domain]) {
      return false;
    }
    return true;
  };
  // Get domain suggestions based on user input
  const getDomainSuggestions = (input: string) => {
    if (!input.includes('@')) return [];
    
    const [localPart, partialDomain] = input.split('@');
    if (!partialDomain) return [];
    
    const currentEmail = `${localPart}@${partialDomain}`;
    if (validateEmail(currentEmail)) {
      return [];
    }
    
    return commonDomains.filter(domain => 
      domain.startsWith(partialDomain.toLowerCase())
    );
  };
  // Auto-complete email domain
  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    
    if (value.includes('@') && !value.endsWith('@') && !validateEmail(value)) {
      setShowDomainSuggestions(true);
    } else {
      setShowDomainSuggestions(false);
    }
    handleInputChange("email", value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };
  // Select domain suggestion
  const selectDomainSuggestion = (domain: string) => {
    const [localPart] = emailInput.split('@');
    const completeEmail = `${localPart}@${domain}`;
    setEmailInput(completeEmail);
    handleInputChange("email", completeEmail);
    setShowDomainSuggestions(false);
    
    if (validateEmail(completeEmail)) {
      setEmailError("");
    }
  };
  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length === 0;
    } catch (error) {
      console.error("Error checking email availability:", error);
      return false;
    }
  };
  
  // Validate PH contact number format
  const validateContact = (value: string) => {
    const cleanValue = value.replace(/[\s\-\(\)]/g, '');
    const phRegex = /^(?:\+63|0)9\d{9}$/;
    return phRegex.test(cleanValue);
  };
  // Format phone number for display
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('09')) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    else if (cleaned.startsWith('+639')) {
      return cleaned.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    }
    else if (cleaned.startsWith('639')) {
      return `+63 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return value;
  };
  // Fetch provinces based on selected region
  const fetchProvinces = async (regionCode: string) => {
    try {
      setProvinces(regionIIIProvinces);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };
  // Fetch cities based on selected province
  const fetchCities = async (provinceCode: string) => {
    try {
      if (provinceCode === "037100000") {
        setCities(zambalesCitiesMunicipalities);
      } else {
        const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities/`);
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };
  // Fetch barangays based on selected city
  const fetchBarangays = async (cityCode: string) => {
    try {
      const barangaysData = zambalesBarangays[cityCode as keyof typeof zambalesBarangays] || [];
      setBarangays(barangaysData);
    } catch (error) {
      console.error("Error fetching barangays:", error);
      setBarangays([]);
    }
  };
  // Build full address string for display
  const getFullAddress = () => {
    const { region, province, city, barangay, streetName, building, houseNo } = formData;
    return `${houseNo} ${building}, ${streetName}, ${barangay}, ${city}, ${province}, ${region}, Philippines`.trim();
  };
  // Handle resend email verification with cooldown
  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      setError("No user found. Please try signing in again.");
      return;
    }
    if (!canResendEmail) {
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess("Verification email sent successfully!");
      setCanResendEmail(false);
      setResendCooldown(60);
    } catch (error: any) {
      console.error("Error resending email:", error);
      setError("Failed to resend verification email. Please try again.");
    }
  };
  // Handle change email address
  const handleChangeEmail = () => {
    setCurrentStep(1);
    setSuccess("");
  };
  const handleInputChange = (field: string, value: string | boolean | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Only validate birthday if user has entered a value AND they're under 18
    if (field === "birthday") {
      if (value && !validateBirthday(value as string)) {
        setBirthdayError("You must be at least 18 years old to register");
      } else {
        setBirthdayError("");
      }
    }
    // Real-time validation for phone number
    if (field === "phoneNumber") {
      const formattedValue = formatPhoneNumber(value as string);
      setFormData(prev => ({
        ...prev,
        phoneNumber: formattedValue
      }));
      if (value && !validateContact(value as string)) {
        setPhoneError("Please enter a valid Philippine number (09 or +63)");
      } else {
        setPhoneError("");
      }
    }
    // Handle address cascading updates
    if (field === "region") {
      const selectedRegion = philippineRegions.find(r => r.region === value);
      if (selectedRegion) {
        fetchProvinces(selectedRegion.region_code);
        setFormData(prev => ({
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
        fetchCities(selectedProvince.province_code);
        setFormData(prev => ({
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
        fetchBarangays(selectedCity.city_code);
        setFormData(prev => ({
          ...prev,
          barangay: ""
        }));
      }
    }
  };
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    handleInputChange("password", value);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0] || null;
    handleInputChange(field, file);
  };
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.fullName.trim() !== "" &&
          formData.email.trim() !== "" &&
          validateEmail(formData.email) &&
          formData.birthday.trim() !== "" &&
          validateBirthday(formData.birthday) &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword &&
          formData.agreeToTerms
        );
      
      case 2:
        // MODIFIED: Removed location validation since coordinates are auto-set
        return (
          formData.phoneNumber.trim() !== "" &&
          validateContact(formData.phoneNumber) &&
          formData.region.trim() !== "" &&
          formData.province.trim() !== "" &&
          formData.city.trim() !== "" &&
          formData.barangay.trim() !== "" &&
          formData.postalCode.trim() !== "" &&
          formData.streetName.trim() !== "" &&
          formData.houseNo.trim() !== "" &&
          formData.building.trim() !== ""
        );
      
      case 3:
        return (
          formData.farmName.trim() !== "" &&
          formData.description.trim() !== "" &&
          formData.logo !== null
        );

      // ADDED: Step 4 validation - ID Verification
      case 4:
        return (
          formData.idType.trim() !== "" &&
          formData.idNumber.trim() !== "" &&
          formData.idFront !== null &&
          formData.idBack !== null &&
          formData.selfieWithId !== null
        );
      
      default:
        return true;
    }
  };
  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  // MODIFIED: Fixed Cloudinary uploads with proper null checks
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Validation checks
      if (!validateContact(formData.phoneNumber)) {
        setError("Please enter a valid Philippine contact number (e.g., +639123456789 or 09123456789)");
        setLoading(false);
        return;
      }
      if (!validateBirthday(formData.birthday)) {
        setError("You must be at least 18 years old to register");
        setLoading(false);
        return;
      }
      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }
      // MODIFIED: Auto-set coordinates if not already set (fallback)
      if (!formData.location.lat || !formData.location.lng) {
        if (formData.city && formData.barangay) {
          const coordinates = getBarangayCoordinates(formData.city, formData.barangay);
          setFormData(prev => ({
            ...prev,
            location: { lat: coordinates.lat, lng: coordinates.lng }
          }));
        } else {
          setError("Please complete your address information");
          setLoading(false);
          return;
        }
      }

      // UPLOAD LOGO TO CLOUDINARY
      let logoUrl = null;
      if (formData.logo) {
        try {
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append('file', formData.logo);
          cloudinaryFormData.append('upload_preset', 'farm2table_logos');
          
          const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dat1ycsju/image/upload', {
            method: 'POST',
            body: cloudinaryFormData
          });
          
          const cloudinaryData = await cloudinaryResponse.json();
          
          if (cloudinaryData.secure_url) {
            logoUrl = cloudinaryData.secure_url;
            console.log('✅ Logo uploaded to Cloudinary:', logoUrl);
          } else {
            throw new Error('Cloudinary upload failed: ' + cloudinaryData.error?.message);
          }
        } catch (uploadError) {
          console.error('❌ Cloudinary upload error:', uploadError);
          setError('Failed to upload logo. Please try again.');
          setLoading(false);
          return;
        }
      }

      // FIXED: Upload ID verification documents to Cloudinary - WITH PROPER NULL CHECKS
      let idFrontUrl = null;
      let idBackUrl = null;
      let selfieWithIdUrl = null;

      // Upload all ID documents in parallel for better performance
      const uploadPromises = [];

      // ✅ FIXED: Add explicit null checks before creating upload promises
      if (formData.idFront !== null) {
        uploadPromises.push(
          (async () => {
            try {
              const idFrontFormData = new FormData();
              idFrontFormData.append('file', formData.idFront as File); // ✅ Type assertion since we checked for null
              idFrontFormData.append('upload_preset', 'farm2table_logos');
              idFrontFormData.append('folder', 'id_verification');
              
              const idFrontResponse = await fetch('https://api.cloudinary.com/v1_1/dat1ycsju/image/upload', {
                method: 'POST',
                body: idFrontFormData
              });
              
              const idFrontData = await idFrontResponse.json();
              if (idFrontData.secure_url) {
                idFrontUrl = idFrontData.secure_url;
                console.log('✅ ID Front uploaded to Cloudinary:', idFrontUrl);
              } else {
                throw new Error('ID Front upload failed: ' + idFrontData.error?.message);
              }
            } catch (error) {
              console.error('❌ ID Front upload error:', error);
              throw error;
            }
          })()
        );
      }

      // ✅ FIXED: Add explicit null check
      if (formData.idBack !== null) {
        uploadPromises.push(
          (async () => {
            try {
              const idBackFormData = new FormData();
              idBackFormData.append('file', formData.idBack as File); // ✅ Type assertion since we checked for null
              idBackFormData.append('upload_preset', 'farm2table_logos');
              idBackFormData.append('folder', 'id_verification');
              
              const idBackResponse = await fetch('https://api.cloudinary.com/v1_1/dat1ycsju/image/upload', {
                method: 'POST',
                body: idBackFormData
              });
              
              const idBackData = await idBackResponse.json();
              if (idBackData.secure_url) {
                idBackUrl = idBackData.secure_url;
                console.log('✅ ID Back uploaded to Cloudinary:', idBackUrl);
              } else {
                throw new Error('ID Back upload failed: ' + idBackData.error?.message);
              }
            } catch (error) {
              console.error('❌ ID Back upload error:', error);
              throw error;
            }
          })()
        );
      }

      // ✅ FIXED: Add explicit null check
      if (formData.selfieWithId !== null) {
        uploadPromises.push(
          (async () => {
            try {
              const selfieFormData = new FormData();
              selfieFormData.append('file', formData.selfieWithId as File); // ✅ Type assertion since we checked for null
              selfieFormData.append('upload_preset', 'farm2table_logos');
              selfieFormData.append('folder', 'id_verification');
              
              const selfieResponse = await fetch('https://api.cloudinary.com/v1_1/dat1ycsju/image/upload', {
                method: 'POST',
                body: selfieFormData
              });
              
              const selfieData = await selfieResponse.json();
              if (selfieData.secure_url) {
                selfieWithIdUrl = selfieData.secure_url;
                console.log('✅ Selfie with ID uploaded to Cloudinary:', selfieWithIdUrl);
              } else {
                throw new Error('Selfie with ID upload failed: ' + selfieData.error?.message);
              }
            } catch (error) {
              console.error('❌ Selfie with ID upload error:', error);
              throw error;
            }
          })()
        );
      }

      // Wait for all uploads to complete
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
        console.log('✅ All ID documents uploaded to Cloudinary');
      }
      
      // 1. Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      const user = userCredential.user;
      
      // 2. Update user profile with display name
      await updateProfile(user, {
        displayName: formData.fullName
      });
      
      // 3. Send email verification
      await sendEmailVerification(user);
      
      // 4. Save additional user data to Firestore
      await setDoc(doc(db, "sellers", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        birthday: formData.birthday,
        age: calculateAge(formData.birthday),
        contact: formData.phoneNumber,
        // Address information
        address: {
          region: formData.region,
          province: formData.province,
          city: formData.city,
          barangay: formData.barangay,
          postalCode: formData.postalCode,
          streetName: formData.streetName,
          building: formData.building,
          houseNo: formData.houseNo,
          location: formData.location
        },
        // Farm information
        farm: {
          farmName: formData.farmName,
          description: formData.description,
          logo: logoUrl
        },
        // ID Verification information
        idVerification: {
          idType: formData.idType,
          idNumber: formData.idNumber,
          idFront: idFrontUrl,
          idBack: idBackUrl,
          selfieWithId: selfieWithIdUrl,
          submittedAt: new Date(),
          status: "pending"
        },
        createdAt: new Date(),
        role: "seller",
        emailVerified: false,
        accountStatus: "pending", // Account pending until ID verification
        verificationSentAt: new Date()
      });
      
      // 5. Show success and move to email verification step
      setSuccess(`Account created successfully! We've sent a verification email to ${formData.email}. Your account will be activated after ID verification.`);
      setCurrentStep(5); // Move to email verification step
      
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered. Please use a different email or login.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Please choose a stronger password.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your connection and try again.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;
        default:
          setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  // UPDATED: Step titles and descriptions for the progress tracker
  const stepInfo = [
    { number: 1, title: "Personal Information", description: "Your basic details and account setup" },
    { number: 2, title: "Farm Location", description: "Where your farm is located" },
    { number: 3, title: "Farm Details", description: "Tell us about your farm" },
    { number: 4, title: "ID Verification", description: "Verify your identity" },
    { number: 5, title: "Email Verification", description: "Confirm your email address" }
  ];
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>YOUR PERSONAL INFORMATION</h2>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Birthday <span className={styles.required}>*</span></label>
                <input 
                  className={`${styles.input} ${birthdayError ? styles.inputError : ''}`} 
                  type="date" 
                  max={getMaxBirthdayDate()}
                  value={formData.birthday}
                  onChange={(e) => handleInputChange("birthday", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
                {birthdayError && <div className={styles.fieldError}>{birthdayError}</div>}
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.emailContainer}>
                  <input 
                    className={`${styles.input} ${emailError ? styles.inputError : ''}`} 
                    type="text" 
                    placeholder="username@gmail.com"
                    value={emailInput}
                    onChange={(e) => handleEmailInputChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowDomainSuggestions(false), 200)}
                    required 
                    suppressHydrationWarning
                  />
                  {showDomainSuggestions && (
                    <div className={styles.domainSuggestions}>
                      {getDomainSuggestions(emailInput).map((domain, index) => (
                        <div
                          key={domain}
                          className={styles.domainSuggestion}
                          onClick={() => selectDomainSuggestion(domain)}
                        >
                          @{domain}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {emailError && <div className={styles.fieldError}>{emailError}</div>}
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.passwordContainer}>
                  <input
                    className={styles.input}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    suppressHydrationWarning
                  />
                  <button 
                    type="button" 
                    className={styles.toggleBtn} 
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
            {passwordFocused && (
              <div className={styles.strengthWrapper}>
                <div className={styles.strengthHeader}>
                  <span className={styles.strengthLabel}>Password Strength</span>
                  <span className={styles.strengthText}>{strengthText}</span>
                </div>
    
                <div className={styles.strengthBar}>
                  <div 
                    className={`${styles.strengthFill} ${
                      strengthText === "Strong" ? styles.strong :
                      strengthText === "Medium" ? styles.medium :
                      styles.weak
                    }`}
                  />
                </div>
                <ul className={styles.requirements}>
                  <li className={hasMinLength ? styles.valid : styles.invalid}>
                    At least 8 characters
                  </li>
                  <li className={hasUppercase ? styles.valid : styles.invalid}>
                    At least one uppercase letter
                  </li>
                  <li className={hasLowercase ? styles.valid : styles.invalid}>
                    At least one lowercase letter
                  </li>
                  <li className={hasNumber ? styles.valid : styles.invalid}>
                    At least one number
                  </li>
                  <li className={hasSpecialChar ? styles.valid : styles.invalid}>
                    At least one special character
                  </li>
                </ul>
              </div>
            )}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Confirm Password</label>
                <div className={styles.passwordContainer}>
                  <input
                    className={styles.input}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    suppressHydrationWarning
                  />
                  <button 
                    type="button" 
                    className={styles.toggleBtn} 
                    onClick={() => setShowConfirmPassword((s) => !s)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
            {formData.confirmPassword && (
              <div className={`${styles.passwordMatch} ${
                formData.password === formData.confirmPassword ? styles.match : styles.noMatch
              }`}>
                {formData.password === formData.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
            <div className={styles.checkbox}>
              <input 
                type="checkbox" 
                id="agree" 
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                required 
                suppressHydrationWarning
              /> 
              <label htmlFor="agree">I agree to the</label>
              <span className={styles.linkText} onClick={() => setShowTermsModal(true)}>Terms & Conditions</span>
              {''}and{''}
              <span className={styles.linkText} onClick={() => setShowPrivacyModal(true)}>Privacy and Policy</span>
            </div>
            <div className={styles.signinPrompt}>
              <span>Already have an account? </span>
              <a href="/roleSelection/seller/signin" className={styles.signinLink}>
                Sign In
              </a>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>YOUR FARM LOCATION</h2>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Phone Number <span className={styles.required}>*</span></label>
                <input 
                  className={`${styles.input} ${phoneError ? styles.inputError : ''}`} 
                  type="tel" 
                  placeholder="+63 912 345 6789 or 0912 345 6789"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
                {phoneError && <div className={styles.fieldError}>{phoneError}</div>}
              </div>
            </div>
            <div className={styles.inputRowDouble}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Region <span className={styles.required}>*</span></label>
                <select 
                  className={styles.input} 
                  value={formData.region}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  required
                >
                  <option value="">Select Region</option>
                  {philippineRegions.map(region => (
                    <option key={region.region_code} value={region.region}>
                      {region.region}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Province <span className={styles.required}>*</span></label>
                <select 
                  className={styles.input} 
                  value={formData.province}
                  onChange={(e) => handleInputChange("province", e.target.value)}
                  required
                  disabled={!formData.region}
                >
                  <option value="">Select Province</option>
                  {provinces.map(province => (
                    <option key={province.province_code} value={province.province}>
                      {province.province}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.inputRowDouble}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>City/Municipality <span className={styles.required}>*</span></label>
                <select 
                  className={styles.input} 
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
                  disabled={!formData.province}
                >
                  <option value="">Select City/Municipality</option>
                  {cities.map(city => (
                    <option key={city.city_code} value={city.city}>
                      {city.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Barangay <span className={styles.required}>*</span></label>
                <select 
                  className={styles.input} 
                  value={formData.barangay}
                  onChange={(e) => handleInputChange("barangay", e.target.value)}
                  required
                  disabled={!formData.city}
                >
                  <option value="">Select Barangay</option>
                  {barangays.map(barangay => (
                    <option key={barangay.brgy_code} value={barangay.brgy}>
                      {barangay.brgy}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.inputRowTriple}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Postal Code <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Postal code"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Street Name <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Street name"
                  value={formData.streetName}
                  onChange={(e) => handleInputChange("streetName", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>House No. <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="House number"
                  value={formData.houseNo}
                  onChange={(e) => handleInputChange("houseNo", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Building <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Building name/number"
                  value={formData.building}
                  onChange={(e) => handleInputChange("building", e.target.value)}
                  required 
                  suppressHydrationWarning
                />
              </div>
            </div>
            {/* REPLACED: Barangay-based location coordinates display */}
            <div className={styles.locationInfo}>
              <h3 className={styles.locationTitle}>📍 Farm Location Coordinates</h3>
              <p className={styles.locationDescription}>
                Your farm location will be automatically calculated based on your barangay for accurate delivery distances.
              </p>
              
              {formData.city && formData.barangay && (
                <div className={styles.coordinatesDisplay}>
                  <div className={styles.coordinateItem}>
                    <span className={styles.coordinateLabel}>Latitude:</span>
                    <span className={styles.coordinateValue}>
                      {formData.location.lat ? formData.location.lat.toFixed(6) : 'Not set'}
                    </span>
                  </div>
                  <div className={styles.coordinateItem}>
                    <span className={styles.coordinateLabel}>Longitude:</span>
                    <span className={styles.coordinateValue}>
                      {formData.location.lng ? formData.location.lng.toFixed(6) : 'Not set'}
                    </span>
                  </div>
                  <div className={styles.locationNote}>
                    ✅ Coordinates automatically set based on {formData.barangay}, {formData.city}
                  </div>
                </div>
              )}
              
              {(!formData.location.lat || !formData.location.lng) && formData.city && formData.barangay && (
                <div className={styles.fieldInfo}>
                  Complete the address fields above to automatically set your location coordinates
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>YOUR FARM DETAILS</h2>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Farm Name <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Enter your farm name"
                  value={formData.farmName}
                  onChange={(e) => handleInputChange("farmName", e.target.value)}
                  required 
                />
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Farm Description <span className={styles.required}>*</span></label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Tell buyers about your farm, your practices, and your story."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Farm Logo <span className={styles.required}>*</span></label>
                <div className={styles.fileUpload}>
                  <label className={styles.uploadLabel}>
                    Choose File
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "logo")}
                      className={styles.fileInput}
                      required
                    />
                  </label>
                  {formData.logo && (
                    <span className={styles.fileName}>{formData.logo.name}</span>
                  )}
                </div>
                <div className={styles.helperText}>
                  Logo is required for your farm profile
                </div>
              </div>
            </div>
          </div>
        );
      // ADDED: Step 4 - ID Verification
      case 4:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>ID VERIFICATION</h2>
            <p className={styles.stepDescription}>
              To ensure the security of our marketplace, we require identity verification for all sellers.
            </p>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>ID Type <span className={styles.required}>*</span></label>
                <select 
                  className={styles.input} 
                  value={formData.idType}
                  onChange={(e) => handleInputChange("idType", e.target.value)}
                  required
                >
                  <option value="">Select ID Type</option>
                  {idTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>ID Number <span className={styles.required}>*</span></label>
                <input 
                  className={styles.input} 
                  type="text" 
                  placeholder="Enter your ID number"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange("idNumber", e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className={styles.uploadSection}>
              <h3 className={styles.uploadTitle}>Upload Required Documents</h3>
              
              <div className={styles.uploadRow}>
                <div className={styles.uploadGroup}>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadText}>ID Front Photo <span className={styles.required}>*</span></span>
                    <div className={styles.uploadBox}>
                      <span className={styles.uploadIcon}>📷</span>
                      <span className={styles.uploadHint}>Clear photo of ID front</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "idFront")}
                        className={styles.fileInput}
                        required
                      />
                    </div>
                  </label>
                  {formData.idFront && (
                    <span className={styles.fileName}>{formData.idFront.name}</span>
                  )}
                </div>
                
                <div className={styles.uploadGroup}>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadText}>ID Back Photo <span className={styles.required}>*</span></span>
                    <div className={styles.uploadBox}>
                      <span className={styles.uploadIcon}>📷</span>
                      <span className={styles.uploadHint}>Clear photo of ID back</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "idBack")}
                        className={styles.fileInput}
                        required
                      />
                    </div>
                  </label>
                  {formData.idBack && (
                    <span className={styles.fileName}>{formData.idBack.name}</span>
                  )}
                </div>
              </div>
              
              <div className={styles.uploadRow}>
                <div className={styles.uploadGroup}>
                  <label className={styles.uploadLabel}>
                    <span className={styles.uploadText}>Selfie with ID <span className={styles.required}>*</span></span>
                    <div className={styles.uploadBox}>
                      <span className={styles.uploadIcon}>🤳</span>
                      <span className={styles.uploadHint}>Your face holding the ID</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "selfieWithId")}
                        className={styles.fileInput}
                        required
                      />
                    </div>
                  </label>
                  {formData.selfieWithId && (
                    <span className={styles.fileName}>{formData.selfieWithId.name}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.verificationNote}>
              <h4>📋 Verification Requirements:</h4>
              <ul>
                <li>All documents must be clear and readable</li>
                <li>Photos must be in color and well-lit</li>
                <li>ID must be valid and not expired</li>
                <li>Selfie must show your full face clearly</li>
                <li>Your account will be reviewed within 24-48 hours</li>
              </ul>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={styles.stepContent}>
            <h2 className={styles.stepTitle}>EMAIL VERIFICATION</h2>
            
            <div className={styles.verificationContent}>
              <div className={styles.verificationIcon}>📧</div>
              <h3 className={styles.verificationTitle}>Verify Your Email Address</h3>
              <p className={styles.verificationText}>
                We've sent a verification link to <strong>{formData.email}</strong>. 
                Please check your inbox and click the link to activate your Farm2Table Seller account.
              </p>
              <p className={styles.verificationSubtext}>
                Haven't received the email? Check your spam folder or click the button below to resend the link.
              </p>
              
              <div className={styles.verificationActions}>
                <div className={styles.verificationButtons}>
                  <button 
                    type="button" 
                    className={`${styles.secondaryButton} ${!canResendEmail ? styles.disabled : ''}`}
                    onClick={handleResendEmail}
                    disabled={!canResendEmail}
                  >
                    {canResendEmail ? (
                      <>
                        <svg className={styles.buttonIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M14 4L8 8L2 4M2 4L8 2L14 4M2 4V12L8 14L14 12V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Resend Email
                      </>
                    ) : (
                      `Resend in ${resendCooldown}s`
                    )}
                  </button>
                  <button 
                    type="button" 
                    className={styles.primaryButton}
                    onClick={() => window.location.href = '/roleSelection/seller/signin'}
                  >
                    Sign In
                    <svg className={styles.buttonIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12H14M14 12L11 9M14 12L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 4V2C10 1.44772 9.55228 1 9 1H3C2.44772 1 2 1.44772 2 2V14C2 14.5523 2.44772 15 3 15H9C9.55228 15 10 14.5523 10 14V12" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </button>
                </div>
                <button 
                  type="button" 
                  className={styles.textButton}
                  onClick={handleChangeEmail}
                >
                  Change Email Address
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContainer}>
        {/* Left Side - Progress Tracker */}
        <div className={styles.progressSection}>
          <div className={styles.progressContainer}>
            {/* Farm2Table Logo */}
            <div className={styles.logoContainer}>
              <img 
                src="/images/Farm2Table_Logo.png" 
                alt="Farm2Table Logo" 
                className={styles.logo} 
              />
            </div>
            
            <h1 className={styles.mainTitle}>Create Seller Account</h1>
            <p className={styles.subtitle}>Join our Farming Community and start selling directly to customers</p>
            
            <div className={styles.stepsList}>
              {stepInfo.map((step, index) => (
                <div 
                  key={step.number} 
                  className={`${styles.stepItem} ${
                    currentStep === step.number ? styles.active : ''
                  } ${currentStep > step.number ? styles.completed : ''}`}
                >
                  <div className={styles.stepIndicator}>
                    <div className={styles.stepNumber}>
                      {currentStep > step.number ? '✓' : step.number}
                    </div>
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={styles.stepDescription}>{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right Side - Form Content */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            {renderStepContent()}
            {/* Navigation Buttons */}
            {currentStep < totalSteps && (
              <div className={styles.navigationButtons}>
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    className={styles.backButton}
                    onClick={prevStep}
                  >
                    <svg className={styles.buttonIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11 2L5 8L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                  </button>
                )}
                <button 
                  type="button" 
                  className={styles.nextButton}
                  onClick={currentStep === 4 ? handleFinalSubmit : nextStep}
                  disabled={!validateStep(currentStep) || loading}
                >
                  {/* ✅ CORRECTED: Step 4 now shows "Next" since step 5 is email verification */}
                  {loading ? "Creating Account..." : currentStep === 4 ? 'Next' : 'Next'}
                  {!loading && currentStep !== 4 && (
                    <svg className={styles.buttonIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M5 2L11 8L5 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Modals */}
        {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
        {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}
      </div>
    </div>
  );
}