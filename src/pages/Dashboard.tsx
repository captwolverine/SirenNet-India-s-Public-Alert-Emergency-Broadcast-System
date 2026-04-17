import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { AlertCategory, AlertSeverity, GeoLocation } from '../types';
import { calculateRoute, findNearestHospital } from '../services/RoutingService';
import { Search, MapPin, Activity, Power, LogOut, Radio } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { alerts, addAlert, deactivateAlert, activeAlerts } = useAlerts();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PUBLIC_SAFETY' as AlertCategory,
    severity: 'INFO' as AlertSeverity,
    lat: '12.9716',
    lng: '77.5946',
    radiusKm: '5.0',
    locationName: 'Bengaluru, KA',
    licensePlate: '',
  });

  const [isDispatching, setIsDispatching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDispatching(true);
    
    let routeInfo = undefined;
    const loc: GeoLocation = {
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      name: formData.locationName
    };

    if (formData.category === 'MEDICAL_EMERGENCY') {
      const nearestHosp = findNearestHospital(loc);
      const routeCalc = await calculateRoute(loc, nearestHosp);
      if (routeCalc) {
         routeInfo = routeCalc;
      }
    } else if (formData.category === 'TRAFFIC_HAZARD') {
      // Simulate getting alternative routes around the incident
      const alternateDest = { lat: loc.lat + 0.05, lng: loc.lng + 0.05, name: 'Bypass Route' };
      const routeCalc = await calculateRoute(loc, alternateDest);
      if (routeCalc) routeInfo = routeCalc;
    }

    let trafficInfo = undefined;
    if (formData.category === 'TRAFFIC_HAZARD' || formData.category === 'MEDICAL_EMERGENCY') {
        trafficInfo = `SEVERE CONGESTION EXPECTED ALONG DISSEMINATION RADIUS OF ${formData.radiusKm} KM. AVOID ROUTE.`;
    }

    addAlert({
      category: formData.category,
      severity: formData.severity,
      title: formData.title.toUpperCase(),
      description: formData.description,
      location: loc,
      radiusKm: parseFloat(formData.radiusKm),
      route: routeInfo,
      trafficCongestionInfo: trafficInfo,
      licensePlate: formData.licensePlate || undefined,
      targetChannels: ['MOBILE', 'PUBLIC_DISPLAY', 'CAR_PLAY']
    });
    
    setIsDispatching(false);
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <header className="hd-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio className="text-[var(--accent)]" size={20} />
          <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-1px' }}>SirenNet</div>
          <div className="hd-badge">Live Network</div>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <div style={{ color: 'var(--success)' }} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"></span>
            TRAFFIC TELEMETRY
          </div>
          <div>SYSTEMS NOMINAL</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{format(new Date(), 'HH:mm:ss')}</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar Panel */}
        <div className="hd-panel">
          <div className="hd-panel-header">
            <span>Operations Node</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)] px-4 py-3 cursor-pointer flex justify-between items-center">
                <span className="font-mono text-xs tracking-widest uppercase">Active Alerts</span>
                <span className="bg-[var(--accent)] px-2 text-white font-mono text-xs animate-pulse">
                  {activeAlerts.length}
                </span>
              </div>
              <div className="px-4 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] flex gap-2 items-center border border-transparent transition-colors">
                <Search size={16}/> <span className="font-mono text-xs tracking-widest uppercase">Archive</span>
              </div>
              <div className="px-4 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-dim)] flex gap-2 items-center border border-transparent transition-colors">
                <MapPin size={16}/> <span className="font-mono text-xs tracking-widest uppercase">Map View</span>
              </div>
            </nav>
          </div>
          
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-mono text-[var(--text-dim)] bg-[var(--surface)]">
            <span>OP: ADM_RJ7</span>
            <LogOut size={14} className="cursor-pointer hover:text-[var(--accent)] transition-colors"/>
          </div>
        </div>

        {/* Main Content Panel */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg)', padding: '32px' }}>
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header Bar */}
            <div className="flex justify-between items-end border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Mission Control</h2>
                <p className="font-mono text-[11px] text-[var(--text-dim)] uppercase mt-1">National Emergency Dispatch Protocol</p>
              </div>
              <button 
                onClick={() => setShowForm(!showForm)}
                className="bg-[var(--accent)] text-white px-6 py-2.5 font-mono text-[11px] font-bold uppercase transition hover:opacity-80"
              >
                {showForm ? 'Cancel Dispatch' : '+ Issue Alert'}
              </button>
            </div>

            {/* Form Create */}
            {showForm && (
              <div className="dash-card p-6 border-l-4 border-[var(--border)]" style={{ borderLeftColor: 'var(--accent)' }}>
                <h3 className="font-mono text-[12px] text-[var(--text-dim)] uppercase mb-6">New Threat / Event Dispatch</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Alert Title</label>
                      <input className="w-full px-3 py-2 font-mono uppercase text-sm" required
                        value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Category</label>
                        <select className="w-full px-3 py-2 font-mono uppercase text-sm"
                          value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as AlertCategory})}>
                          <option value="PUBLIC_SAFETY">Public Safety</option>
                          <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                          <option value="SUSPECT_SEARCH">Suspect Search</option>
                          <option value="TRAFFIC_HAZARD">Traffic Hazard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Severity</label>
                        <select className="w-full px-3 py-2 font-mono uppercase text-sm"
                          value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value as AlertSeverity})}>
                          <option value="INFO">Info</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Description / Action Required</label>
                    <textarea className="w-full px-3 py-2 font-mono text-sm h-24" required
                       value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                     <div className="col-span-2">
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Location Name</label>
                      <input className="w-full px-3 py-2 font-mono text-sm"
                        value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})} />
                    </div>
                     <div>
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Lat</label>
                      <input className="w-full px-3 py-2 font-mono text-sm"
                        value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                    </div>
                     <div>
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Lng</label>
                      <input className="w-full px-3 py-2 font-mono text-sm"
                        value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Target Vehicle (License Plate)</label>
                      <input className="w-full px-3 py-2 font-mono uppercase text-sm" placeholder="Optional DL-XX-XXXX"
                        value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--text-dim)] mb-1 uppercase font-bold">Dissemination Radius (KM)</label>
                      <input type="number" step="0.1" className="w-full px-3 py-2 font-mono uppercase text-sm"
                        value={formData.radiusKm} onChange={e => setFormData({...formData, radiusKm: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={isDispatching} className="bg-white text-black px-8 py-2.5 font-mono text-[11px] font-bold tracking-widest uppercase hover:opacity-80 transition disabled:opacity-50">
                      {isDispatching ? 'CALCULATING ROUTE & DISPATCHING...' : 'BROADCAST ALERT'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Data Grid */}
            <div className="dash-card">
              <div className="grid grid-cols-[auto_1fr_1fr_120px] bg-[var(--surface)] border-b border-[var(--border)]">
                <div className="col-header w-12">St</div>
                <div className="col-header">Identifier / Context</div>
                <div className="col-header">Location / Subject</div>
                <div className="col-header text-right">Action</div>
              </div>
              
              <div className="flex flex-col">
                {alerts.length === 0 ? (
                   <div className="p-8 text-center font-mono text-[12px] text-[var(--text-dim)]">No alerts logged in the system.</div>
                ) : alerts.map(alert => (
                  <div key={alert.id} className="data-row relative bg-[var(--bg)]">
                    {/* Status indicator bar */}
                    <div className={`w-12 border-r border-[var(--border)] flex items-center justify-center
                      ${alert.active && alert.severity === 'CRITICAL' ? 'bg-[rgba(225,29,72,0.1)] text-[var(--accent)] border-l-4' : 'border-l-4 border-l-transparent'}
                      ${alert.active && alert.severity === 'HIGH' ? 'bg-[rgba(245,158,11,0.1)] text-[var(--warning)] border-l-4' : ''}
                      ${alert.active && alert.severity === 'MEDIUM' ? 'bg-[rgba(245,158,11,0.1)] text-[var(--warning)] border-l-4' : ''}
                      ${!alert.active ? 'text-[var(--text-dim)] opacity-50' : ''}
                    `} style={alert.active ? {
                      borderLeftColor: alert.severity === 'CRITICAL' ? 'var(--accent)' : alert.severity === 'HIGH' || alert.severity === 'MEDIUM' ? 'var(--warning)' : 'var(--info)'
                    } : {}}>
                      {!alert.active ? <Power size={16} /> : <Activity size={16} className="animate-pulse" />}
                    </div>
                    
                    <div className="p-4 flex flex-col justify-center">
                      <div className="alert-time mb-1">{alert.id} | {format(new Date(alert.timestamp), 'HH:mm:ss')}</div>
                      <div className="alert-title text-[var(--text-main)] uppercase">{alert.title}</div>
                      <div className="text-[11px] text-[var(--text-dim)] mt-1 line-clamp-1">{alert.description}</div>
                    </div>

                    <div className="p-4 flex flex-col justify-center gap-1">
                      <div className="alert-meta">
                        <span>{alert.location?.name || 'N/A'} (R: {alert.radiusKm}km)</span>
                      </div>
                      {alert.licensePlate && (
                         <div className="font-mono text-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-main)] inline-block px-1.5 py-0.5 align-middle self-start">
                           {alert.licensePlate}
                         </div>
                      )}
                      {alert.route && (
                         <div className="font-mono text-[10px] text-[var(--success)]">
                            ROUTING: {alert.route.end.name}
                         </div>
                      )}
                    </div>

                    <div className="p-4 flex items-center justify-end">
                      {alert.active ? (
                        <button 
                          onClick={() => deactivateAlert(alert.id)}
                          className="text-[10px] uppercase font-mono border border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] px-3 py-1.5 hover:bg-[var(--bg)] hover:border-white transition-colors">
                          Stand Down
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono opacity-50">RESOLVED</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

