// ============================================
// Geocoordinates for onboarding globe
// [latitude, longitude] — hardcoded for all known locations
// ============================================

/** Country center coordinates [lat, lng] keyed by ISO alpha-2 code */
export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  // Americas
  US: [39.83, -98.58],
  CA: [56.13, -106.35],
  BR: [-14.24, -51.93],
  MX: [23.63, -102.55],
  AR: [-38.42, -63.62],
  CO: [4.57, -74.3],
  CL: [-35.68, -71.54],
  // Europe
  GB: [55.38, -3.44],
  DE: [51.17, 10.45],
  FR: [46.23, 2.21],
  NL: [52.13, 5.29],
  IE: [53.41, -8.24],
  SE: [60.13, 18.64],
  CH: [46.82, 8.23],
  ES: [40.46, -3.75],
  IT: [41.87, 12.57],
  PL: [51.92, 19.15],
  PT: [39.4, -8.22],
  DK: [56.26, 9.5],
  FI: [61.92, 25.75],
  AT: [47.52, 14.55],
  BE: [50.5, 4.47],
  CZ: [49.82, 15.47],
  RO: [45.94, 24.97],
  // Asia-Pacific
  IN: [20.59, 78.96],
  SG: [1.35, 103.82],
  AU: [-25.27, 133.78],
  JP: [36.2, 138.25],
  KR: [35.91, 127.77],
  CN: [35.86, 104.2],
  HK: [22.32, 114.17],
  TW: [23.7, 120.96],
  NZ: [-40.9, 174.89],
  ID: [-0.79, 113.92],
  PH: [12.88, 121.77],
  VN: [14.06, 108.28],
  TH: [15.87, 100.99],
  MY: [4.21, 101.98],
  // Middle East & Africa
  AE: [23.42, 53.85],
  IL: [31.05, 34.85],
  SA: [23.89, 45.08],
  NG: [9.08, 8.68],
  ZA: [-30.56, 22.94],
  KE: [-0.02, 37.91],
  EG: [26.82, 30.8],
};

/** City coordinates [lat, lng] keyed by city name (matching location-data.ts names) */
export const CITY_COORDINATES: Record<string, [number, number]> = {
  // US
  'San Francisco, CA': [37.77, -122.42],
  'New York, NY': [40.71, -74.01],
  'Seattle, WA': [47.61, -122.33],
  'Austin, TX': [30.27, -97.74],
  'Los Angeles, CA': [34.05, -118.24],
  'Boston, MA': [42.36, -71.06],
  'Denver, CO': [39.74, -104.98],
  'Chicago, IL': [41.88, -87.63],
  'San Jose, CA': [37.34, -121.89],
  'Miami, FL': [25.76, -80.19],
  'Atlanta, GA': [33.75, -84.39],
  'Raleigh, NC': [35.78, -78.64],
  'San Diego, CA': [32.72, -117.16],
  'Washington, DC': [38.91, -77.04],
  'Portland, OR': [45.52, -122.68],
  // CA
  'Toronto, ON': [43.65, -79.38],
  'Vancouver, BC': [49.28, -123.12],
  'Montreal, QC': [45.5, -73.57],
  'Ottawa, ON': [45.42, -75.7],
  'Calgary, AB': [51.05, -114.07],
  'Waterloo, ON': [43.46, -80.52],
  // GB
  London: [51.51, -0.13],
  Manchester: [53.48, -2.24],
  Edinburgh: [55.95, -3.19],
  Cambridge: [52.21, 0.12],
  Bristol: [51.45, -2.59],
  Birmingham: [52.49, -1.89],
  // DE
  Berlin: [52.52, 13.41],
  Munich: [48.14, 11.58],
  Hamburg: [53.55, 9.99],
  Frankfurt: [50.11, 8.68],
  Stuttgart: [48.78, 9.18],
  // FR
  Paris: [48.86, 2.35],
  Lyon: [45.76, 4.84],
  Toulouse: [43.6, 1.44],
  Nantes: [47.22, -1.55],
  // NL
  Amsterdam: [52.37, 4.9],
  Rotterdam: [51.92, 4.48],
  Eindhoven: [51.44, 5.47],
  'The Hague': [52.08, 4.31],
  // IE
  Dublin: [53.35, -6.26],
  Cork: [51.9, -8.47],
  Galway: [53.27, -9.06],
  // SE
  Stockholm: [59.33, 18.07],
  Gothenburg: [57.71, 11.97],
  Malmo: [55.6, 13.0],
  // CH
  Zurich: [47.37, 8.54],
  Geneva: [46.2, 6.14],
  Basel: [47.56, 7.59],
  // ES
  Barcelona: [41.39, 2.17],
  Madrid: [40.42, -3.7],
  Valencia: [39.47, -0.38],
  // IT
  Milan: [45.46, 9.19],
  Rome: [41.9, 12.5],
  Turin: [45.07, 7.69],
  // PL
  Warsaw: [52.23, 21.01],
  Krakow: [50.06, 19.94],
  Wroclaw: [51.11, 17.04],
  // PT
  Lisbon: [38.72, -9.14],
  Porto: [41.15, -8.61],
  // DK
  Copenhagen: [55.68, 12.57],
  // FI
  Helsinki: [60.17, 24.94],
  // AT
  Vienna: [48.21, 16.37],
  // BE
  Brussels: [50.85, 4.35],
  Antwerp: [51.22, 4.4],
  // CZ
  Prague: [50.08, 14.44],
  Brno: [49.2, 16.61],
  // RO
  Bucharest: [44.43, 26.1],
  'Cluj-Napoca': [46.77, 23.6],
  // IN
  Bangalore: [12.97, 77.59],
  Mumbai: [19.08, 72.88],
  'Delhi NCR': [28.7, 77.1],
  Hyderabad: [17.39, 78.49],
  Pune: [18.52, 73.86],
  Chennai: [13.08, 80.27],
  // SG
  Singapore: [1.35, 103.82],
  // AU
  Sydney: [-33.87, 151.21],
  Melbourne: [-37.81, 144.96],
  Brisbane: [-27.47, 153.03],
  // JP
  Tokyo: [35.68, 139.69],
  Osaka: [34.69, 135.5],
  // KR
  Seoul: [37.57, 126.98],
  // CN
  Shanghai: [31.23, 121.47],
  Beijing: [39.9, 116.41],
  Shenzhen: [22.54, 114.06],
  Hangzhou: [30.27, 120.15],
  // HK
  'Hong Kong': [22.32, 114.17],
  // TW
  Taipei: [25.03, 121.57],
  // NZ
  Auckland: [-36.85, 174.76],
  Wellington: [-41.29, 174.78],
  // ID
  Jakarta: [-6.21, 106.85],
  // PH
  Manila: [14.6, 120.98],
  // VN
  'Ho Chi Minh City': [10.82, 106.63],
  Hanoi: [21.03, 105.85],
  // TH
  Bangkok: [13.76, 100.5],
  // MY
  'Kuala Lumpur': [3.14, 101.69],
  // AE
  Dubai: [25.2, 55.27],
  'Abu Dhabi': [24.45, 54.65],
  // IL
  'Tel Aviv': [32.09, 34.78],
  Haifa: [32.79, 34.99],
  // SA
  Riyadh: [24.69, 46.72],
  Jeddah: [21.54, 39.17],
  // NG
  Lagos: [6.52, 3.38],
  // ZA
  'Cape Town': [-33.92, 18.42],
  Johannesburg: [-26.2, 28.05],
  // KE
  Nairobi: [-1.29, 36.82],
  // EG
  Cairo: [30.04, 31.24],
  // BR
  'Sao Paulo': [-23.55, -46.63],
  'Rio de Janeiro': [-22.91, -43.17],
  // MX
  'Mexico City': [19.43, -99.13],
  Guadalajara: [20.68, -103.35],
  Monterrey: [25.69, -100.32],
  // AR
  'Buenos Aires': [-34.6, -58.38],
  // CO
  Bogota: [4.71, -74.07],
  Medellin: [6.25, -75.56],
  // CL
  Santiago: [-33.45, -70.67],
};
