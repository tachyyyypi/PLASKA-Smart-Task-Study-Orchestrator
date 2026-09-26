import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, X, Clock, Zap, ArrowRight, Minimize2, Maximize2 } from 'lucide-react';
import { Task, Subtask, UserProfile } from '../types';

interface InteractiveTimerModalProps {
  isOpen: boolean;
  task: Task | null;
  subtask: Subtask | null;
  userProfile?: UserProfile;
  onClose: () => void;
  onCompleteSubtask: (taskId: string, subtaskId: string, actualMinutes: number) => void;
}

export const InteractiveTimerModal: React.FC<InteractiveTimerModalProps> = ({
  isOpen,
  task,
  subtask,
  userProfile,
  onClose,
  onCompleteSubtask,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [manualMinutes, setManualMinutes] = useState<number>(
    subtask?.personalized_minutes || subtask?.estimated_minutes || 30
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const timerRef = useRef<any>(null);
  const activeSubtaskIdRef = useRef<string | null>(null);

  // Reset timer state whenever a new or different subtask is selected / modal opens
  useEffect(() => {
    if (isOpen && subtask?.id) {
      if (activeSubtaskIdRef.current !== subtask.id) {
        // Stop any running interval from previous subtask
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // Always reset timer to 0 (0:00) for new subtask
        setSecondsElapsed(0);
        setIsActive(true);
        setManualMinutes(subtask.personalized_minutes || subtask.estimated_minutes || 30);
        setIsMinimized(false);
        activeSubtaskIdRef.current = subtask.id;
      }
    } else if (!isOpen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      activeSubtaskIdRef.current = null;
    }
  }, [isOpen, subtask?.id, subtask?.personalized_minutes, subtask?.estimated_minutes]);

  useEffect(() => {
    if (isOpen && isActive) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isActive]);

  if (!isOpen || !task || !subtask) return null;

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsElapsed(0);
  };

  const handleFinishTimer = (minutesSpent: number) => {
    const finalMinutes = Math.max(1, Math.round(minutesSpent));
    onCompleteSubtask(task.id, subtask.id, finalMinutes);
    onClose();
  };

  const minutesFromStopwatch = Math.ceil(secondsElapsed / 60);

  const baseAi = subtask.estimated_minutes || 30;
  const currentTotalAi = userProfile?.total_ai_estimated_minutes ?? 300;
  const currentTotalActual = userProfile?.total_actual_minutes ?? 300;

  const projectedTotalAi = currentTotalAi + baseAi;
  const projectedTotalActual = currentTotalActual + (minutesFromStopwatch > 0 ? minutesFromStopwatch : manualMinutes);
  const projectedPF = projectedTotalAi > 0 ? (projectedTotalActual / projectedTotalAi).toFixed(2) : '1.00';

  const formatStopwatch = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If minimized, render Floating Mini Widget at bottom-right corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in slide-in-from-bottom-5 duration-200">
        <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-mono font-bold text-sm shrink-0">
          {formatStopwatch(secondsElapsed)}
        </div>
        <div className="min-w-0 max-w-[180px]">
          <div className="text-[10px] font-bold text-teal-400 uppercase truncate">{task.subject}</div>
          <div className="text-xs font-bold text-white truncate">{subtask.name}</div>
        </div>
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={toggleTimer}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title={isActive ? 'Jeda' : 'Lanjutkan'}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleFinishTimer(minutesFromStopwatch > 0 ? minutesFromStopwatch : 1)}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            title="Selesai"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Perbesar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Minimalkan ke Floating Widget"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="mb-4 pr-12">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">
            {task.subject} • Sesi Pengerjaan Subtugas
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {subtask.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{task.task_name}</p>
        </div>

        {/* Stopwatch Display */}
        <div className="my-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden shadow-inner">
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white mb-2">
            {formatStopwatch(secondsElapsed)}
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Estimasi Awal: ~{subtask.personalized_minutes || subtask.estimated_minutes} Menit</span>
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center justify-center space-x-3 mt-5">
            <button
              id="btn-toggle-timer-session"
              onClick={toggleTimer}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95 ${
                isActive
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Lanjutkan</span>
                </>
              )}
            </button>

            <button
              onClick={resetTimer}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-complete-subtask-timer"
              onClick={() => handleFinishTimer(minutesFromStopwatch > 0 ? minutesFromStopwatch : 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Selesai Kerjakan</span>
            </button>
          </div>
        </div>

        {/* Offline / Manual Minutes Logging Option */}
        <div className="pt-3 border-t border-slate-800">
          <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Sudah mengerjakan offline tanpa stopwatch?</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="600"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(Number(e.target.value))}
              className="w-24 text-xs bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-center focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-400">menit</span>
            <button
              onClick={() => handleFinishTimer(manualMinutes)}
              className="flex-1 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <span>Simpan Catatan Waktu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Personal Factor Calibration Preview */}
        <div className="mt-4 p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kalibrasi Personal Factor:</span>
          </div>
          <div className="font-bold text-slate-200">
            {(userProfile?.personal_factor ?? 1.0).toFixed(2)}x → <span className="text-emerald-400 font-extrabold">{projectedPF}x</span>
          </div>
        </div>
      </div>
    </div>
  );
};
