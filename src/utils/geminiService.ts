import { GoogleGenAI, Type } from '@google/genai';
import { DecompositionResult } from '../types';
import { runLocalDecomposition } from './localDecomposition';

export function getGeminiApiKey(): string {
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
    '';

  return apiKey;
}

export async function decomposeTaskWithGemini(input: {
  taskName: string;
  subject: string;
  deadline: string;
  description: string;
  reference: string;
}): Promise<DecompositionResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    console.warn(
      '⚠️ [PLASKA AI Warning]: VITE_GEMINI_API_KEY tidak ditemukan pada environment variables.\n' +
      'Sistem secara otomatis berjalan menggunakan fallback "runLocalDecomposition" (Client-Side Decomposition).'
    );
    return runLocalDecomposition(
      input.taskName,
      input.subject,
      input.description,
      input.deadline
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const model = 'gemini-3.8-flash';

    const prompt = `Anda adalah Asisten Penjadwalan Belajar Cerdas (PLASKA AI).
Tugas Anda adalah memecah (dekomposisi) tugas sekolah siswa menjadi langkah-langkah pengerjaan (subtask) yang logis, terstruktur, dan realistis.

DETAIL TUGAS SISWA:
- Nama Tugas: ${input.taskName}
- Mata Pelajaran: ${input.subject}
- Tenggat Waktu (Deadline): ${input.deadline}
- Deskripsi / Instruksi Tambahan: ${input.description || 'Tidak ada'}
- Referensi / Sumber: ${input.reference || 'Tidak ada'}

INSTRUKSI DEKOMPOSISI:
1. Buat ringkasan tugas (task_summary).
2. Buat 3 hingga 5 subtask yang konkret dan berurutan.
3. Berikan estimasi durasi menit (estimated_minutes) yang masuk akal (antara 15 hingga 60 menit per subtask).
4. Tentukan dependensi (ID subtask sebelumnya jika harus dikerjakan berurutan).
5. Tentukan kriteria selesai (completion_criteria) untuk tiap subtask.
6. Sebutkan kebutuhan materi (requirements) dan peralatan/alat (tools_and_materials).

Output HARUS dalam format JSON sesuai schema.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            task_summary: { type: Type.STRING },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimated_minutes: { type: Type.NUMBER },
                  dependencies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  completion_criteria: { type: Type.STRING },
                },
                required: ['id', 'name', 'description', 'estimated_minutes'],
              },
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            tools_and_materials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['task_summary', 'subtasks'],
        },
      },
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text) as DecompositionResult;
      if (parsed && parsed.subtasks && parsed.subtasks.length > 0) {
        return parsed;
      }
    }

    throw new Error('Respons Gemini API tidak valid atau kosong.');
  } catch (err) {
    console.warn('Gemini API decomposition error, falling back to local decomposition:', err);
    return runLocalDecomposition(
      input.taskName,
      input.subject,
      input.description,
      input.deadline
    );
  }
}
