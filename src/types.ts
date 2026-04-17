export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export type AlertCategory =
  | 'MEDICAL_EMERGENCY'
  | 'SUSPECT_SEARCH'
  | 'TRAFFIC_HAZARD'
  | 'PUBLIC_SAFETY';

export interface GeoLocation {
  lat: number;
  lng: number;
  name?: string;
}

export interface RoutePattern {
  coordinates: [number, number][]; // lat, lng for leaflet
  durationSec: number;
  distanceMeters: number;
  type: 'PRIMARY' | 'ALTERNATIVE';
}

export interface RouteInfo {
  start: GeoLocation;
  end: GeoLocation;
  routes: RoutePattern[];
}

export interface WatchZone {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number;
  name: string;
}

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  location?: GeoLocation;
  radiusKm: number; // For geofencing dissemination area
  route?: RouteInfo;
  trafficCongestionInfo?: string;
  licensePlate?: string;
  timestamp: string; // ISO string
  active: boolean;
  hospitalVerificationToken?: string;
  targetChannels: string[];
}

