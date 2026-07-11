export interface LatLng {
  lat: number;
  lng: number;
}

const CITY_COORDINATES: Record<string, LatLng> = {
  indore: { lat: 22.7196, lng: 75.8577 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  delhi: { lat: 28.6139, lng: 77.209 },
  'new delhi': { lat: 28.6139, lng: 77.209 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  ajmer: { lat: 26.4499, lng: 74.6399 },
  kota: { lat: 25.2138, lng: 75.8648 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  ujjain: { lat: 23.1765, lng: 75.7885 },
  nagda: { lat: 23.458, lng: 75.4172 },
  baramati: { lat: 18.151, lng: 74.5777 },
  palasia: { lat: 22.724, lng: 75.883 },
  sanganer: { lat: 26.785, lng: 75.787 },
  'san jose': { lat: 37.3382, lng: -121.8863 },
  london: { lat: 51.5074, lng: -0.1278 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  india: { lat: 20.5937, lng: 78.9629 },
  'united states': { lat: 37.0902, lng: -95.7129 },
  usa: { lat: 37.0902, lng: -95.7129 },
  canada: { lat: 56.1304, lng: -106.3468 },
  australia: { lat: -25.2744, lng: 133.7751 },
  'united kingdom': { lat: 55.3781, lng: -3.436 },
  uk: { lat: 55.3781, lng: -3.436 },
  california: { lat: 36.7783, lng: -119.4179 },
  ontario: { lat: 51.2538, lng: -85.3232 },
  'new south wales': { lat: -31.2532, lng: 146.9211 },
  'greater london': { lat: 51.5074, lng: -0.1278 },
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
  gujarat: { lat: 22.2587, lng: 71.1924 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  karnataka: { lat: 15.3173, lng: 75.7139 },
};

const COUNTRY_CENTERS: Record<string, LatLng> = {
  india: { lat: 20.5937, lng: 78.9629 },
  'united states': { lat: 39.8283, lng: -98.5795 },
  usa: { lat: 39.8283, lng: -98.5795 },
  canada: { lat: 56.1304, lng: -106.3468 },
  australia: { lat: -25.2744, lng: 133.7751 },
  'united kingdom': { lat: 55.3781, lng: -3.436 },
  uk: { lat: 55.3781, lng: -3.436 },
};

export function resolveRegistrationCoords(
  city?: string,
  state?: string,
  country?: string,
  id?: string
): LatLng {
  const cityKey = city?.trim().toLowerCase() ?? '';
  const stateKey = state?.trim().toLowerCase() ?? '';
  const countryKey = country?.trim().toLowerCase() ?? '';

  const baseCoords =
    CITY_COORDINATES[cityKey] ??
    CITY_COORDINATES[stateKey] ??
    COUNTRY_CENTERS[countryKey] ??
    CITY_COORDINATES[countryKey] ??
    { lat: 20.5937, lng: 78.9629 };

  if (!id) return baseCoords;

  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const latOffset = ((seed % 100) - 50) / 1600;
  const lngOffset = (((seed * 7) % 100) - 50) / 1600;

  return {
    lat: baseCoords.lat + latOffset,
    lng: baseCoords.lng + lngOffset,
  };
}

export function getMapBounds(coords: LatLng[]): [[number, number], [number, number]] | null {
  if (coords.length === 0) return null;

  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  let minLng = coords[0].lng;
  let maxLng = coords[0].lng;

  for (const { lat, lng } of coords) {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }

  const latPad = Math.max((maxLat - minLat) * 0.15, 2);
  const lngPad = Math.max((maxLng - minLng) * 0.15, 2);

  return [
    [minLat - latPad, minLng - lngPad],
    [maxLat + latPad, maxLng + lngPad],
  ];
}
