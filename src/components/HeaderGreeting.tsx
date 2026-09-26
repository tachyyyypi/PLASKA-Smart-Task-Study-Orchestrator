import React from 'react';
import { UserProfile } from '../types';
import { Zap, BookOpen, Plus, Award } from 'lucide-react';

interface HeaderGreetingProps {
  userProfile: UserProfile;
  totalTasks: number;
  criticalTasks: number;
  onOpenAddTaskModal: () => void;
}

export const HeaderGreeting: React.FC<HeaderGreetingProps> = ({
  userProfile,
  totalTasks,
  criticalTasks,
  onOpenAddTaskModal,
}) => {
  const firstName = userProfile.name ? userProfile.name.split(' ')[0] : 'Siswa';
  const pf = userProfile.personal_factor || 1.0;

  return (
    <div className="mb-6 pt-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Halo, <span className="text-teal-400">{firstName}</span>!
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Atur dan selesaikan tugas secara terstruktur.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Personal Factor badge */}
          <div className="flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Personal Factor</div>
              <div className="text-sm font-bold text-white">{pf.toFixed(2)}x buffer</div>
            </div>
          </div>

          <button
            onClick={onOpenAddTaskModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#e58b73] hover:bg-[#d87b63] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-[#e58b73]/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tugas Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
