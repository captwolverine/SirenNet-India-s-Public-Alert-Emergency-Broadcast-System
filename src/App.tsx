/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';
import Dashboard from './pages/Dashboard';
import Receiver from './pages/Receiver';

function NavigationHelper() {
  const location = useLocation();
  const isDash = location.pathname === '/dashboard';
  
  return (
    <div className="fixed top-2 right-2 z-50 bg-black/80 backdrop-blur text-white text-xs font-mono p-2 rounded flex gap-4 border border-white/20 hover:opacity-100 opacity-20 transition-opacity">
      <span className="opacity-50 uppercase tracking-widest">Dev Menu</span>
      <Link to="/" className={!isDash ? 'text-[var(--accent-red)]' : 'hover:text-[var(--accent-red)]'}>DISPLAY VIEW</Link>
      <Link to="/dashboard" className={isDash ? 'text-[var(--accent-red)]' : 'hover:text-[var(--accent-red)]'}>DASHBOARD VIEW</Link>
    </div>
  );
}

export default function App() {
  return (
    <AlertProvider>
      <Router>
        <NavigationHelper />
        <Routes>
          <Route path="/" element={<Receiver />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AlertProvider>
  );
}

