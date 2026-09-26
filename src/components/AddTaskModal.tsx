import React, { useState } from 'react';
import { Sparkles, X, Calendar, BookOpen, FileText, Bookmark, Loader2, Wrench, HelpCircle } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    taskName: string;
    subject: string;
    deadline: string;
    description: string;
    reference: string;
  }) => void;
  isLoading: boolean;
}

const COMMON_SUBJECTS = [
  'Matematika',
  'Fisika',
  'Kimia',
  'Biologi',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Geografi',
  'Sejarah',
  'Sosiologi',
  'Ekonomi',
  'Informatika',
  'Seni Budaya',
];

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [taskName, setTaskName] = useState('');
  const [subject, setSubject] = useState('Geografi');
  const [customSubject, setCustomSubject] = useState('');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}T23:59`;
  });
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const finalSubject = subject === 'Lainnya' ? customSubject.trim() || 'Umum' : subject;

    onSubmit({
      taskName: taskName.trim(),
      subject: finalSubject,
      deadline,
      description: description.trim(),
      reference: reference.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Tambah Tugas Baru & Dekomposisi AI
              </h3>
              <p className="text-[11px] text-slate-400">
                Pecah instruksi abstrak menjadi subtugas konkret & realistis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar pt-4 space-y-4 pr-1">
          {/* 1. Task Name */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              1. Nama Tugas Utama <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Contoh: Makalah Perubahan Iklim & Krisis Pangan"
              className="w-full text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* 2. Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>2. Mata Pelajaran Terkait</span>
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_SUBJECTS.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    subject === sub
                      ? 'bg-teal-600 text-slate-950 border-teal-500 font-bold shadow-sm shadow-teal-600/30'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSubject('Lainnya')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  subject === 'Lainnya'
                    ? 'bg-teal-600 text-slate-950 border-teal-500 font-bold'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Lainnya...
              </button>
            </div>
            {subject === 'Lainnya' && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Tuliskan nama mata pelajaran..."
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            )}
          </div>

          {/* 3. Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>3. Batas Waktu / Deadline <span className="text-rose-400">*</span></span>
              <span className="flex items-center space-x-1 text-teal-300 font-semibold bg-teal-950/80 border border-teal-500/50 px-2 py-0.5 rounded-md text-[10px]">
                <Calendar className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                <span>Pilih Waktu</span>
              </span>
            </label>
            <input
              type="datetime-local"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch (err) {}
              }}
              className="w-full cursor-pointer text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-teal-500 transition-colors [color-scheme:dark]"
            />
            <p className="text-[10px] text-teal-400/90 mt-1 flex items-center space-x-1">
              <span>💡 Klik kotak di atas untuk membuka pop-up kalender & jam.</span>
            </p>
          </div>

          {/* 4. Detailed Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-200">
                4. Deskripsi Tugas / Instruksi Guru
              </label>
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center space-x-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/30 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>ℹ️ Panduan & Contoh</span>
              </button>
            </div>
            <p className="text-[11px] text-teal-300 mb-1.5 font-medium">
              Semakin mendetail deskripsi yang diberikan, semakin akurat AI dalam menyusun subtugas.
            </p>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Buat makalah minimal 5 halaman mengenai dampak perubahan iklim. Gunakan sumber terpercaya dan sertakan data grafik BMKG..."
              className="w-full text-xs sm:text-sm bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors leading-relaxed"
            />
          </div>

          {/* 5. Example / Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
              <span>5. Catatan Acuan Format / Referensi (Opsional)</span>
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Contoh: Format APA Style, margin 4-4-3-3, font Times New Roman 12pt"
              className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !taskName.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-teal-500 hover:bg-teal-400 shadow-lg shadow-teal-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Sedang Menghubungi Gemini AI Orchestrator...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Dekomposisi & Jadwalkan dengan AI</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Sistem mengevaluasi kapasitas SMA, mendeteksi dependensi, dan menyusun timeline proporsional.
            </p>
          </div>
        </form>
      </div>

      {/* Guide Modal Pop-up */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Panduan Penulisan Deskripsi untuk AI</span>
              </h4>
              <button
                onClick={() => setIsGuideOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Agar AI dapat mendekomposisi tugas menjadi langkah-langkah yang realistis dan terukur, ikuti tips berikut:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
                <li>
                  <strong className="text-white">Sebutkan Cakupan & Target:</strong> Tuliskan berapa halaman, jumlah soal, atau bab yang harus dikerjakan (misal: Bab 3 sampai 5).
                </li>
                <li>
                  <strong className="text-white">Sertakan Alat & Bahan:</strong> Jika butuh lab, laptop, atau literatur tertentu, sebutkan agar AI mencatatnya dalam daftar kebutuhan.
                </li>
                <li>
                  <strong className="text-white">Pecah Instruksi Kompleks:</strong> Jika tugas merupakan proyek kelompok atau laporan praktikum, sebutkan tahapan seperti pengambilan data, analisis, dan penyusunan laporan.
                </li>
              </ul>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mt-3">
                <div className="text-[10px] font-bold text-teal-400 uppercase mb-1">Contoh Penulisan yang Baik:</div>
                <p className="italic text-slate-400 text-[11px]">
                  "Membuat laporan praktikum Biologi tentang fermentasi ragi. Butuh waktu untuk mengamati botol fermentasi selama 2 jam, mencatat suhu, dan membuat kesimpulan dalam format laporan PDF 4 halaman."
                </p>
              </div>
            </div>
            <div className="mt-5 text-right">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Mengerti, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

