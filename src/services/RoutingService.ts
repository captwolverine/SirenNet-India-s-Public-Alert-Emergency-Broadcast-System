import { GeoLocation, RoutePattern, RouteInfo } from '../types';

/**
 * Uses the free OSRM demo server for real-time routing. 
 * Note: OSRM expects coordinates in lng,lat format.
 */
export async function calculateRoute(start: GeoLocation, end: GeoLocation): Promise<RouteInfo | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Routing failed');
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const routes: RoutePattern[] = data.routes.map((rt: any, index: number) => {
      // OSRM GeoJSON returns [lng, lat] arrays. We need [lat, lng] for Leaflet.
      const coordinates = rt.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      
      return {
        coordinates,
        durationSec: rt.duration,
        distanceMeters: rt.distance,
        type: index === 0 ? 'PRIMARY' : 'ALTERNATIVE'
      };
    });

    return {
      start,
      end,
      routes
    };

  } catch (error) {
    console.error("OSRM Routing Error:", error);
    return null;
  }
}

export const KNOWN_HOSPITALS: GeoLocation[] = [
  { name: 'AIIMS Delhi', lat: 28.5672, lng: 77.2100 },
  { name: 'Safdarjung Hospital', lat: 28.5688, lng: 77.2059 },
  { name: 'Manipal Hospital, Old Airport Rd', lat: 12.9592, lng: 77.6485 },
  { name: 'Apollo Hospitals Bannerghatta', lat: 12.8953, lng: 77.5991 },
  { name: 'Fortis Hospital Mulund', lat: 19.1554, lng: 72.9366 }
];

// Helper to find nearest hospital
export function findNearestHospital(loc: GeoLocation): GeoLocation {
  let nearest = KNOWN_HOSPITALS[0];
  let minDistance = Infinity;

  for (const h of KNOWN_HOSPITALS) {
    // Simple rough distance (Pythagoras on lat/lng) for prototype speed. 
    // In production, Haversine is used.
    const dist = Math.pow(h.lat - loc.lat, 2) + Math.pow(h.lng - loc.lng, 2);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = h;
    }
  }

  return nearest;
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const x1 = lat2 - lat1;
  const dLat = (x1 * Math.PI) / 180;
  const x2 = lon2 - lon1;
  const dLon = (x2 * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
