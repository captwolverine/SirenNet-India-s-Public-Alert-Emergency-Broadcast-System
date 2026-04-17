import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Alert, RoutePattern } from '../types';
import { useAlerts } from '../context/AlertContext';
import LiveTrafficLayer from './LiveTrafficLayer';

// Fix for default markers in react-leaflet
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px ${color}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function MapClickHandler({ isZoneEditMode, addWatchZone }: { isZoneEditMode: boolean, addWatchZone: (z: any) => void }) {
  useMapEvents({
    click(e) {
      if (isZoneEditMode) {
        addWatchZone({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          radiusKm: 10,
          name: `Sector-${Math.floor(Math.random() * 999)}`
        });
      }
    }
  });
  return null;
}

interface AlertMapProps {
  alerts: Alert[];
  isZoneEditMode?: boolean;
}

export default function AlertMap({ alerts, isZoneEditMode = false }: AlertMapProps) {
  const center: [number, number] = alerts.length > 0 && alerts[0].location
    ? [alerts[0].location.lat, alerts[0].location.lng]
    : [12.9716, 77.5946];

  const { watchZones, addWatchZone } = useAlerts();

  return (
    <MapContainer 
      center={center} 
      zoom={11} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', zIndex: 10 }}
      className="rounded-lg filter invert hue-rotate-180 contrast-75 brightness-75 bg-[#f8f9fa]" 
    >
      <ChangeView center={center} zoom={11} />
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LiveTrafficLayer />
      <MapClickHandler isZoneEditMode={isZoneEditMode} addWatchZone={addWatchZone} />

      {watchZones.map(zone => (
        <Circle 
           key={zone.id}
           center={[zone.lat, zone.lng]}
           radius={zone.radiusKm * 1000}
           pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 0.1, dashArray: '10, 10' }}
        >
          <Popup>
            <div className="font-mono text-xs"><b>{zone.name}</b><br/>Watch Zone ({zone.radiusKm}km)</div>
          </Popup>
        </Circle>
      ))}

      {alerts.map(alert => {
        if (!alert.location) return null;
        
        let color = '#267CF2';
        if (alert.severity === 'CRITICAL') color = '#E23636';
        else if (alert.severity === 'HIGH') color = '#F27D26';
        else if (alert.severity === 'MEDIUM') color = '#F2A626';

        return (
          <React.Fragment key={alert.id}>
            <Marker 
              position={[alert.location.lat, alert.location.lng]}
              icon={createCustomIcon(color)}
            >
              <Popup>
                 <div className="font-sans">
                   <strong className="block text-red-600 mb-1">{alert.title}</strong>
                   <p className="text-sm m-0 text-gray-800">{alert.description}</p>
                   {alert.licensePlate && <span className="inline-block mt-2 font-mono text-xs bg-gray-200 px-1">{alert.licensePlate}</span>}
                 </div>
              </Popup>
            </Marker>

            {alert.radiusKm && (
               <Circle 
                 center={[alert.location.lat, alert.location.lng]}
                 radius={alert.radiusKm * 1000}
                 pathOptions={{ color, fillColor: color, fillOpacity: 0.05, weight: 1 }}
               />
            )}

            {alert.route && alert.route.routes.map((rt: RoutePattern, i: number) => (
              <Polyline
                key={i}
                positions={rt.coordinates}
                pathOptions={{ 
                  color: rt.type === 'PRIMARY' ? color : '#94A3B8', 
                  weight: rt.type === 'PRIMARY' ? 4 : 2,
                  dashArray: rt.type === 'ALTERNATIVE' ? '5, 10' : undefined,
                  opacity: 0.8
                }}
              />
            ))}
          </React.Fragment>
        )
      })}
    </MapContainer>
  );
}
