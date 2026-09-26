import React, { useState } from 'react';
import { Clock, Moon, GraduationCap, Coffee, X, Save, Zap, Plus, Trash2, Calendar, CheckSquare, Square, Shield } from 'lucide-react';
import { UserProfile, RoutineActivity } from '../types';

interface TimeSettingsModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSaveProfile: (updatedProfile: Partial<UserProfile>) => void;
}

const DAY_LABELS = [
  { day: 1, label: 'Sen' },
  { day: 2, label: 'Sel' },
  { day: 3, label: 'Rab' },
  { day: 4, label: 'Kam' },
  { day: 5, label: 'Jum' },
  { day: 6, label: 'Sab' },
  { day: 0, label: 'Min' },
];

export const TimeSettingsModal: React.FC<TimeSettingsModalProps> = ({
  isOpen,
  userProfile,
  onClose,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [sleepStart, setSleepStart] = useState(userProfile.sleep_schedule.sleep_start || '22:00');
  const [sleepEnd, setSleepEnd] = useState(userProfile.sleep_schedule.sleep_end || '05:30');
  const [schoolStart, setSchoolStart] = useState(userProfile.school_schedule.school_start || '07:00');
  const [schoolEnd, setSchoolEnd] = useState(userProfile.school_schedule.school_end || '15:00');
  const [activeDays, setActiveDays] = useState<number[]>(userProfile.school_schedule?.active_days || [1, 2, 3, 4, 5]);

  const [breakMin, setBreakMin] = useState(userProfile.preferences?.break_min || 15);
  const [maxSessionMin, setMaxSessionMin] = useState(userProfile.preferences?.max_session_min || 90);
  const [personalFactor, setPersonalFactor] = useState(userProfile.personal_factor || 1.0);

  // Custom Routines List
  const [routines, setRoutines] = useState<RoutineActivity[]>(userProfile.routine_activities || []);

  // Form for new routine
  const [showAddRoutine, setShowAddRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineStart, setNewRoutineStart] = useState('16:00');
  const [newRoutineEnd, setNewRoutineEnd] = useState('17:30');
  const [newRoutineDays, setNewRoutineDays] = useState<number[]>([1, 3, 5]); // Sen, Rab, Jum
  const [newRoutineConstraint, setNewRoutineConstraint] = useState<'HARD' | 'FLEXIBLE'>('HARD');

  const toggleSchoolDay = (day: number) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const toggleNewRoutineDay = (day: number) => {
    setNewRoutineDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleAddRoutine = () => {
    if (!newRoutineName.trim()) return;
    const newRoutine: RoutineActivity = {
      id: 'routine_' + Date.now(),
      name: newRoutineName.trim(),
      start_time: newRoutineStart,
      end_time: newRoutineEnd,
      days: newRoutineDays.length > 0 ? newRoutineDays : [1, 2, 3, 4, 5],
      constraint_type: newRoutineConstraint,
    };
    setRoutines([...routines, newRoutine]);
    setNewRoutineName('');
    setShowAddRoutine(false);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(routines.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      sleep_schedule: {
        sleep_start: sleepStart,
        sleep_end: sleepEnd,
      },
      school_schedule: {
        school_start: schoolStart,
        school_end: schoolEnd,
        active_days: activeDays,
      },
      routine_activities: routines,
      preferences: {
        break_min: Number(breakMin),
        max_session_min: Number(maxSessionMin),
      },
      personal_factor: Number(personalFactor),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden my-6 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pengaturan Waktu & Rutinitas Siswa
            </h3>
            <p className="text-xs text-slate-400">
              Menentukan batas ketersediaan waktu untuk alokasi cerdas timeline Plaska
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
          {/* Jam Tidur */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 mb-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Jam Tidur (Hard Constraint Malam)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Mulai Tidur:</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </label>
                <input
                  type="time"
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full cursor-pointer text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Bangun Pagi:</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </label>
                <input
                  type="time"
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full cursor-pointer text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Jam Sekolah & Hari Aktif */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 mb-2">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <span>Jam Sekolah & KBM</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Masuk Kelas:</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </label>
                <input
                  type="time"
                  value={schoolStart}
                  onChange={(e) => setSchoolStart(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full cursor-pointer text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Pulang Sekolah:</span>
                  <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                </label>
                <input
                  type="time"
                  value={schoolEnd}
                  onChange={(e) => setSchoolEnd(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full cursor-pointer text-xs font-medium bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1.5">Hari Aktif Masuk Sekolah:</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DAY_LABELS.map(({ day, label }) => {
                  const isActive = activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleSchoolDay(day)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rutinitas Berulang (Bimbel, Les, Ekskul, dll) */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Rutinitas Berulang (Bimbel, Les, Ekskul, Ibadah)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoutine(!showAddRoutine)}
                className="flex items-center space-x-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/30"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah Rutinitas</span>
              </button>
            </div>

            {/* List Existing Routines */}
            {routines.length === 0 && !showAddRoutine ? (
              <div className="text-[11px] text-slate-500 italic py-1">
                Belum ada rutinitas berulang. Tambahkan jika Anda memiliki jadwal bimbel/les rutin.
              </div>
            ) : (
              <div className="space-y-2">
                {routines.map((routine) => {
                  const daysStr = routine.days
                    ? routine.days
                        .map((d) => DAY_LABELS.find((l) => l.day === d)?.label)
                        .filter(Boolean)
                        .join(', ')
                    : 'Semua Hari';

                  return (
                    <div
                      key={routine.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200 flex items-center space-x-2">
                          <span>{routine.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              routine.constraint_type === 'HARD'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {routine.constraint_type === 'HARD' ? 'Pasti / Wajib' : 'Fleksibel'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {routine.start_time} - {routine.end_time} • {daysStr}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="p-1 hover:bg-rose-500/20 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Hapus Rutinitas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Routine Sub-Form */}
            {showAddRoutine && (
              <div className="p-3 bg-slate-900 border border-teal-500/30 rounded-xl space-y-2.5 mt-2">
                <div className="text-xs font-bold text-teal-300">Form Tambah Rutinitas Baru</div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Nama Kegiatan Rutin:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bimbel Matematika / Les Bahasa"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Jam Mulai:</label>
                    <input
                      type="time"
                      value={newRoutineStart}
                      onChange={(e) => setNewRoutineStart(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className="w-full cursor-pointer text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Jam Selesai:</label>
                    <input
                      type="time"
                      value={newRoutineEnd}
                      onChange={(e) => setNewRoutineEnd(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className="w-full cursor-pointer text-xs bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Hari Berulang:</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {DAY_LABELS.map(({ day, label }) => {
                      const isSel = newRoutineDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleNewRoutineDay(day)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                            isSel
                              ? 'bg-teal-500/25 text-teal-300 border-teal-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Sifat Rutinitas:</label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setNewRoutineConstraint('HARD')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-lg border ${
                        newRoutineConstraint === 'HARD'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Pasti / Wajib (Hard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRoutineConstraint('FLEXIBLE')}
                      className={`flex-1 py-1 text-xs font-semibold rounded-lg border ${
                        newRoutineConstraint === 'FLEXIBLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Fleksibel (Bisa Digeser)
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddRoutine(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRoutine}
                    className="px-3 py-1 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-teal-400"
                  >
                    Simpan Rutinitas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preferensi Belajar & Jeda */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 mb-2">
              <Coffee className="w-4 h-4 text-emerald-400" />
              <span>Jeda Istirahat & Sesi Belajar</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Jeda Istirahat (menit):</label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={breakMin}
                  onChange={(e) => setBreakMin(Number(e.target.value))}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Maks Sesi Belajar (menit):</label>
                <input
                  type="number"
                  min="30"
                  max="180"
                  value={maxSessionMin}
                  onChange={(e) => setMaxSessionMin(Number(e.target.value))}
                  className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Personal Factor Adjustment */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Personal Factor (PF) Baseline</span>
              </div>
              <span className="text-teal-400 font-extrabold">{Number(personalFactor).toFixed(2)}x</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2">
              Mengalikan estimasi AI dengan rasio kecepatan belajar pribadi Anda.
            </p>
            <input
              type="range"
              min="0.75"
              max="2.0"
              step="0.05"
              value={personalFactor}
              onChange={(e) => setPersonalFactor(parseFloat(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.75x (Cepat)</span>
              <span>1.0x (Baseline)</span>
              <span>2.0x (Sangat Cermat)</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-save-time-settings"
              type="submit"
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-md shadow-teal-500/20 flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
