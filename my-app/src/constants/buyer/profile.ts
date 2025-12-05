// Buyer profile constants

// Philippine address data
export const PHILIPPINE_REGIONS = [
  { region: "Region III - Central Luzon", region_code: "030000000" }
];

export const REGION_III_PROVINCES = [
  { province: "Zambales", province_code: "037100000" }
];

// Cities and Municipalities in Zambales
export const ZAMBALES_CITIES_MUNICIPALITIES = [
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

// Default avatar as base64 SVG
export const DEFAULT_AVATAR_SVG = `data:image/svg+xml;base64,${btoa(`
  <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" fill="#E5E7EB"/>
    <circle cx="100" cy="80" r="40" fill="#9CA3AF"/>
    <path d="M100 140 C60 140 40 180 40 200 L160 200 C160 180 140 140 100 140Z" fill="#9CA3AF"/>
  </svg>
`)}`;

// Barangays data for Zambales (simplified - you may want to expand this)
export const ZAMBALES_BARANGAYS: Record<string, Array<{ brgy: string; brgy_code: string }>> = {
  "037109000": [ // Olongapo City
    { brgy: "Asinan", brgy_code: "037109001" },
    { brgy: "Banicain", brgy_code: "037109002" },
    { brgy: "Barretto", brgy_code: "037109003" },
    { brgy: "East Bajac-Bajac", brgy_code: "037109004" },
    { brgy: "West Bajac-Bajac", brgy_code: "037109005" },
    { brgy: "East Tapinac", brgy_code: "037109006" },
    { brgy: "West Tapinac", brgy_code: "037109007" },
    { brgy: "Gordon Heights", brgy_code: "037109008" },
    { brgy: "Kalaklan", brgy_code: "037109009" },
    { brgy: "Mabayuan", brgy_code: "037109010" },
    { brgy: "New Cabalan", brgy_code: "037109011" },
    { brgy: "New Ilalim", brgy_code: "037109012" },
    { brgy: "New Kababae", brgy_code: "037109013" },
    { brgy: "New Kalalake", brgy_code: "037109014" },
    { brgy: "Old Cabalan", brgy_code: "037109015" },
    { brgy: "Pag-asa", brgy_code: "037109016" },
    { brgy: "Santa Rita", brgy_code: "037109017" },
  ],
  // Add more cities/municipalities as needed
};

