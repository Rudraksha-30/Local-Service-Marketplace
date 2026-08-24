import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, Home, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Health check failed');
      })
      .then((data) => {
        if (data.status === 'ok') setHealthStatus('online');
        else setHealthStatus('degraded');
      })
      .catch(() => {
        setHealthStatus('offline');
      });
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-teal-700 to-slate-800 dark:from-white dark:via-teal-400 dark:to-slate-200 bg-clip-text text-transparent">
              TrustHome
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              Scaffold
            </span>
          </div>
        </Link>

        {/* Right Action Items */}
        <div className="flex items-center gap-3">

          {/* API Health Status Pill */}
          <div 
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            title="Backend API Connectivity"
          >
            <span className={`w-2 h-2 rounded-full ${
              healthStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
              healthStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-500'
            }`} />
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>API: <strong className="capitalize">{healthStatus}</strong></span>
          </div>

          {/* Navigation link back to home if on a dashboard page */}
          {!isHomePage && (
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Toggle Light/Dark Theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
