import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Filter,
  Trash2,
  CheckCircle2,
  Circle,
  Timer,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Layers,
  Clock,
  Calendar,
  Maximize2,
  Wrench,
} from 'lucide-react';
import { Task, Subtask, RiskLevel, FilterState, ScheduleBlock } from '../types';

interface CardActiveTasksProps {
  tasks: Task[];
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onOpenAddTaskModal: () => void;
  onRequestDeleteTask: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, currentStatus: boolean) => void;
  onStartInteractiveTimer: (task: Task, subtask: Subtask) => void;
  onExpand?: () => void;
  scheduledBlocks?: ScheduleBlock[];
}

export const CardActiveTasks: React.FC<CardActiveTasksProps> = ({
  tasks,
  filterState,
  onFilterChange,
  onOpenAddTaskModal,
  onRequestDeleteTask,
  onToggleSubtask,
  onStartInteractiveTimer,
  onExpand,
  scheduledBlocks = [],
}) => {
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({
    [tasks[0]?.id || '']: true,
  });

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilterPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const allSubjects = Array.from(new Set(tasks.map((t) => t.subject))).filter(Boolean);

  const filteredTasks = tasks.filter((task) => {
    if (filterState.subject !== 'ALL' && task.subject !== filterState.subject) {
      return false;
    }
    if (filterState.risk !== 'ALL' && task.risk_status !== filterState.risk) {
      return false;
    }
    if (filterState.search.trim()) {
      const q = filterState.search.toLowerCase();
      const matchName = task.task_name.toLowerCase().includes(q);
      const matchSubject = task.subject.toLowerCase().includes(q);
      if (!matchName && !matchSubject) return false;
    }
    return true;
  });

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'SAFE':
        return { label: 'Safe', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'AT_RISK':
        return { label: 'At Risk', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'CRITICAL':
        return { label: 'Critical', color: 'text-rose-400 bg-rose-500/15 border-rose-500/40' };
      case 'IMPOSSIBLE':
        return { label: 'Overdue', color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const getSubtaskDayLabel = (allocationDate: string) => {
    if (!allocationDate) return '';
    const parts = allocationDate.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const dateObj = new Date(year, month - 1, day);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
      }
    }
    const d = new Date(allocationDate + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    }
    return allocationDate;
  };

  const formatSubtaskTimestamp = (sub: Subtask) => {
    const dateStr = sub.allocation_date || sub.scheduled_date || new Date().toISOString().split('T')[0];
    const startTime = sub.scheduled_start || '16:00';
    const endTime = sub.scheduled_end || '17:30';

    const [year, month, day] = dateStr.split('-').map(Number);
    const d = !isNaN(year) && !isNaN(month) && !isNaN(day) ? new Date(year, month - 1, day) : new Date(dateStr + 'T00:00:00');
    const formattedDate = !isNaN(d.getTime())
      ? d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      : dateStr;

    return `${formattedDate} | ${startTime} - ${endTime}`;
  };

  const hasActiveFilters =
    filterState.subject !== 'ALL' || filterState.risk !== 'ALL' || !!filterState.search.trim();

  return (
    <div id="card-active-tasks" className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 flex flex-col h-full shadow-xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 relative">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-white">
            Daftar Tugas Aktif <span className="text-teal-400">({filteredTasks.length})</span>
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Perbesar / Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          {/* Filter Popover Button */}
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              title="Filter"
              className={`flex items-center justify-center p-2 text-xs font-semibold rounded-xl border transition-all ${
                hasActiveFilters
                  ? 'bg-teal-600 text-slate-950 border-teal-500 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse ml-1" />}
            </button>

            {/* Popover */}
            {showFilterPopover && (
              <div
                ref={popoverRef}
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50"
              >
                <div className="text-xs font-bold text-slate-300 uppercase mb-2">Filter Mata Pelajaran</div>
                <select
                  value={filterState.subject}
                  onChange={(e) => onFilterChange({ ...filterState, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mb-3"
                >
                  <option value="ALL">Semua Mata Pelajaran</option>
                  {allSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>

                <div className="text-xs font-bold text-slate-300 uppercase mb-2">Filter Risiko</div>
                <select
                  value={filterState.risk}
                  onChange={(e) => onFilterChange({ ...filterState, risk: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ALL">Semua Tingkat Risiko</option>
                  <option value="SAFE">Safe (Aman)</option>
                  <option value="AT_RISK">At Risk (Waspada)</option>
                  <option value="CRITICAL">Critical (Kritis)</option>
                  <option value="IMPOSSIBLE">Overdue / Terlewat</option>
                </select>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAddTaskModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#e58b73] hover:bg-[#d87b63] text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-[#e58b73]/25 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Tugas</span>
          </button>
        </div>
      </div>

      {/* Task List Container */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-slate-800/80">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Belum ada tugas aktif</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Tambahkan tugas sekolah untuk memulai orkestrasi AI Plaska</p>
            <button
              onClick={onOpenAddTaskModal}
              className="px-4 py-2 bg-[#e58b73] hover:bg-[#d87b63] text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-[#e58b73]/25 transition-all active:scale-95"
            >
              + Tambah Tugas Sekarang
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const riskInfo = getRiskBadge(task.risk_status);
            const totalSubs = task.subtasks.length;
            const completedSubs = task.subtasks.filter((s) => s.is_completed).length;
            const progress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;
            const isExpanded = expandedTasks[task.id] ?? false;

            const totalEstimatedMinutes = task.subtasks.reduce(
              (acc, s) => acc + (s.personalized_minutes || s.estimated_minutes || 30),
              0
            );

            const nextSub = task.subtasks.find((s) => !s.is_completed);

            const formatTotalDuration = (mins: number) => {
              const h = Math.floor(mins / 60);
              const m = mins % 60;
              if (h > 0 && m > 0) return `${h}j ${m}m (${mins}m)`;
              if (h > 0) return `${h} jam (${mins}m)`;
              return `${mins} menit`;
            };

            return (
              <div
                key={task.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {task.subject}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskInfo.color}`}>
                        {riskInfo.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/25">
                        ⏱️ Total: {formatTotalDuration(totalEstimatedMinutes)}
                      </span>
                      {task.status === 'COMPLETED' && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Selesai
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => toggleTaskExpansion(task.id)}
                      className="text-sm font-bold text-white hover:text-teal-300 cursor-pointer transition-colors truncate"
                    >
                      {task.task_name}
                    </h4>

                    {/* Essential summary row */}
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 flex-wrap gap-y-1">
                      <span>Progress: <strong className="text-white">{completedSubs}/{totalSubs}</strong> ({progress}%)</span>
                      <span>•</span>
                      <span>Deadline: {new Date(task.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="text-teal-300 font-medium">Est: {totalEstimatedMinutes}m</span>
                    </div>

                    {nextSub && (
                      <div className="text-xs text-teal-300 font-medium mt-1.5 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mr-1.5" />
                        Next: {nextSub.name} ({nextSub.personalized_minutes || nextSub.estimated_minutes || 30}m)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => toggleTaskExpansion(task.id)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={isExpanded ? 'Tutup Detail' : 'Lihat Subtugas'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onRequestDeleteTask(task)}
                      className="p-1.5 hover:bg-rose-500/20 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                      title="Hapus Tugas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Subtasks */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
                    {/* Alat & Bahan Required */}
                    {task.tools_and_materials && task.tools_and_materials.length > 0 && (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                        <div className="text-[10px] font-bold text-teal-400 uppercase flex items-center mb-1">
                          <Wrench className="w-3 h-3 mr-1" />
                          Alat & Bahan yang Dibutuhkan:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {task.tools_and_materials.map((tool, idx) => (
                            <span key={idx} className="text-[11px] bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Dekomposisi Subtugas AI ({task.subtasks.length} langkah)</span>
                      <span className="text-teal-400">Total: {totalEstimatedMinutes} Menit</span>
                    </div>

                    {task.subtasks.map((sub, sIdx) => {
                      const subMinutes = sub.personalized_minutes || sub.estimated_minutes || 30;
                      const timestampFullText = formatSubtaskTimestamp(sub);

                      return (
                        <div
                          key={sub.id || sIdx}
                          className="flex items-start justify-between bg-slate-900/90 rounded-lg p-2.5 text-xs border border-slate-800 gap-3 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                            <button
                              onClick={() => onToggleSubtask(task.id, sub.id, sub.is_completed)}
                              className="text-teal-400 hover:text-teal-300 transition-colors shrink-0 mt-0.5"
                            >
                              {sub.is_completed ? (
                                <CheckCircle2 className="w-4 h-4 text-teal-400 fill-teal-500/20" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className={`font-medium ${sub.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {sub.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  {subMinutes}m
                                </span>
                              </div>
                              <div className="text-[11px] text-teal-300 font-mono mt-1 flex items-center space-x-1">
                                <Clock className="w-3 h-3 mr-0.5 shrink-0" />
                                <span>[{timestampFullText}]</span>
                              </div>
                              {sub.description && (
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${sub.is_completed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 pt-0.5">
                            {!sub.is_completed && (
                              <button
                                onClick={() => onStartInteractiveTimer(task, sub)}
                                className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold rounded border border-teal-500/30 transition-colors"
                                title="Mulai Timer Subtugas"
                              >
                                Kerjakan
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
