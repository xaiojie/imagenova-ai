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
  user: AppUser | null;
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

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  status: 'active' | 'disabled';
  quota: {
    monthlyLimit: number;
    usedThisMonth: number;
    maxBatch: number;
    hdDownload: boolean;
    privateGallery: boolean;
    concurrentJobs: number;
  };
  createdAt: number;
  lastLoginAt: number | null;
}

export interface AdminConfig {
  imageApiBase: string;
  normalizedImageApiBase: string;
  imageModel: string;
  uiModelName: string;
  hasApiKey: boolean;
  maskedApiKey: string;
  port: number;
}

export interface AdminOverview {
  users: number;
  activeUsers: number;
  works: number;
  publicWorks: number;
  liveRenders: number;
  mockRenders: number;
  promptPresets: number;
  usedThisMonth: number;
  totalLikes: number;
  totalSaves: number;
  recent: Array<{
    id: string;
    prompt: string;
    source: ImageSource;
    createdAt: number;
    ratio: AspectRatio;
    public: boolean;
  }>;
}

export interface AdminUser extends AppUser {
  stats: {
    works: number;
    publicWorks: number;
    liveRenders: number;
    likes: number;
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
      const text = await res.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          message = body.error || body.message || message;
        } catch {
          message = text;
        }
      }
    } catch {
      message = res.statusText || message;
    }
    throw new Error(message);
  }
  return res.json();
}

export async function getConfig() {
  return api<AppConfig>('/api/health');
}

export async function getMe() {
  return api<{ user: AppUser | null; membership: AppConfig['membership'] }>('/api/auth/me');
}

export async function login(email: string, password: string) {
  return api<{ user: AppUser; membership: AppConfig['membership'] }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string) {
  return api<{ user: AppUser; membership: AppConfig['membership'] }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logout() {
  return api<{ ok: boolean }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getAdminConfig() {
  return api<AdminConfig>('/api/admin/config');
}

export async function saveAdminConfig(payload: {
  imageApiBase: string;
  apiKey?: string;
  imageModel: string;
  uiModelName: string;
}) {
  return api<AdminConfig & { ok: boolean }>('/api/admin/config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getAdminOverview() {
  return api<AdminOverview>('/api/admin/overview');
}

export async function getAdminUsers() {
  return api<{ items: AdminUser[] }>('/api/admin/users');
}

export async function updateAdminUser(id: string, patch: Partial<Pick<AppUser, 'role' | 'plan' | 'status'>>) {
  return api<{ user: AppUser }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function generateImages(req: GenerationRequest): Promise<GenerationResult[]> {
  const form = new FormData();
  form.append('prompt', req.prompt);
  form.append('ratio', req.ratio);
  form.append('n', String(req.n ?? 2));
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
