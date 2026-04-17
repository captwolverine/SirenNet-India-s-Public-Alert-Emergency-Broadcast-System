import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMap, useMapEvents, Polyline } from 'react-leaflet';

interface RoadSegment {
  id: number;
  coordinates: [number, number][];
  trafficLevel: 'FAST' | 'MODERATE' | 'SLOW';
}

export default function LiveTrafficLayer() {
  const map = useMap();
  const [segments, setSegments] = useState<RoadSegment[]>([]);
  const isFetching = useRef(false);

  const fetchTraffic = useCallback(async () => {
    // Only fetch traffic data if zoomed in to city/regional level to prevent massive queries
    if (map.getZoom() < 12) {
      setSegments([]); 
      return;
    }

    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const bounds = map.getBounds();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();
      
      const bbox = `${south},${west},${north},${east}`;
      // Query major arterial highways and primary roads
      const ql = `[out:json][timeout:5];(way["highway"~"motorway|trunk|primary"](${bbox}););out geom;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(ql)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Overpass API returned ' + res.status);
      
      const data = await res.json();
      
      const newSegments: RoadSegment[] = [];
      data.elements.forEach((el: any) => {
        if (el.type === 'way' && el.geometry) {
           // Simulate realistic pseudo-stable traffic based on element ID
           // In production, this would map to Google/TomTom live traffic vectors
           const rand = (el.id % 200) / 200; 
           let traffic: 'FAST' | 'MODERATE' | 'SLOW' = 'FAST'; // default flowing (Green)
           
           if (rand > 0.85) traffic = 'SLOW'; // 15% chance of severe congestion (Red)
           else if (rand > 0.60) traffic = 'MODERATE'; // 25% chance of moderate (Yellow)
           
           newSegments.push({
             id: el.id,
             coordinates: el.geometry.map((g: any) => [g.lat, g.lon]),
             trafficLevel: traffic
           });
        }
      });
      
      setSegments(newSegments);
    } catch (error) {
      console.warn("Live Traffic Telemetry sync failed (using local cache or waiting):", error);
    } finally {
      isFetching.current = false;
    }
  }, [map]);

  useMapEvents({
    moveend: fetchTraffic, // Re-fetch roads when map is panned/zoomed
  });

  useEffect(() => {
    fetchTraffic();

    // Dynamically simulate real-time traffic shifts every 8 seconds
    const simulationInterval = setInterval(() => {
      setSegments(prev => prev.map(seg => {
         // 10% chance for a road segment's traffic to worsen or improve
         if (Math.random() > 0.9) {
             const levels: ('FAST'|'MODERATE'|'SLOW')[] = ['FAST', 'MODERATE', 'SLOW'];
             // Random walk to an adjacent state
             const shift = levels[Math.floor(Math.random() * 3)];
             return { ...seg, trafficLevel: shift };
         }
         return seg;
      }));
    }, 8000);

    return () => clearInterval(simulationInterval);
  }, [fetchTraffic]);

  const colors = {
    FAST: '#10B981',     // Green
    MODERATE: '#F59E0B', // Yellow
    SLOW: '#E11D48',     // Red
  };

  return (
    <>
      {segments.map(seg => (
        <Polyline
          key={seg.id}
          positions={seg.coordinates}
          pathOptions={{
            color: colors[seg.trafficLevel],
            weight: seg.trafficLevel === 'SLOW' ? 4 : (seg.trafficLevel === 'MODERATE' ? 3 : 2),
            opacity: seg.trafficLevel === 'SLOW' ? 0.9 : 0.6,
          }}
        />
      ))}
    </>
  );
}
