import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { Alert } from '../types';
import AlertMap from '../components/AlertMap';
import { ShieldAlert, AlertTriangle, Activity, Settings, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { haversineDistanceKm } from '../services/RoutingService';

export default function Receiver() {
  const { activeAlerts, watchZones, removeWatchZone } = useAlerts();
  const [showSettings, setShowSettings] = useState(false);
  const [isZoneEditMode, setIsZoneEditMode] = useState(false);

  // Filter alerts by watch zones (if any exist)
  const filteredAlerts = activeAlerts.filter(alert => {
    if (watchZones.length === 0) return true; // Show all if no zones map
    if (!alert.location) return true;

    // Check if it overlaps with any watch zone
    return watchZones.some(zone => {
       const distKm = haversineDistanceKm(zone.lat, zone.lng, alert.location!.lat, alert.location!.lng);
       return distKm <= (zone.radiusKm + (alert.radiusKm || 0));
    });
  });
  
  // Sort by severity
  const severityValue = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, INFO: 1 };
  const sortedAlerts = [...filteredAlerts].sort((a, b) => severityValue[b.severity] - severityValue[a.severity]);
  
  const criticalAlert = sortedAlerts.find(a => a.severity === 'CRITICAL');
  const hasAlerts = sortedAlerts.length > 0;

  return (
    <div className="display-grid">
      {/* Header Widget */}
      <header className="hd-header z-30 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center gap-4">
          <ShieldAlert className="text-[var(--text-dim)]" size={20} />
          <div className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--accent)]">
            Public Auth Broadcast Network
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-[11px] tracking-widest text-[var(--text-dim)] mr-4">
            BLR / HUB-01 / VARDAN-NET | {format(new Date(), 'HH:mm:ss')}
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`p-2 transition-colors border ${showSettings ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)] hover:text-white'}`}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col z-10 w-full overflow-hidden">
        {/* Background Map layer */}
        <div className="absolute inset-0 z-0">
          <AlertMap alerts={sortedAlerts} isZoneEditMode={isZoneEditMode && showSettings} />
          {/* Overlay to dim map to high-density dark mode */}
          <div className="absolute inset-0 bg-[var(--bg)]/80 pointer-events-none mix-blend-multiply" />
          {/* Grid overlay from high density theme */}
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        </div>

        {/* Traffic Telemetry Widget */}
        <div className="absolute top-8 right-8 z-20 pointer-events-auto">
          <div className="bg-[var(--surface)]/90 backdrop-blur border border-[var(--border)] py-3 px-4 flex flex-col gap-2 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
               <div className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-widest">Traffic Telemetry</div>
               <div className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse shadow-[0_0_8px_var(--success)]"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"></div><span className="text-[10px] text-[var(--text-dim)] font-mono">FLOW</span></div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]"></div><span className="text-[10px] text-[var(--text-dim)] font-mono">MODERATE</span></div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_5px_var(--accent)]"></div><span className="text-[10px] font-mono text-[var(--accent)] font-bold">SEVERE</span></div>
            </div>
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
          <AnimatePresence>
            {hasAlerts ? (
              <div className="grid grid-cols-12 gap-8 h-full items-end p-8">
                
                {/* Left Side: Secondary Alerts (if multiple) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 pointer-events-auto">
                    {sortedAlerts.filter(a => a.id !== criticalAlert?.id).slice(0, 2).map((alert) => (
                      <motion.div 
                        key={alert.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="hardware-widget bg-[var(--bg)]/90 backdrop-blur-md"
                        style={{ borderLeftWidth: '4px', borderLeftColor: alert.severity === 'HIGH' ? 'var(--warning)' : 'var(--info)' }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <AlertTriangle className={alert.severity === 'HIGH' ? 'text-[var(--warning)]' : 'text-[var(--info)]'} size={18} />
                          <span className="font-mono text-[10px] tracking-widest text-[var(--text-dim)] uppercase">ACTIVE ADVISORY</span>
                        </div>
                        <h3 className="font-sans font-bold uppercase text-[16px] mb-2">{alert.title}</h3>
                        <p className="font-sans text-[13px] text-[var(--text-dim)] leading-relaxed mb-4">{alert.description}</p>
                        
                        {alert.licensePlate && (
                          <div className="border border-[var(--border)] p-2 font-mono text-center tracking-widest text-[14px] mt-2 bg-[var(--surface)] text-[var(--text-main)]">
                            {alert.licensePlate}
                          </div>
                        )}
                      </motion.div>
                    ))}
                </div>

                {/* Right/Bottom Side: Critical Alert (Slam In) */}
                {criticalAlert && (
                  <div className="col-span-12 lg:col-span-8 flex justify-end pointer-events-auto">
                    <motion.div 
                      key={criticalAlert.id}
                      initial={{ scale: 1.5, y: 100, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.8 }}
                      className="bg-[var(--surface)] border border-[var(--border)] border-l-4 p-10 shadow-2xl relative overflow-hidden max-w-3xl"
                      style={{ borderLeftColor: 'var(--accent)' }}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm mix-blend-screen text-[var(--accent)]">
                        <Activity size={160} />
                      </div>
                      
                      <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="w-16 h-16 rounded flex items-center justify-center glow-red animate-pulse bg-[rgba(225,29,72,0.1)] border border-[var(--accent)]">
                          <AlertTriangle className="text-[var(--accent)]" size={32} />
                        </div>
                        <div>
                          <div className="font-mono text-[12px] font-bold tracking-[0.3em] text-[var(--accent)] mb-2">CRITICAL NOTIFICATION</div>
                          <div className="font-mono text-[10px] text-[var(--text-dim)]">AUTH_VAL: {criticalAlert.hospitalVerificationToken || '0x8821_VERIFY_REQ'}</div>
                        </div>
                      </div>

                      <h1 className="relative z-10 font-sans font-extrabold text-4xl tracking-tight uppercase mb-6 text-[var(--text-main)]">
                        {criticalAlert.title}
                      </h1>
                      
                      <div className="relative z-10 grid grid-cols-2 gap-8 mb-4 border-t border-[var(--border)] py-6 mt-4">
                         <div>
                            <div className="font-mono text-[10px] text-[var(--text-dim)] mb-2 tracking-widest uppercase">Directive / Instruction</div>
                            <p className="font-sans text-[15px] leading-relaxed text-[var(--text-main)] w-full">{criticalAlert.description}</p>
                            
                            {criticalAlert.trafficCongestionInfo && (
                               <div className="mt-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] font-mono text-[11px] uppercase tracking-wider">
                                  {criticalAlert.trafficCongestionInfo}
                               </div>
                            )}
                         </div>
                         <div className="flex flex-col gap-4">
                            {criticalAlert.licensePlate && (
                               <div>
                                  <div className="font-mono text-[10px] text-[var(--text-dim)] mb-2 tracking-widest uppercase">Target Vector (License Plate)</div>
                                  <div className="font-mono text-3xl font-bold text-center border border-[var(--accent)] py-4 px-4 bg-[rgba(225,29,72,0.05)] text-[var(--accent)] shadow-[inset_0_0_20px_rgba(225,29,72,0.1)]">
                                    {criticalAlert.licensePlate}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>

                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 h-full pointer-events-none">
                <div className="text-center opacity-30 text-[var(--text-dim)]">
                  <ShieldAlert size={64} className="mx-auto mb-4" />
                  <div className="font-mono tracking-[0.3em] uppercase text-xs font-bold">Systems Nominal — No Active Threats</div>
                  {watchZones.length > 0 && <div className="mt-2 text-[10px] font-mono opacity-60 uppercase">In your active watch zones</div>}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Settings Drawer Overlay */}
          <AnimatePresence>
            {showSettings && (
               <motion.div 
                 initial={{ x: '100%' }}
                 animate={{ x: 0 }}
                 exit={{ x: '100%' }}
                 transition={{ type: 'tween', duration: 0.3 }}
                 className="absolute left-0 top-0 bottom-0 w-80 bg-[var(--surface)] border-r border-[var(--border)] z-40 flex flex-col pointer-events-auto"
               >
                 <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                   <div className="font-mono text-xs tracking-widest uppercase font-bold text-[var(--text-main)]">Geo-Fencing Config</div>
                   <button onClick={() => setShowSettings(false)} className="text-[var(--text-dim)] hover:text-white"><X size={16}/></button>
                 </div>
                 
                 <div className="p-4 flex-1 overflow-y-auto">
                    <p className="font-sans text-xs text-[var(--text-dim)] mb-6">
                      Set custom watch zones. If zones are active, you will only receive alerts that overlap with these zones.
                    </p>

                    <button 
                      onClick={() => setIsZoneEditMode(!isZoneEditMode)}
                      className={`w-full py-3 px-4 font-mono text-[10px] font-bold tracking-widest uppercase border transition-colors flex items-center justify-center gap-2 mb-6
                        ${isZoneEditMode ? 'bg-[var(--success)] text-black border-[var(--success)]' : 'bg-transparent text-[var(--text-main)] border-[var(--border)] hover:bg-[var(--bg)]'}
                      `}
                    >
                      <Plus size={14} />
                      {isZoneEditMode ? 'Click Map To Add' : 'Add Watch Zone'}
                    </button>

                    <div className="space-y-3">
                      {watchZones.length === 0 ? (
                        <div className="text-center p-4 border border-[var(--border)] border-dashed text-[var(--text-dim)] font-mono text-[10px] uppercase">
                          No zones active. Receiving global alerts.
                        </div>
                      ) : watchZones.map(zone => (
                        <div key={zone.id} className="p-3 border border-[var(--border)] bg-[var(--bg)] flex justify-between items-center group">
                          <div>
                            <div className="font-mono text-xs text-[var(--text-main)]">{zone.name}</div>
                            <div className="font-mono text-[10px] text-[var(--text-dim)] mt-0.5">R: {zone.radiusKm}km</div>
                          </div>
                          <button 
                            onClick={() => removeWatchZone(zone.id)}
                            className="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Marquee */}
      {hasAlerts && (
        <div className="bg-[var(--accent)] text-white py-2 overflow-hidden z-20 border-t border-[var(--border)]">
          <div className="marquee-track space-x-12 whitespace-nowrap">
            {sortedAlerts.map(a => (
               <span key={a.id} className="font-mono text-[12px] tracking-widest font-bold uppercase">
                 /// AWARENESS UPDATE: {a.title} — {a.location?.name || 'AREA WIDE'} /// 
               </span>
            ))}
            {sortedAlerts.map(a => (
               <span key={a.id + '-dup'} className="font-mono text-[12px] tracking-widest font-bold uppercase">
                 /// AWARENESS UPDATE: {a.title} — {a.location?.name || 'AREA WIDE'} /// 
               </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

