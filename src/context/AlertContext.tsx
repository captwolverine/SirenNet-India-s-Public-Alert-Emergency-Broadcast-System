import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert, AlertCategory, AlertSeverity, WatchZone } from '../types';

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'active'>) => void;
  deactivateAlert: (id: string) => void;
  activeAlerts: Alert[];
  watchZones: WatchZone[];
  addWatchZone: (zone: Omit<WatchZone, 'id'>) => void;
  removeWatchZone: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const initialAlerts: Alert[] = [
  {
    id: 'AL-1004',
    category: 'MEDICAL_EMERGENCY',
    severity: 'CRITICAL',
    title: 'PRIVATE VEHICLE AMBULATORY STATUS',
    description: 'Vehicle KA-01-ME-108 transporting critical patient to Manipal Hospital. Has legal authorization to break red signals. EXPECT DELAYS ON ROUTE.',
    location: { lat: 12.9716, lng: 77.5946, name: 'MG Road, Bengaluru' },
    radiusKm: 5.0,
    licensePlate: 'KA-01-ME-108',
    timestamp: new Date().toISOString(),
    active: true,
    hospitalVerificationToken: 'AUTH-MANIPAL-99X',
    targetChannels: ['CAR_PLAY', 'MOBILE', 'PUBLIC_DISPLAY']
  },
  {
    id: 'AL-1005',
    category: 'SUSPECT_SEARCH',
    severity: 'HIGH',
    title: 'WANTED SUBJECT: ARMED & DANGEROUS',
    description: 'Suspect fleeing in silver SUV. Last seen traversing Outer Ring Road.',
    location: { lat: 12.9229, lng: 77.6711, name: 'Outer Ring Road, Bengaluru' },
    radiusKm: 10.0,
    licensePlate: 'DL-4C-AW-9932',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    active: true,
    targetChannels: ['MOBILE', 'PUBLIC_DISPLAY']
  }
];

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [watchZones, setWatchZones] = useState<WatchZone[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(curr => curr.map(a => {
        if (!a.active) return a;
        const hoursPassed = (Date.now() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60);
        if (hoursPassed > 24 && (a.severity === 'INFO' || a.severity === 'MEDIUM')) {
          return { ...a, active: false };
        }
        return a;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const addAlert = (alertData: Omit<Alert, 'id' | 'timestamp' | 'active'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `AL-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date().toISOString(),
      active: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const deactivateAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, active: false } : a)));
  };

  const addWatchZone = (zone: Omit<WatchZone, 'id'>) => {
    setWatchZones(prev => [...prev, { ...zone, id: `WZ-${Date.now()}` }]);
  };

  const removeWatchZone = (id: string) => {
    setWatchZones(prev => prev.filter(z => z.id !== id));
  };

  const activeAlerts = alerts.filter(a => a.active);

  return (
    <AlertContext.Provider value={{
      alerts, addAlert, deactivateAlert, activeAlerts,
      watchZones, addWatchZone, removeWatchZone
    }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
