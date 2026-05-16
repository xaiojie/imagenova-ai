export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageQuality = 'standard' | 'hd' | 'ultra';
export type ImageSource = 'api' | 'mock';

export interface GenerationRequest {
  prompt: string;
  ratio: AspectRatio;
  n?: number;
  quality?: ImageQuality;
  seed?: number;
  style?: string;
  creativity?: number;
  publish?: boolean;
  tags?: string[];
  reference?: File | null;
}

export interface Author {
  user: string;
  avatar: string;
}

export interface GenerationResult {
  id: string;
  url: string;
  prompt: string;
  originalPrompt?: string;
  ratio: AspectRatio;
  model: string;
  providerModel?: string;
  createdAt: number;
  seed: number;
  quality: string;
  creativity?: number;
  steps?: number | null;
  style?: string;
  source: ImageSource;
  owner?: string;
  author?: Author;
  public?: boolean;
  private?: boolean;
  likes?: number;
  saves?: number;
  copies?: number;
  shares?: number;
  liked?: boolean;
  saved?: boolean;
  referenceImage?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface WorksResponse extends PagedResult<GenerationResult> {
  stats: {
    total: number;
    live: number;
    likes: number;
    saves: number;
  };
}

export interface PromptPreset {
  id: string;
  category: string;
  title: string;
  cn: string;
  prompt: string;
  desc: string;
  uses: number;
}

export interface AppConfig {
  ok: boolean;
  hasApiKey: boolean;
  model: string;
  providerModel: string;
  membership: {
    plan: string;
    maxBatch: number;
    hdDownload: boolean;
    privateGallery: boolean;
    concurrentJobs: number;
    monthlyLimit: number;
    usedThisMonth: number;
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });

  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      message = await res.text();
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getConfig() {
  return api<AppConfig>('/api/health');
}

export async function generateImages(req: GenerationRequest): Promise<GenerationResult[]> {
  const form = new FormData();
  form.append('prompt', req.prompt);
  form.append('ratio', req.ratio);
  form.append('n', String(req.n ?? 4));
  form.append('quality', req.quality ?? 'ultra');
  form.append('seed', String(req.seed ?? Math.floor(Math.random() * 1_000_000)));
  form.append('style', req.style ?? 'cinematic');
  form.append('creativity', String(req.creativity ?? 7.5));
  form.append('publish', String(req.publish ?? true));
  form.append('tags', (req.tags ?? []).join(','));
  if (req.reference) form.append('reference', req.reference);

  const data = await api<{ items: GenerationResult[] }>('/api/generate', {
    method: 'POST',
    body: form,
  });
  return data.items;
}

export async function getWorks(params: Record<string, string | number | undefined> = {}) {
  return api<WorksResponse>(`/api/works?${new URLSearchParams(cleanParams(params))}`);
}

export async function getGallery(params: Record<string, string | number | undefined> = {}) {
  return api<PagedResult<GenerationResult>>(`/api/gallery?${new URLSearchParams(cleanParams(params))}`);
}

export async function getImage(id: string) {
  return api<GenerationResult>(`/api/images/${id}`);
}

export async function updateImage(id: string, patch: Partial<GenerationResult>) {
  return api<GenerationResult>(`/api/images/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteWork(id: string) {
  return api<{ ok: boolean }>(`/api/works/${id}`, { method: 'DELETE' });
}

export async function imageAction(id: string, action: 'like' | 'save' | 'copy' | 'share') {
  return api<{ image: GenerationResult; prompt: string; shareUrl: string }>(`/api/images/${id}/${action}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function imageDownloadUrl(id: string) {
  return `/api/images/${id}/download`;
}

export async function getPromptPresets(params: Record<string, string | undefined> = {}) {
  return api<{ items: PromptPreset[] }>(`/api/prompts?${new URLSearchParams(cleanParams(params))}`);
}

export async function usePromptPreset(id: string) {
  return api<{ prompt: string; preset: PromptPreset }>(`/api/prompts/${id}/use`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getInspiration(prompt: string, style: string) {
  return api<{ prompt: string }>('/api/inspiration', {
    method: 'POST',
    body: JSON.stringify({ prompt, style }),
  });
}

export async function getNotifications() {
  return api<{ items: Array<{ id: string; title: string; body: string; read: boolean; createdAt: number }> }>('/api/notifications');
}

export async function getModels() {
  return api<{ selected: string; models: Array<{ id: string; name: string; status: string; supportsReference: boolean }> }>('/api/models');
}

function cleanParams(params: Record<string, string | number | undefined>) {
  const clean: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') clean[key] = String(value);
  });
  return clean;
}
