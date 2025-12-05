// Interface definitions
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BarangayCoordinates {
  [city: string]: {
    [barangay: string]: Coordinates;
  };
}

// BARANGAY COORDINATES FOR ZAMBALES - Using your existing data structure
export const brgyCoordinates: BarangayCoordinates = {
  // OLONGAPO CITY
  "Olongapo City": {
    "Asinan": { lat: 14.8300, lng: 120.2850 },
    "Banicain": { lat: 14.8350, lng: 120.2800 },
    "Barreto": { lat: 14.8791, lng: 120.2627 },
    "East Bajac-bajac": { lat: 14.8278, lng: 120.2826 },
    "East Tapinac": { lat: 14.8411, lng: 120.2820 },
    "Gordon Heights": { lat: 14.8381, lng: 120.2824 },
    "Kalaklan": { lat: 14.8450, lng: 120.2750 },
    "Mabayuan": { lat: 14.8500, lng: 120.2700 },
    "New Cabalan": { lat: 14.8664, lng: 120.3078 },
    "New Ilalim": { lat: 14.8400, lng: 120.2900 },
    "New Kababae": { lat: 14.8420, lng: 120.2880 },
    "New Kalalake": { lat: 14.8440, lng: 120.2860 },
    "Old Cabalan": { lat: 14.8600, lng: 120.3050 },
    "Pag-asa": { lat: 14.8320, lng: 120.2830 },
    "Santa Rita": { lat: 14.8350, lng: 120.2787 },
    "West Bajac-bajac": { lat: 14.8250, lng: 120.2800 },
    "West Tapinac": { lat: 14.8390, lng: 120.2810 }
  },

  // SUBIC
  "Subic": {
    "Aningway": { lat: 14.8500, lng: 120.2200 },
    "Asinan": { lat: 14.8550, lng: 120.2250 },
    "Baraca-Camachile": { lat: 14.8744, lng: 120.2347 },
    "Batiawan": { lat: 14.8600, lng: 120.2300 },
    "Calapacuan": { lat: 14.8650, lng: 120.2350 },
    "Calapandayan": { lat: 14.8592, lng: 120.2419 },
    "Cawag": { lat: 14.8700, lng: 120.2400 },
    "Ilwas": { lat: 14.8570, lng: 120.2380 },
    "Mangan-Vaca": { lat: 14.8620, lng: 120.2330 },
    "Matain": { lat: 14.8680, lng: 120.2370 },
    "Naugsol": { lat: 14.8630, lng: 120.2320 },
    "Pamatawan": { lat: 14.8610, lng: 120.2310 },
    "San Isidro": { lat: 14.8560, lng: 120.2390 },
    "Santo Tomas": { lat: 14.8580, lng: 120.2360 },
    "Wawandue": { lat: 14.8667, lng: 120.2333 }
  },

  // SAN MARCELINO
  "San Marcelino": {
    "Aglao": { lat: 14.9742, lng: 120.1578 },
    "Buhawen": { lat: 14.9800, lng: 120.1600 },
    "Burgos": { lat: 14.9639, lng: 120.1653 },
    "Central": { lat: 14.9744, lng: 120.1603 },
    "Consuelo Norte": { lat: 14.9760, lng: 120.1580 },
    "Consuelo Sur": { lat: 14.9750, lng: 120.1590 },
    "La Paz": { lat: 14.9770, lng: 120.1610 },
    "Laoag": { lat: 14.9780, lng: 120.1620 },
    "Linasin": { lat: 14.9790, lng: 120.1630 },
    "Linusungan": { lat: 14.9800, lng: 120.1640 },
    "Lucero": { lat: 14.9810, lng: 120.1650 },
    "Nagbunga": { lat: 14.9820, lng: 120.1660 },
    "Rabanes": { lat: 14.9830, lng: 120.1670 },
    "Rizal": { lat: 14.9840, lng: 120.1680 },
    "San Guillermo": { lat: 14.9850, lng: 120.1690 },
    "San Isidro": { lat: 14.9860, lng: 120.1700 },
    "San Rafael": { lat: 14.9870, lng: 120.1710 },
    "Santa Fe": { lat: 14.9880, lng: 120.1720 }
  },

  // CASTILLEJOS
  "Castillejos": {
    "Balaybay": { lat: 14.9300, lng: 120.1900 },
    "Buengay": { lat: 14.9350, lng: 120.1950 },
    "Del Pilar": { lat: 14.9400, lng: 120.2000 },
    "Looc": { lat: 14.9450, lng: 120.2050 },
    "Magsaysay": { lat: 14.9500, lng: 120.2100 },
    "Nagbayan": { lat: 14.9550, lng: 120.2150 },
    "Nagbunga": { lat: 14.9600, lng: 120.2200 },
    "San Agustin": { lat: 14.9650, lng: 120.2250 },
    "San Jose": { lat: 14.9700, lng: 120.2300 },
    "San Juan": { lat: 14.9750, lng: 120.2350 },
    "San Nicolas": { lat: 14.9800, lng: 120.2400 },
    "San Pablo": { lat: 14.9850, lng: 120.2450 },
    "San Roque": { lat: 14.9900, lng: 120.2500 },
    "Santa Maria": { lat: 14.9950, lng: 120.2550 }
  },

  // SAN ANTONIO
  "San Antonio": {
    "Angeles": { lat: 14.9500, lng: 120.0800 },
    "Antipolo": { lat: 14.9550, lng: 120.0850 },
    "Burgos": { lat: 14.9600, lng: 120.0900 },
    "East Dirita": { lat: 14.9650, lng: 120.0950 },
    "Luna": { lat: 14.9700, lng: 120.1000 },
    "Pundaquit": { lat: 14.9750, lng: 120.1050 },
    "San Esteban": { lat: 14.9800, lng: 120.1100 },
    "San Gregorio": { lat: 14.9850, lng: 120.1150 },
    "San Juan": { lat: 14.9900, lng: 120.1200 },
    "San Miguel": { lat: 14.9950, lng: 120.1250 },
    "San Nicolas": { lat: 15.0000, lng: 120.1300 },
    "Santiago": { lat: 15.0050, lng: 120.1350 },
    "West Dirita": { lat: 15.0100, lng: 120.1400 }
  },

  // BOTOLAN (Sample - add more as needed)
  "Botolan": {
    "Bangan": { lat: 15.2900, lng: 120.0200 },
    "Batolilan": { lat: 15.2950, lng: 120.0250 },
    "Beneg": { lat: 15.3000, lng: 120.0300 },
    "Poblacion": { lat: 15.2850, lng: 120.0150 }
  },

  // IBA (Sample - add more as needed)
  "Iba": {
    "Amungan": { lat: 15.3300, lng: 119.9800 },
    "Bangantalinga": { lat: 15.3350, lng: 119.9850 },
    "Zone 1 Poblacion": { lat: 15.3250, lng: 119.9750 }
  },

  // MASINLOC (Sample - add more as needed)
  "Masinloc": {
    "Baloganon": { lat: 15.5400, lng: 119.9500 },
    "Bamban": { lat: 15.5450, lng: 119.9550 },
    "North Poblacion": { lat: 15.5350, lng: 119.9450 }
  }
};

// City center coordinates for fallback
const cityCenters: { [city: string]: Coordinates } = {
  "Olongapo City": { lat: 14.8381, lng: 120.2824 },
  "Subic": { lat: 14.8744, lng: 120.2347 },
  "San Marcelino": { lat: 14.9744, lng: 120.1603 },
  "Castillejos": { lat: 14.9300, lng: 120.1900 },
  "San Antonio": { lat: 14.9500, lng: 120.0800 },
  "Botolan": { lat: 15.2850, lng: 120.0150 },
  "Iba": { lat: 15.3250, lng: 119.9750 },
  "Masinloc": { lat: 15.5350, lng: 119.9450 }
};

// Helper function to get coordinates for a specific barangay
export function getBarangayCoordinates(city: string, barangay: string): Coordinates {
  if (brgyCoordinates[city] && brgyCoordinates[city][barangay]) {
    return brgyCoordinates[city][barangay];
  }
  
  // Fallback: return city center coordinates
  return cityCenters[city] || { lat: 14.8381, lng: 120.2824 }; // Default to Olongapo
}

// Get all barangays for a specific city
export function getBarangaysByCity(city: string): string[] {
  return brgyCoordinates[city] ? Object.keys(brgyCoordinates[city]) : [];
}

// Check if a city exists in our coordinates database
export function isValidCity(city: string): boolean {
  return city in brgyCoordinates;
}

// Check if a barangay exists in a specific city
export function isValidBarangay(city: string, barangay: string): boolean {
  return !!(brgyCoordinates[city] && brgyCoordinates[city][barangay]);
}