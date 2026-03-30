// ============================================
// Static location data for onboarding
// No API calls — bundled in client
// ============================================

export interface Country {
  code: string;
  name: string;
  region: string;
  flag: string;
}

export interface City {
  name: string;
  label: string;
}

// ── Countries with significant tech job markets ──

export const COUNTRIES: Country[] = [
  // Americas
  { code: 'US', name: 'United States', region: 'Americas', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', region: 'Americas', flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil', region: 'Americas', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', region: 'Americas', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', region: 'Americas', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', region: 'Americas', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', region: 'Americas', flag: '🇨🇱' },
  // Europe
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪' },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  { code: 'IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪' },
  { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭' },
  { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹' },
  { code: 'PL', name: 'Poland', region: 'Europe', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', region: 'Europe', flag: '🇵🇹' },
  { code: 'DK', name: 'Denmark', region: 'Europe', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', region: 'Europe', flag: '🇫🇮' },
  { code: 'AT', name: 'Austria', region: 'Europe', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', region: 'Europe', flag: '🇧🇪' },
  { code: 'CZ', name: 'Czech Republic', region: 'Europe', flag: '🇨🇿' },
  { code: 'RO', name: 'Romania', region: 'Europe', flag: '🇷🇴' },
  // Asia-Pacific
  { code: 'IN', name: 'India', region: 'Asia-Pacific', flag: '🇮🇳' },
  { code: 'SG', name: 'Singapore', region: 'Asia-Pacific', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', region: 'Asia-Pacific', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', region: 'Asia-Pacific', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', region: 'Asia-Pacific', flag: '🇰🇷' },
  { code: 'CN', name: 'China', region: 'Asia-Pacific', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', region: 'Asia-Pacific', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwan', region: 'Asia-Pacific', flag: '🇹🇼' },
  { code: 'NZ', name: 'New Zealand', region: 'Asia-Pacific', flag: '🇳🇿' },
  { code: 'ID', name: 'Indonesia', region: 'Asia-Pacific', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', region: 'Asia-Pacific', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', region: 'Asia-Pacific', flag: '🇻🇳' },
  { code: 'TH', name: 'Thailand', region: 'Asia-Pacific', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', region: 'Asia-Pacific', flag: '🇲🇾' },
  // Middle East & Africa
  { code: 'AE', name: 'UAE', region: 'Middle East & Africa', flag: '🇦🇪' },
  { code: 'IL', name: 'Israel', region: 'Middle East & Africa', flag: '🇮🇱' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East & Africa', flag: '🇸🇦' },
  { code: 'NG', name: 'Nigeria', region: 'Middle East & Africa', flag: '🇳🇬' },
  { code: 'ZA', name: 'South Africa', region: 'Middle East & Africa', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', region: 'Middle East & Africa', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', region: 'Middle East & Africa', flag: '🇪🇬' },
];

/** Top 12 countries shown as primary chips */
export const POPULAR_COUNTRY_CODES: string[] = [
  'US',
  'GB',
  'CA',
  'DE',
  'IN',
  'AU',
  'SG',
  'NL',
  'FR',
  'IE',
  'IL',
  'AE',
];

// ── Cities per country (major tech hubs) ──

export const CITIES_BY_COUNTRY: Record<string, City[]> = {
  US: [
    { name: 'San Francisco, CA', label: 'San Francisco' },
    { name: 'New York, NY', label: 'New York' },
    { name: 'Seattle, WA', label: 'Seattle' },
    { name: 'Austin, TX', label: 'Austin' },
    { name: 'Los Angeles, CA', label: 'Los Angeles' },
    { name: 'Boston, MA', label: 'Boston' },
    { name: 'Denver, CO', label: 'Denver' },
    { name: 'Chicago, IL', label: 'Chicago' },
    { name: 'San Jose, CA', label: 'San Jose' },
    { name: 'Miami, FL', label: 'Miami' },
    { name: 'Atlanta, GA', label: 'Atlanta' },
    { name: 'Raleigh, NC', label: 'Raleigh' },
    { name: 'San Diego, CA', label: 'San Diego' },
    { name: 'Washington, DC', label: 'Washington DC' },
    { name: 'Portland, OR', label: 'Portland' },
  ],
  CA: [
    { name: 'Toronto, ON', label: 'Toronto' },
    { name: 'Vancouver, BC', label: 'Vancouver' },
    { name: 'Montreal, QC', label: 'Montreal' },
    { name: 'Ottawa, ON', label: 'Ottawa' },
    { name: 'Calgary, AB', label: 'Calgary' },
    { name: 'Waterloo, ON', label: 'Waterloo' },
  ],
  GB: [
    { name: 'London', label: 'London' },
    { name: 'Manchester', label: 'Manchester' },
    { name: 'Edinburgh', label: 'Edinburgh' },
    { name: 'Cambridge', label: 'Cambridge' },
    { name: 'Bristol', label: 'Bristol' },
    { name: 'Birmingham', label: 'Birmingham' },
  ],
  DE: [
    { name: 'Berlin', label: 'Berlin' },
    { name: 'Munich', label: 'Munich' },
    { name: 'Hamburg', label: 'Hamburg' },
    { name: 'Frankfurt', label: 'Frankfurt' },
    { name: 'Stuttgart', label: 'Stuttgart' },
  ],
  FR: [
    { name: 'Paris', label: 'Paris' },
    { name: 'Lyon', label: 'Lyon' },
    { name: 'Toulouse', label: 'Toulouse' },
    { name: 'Nantes', label: 'Nantes' },
  ],
  NL: [
    { name: 'Amsterdam', label: 'Amsterdam' },
    { name: 'Rotterdam', label: 'Rotterdam' },
    { name: 'Eindhoven', label: 'Eindhoven' },
    { name: 'The Hague', label: 'The Hague' },
  ],
  IE: [
    { name: 'Dublin', label: 'Dublin' },
    { name: 'Cork', label: 'Cork' },
    { name: 'Galway', label: 'Galway' },
  ],
  SE: [
    { name: 'Stockholm', label: 'Stockholm' },
    { name: 'Gothenburg', label: 'Gothenburg' },
    { name: 'Malmo', label: 'Malmo' },
  ],
  CH: [
    { name: 'Zurich', label: 'Zurich' },
    { name: 'Geneva', label: 'Geneva' },
    { name: 'Basel', label: 'Basel' },
  ],
  ES: [
    { name: 'Barcelona', label: 'Barcelona' },
    { name: 'Madrid', label: 'Madrid' },
    { name: 'Valencia', label: 'Valencia' },
  ],
  IT: [
    { name: 'Milan', label: 'Milan' },
    { name: 'Rome', label: 'Rome' },
    { name: 'Turin', label: 'Turin' },
  ],
  PL: [
    { name: 'Warsaw', label: 'Warsaw' },
    { name: 'Krakow', label: 'Krakow' },
    { name: 'Wroclaw', label: 'Wroclaw' },
  ],
  PT: [
    { name: 'Lisbon', label: 'Lisbon' },
    { name: 'Porto', label: 'Porto' },
  ],
  DK: [{ name: 'Copenhagen', label: 'Copenhagen' }],
  FI: [{ name: 'Helsinki', label: 'Helsinki' }],
  AT: [{ name: 'Vienna', label: 'Vienna' }],
  BE: [
    { name: 'Brussels', label: 'Brussels' },
    { name: 'Antwerp', label: 'Antwerp' },
  ],
  CZ: [
    { name: 'Prague', label: 'Prague' },
    { name: 'Brno', label: 'Brno' },
  ],
  RO: [
    { name: 'Bucharest', label: 'Bucharest' },
    { name: 'Cluj-Napoca', label: 'Cluj-Napoca' },
  ],
  IN: [
    { name: 'Bangalore', label: 'Bangalore' },
    { name: 'Mumbai', label: 'Mumbai' },
    { name: 'Delhi NCR', label: 'Delhi NCR' },
    { name: 'Hyderabad', label: 'Hyderabad' },
    { name: 'Pune', label: 'Pune' },
    { name: 'Chennai', label: 'Chennai' },
  ],
  SG: [{ name: 'Singapore', label: 'Singapore' }],
  AU: [
    { name: 'Sydney', label: 'Sydney' },
    { name: 'Melbourne', label: 'Melbourne' },
    { name: 'Brisbane', label: 'Brisbane' },
  ],
  JP: [
    { name: 'Tokyo', label: 'Tokyo' },
    { name: 'Osaka', label: 'Osaka' },
  ],
  KR: [{ name: 'Seoul', label: 'Seoul' }],
  CN: [
    { name: 'Shanghai', label: 'Shanghai' },
    { name: 'Beijing', label: 'Beijing' },
    { name: 'Shenzhen', label: 'Shenzhen' },
    { name: 'Hangzhou', label: 'Hangzhou' },
  ],
  HK: [{ name: 'Hong Kong', label: 'Hong Kong' }],
  TW: [{ name: 'Taipei', label: 'Taipei' }],
  NZ: [
    { name: 'Auckland', label: 'Auckland' },
    { name: 'Wellington', label: 'Wellington' },
  ],
  ID: [{ name: 'Jakarta', label: 'Jakarta' }],
  PH: [{ name: 'Manila', label: 'Manila' }],
  VN: [
    { name: 'Ho Chi Minh City', label: 'Ho Chi Minh City' },
    { name: 'Hanoi', label: 'Hanoi' },
  ],
  TH: [{ name: 'Bangkok', label: 'Bangkok' }],
  MY: [{ name: 'Kuala Lumpur', label: 'Kuala Lumpur' }],
  AE: [
    { name: 'Dubai', label: 'Dubai' },
    { name: 'Abu Dhabi', label: 'Abu Dhabi' },
  ],
  IL: [
    { name: 'Tel Aviv', label: 'Tel Aviv' },
    { name: 'Haifa', label: 'Haifa' },
  ],
  SA: [
    { name: 'Riyadh', label: 'Riyadh' },
    { name: 'Jeddah', label: 'Jeddah' },
  ],
  NG: [{ name: 'Lagos', label: 'Lagos' }],
  ZA: [
    { name: 'Cape Town', label: 'Cape Town' },
    { name: 'Johannesburg', label: 'Johannesburg' },
  ],
  KE: [{ name: 'Nairobi', label: 'Nairobi' }],
  EG: [{ name: 'Cairo', label: 'Cairo' }],
  BR: [
    { name: 'Sao Paulo', label: 'Sao Paulo' },
    { name: 'Rio de Janeiro', label: 'Rio de Janeiro' },
  ],
  MX: [
    { name: 'Mexico City', label: 'Mexico City' },
    { name: 'Guadalajara', label: 'Guadalajara' },
    { name: 'Monterrey', label: 'Monterrey' },
  ],
  AR: [{ name: 'Buenos Aires', label: 'Buenos Aires' }],
  CO: [
    { name: 'Bogota', label: 'Bogota' },
    { name: 'Medellin', label: 'Medellin' },
  ],
  CL: [{ name: 'Santiago', label: 'Santiago' }],
};

// ── Helpers ──

const countriesByCode = new Map(COUNTRIES.map((c) => [c.code, c]));

/** Search countries by name (case-insensitive prefix match) */
export function searchCountries(query: string, limit = 8): Country[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q
  ).slice(0, limit);
}

/** Get combined city list for selected country codes */
export function getCitiesForCountries(codes: string[]): (City & { countryCode: string })[] {
  return codes.flatMap((code) =>
    (CITIES_BY_COUNTRY[code] ?? []).map((city) => ({ ...city, countryCode: code }))
  );
}

/** Look up a country by its ISO code */
export function getCountryByCode(code: string): Country | undefined {
  return countriesByCode.get(code);
}
