import React, { useState, useEffect } from 'react';
import { Home, Users, Camera, Clock, Smartphone, Monitor, ShieldCheck, Wifi, Battery } from 'lucide-react';

interface DeviceFrameProps {
  currentTab: 'home' | 'scan' | 'contacts' | 'history' | 'specs';
  onTabChange: (tab: 'home' | 'scan' | 'contacts' | 'history' | 'specs') => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const [deviceModel, setDeviceModel] = useState<'iphone' | 'pixel' | 'fullscreen'>('iphone');
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 select-none font-sans">
      {/* Top Controls Toolbar: Device Selector */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-3 px-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold text-white tracking-tight">CardScan AI Mobile</span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Cross-Platform Engine
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setDeviceModel('iphone')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              deviceModel === 'iphone'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">iPhone 16 Pro</span>
          </button>
          <button
            onClick={() => setDeviceModel('pixel')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              deviceModel === 'pixel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Pixel 9</span>
          </button>
          <button
            onClick={() => setDeviceModel('fullscreen')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              deviceModel === 'fullscreen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Main Container / Mobile Frame */}
      <div
        className={`relative flex flex-col overflow-hidden transition-all duration-300 ${
          deviceModel === 'fullscreen'
            ? 'w-full max-w-4xl h-[90vh] rounded-2xl border border-slate-800 bg-white shadow-2xl'
            : deviceModel === 'iphone'
            ? 'w-full max-w-[400px] h-[844px] max-h-[92vh] rounded-[48px] border-[10px] border-slate-800 bg-white shadow-2xl shadow-blue-500/10 ring-1 ring-slate-700/50'
            : 'w-full max-w-[400px] h-[844px] max-h-[92vh] rounded-[36px] border-[10px] border-slate-800 bg-white shadow-2xl shadow-indigo-500/10 ring-1 ring-slate-700/50'
        }`}
      >
        {/* Device Status Bar */}
        <div className="relative z-30 px-6 py-2 bg-white text-slate-900 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold shrink-0 select-none">
          <span>{time || '09:41'}</span>

          {/* Dynamic Island / Camera punch-hole */}
          {deviceModel === 'iphone' && (
            <div className="w-24 h-4 rounded-full bg-slate-950 mx-auto -mt-1" />
          )}
          {deviceModel === 'pixel' && (
            <div className="w-3.5 h-3.5 rounded-full bg-slate-950 mx-auto" />
          )}

          <div className="flex items-center gap-1.5 text-slate-700">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Screen Viewport Content */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-50">
          {children}
        </div>

        {/* Bottom Mobile Tab Bar (Navigation) */}
        <nav aria-label="Mobile navigation" className="relative z-30 px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 shadow-lg">
          {/* Home Tab */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              currentTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          {/* Contacts Directory Tab */}
          <button
            onClick={() => onTabChange('contacts')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              currentTab === 'contacts' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Contacts</span>
          </button>

          {/* Center Prominent Scan Action Button */}
          <button
            onClick={() => onTabChange('scan')}
            className="flex flex-col items-center -mt-5 transition-transform active:scale-95"
            title="Scan Card"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-white">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-blue-600 mt-0.5">Scan</span>
          </button>

          {/* Scan History Tab */}
          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              currentTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>History</span>
          </button>

          {/* Specs / Architecture Tab */}
          <button
            onClick={() => onTabChange('specs')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
              currentTab === 'specs' ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Specs</span>
          </button>
        </nav>

        {/* Home Bar indicator for iOS */}
        {deviceModel === 'iphone' && (
          <div className="w-32 h-1 bg-slate-300 rounded-full mx-auto my-1 shrink-0" />
        )}
      </div>
    </div>
  );
};
