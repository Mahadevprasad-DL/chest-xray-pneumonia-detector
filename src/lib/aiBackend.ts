import type { Severity } from '../types';

export interface BackendAnalysisResult {
  diagnosis: string;
  confidence: number;
  severity: Severity;
  risk_score: number;
  notes: string;
  heatmap_data: Record<string, number[][]>;
  differentials: { label: string; probability: number }[];
}

const API_BASE_URL = import.meta.env.VITE_AI_API_URL ?? 'http://127.0.0.1:8000';

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeXRayWithBackend(file: File): Promise<BackendAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const attempts = 5;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Backend prediction failed with status ${response.status}`);
      }

      return response.json() as Promise<BackendAnalysisResult>;
    } catch (error) {
      lastError = error;

      // Retry only transient network failures, useful when backend is still booting up.
      if (attempt < attempts && isNetworkError(error)) {
        await sleep(700);
        continue;
      }

      if (isNetworkError(error)) {
        throw new Error(
          `Cannot reach AI backend at ${API_BASE_URL}. Start backend API and try again.`
        );
      }

      throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Backend prediction failed.');
}
