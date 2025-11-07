import { Configuration } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface RunExtractionResponse {
  status: 'success' | 'error';
  summary?: {
    status: string;
    images_found: number;
    export_method: string;
    collection: string;
    mask_applied: boolean;
    mask_filters: Record<string, string>;
    export_details: Record<string, string>;
  };
  artifacts?: {
    config_path: string;
    runner_path: string;
    class_path: string;
    output_path: string;
    log_path: string;
  };
  message?: string;
}

export async function runExtraction(config: Configuration): Promise<RunExtractionResponse> {
  const response = await fetch(`${API_BASE}/api/run-extraction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = (error && error.message) || response.statusText;
    return { status: 'error', message };
  }

  return response.json();
}
