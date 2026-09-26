// force re-deploy after repo rename
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeaderGreeting } from './components/HeaderGreeting';
import { CardFocusTask } from './components/CardFocusTask';
import { CardTodaySummary } from './components/CardTodaySummary';
import { CardRiskOverview } from './components/CardRiskOverview';
import { CardActiveTasks } from './components/CardActiveTasks';
import { CardTimeline } from './components/CardTimeline';
import { AddTaskModal } from './components/AddTaskModal';
import { AiErrorFallbackModal } from './components/AiErrorFallbackModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { TimeSettingsModal } from './components/TimeSettingsModal';
import { InteractiveTimerModal } from './components/InteractiveTimerModal';
import { AuthProfileModal } from './components/AuthProfileModal';
import { X, Maximize2 } from 'lucide-react';
import {
  Task,
  Subtask,
  UserProfile,
  FilterState,
  DecompositionResult,
  OneTimeEvent,
} from './types';
import { calculateSchedule, getISODateOnly, sanitizeSubtaskAllocation, sanitizeAllTasksSchedule } from './utils/scheduler';
import { runLocalDecomposition } from './utils/localDecomposition';
import { decomposeTaskWithGemini } from './utils/geminiService';

export default function App() {
  // Backend and environment status
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    mode: 'firebase' | 'local';
    message: string;
  } | null>(null);
  const [geminiKeyPresent, setGeminiKeyPresent] = useState(false);

  // User Profile state (Clean fresh default state)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    school_name: '',
    sleep_schedule: {
      sleep_start: '22:00',
      sleep_end: '05:30',
    },
    school_schedule: {
      school_start: '07:00',
      school_end: '15:00',
      active_days: [1, 2, 3, 4, 5],
    },
    routine_activities: [],
    one_time_events: [],
    preferences: {
      max_session_min: 90,
      break_min: 15,
    },
    personal_factor: 1.0,
    total_ai_estimated_minutes: 0,
    total_actual_minutes: 0,
  });

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter state for tasks
  const [filterState, setFilterState] = useState<FilterState>({
    subject: 'ALL',
    risk: 'ALL',
    search: '',
  });

  // Modals state
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // User-Driven Fallback State
  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [fallbackErrorMessage, setFallbackErrorMessage] = useState('');
  const [pendingTaskData, setPendingTaskData] = useState<{
    taskName: string;
    subject: string;
    deadline: string;
    description: string;
    reference: string;
  } | null>(null);
  const [isRetryingAi, setIsRetryingAi] = useState(false);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Interactive Timer modal state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [activeTimerTask, setActiveTimerTask] = useState<Task | null>(null);
  const [activeTimerSubtask, setActiveTimerSubtask] = useState<Subtask | null>(null);

  // Settings & Auth modals
  const [isTimeSettingsOpen, setIsTimeSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Card Expand / Fullscreen state
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Background Decomposition Toast state
  const [backgroundToast, setBackgroundToast] = useState<{
    show: boolean;
    status: 'loading' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Initial load from LocalStorage
  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, []);

  // Sync tasks and profile to localStorage unconditionally for 100% persistent storage
  useEffect(() => {
    try {
      localStorage.setItem('plaska_tasks', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('plaska_user_profile', JSON.stringify(userProfile));
    } catch (e) {}
  }, [userProfile]);

  const fetchProfile = () => {
    const saved = localStorage.getItem('plaska_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setUserProfile(parsed);
          setTasks((prevTasks) => sanitizeAllTasksSchedule(prevTasks, parsed));
        }
      } catch (e) {
        console.warn('Error parsing user profile from localStorage', e);
      }
    }
  };

  const fetchTasks = () => {
    const saved = localStorage.getItem('plaska_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeAllTasksSchedule(parsed, userProfile);
          setTasks(sanitized);
        }
      } catch (e) {
        console.warn('Error parsing tasks from localStorage', e);
      }
    }
  };

  // Schedule calculation (deterministic, sequential, with visual rest breaks & overlap offsets)
  const scheduledData = useMemo(() => {
    return calculateSchedule(tasks, userProfile, selectedDate);
  }, [tasks, userProfile, selectedDate]);

  // Handle Add Task with Gemini AI & client-side decomposition UX
  const handleCreateTask = async (taskInput: {
    taskName: string;
    subject: string;
    deadline: string;
    description: string;
    reference: string;
  }) => {
    // 1. Immediately close modal / pop-up input
    setIsAddTaskModalOpen(false);

    // 2. Show floating toast banner in corner with task name context
    setBackgroundToast({
      show: true,
      status: 'loading',
      message: `Sedang menata dan merancang langkah untuk '${taskInput.taskName}'...`,
    });

    try {
      // 1. Try Gemini API decomposition first, automatically falling back to Local Client Decomposition
      const resultData = await decomposeTaskWithGemini(taskInput);

      await finalizeTaskCreation(taskInput, resultData);

      // Update toast to success
      setBackgroundToast({
        show: true,
        status: 'success',
        message: `Langkah pengerjaan '${taskInput.taskName}' selesai dirancang!`,
      });

      setTimeout(() => {
        setBackgroundToast(null);
      }, 4000);
    } catch (err: any) {
      setBackgroundToast({
        show: true,
        status: 'error',
        message: err.message || 'Gagal memproses dekomposisi tugas.',
      });
      setTimeout(() => {
        setBackgroundToast(null);
      }, 5000);
    }
  };

  // User-Driven Fallback Action 1: Gunakan Template Standar
  const handleApplyFallbackTemplate = async () => {
    if (!pendingTaskData) return;

    const templateSubtasks = [
      {
        id: 'sub_fb_1',
        name: `Riset Dasar & Bahan: ${pendingTaskData.taskName}`,
        description: 'Kumpulkan sumber materi, buku cetak, referensi, atau catatan kelas.',
        estimated_minutes: 30,
        dependencies: [],
        completion_criteria: 'Bahan referensi dan materi telah terkumpul siap dikerjakan.',
      },
      {
        id: 'sub_fb_2',
        name: `Pengerjaan Inti Tugas: ${pendingTaskData.taskName}`,
        description: 'Tulis draf utama, kerjakan soal-soal, atau susun isi tugas.',
        estimated_minutes: 60,
        dependencies: ['sub_fb_1'],
        completion_criteria: 'Draf utama tugas selesai 100%.',
      },
      {
        id: 'sub_fb_3',
        name: `Review & Finalisasi: ${pendingTaskData.taskName}`,
        description: 'Periksa kembali kesesuaian format, ejaan, dan kelengkapan sebelum dikirim.',
        estimated_minutes: 30,
        dependencies: ['sub_fb_2'],
        completion_criteria: 'Tugas telah dicek ulang dan siap dikumpulkan.',
      },
    ];

    const fallbackDecomp: DecompositionResult = {
      task_summary: pendingTaskData.taskName,
      subtasks: templateSubtasks,
      requirements: ['Buku catatan / dokumen digital', 'Alat tulis / perangkat komputer'],
      tools_and_materials: ['Buku referensi', 'Koneksi internet'],
    };

    await finalizeTaskCreation(pendingTaskData, fallbackDecomp);
    setIsFallbackModalOpen(false);
    setPendingTaskData(null);
  };

  // User-Driven Fallback Action 2: Generate Ulang via Local Generator
  const handleRetryAiGeneration = async () => {
    if (!pendingTaskData) return;
    setIsRetryingAi(true);

    try {
      const localData = runLocalDecomposition(
        pendingTaskData.taskName,
        pendingTaskData.subject,
        pendingTaskData.description,
        pendingTaskData.deadline
      );

      await finalizeTaskCreation(pendingTaskData, localData);
      setIsFallbackModalOpen(false);
      setPendingTaskData(null);
    } catch (err: any) {
      setFallbackErrorMessage(err.message || 'Gagal memproses ulang.');
    } finally {
      setIsRetryingAi(false);
    }
  };

  // Finalize Task creation and persist to LocalStorage without reload
  const finalizeTaskCreation = async (
    rawInput: {
      taskName: string;
      subject: string;
      deadline: string;
      description: string;
      reference: string;
    },
    decomp: DecompositionResult
  ) => {
    const pf = userProfile.personal_factor || 1.0;

    const existingSubtasks = tasks.flatMap((t) => t.subtasks || []);
    const constraints = {
      sleepStart: userProfile.sleep_schedule?.sleep_start,
      sleepEnd: userProfile.sleep_schedule?.sleep_end,
      schoolStart: userProfile.school_schedule?.school_start,
      schoolEnd: userProfile.school_schedule?.school_end,
      activeSchoolDays: userProfile.school_schedule?.active_days ?? [1, 2, 3, 4, 5],
    };

    const rawSubtasks = (decomp.subtasks || []).map((s, idx) => ({
      id: s.id || `sub_${idx + 1}`,
      name: s.name,
      description: s.description,
      estimated_minutes: s.estimated_minutes,
      personalized_minutes: Math.round((s.estimated_minutes || 30) * pf),
      dependencies: s.dependencies || [],
      completion_criteria: s.completion_criteria,
      is_completed: false,
      allocation_date: (s as any).allocation_date || s.scheduled_date || getISODateOnly(new Date()),
      scheduled_start: s.scheduled_start,
      scheduled_end: s.scheduled_end,
    }));

    const collisionFreeSubtasks = sanitizeSubtaskAllocation(
      rawSubtasks,
      rawInput.deadline,
      constraints,
      existingSubtasks,
      userProfile.routine_activities || [],
      userProfile.one_time_events || []
    );

    const newTask: Task = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: userProfile.id || 'user_1',
      task_name: rawInput.taskName,
      subject: rawInput.subject,
      deadline: rawInput.deadline,
      description: rawInput.description,
      reference: rawInput.reference,
      status: 'PENDING',
      risk_status: 'SAFE',
      requirements: decomp.requirements || [],
      tools_and_materials: decomp.tools_and_materials || [],
      subtasks: collisionFreeSubtasks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Persist synchronously to LocalStorage
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    try {
      localStorage.setItem('plaska_tasks', JSON.stringify(updatedTasks));
    } catch (e) {}
  };

  // Toggle Subtask Completion without page reload
  const handleToggleSubtask = (
    taskId: string,
    subtaskId: string,
    currentStatus: boolean
  ) => {
    const newStatus = !currentStatus;

    setTasks((prevTasks) => {
      const updated = prevTasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, is_completed: newStatus } : st
        );
        const allCompleted = updatedSubs.every((s) => s.is_completed);
        const anyCompleted = updatedSubs.some((s) => s.is_completed);
        return {
          ...t,
          subtasks: updatedSubs,
          status: allCompleted ? 'COMPLETED' : anyCompleted ? 'IN_PROGRESS' : 'PENDING',
        };
      });
      try {
        localStorage.setItem('plaska_tasks', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Handle Request Delete Task
  const handleRequestDelete = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Task without reload
  const handleConfirmDelete = (taskId: string) => {
    setIsDeleting(true);
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem('plaska_tasks', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  // Start Interactive Timer for a Subtask
  const handleStartInteractiveTimer = (task: Task, subtask: Subtask) => {
    setActiveTimerTask(task);
    setActiveTimerSubtask(subtask);
    setIsTimerModalOpen(true);
  };

  // Complete Subtask from Timer and calibrate Personal Factor
  const handleCompleteSubtaskWithTimer = (
    taskId: string,
    subtaskId: string,
    actualMinutes: number
  ) => {
    setTasks((prevTasks) => {
      const updated = prevTasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = t.subtasks.map((st) =>
          st.id === subtaskId
            ? { ...st, is_completed: true, actual_minutes_logged: actualMinutes }
            : st
        );
        const allCompleted = updatedSubs.every((s) => s.is_completed);
        const anyCompleted = updatedSubs.some((s) => s.is_completed);
        return {
          ...t,
          subtasks: updatedSubs,
          status: allCompleted ? 'COMPLETED' : anyCompleted ? 'IN_PROGRESS' : 'PENDING',
        };
      });
      try {
        localStorage.setItem('plaska_tasks', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Calibrate user profile Personal Factor
    const subtask = activeTimerSubtask;
    const baseAi = subtask?.estimated_minutes || 30;
    const newAiTotal = (userProfile.total_ai_estimated_minutes || 0) + baseAi;
    const newActualTotal = (userProfile.total_actual_minutes || 0) + actualMinutes;
    const newPF = newAiTotal > 0 ? parseFloat((newActualTotal / newAiTotal).toFixed(2)) : 1.0;

    const updatedProfile = {
      ...userProfile,
      total_ai_estimated_minutes: newAiTotal,
      total_actual_minutes: newActualTotal,
      personal_factor: newPF,
    };
    setUserProfile(updatedProfile);
    try {
      localStorage.setItem('plaska_user_profile', JSON.stringify(updatedProfile));
    } catch (e) {}
  };

  // Save updated profile from Settings or Auth modal
  const handleSaveProfile = (updatedFields: Partial<UserProfile>) => {
    const merged = { ...userProfile, ...updatedFields };
    setUserProfile(merged);
    setTasks((prevTasks) => sanitizeAllTasksSchedule(prevTasks, merged));
    try {
      localStorage.setItem('plaska_user_profile', JSON.stringify(merged));
    } catch (e) {}
  };

  // Add One-Time Event (Jadwal Dadakan)
  const handleAddOneTimeEvent = (event: OneTimeEvent) => {
    const updatedEvents = [...(userProfile.one_time_events || []), event];
    const updatedProfile = { ...userProfile, one_time_events: updatedEvents };
    setUserProfile(updatedProfile);
    setTasks((prevTasks) => sanitizeAllTasksSchedule(prevTasks, updatedProfile));
    try {
      localStorage.setItem('plaska_user_profile', JSON.stringify(updatedProfile));
    } catch (e) {}
  };

  // Delete One-Time Event
  const handleDeleteOneTimeEvent = (eventId: string) => {
    const updatedEvents = (userProfile.one_time_events || []).filter((e) => e.id !== eventId);
    const updatedProfile = { ...userProfile, one_time_events: updatedEvents };
    setUserProfile(updatedProfile);
    setTasks((prevTasks) => sanitizeAllTasksSchedule(prevTasks, updatedProfile));
    try {
      localStorage.setItem('plaska_user_profile', JSON.stringify(updatedProfile));
    } catch (e) {}
  };

  // Recalculate & Optimize Task Schedule on demand
  const handleRescheduleTasks = () => {
    setTasks((prevTasks) => {
      const rescheduled = sanitizeAllTasksSchedule(prevTasks, userProfile);
      try {
        localStorage.setItem('plaska_tasks', JSON.stringify(rescheduled));
      } catch (e) {}
      return rescheduled;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navigation Bar */}
      <Navbar
        userProfile={userProfile}
        onOpenTimeSettings={() => setIsTimeSettingsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        backendStatus={backendStatus}
        geminiKeyPresent={geminiKeyPresent}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Header Menyapa User */}
        <HeaderGreeting
          userProfile={userProfile}
          totalTasks={scheduledData.totalActiveTasks}
          criticalTasks={scheduledData.criticalTasksCount}
          onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
        />

        {/* BENTO GRID DASHBOARD */}
        <div className="space-y-6">
          {/* Row 1: Focus Task (Large Card) & Summary/Risk Stack (Small Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {/* Focus Task (Large Card - 7 cols) */}
            <div className="lg:col-span-7">
              <CardFocusTask
                tasks={scheduledData.allScheduledTasks}
                onStartInteractiveTimer={handleStartInteractiveTimer}
                onExpand={() => setExpandedCardId('focus')}
              />
            </div>

            {/* Right Stack: Today Summary & Risk Overview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="flex-1">
                <CardTodaySummary
                  tasks={scheduledData.allScheduledTasks}
                  onExpand={() => setExpandedCardId('today')}
                />
              </div>
              <div className="flex-1">
                <CardRiskOverview
                  tasks={scheduledData.allScheduledTasks}
                  onExpand={() => setExpandedCardId('risk')}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Active Tasks List (Dominant Full-Width Bento Card - 12 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            <div className="lg:col-span-12">
              <CardActiveTasks
                tasks={scheduledData.allScheduledTasks}
                filterState={filterState}
                onFilterChange={setFilterState}
                onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
                onRequestDeleteTask={handleRequestDelete}
                onToggleSubtask={handleToggleSubtask}
                onStartInteractiveTimer={handleStartInteractiveTimer}
                onExpand={() => setExpandedCardId('active_tasks')}
                scheduledBlocks={scheduledData.blocksForDate}
              />
            </div>
          </div>

          {/* Row 3: Timeline 24 Jam (Wide Horizontal Bento Card - 12 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
            <div className="lg:col-span-12">
              <CardTimeline
                scheduledBlocks={scheduledData.blocksForDate}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                tasks={scheduledData.allScheduledTasks}
                onToggleSubtask={handleToggleSubtask}
                onExpand={() => setExpandedCardId('timeline')}
                onAddOneTimeEvent={handleAddOneTimeEvent}
                onDeleteOneTimeEvent={handleDeleteOneTimeEvent}
                onRescheduleTasks={handleRescheduleTasks}
              />
            </div>
          </div>
        </div>
      </main>

      {/* FULLSCREEN CARD MODAL */}
      {expandedCardId && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider">
                Full View: {expandedCardId.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setExpandedCardId(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Tutup / Kembali"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">
              {expandedCardId === 'focus' && (
                <CardFocusTask
                  tasks={scheduledData.allScheduledTasks}
                  onStartInteractiveTimer={handleStartInteractiveTimer}
                />
              )}
              {expandedCardId === 'today' && (
                <CardTodaySummary tasks={scheduledData.allScheduledTasks} />
              )}
              {expandedCardId === 'risk' && (
                <CardRiskOverview tasks={scheduledData.allScheduledTasks} />
              )}
              {expandedCardId === 'active_tasks' && (
                <CardActiveTasks
                  tasks={scheduledData.allScheduledTasks}
                  filterState={filterState}
                  onFilterChange={setFilterState}
                  onOpenAddTaskModal={() => setIsAddTaskModalOpen(true)}
                  onRequestDeleteTask={handleRequestDelete}
                  onToggleSubtask={handleToggleSubtask}
                  onStartInteractiveTimer={handleStartInteractiveTimer}
                  scheduledBlocks={scheduledData.blocksForDate}
                />
              )}
              {expandedCardId === 'timeline' && (
                <CardTimeline
                  scheduledBlocks={scheduledData.blocksForDate}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  tasks={scheduledData.allScheduledTasks}
                  onToggleSubtask={handleToggleSubtask}
                  onAddOneTimeEvent={handleAddOneTimeEvent}
                  onDeleteOneTimeEvent={handleDeleteOneTimeEvent}
                  onRescheduleTasks={handleRescheduleTasks}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS BARU */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        isLoading={isAiLoading}
      />

      {/* USER-DRIVEN AI FALLBACK MODAL */}
      <AiErrorFallbackModal
        isOpen={isFallbackModalOpen}
        errorMessage={fallbackErrorMessage}
        pendingTask={pendingTaskData}
        onApplyFallbackTemplate={handleApplyFallbackTemplate}
        onRetryAi={handleRetryAiGeneration}
        onClose={() => {
          setIsFallbackModalOpen(false);
          setPendingTaskData(null);
        }}
        isRetrying={isRetryingAi}
      />

      {/* CONFIRM DELETE MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        task={taskToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* PENGATURAN WAKTU & RUTINITAS MODAL */}
      <TimeSettingsModal
        isOpen={isTimeSettingsOpen}
        userProfile={userProfile}
        onClose={() => setIsTimeSettingsOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      {/* PROFIL & AUTHENTICATION MODAL */}
      <AuthProfileModal
        isOpen={isAuthModalOpen}
        userProfile={userProfile}
        onClose={() => setIsAuthModalOpen(false)}
        onSaveProfile={handleSaveProfile}
        backendMode={backendStatus?.mode || 'local'}
      />

      {/* INTERACTIVE WORK-SESSION TIMER MODAL */}
      <InteractiveTimerModal
        key={activeTimerSubtask?.id || 'timer-modal'}
        isOpen={isTimerModalOpen}
        task={activeTimerTask}
        subtask={activeTimerSubtask}
        userProfile={userProfile}
        onClose={() => {
          setIsTimerModalOpen(false);
          setActiveTimerTask(null);
          setActiveTimerSubtask(null);
        }}
        onCompleteSubtask={handleCompleteSubtaskWithTimer}
      />

      {/* Background Decomposition Floating Toast Banner */}
      {backgroundToast && backgroundToast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold backdrop-blur-md ${
            backgroundToast.status === 'loading'
              ? 'bg-slate-900/90 border-teal-500/40 text-white'
              : backgroundToast.status === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}>
            {backgroundToast.status === 'loading' && (
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            {backgroundToast.status === 'success' && (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</div>
            )}
            {backgroundToast.status === 'error' && (
              <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">!</div>
            )}
            <span>{backgroundToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
