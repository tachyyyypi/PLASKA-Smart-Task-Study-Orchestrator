import React, { useState, useEffect, useRef } from 'react';
import { ScheduleBlock, Task, OneTimeEvent } from '../types';
import {
  Calendar,
  Clock,
  LayoutList,
  Columns,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  Moon,
  Sun,
  Maximize2,
  AlertCircle,
  Plus,
  Trash2,
  X,
  Check,
  CalendarCheck,
} from 'lucide-react';
import { formatDateIndonesian, getISODateOnly, parseTimeToMinutes } from '../utils/scheduler';

interface CardTimelineProps {
  scheduledBlocks: ScheduleBlock[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  tasks?: Task[];
  onToggleSubtask?: (taskId: string, subtaskId: string, currentStatus: boolean) => void;
  onExpand?: () => void;
  onAddOneTimeEvent?: (event: OneTimeEvent) => void;
  onDeleteOneTimeEvent?: (id: string) => void;
  onRescheduleTasks?: () => void;
}

export const CardTimeline: React.FC<CardTimelineProps> = ({
  scheduledBlocks,
  selectedDate,
  onDateChange,
  tasks = [],
  onToggleSubtask,
  onExpand,
  onAddOneTimeEvent,
  onDeleteOneTimeEvent,
  onRescheduleTasks,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalMinutes = 1440;

  // View mode preference stored in localStorage
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>(() => {
    return (localStorage.getItem('plaska_timeline_view') as 'horizontal' | 'vertical') || 'horizontal';
  });

  useEffect(() => {
    localStorage.setItem('plaska_timeline_view', viewMode);
  }, [viewMode]);

  // Modal Jadwal Dadakan state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(getISODateOnly(selectedDate));
  const [eventStart, setEventStart] = useState('18:30');
  const [eventEnd, setEventEnd] = useState('20:00');
  const [eventConstraint, setEventConstraint] = useState<'HARD' | 'FLEXIBLE'>('HARD');

  useEffect(() => {
    setEventDate(getISODateOnly(selectedDate));
  }, [selectedDate]);

  const todayIso = getISODateOnly(new Date());
  const selectedIso = getISODateOnly(selectedDate);
  const isToday = selectedIso === todayIso;

  // Pure Filter View & SSOT for timeline blocks
  const busyBlocks = scheduledBlocks.filter((b) => b.type !== 'TASK' && b.date === selectedIso);
  const taskBlocks: ScheduleBlock[] = [];
  tasks.forEach((task) => {
    task.subtasks.forEach((sub, subIdx) => {
      const allocDate = sub.allocation_date || sub.scheduled_date;
      if (allocDate === selectedIso) {
        const startStr = sub.scheduled_start || '16:00';
        const endStr = sub.scheduled_end || '17:30';
        const startMin = parseTimeToMinutes(startStr);
        const endMin = parseTimeToMinutes(endStr);
        const duration = endMin > startMin ? endMin - startMin : 30;

        taskBlocks.push({
          id: `timeline-block-${task.id}-${sub.id}-${subIdx}-${allocDate}`,
          taskId: task.id,
          taskName: task.task_name,
          subtaskId: sub.id,
          subtaskName: sub.name,
          subject: task.subject,
          date: selectedIso,
          startMinute: startMin,
          endMinute: endMin,
          startTimeFormatted: startStr,
          endTimeFormatted: endStr,
          durationMinutes: duration,
          isCompleted: sub.is_completed,
          type: 'TASK',
          riskStatus: task.risk_status,
        });
      }
    });
  });

  const activeBlocksForDate = [...busyBlocks, ...taskBlocks];

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const currentTopPercentage = (currentTimeMinutes / 1440) * 100;

  // Hover Tooltip state & coordinates
  const [hoveredBlock, setHoveredBlock] = useState<ScheduleBlock | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{ left: number; top: number; isBelow: boolean }>({
    left: 0,
    top: 0,
    isBelow: false,
  });

  // Reschedule Banner Dismiss state
  const [dismissRescheduleBanner, setDismissRescheduleBanner] = useState(false);
  const [isReschedulingLocal, setIsReschedulingLocal] = useState(false);

  // Helper function
  const getSubtaskAndTask = (block: ScheduleBlock) => {
    if (!tasks || block.type !== 'TASK') return { sub: null, task: null, isCompleted: false };
    const task = tasks.find((t) => t.id === block.taskId);
    if (!task) return { sub: null, task: null, isCompleted: false };
    const sub = task.subtasks.find((s) => s.id === block.subtaskId);
    return { sub: sub || null, task, isCompleted: sub ? sub.is_completed : false };
  };

  // Local reschedule evaluation
  const nowMinute = new Date().getHours() * 60 + new Date().getMinutes();
  const overdueCount = activeBlocksForDate.filter((b) => {
    const info = getSubtaskAndTask(b);
    return b.type === 'TASK' && b.endMinute < nowMinute && !info.isCompleted;
  }).length;

  const earlyCount = activeBlocksForDate.filter((b) => {
    const info = getSubtaskAndTask(b);
    return b.type === 'TASK' && b.startMinute > nowMinute && info.isCompleted;
  }).length;

  // Active banner condition when tasks are overdue or completed early
  const showBanner = !dismissRescheduleBanner && (overdueCount >= 1 || earlyCount >= 1);
  const bannerReason =
    'Jadwal kamu tampaknya butuh penyesuaian nih (ada tugas yang bertabrakan atau terlewat). Klik untuk merapikan alokasi waktu secara otomatis.';

  const handleRescheduleAction = () => {
    setIsReschedulingLocal(true);
    if (onRescheduleTasks) {
      onRescheduleTasks();
    }
    setTimeout(() => {
      setIsReschedulingLocal(false);
      setDismissRescheduleBanner(true);
    }, 800);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !onAddOneTimeEvent) return;

    const newEvent: OneTimeEvent = {
      id: 'event_' + Date.now(),
      name: eventName.trim(),
      date: eventDate || getISODateOnly(selectedDate),
      start_time: eventStart,
      end_time: eventEnd,
      constraint_type: eventConstraint,
    };

    onAddOneTimeEvent(newEvent);
    setEventName('');
    setIsEventModalOpen(false);
  };

  const handleMouseEnterBlock = (block: ScheduleBlock, e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rect = e.currentTarget.getBoundingClientRect();

    const relativeLeft = rect.left - containerRect.left + rect.width / 2;
    const relativeTop = rect.top - containerRect.top;

    const clampedX = Math.max(140, Math.min(containerRect.width - 140, relativeLeft));
    const isNearTop = relativeTop < 140;

    setTooltipStyle({
      left: clampedX,
      top: isNearTop ? relativeTop + rect.height + 8 : relativeTop - 12,
      isBelow: isNearTop,
    });
    setHoveredBlock(block);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const getBlockStyle = (block: ScheduleBlock) => {
    const leftPercent = Math.max(0, Math.min(100, (block.startMinute / totalMinutes) * 100));
    const widthPercent = Math.max(0.8, Math.min(100 - leftPercent, (block.durationMinutes / totalMinutes) * 100));
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  const getCalendarBlockStyle = (block: ScheduleBlock) => {
    const topPercent = Math.max(0, Math.min(100, (block.startMinute / totalMinutes) * 100));
    const heightPercent = Math.max(2, Math.min(100 - topPercent, (block.durationMinutes / totalMinutes) * 100));
    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'TASK':
        return 'bg-teal-500/25 border-teal-500/60 text-teal-200 hover:bg-teal-500/35';
      case 'SCHOOL':
        return 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-800';
      case 'ROUTINE':
        return 'bg-indigo-950/70 border-indigo-600/60 text-indigo-200 hover:bg-indigo-900/60';
      case 'EVENT':
        return 'bg-amber-950/70 border-amber-500/60 text-amber-200 hover:bg-amber-900/60';
      case 'SLEEP':
        return 'bg-slate-950 border-slate-900/80 text-slate-500';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}j ${m}m`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'TASK':
        return 'Sesi Tugas';
      case 'SCHOOL':
        return 'Sekolah (Hard Constraint)';
      case 'ROUTINE':
        return 'Rutinitas Berulang';
      case 'EVENT':
        return 'Jadwal Dadakan';
      case 'SLEEP':
        return 'Tidur';
      default:
        return 'Aktivitas';
    }
  };

  const getDisplayBlockName = (block: ScheduleBlock) => {
    if (block.type === 'SCHOOL') return `🔒 Jam Sekolah (${block.startTimeFormatted} - ${block.endTimeFormatted})`;
    if (block.type === 'SLEEP') return `🔒 Waktu Istirahat / Tidur`;
    if (block.type === 'ROUTINE') return `🔒 Rutinitas: ${block.taskName}`;
    if (block.type === 'EVENT') return `📌 ${block.taskName}`;
    return block.taskName;
  };

  const dateFormatted = selectedDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const hoursArray = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      id="card-timeline"
      className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl w-full relative"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Timeline Alokasi 24 Jam</h3>
            <p className="text-xs text-slate-400">
              Blok jadwal harian proporsional • Rutinitas, Jadwal Dadakan, dan Alokasi Subtugas
            </p>
          </div>
        </div>

        {/* Action Controls & Date Selector */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Tambah Jadwal Dadakan Button */}
          {onAddOneTimeEvent && (
            <button
              onClick={() => setIsEventModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
              title="Tambah Jadwal Dadakan (One-Time Event)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jadwal Dadakan</span>
            </button>
          )}

          {/* Date Selector */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1">
            <button
              onClick={handlePrevDay}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              &larr; Prev
            </button>
            <span className="text-xs font-semibold text-white px-1.5">{dateFormatted}</span>
            <button
              onClick={handleNextDay}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-1 rounded hover:bg-slate-800 transition-colors"
            >
              Next &rarr;
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'horizontal'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View Bar Horizontal"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Horizontal</span>
            </button>
            <button
              onClick={() => setViewMode('vertical')}
              className={`flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'vertical'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="View Kalender Vertikal"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kalender</span>
            </button>
          </div>

          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Perbesar"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Reschedule Suggestion Banner */}
      {showBanner && (
        <div className="mb-4 bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/80 border border-teal-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-300">Saran Reschedule & Penyesuaian Waktu</div>
              <p className="text-xs text-slate-300 mt-0.5">{bannerReason}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleRescheduleAction}
              disabled={isReschedulingLocal}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
            >
              {isReschedulingLocal ? 'Memproses...' : 'Atur Ulang Jadwal'}
            </button>
            <button
              onClick={() => setDismissRescheduleBanner(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
            >
              Abaikan
            </button>
          </div>
        </div>
      )}

      {/* HORIZONTAL VIEW */}
      {viewMode === 'horizontal' && (
        <div className="relative w-full bg-slate-950 border border-slate-800/90 rounded-2xl p-4 my-4 overflow-x-auto">
          {/* Hour markers top */}
          <div className="relative h-6 text-[10px] text-slate-500 font-mono select-none mb-2 min-w-[700px]">
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
              <span
                key={h}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {h.toString().padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {/* Timeline Bar Track */}
          <div className="relative h-16 w-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden min-w-[700px]">
            {/* Hour grid lines */}
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-slate-800/60 pointer-events-none"
                style={{ left: `${(i / 24) * 100}%` }}
              />
            ))}

            {/* Current Time Indicator for Horizontal View */}
            {isToday && (
              <div
                id="current-time-indicator"
                className="absolute top-0 bottom-0 z-30 pointer-events-none flex items-center"
                style={{ left: `${(currentTimeMinutes / 1440) * 100}%` }}
              >
                <div className="w-0.5 h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] relative">
                  <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Scheduled Blocks */}
            {activeBlocksForDate.map((block) => {
              const style = getBlockStyle(block);
              const colorClass = getBlockColor(block.type);
              const info = getSubtaskAndTask(block);

              return (
                <div
                  key={block.id}
                  onMouseEnter={(e) => handleMouseEnterBlock(block, e)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  style={style}
                  className={`absolute top-1.5 bottom-1.5 rounded-lg border flex items-center px-2 text-xs font-semibold overflow-hidden transition-all duration-150 cursor-pointer shadow-sm select-none ${colorClass} ${
                    block.isOffset ? 'translate-x-1 opacity-90 z-20 border-dashed' : 'z-10'
                  }`}
                >
                  <div className="truncate flex items-center space-x-1.5 w-full">
                    {info.isCompleted && <CheckCircle2 className="w-3 h-3 text-teal-300 shrink-0" />}
                    <span className="truncate">{getDisplayBlockName(block)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between flex-wrap gap-3 mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-teal-500/25 border border-teal-500/60" />
                <span>Sesi Tugas</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span>Sekolah</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-indigo-950/70 border border-indigo-600/60" />
                <span>Rutinitas</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-amber-950/70 border border-amber-500/60" />
                <span>Jadwal Dadakan</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-900" />
                <span>Jam Tidur</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="lg:hidden">Pencet blok untuk detail alokasi waktu</span>
              <span className="hidden lg:inline">Arahkan kursor ke blok untuk detail alokasi waktu</span>
            </div>
          </div>
        </div>
      )}

      {/* VERTICAL CALENDAR GRID VIEW */}
      {viewMode === 'vertical' && (
        <div className="relative w-full bg-slate-950 border border-slate-800/90 rounded-2xl p-4 my-4">
          <div className="relative h-[480px] w-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
            {/* Grid rows for each hour */}
            {hoursArray.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-slate-800/50 flex items-start"
                style={{ top: `${(hour / 24) * 100}%`, height: `${(1 / 24) * 100}%` }}
              >
                <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 select-none shrink-0 w-12">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1 h-full border-l border-slate-800/40" />
              </div>
            ))}

            {/* Current Time Indicator for Vertical View */}
            {isToday && (
              <div
                id="current-time-indicator"
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                style={{ top: `${currentTopPercentage}%` }}
              >
                <div className="h-0.5 w-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] relative">
                  <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Blocks positioned vertically */}
            <div className="absolute top-0 bottom-0 left-12 right-0">
              {activeBlocksForDate.map((block) => {
                const style = getCalendarBlockStyle(block);
                const colorClass = getBlockColor(block.type);
                const info = getSubtaskAndTask(block);

                return (
                  <div
                    key={block.id}
                    onMouseEnter={(e) => handleMouseEnterBlock(block, e)}
                    onMouseLeave={() => setHoveredBlock(null)}
                    style={style}
                    className={`absolute left-2 right-2 rounded-lg border px-3 py-1 text-xs font-semibold overflow-hidden transition-all duration-150 cursor-pointer shadow-sm select-none ${colorClass} ${
                      block.isOffset ? 'translate-x-3 opacity-90 z-20' : 'z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        {info.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-teal-300 shrink-0" />}
                        <span className="truncate">{getDisplayBlockName(block)}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80 shrink-0 ml-2">
                        {block.startTimeFormatted} - {block.endTimeFormatted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Detailed Hover Tooltip */}
      {hoveredBlock && (
        <div
          style={{
            position: 'absolute',
            left: `${tooltipStyle.left}px`,
            top: `${tooltipStyle.top}px`,
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
          className="z-50 w-64 bg-slate-900/95 border border-teal-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {getCategoryLabel(hoveredBlock.type)}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {formatDuration(hoveredBlock.durationMinutes)}
            </span>
          </div>

          <h4 className="text-xs font-bold text-white mb-0.5 truncate">{hoveredBlock.taskName}</h4>
          <p className="text-[11px] text-slate-300 mb-2 truncate">{hoveredBlock.subtaskName}</p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Rentang Jam:</span>
            <strong className="text-teal-300 font-mono">
              {hoveredBlock.startTimeFormatted} - {hoveredBlock.endTimeFormatted}
            </strong>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL DADAKAN */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Tambah Jadwal Dadakan</h3>
                <p className="text-xs text-slate-400">
                  Kegiatan insidental / halangan khusus yang memblokir waktu belajar
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Kegiatan / Halangan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ke Dokter Gigi / Acara Keluarga"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Kegiatan:</label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="w-full cursor-pointer text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Mulai:</label>
                  <input
                    type="time"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="w-full cursor-pointer text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jam Selesai:</label>
                  <input
                    type="time"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch (err) {}
                    }}
                    className="w-full cursor-pointer text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sifat Halangan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEventConstraint('HARD')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      eventConstraint === 'HARD'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Pasti / Wajib (Hard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventConstraint('FLEXIBLE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      eventConstraint === 'FLEXIBLE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Fleksibel
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md shadow-amber-400/20 flex items-center space-x-1.5 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Jadwal Dadakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
