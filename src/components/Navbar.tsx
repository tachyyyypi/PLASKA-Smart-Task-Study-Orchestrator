import React, { useState } from 'react';
import { Clock, User, Menu, X, ShieldCheck, Sparkles, Target, Layers, Calendar, Settings } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  userProfile: UserProfile;
  onOpenTimeSettings: () => void;
  onOpenAuthModal: () => void;
  backendStatus: {
    connected: boolean;
    mode: 'firebase' | 'local';
    message: string;
  } | null;
  geminiKeyPresent: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  onOpenTimeSettings,
  onOpenAuthModal,
  backendStatus,
  geminiKeyPresent,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & System Name */}
        <div className="flex items-center space-x-3">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Menu Navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-9 h-9 flex items-center justify-center bg-transparent">
            <img src={`${import.meta.env.BASE_URL}logo-task-planner.svg`} alt="Plaska Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">PLASKA</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            id="btn-time-settings"
            onClick={onOpenTimeSettings}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/70 rounded-xl transition-all"
            title="Atur Waktu & Rutinitas"
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Pengaturan Waktu</span>
          </button>
        </div>
      </div>

      {/* Mobile Hamburger Dropdown Menu with Clean Direct Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-950/95 border-b border-slate-800 backdrop-blur-xl p-4 shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-200 z-50">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
            Navigasi Seksi Dashboard
          </div>

          <button
            onClick={() => scrollToSection('card-focus-task')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 text-left"
          >
            <Target className="w-4 h-4 text-teal-400" />
            <span>Focus Task (Prioritas Utama)</span>
          </button>

          <button
            onClick={() => scrollToSection('card-today-summary')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 text-left"
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Hari Ini & Risk Overview</span>
          </button>

          <button
            onClick={() => scrollToSection('card-active-tasks')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 text-left"
          >
            <Layers className="w-4 h-4 text-teal-400" />
            <span>Daftar Tugas Aktif & Subtugas</span>
          </button>

          <button
            onClick={() => scrollToSection('card-timeline')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 text-left"
          >
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Timeline Alokasi 24 Jam</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenTimeSettings();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 text-left"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Pengaturan Waktu & Rutinitas</span>
          </button>


        </div>
      )}
    </header>
  );
};
