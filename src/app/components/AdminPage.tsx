import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity, Bell, BookOpen, CheckCircle2, ChevronRight, Cloud, CreditCard,
  Database, Eye, EyeOff, HardDrive, ImageIcon, KeyRound, ListChecks,
  Lock, RotateCw, Save, ServerCog, ShieldCheck, SlidersHorizontal, Users,
} from 'lucide-react';
import {
  AdminConfig, AdminOverview, getAdminConfig, getAdminOverview, saveAdminConfig,
  AdminUser, getAdminUsers, login, updateAdminUser,
} from '../lib/imageApi';

const moduleItems = [
  { title: '用户管理', desc: '账号、封禁、角色与登录审计', icon: Users },
  { title: '生成记录', desc: '任务队列、失败原因、成本追踪', icon: ListChecks },
  { title: '会员与额度', desc: '套餐、用量、充值和权益开关', icon: CreditCard },
  { title: '模型路由', desc: '模型别名、灰度、Fallback 策略', icon: SlidersHorizontal },
  { title: '提示词库', desc: '广场素材、审核、分类和热榜', icon: BookOpen },
  { title: '通知中心', desc: '系统公告、站内信和运营推送', icon: Bell },
  { title: '内容安全', desc: '公开图库审核和风险拦截', icon: ShieldCheck },
  { title: '数据备份', desc: '作品资产、配置和数据库备份', icon: Database },
];

const modelOptions = ['gpt-image-1', 'gpt-image-1.5', 'gpt-image-2', 'imagen-4', 'mock'];

function compact(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value || 0);
}

function timeText(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  return `${Math.floor(hour / 24)} 天前`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function AdminPage() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userError, setUserError] = useState('');
  const [imageApiBase, setImageApiBase] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [imageModel, setImageModel] = useState('gpt-image-1');
  const [uiModelName, setUiModelName] = useState('GPT-image2');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@imagenova.local');
  const [adminPassword, setAdminPassword] = useState('admin123456');

  async function load() {
    setLoading(true);
    setError('');
    setUserError('');
    try {
      const [nextConfig, nextOverview] = await Promise.all([getAdminConfig(), getAdminOverview()]);
      setConfig(nextConfig);
      setOverview(nextOverview);
      setImageApiBase(nextConfig.imageApiBase);
      setImageModel(nextConfig.imageModel);
      setUiModelName(nextConfig.uiModelName);
      setApiKey('');
      getAdminUsers()
        .then((data) => setUsers(data.items))
        .catch((err) => {
          setUsers([]);
          setUserError(err instanceof Error ? err.message : '需要管理员登录后查看用户');
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : '后台数据读取失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ([
    { label: '用户数量', value: overview?.users || 0, icon: Users },
    { label: '公共图库', value: overview?.publicWorks || 0, icon: Cloud },
    { label: '真实生成', value: overview?.liveRenders || 0, icon: Activity },
    { label: '提示词素材', value: overview?.promptPresets || 0, icon: BookOpen },
  ]), [overview]);

  async function patchUser(id: string, patch: Partial<Pick<AdminUser, 'role' | 'plan' | 'status'>>) {
    setUserError('');
    try {
      const result = await updateAdminUser(id, patch);
      setUsers((current) => current.map((item) => item.id === id ? { ...item, ...result.user } : item));
    } catch (err) {
      setUserError(err instanceof Error ? err.message : '用户更新失败');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const next = await saveAdminConfig({
        imageApiBase,
        apiKey: apiKey.trim() || undefined,
        imageModel,
        uiModelName,
      });
      setConfig(next);
      setApiKey('');
      setMessage('配置已保存，新的图片生成请求会直接使用这组参数。');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070812] text-slate-100">
      <header className="border-b border-white/10 bg-[#0b1020]/95">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-300/25">
              <ServerCog size={20} />
            </div>
            <div>
              <div className="text-base font-semibold">ImageNova Admin</div>
              <div className="text-xs text-slate-500">轻量运维后台 · /admin</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${config?.hasApiKey ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-amber-300/30 bg-amber-300/10 text-amber-200'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${config?.hasApiKey ? 'bg-emerald-300' : 'bg-amber-300'}`} />
              {config?.hasApiKey ? 'Live API 已配置' : '未配置 Key'}
            </span>
            <a href="/" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8">
              返回前台
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 py-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-4 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between text-slate-400">
                  <span className="text-sm">{item.label}</span>
                  <Icon size={16} />
                </div>
                <div className="text-2xl font-semibold">{loading ? '-' : compact(item.value)}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">API 配置</h1>
                <p className="mt-1 text-sm text-slate-500">保存后写入项目 `.env`，并立即影响后端后续生成请求。</p>
              </div>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/8"
              >
                <RotateCw size={14} /> 刷新
              </button>
            </div>

            <div className="grid gap-4">
              <Field label="API Base URL" hint={config?.normalizedImageApiBase ? `实际请求：${config.normalizedImageApiBase}` : undefined}>
                <div className="relative">
                  <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    value={imageApiBase}
                    onChange={(event) => setImageApiBase(event.target.value)}
                    placeholder="https://www.papaclaoud.top"
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#0c1222] pl-10 pr-3 text-sm outline-none transition focus:border-cyan-300/60"
                  />
                </div>
              </Field>

              <Field label="API Key" hint={config?.hasApiKey ? `当前：${config.maskedApiKey}` : '留空则不修改现有 Key'}>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
                  <input
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    type={showKey ? 'text' : 'password'}
                    placeholder={config?.hasApiKey ? '输入新 Key 才会覆盖现有配置' : 'sk-...'}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#0c1222] pl-10 pr-12 text-sm outline-none transition focus:border-cyan-300/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((value) => !value)}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-white/8"
                    aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="默认生成模型" hint="发送给上游 API 的 model">
                  <input
                    list="admin-model-options"
                    value={imageModel}
                    onChange={(event) => setImageModel(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#0c1222] px-3 text-sm outline-none transition focus:border-cyan-300/60"
                  />
                  <datalist id="admin-model-options">
                    {modelOptions.map((model) => <option key={model} value={model} />)}
                  </datalist>
                </Field>
                <Field label="前台展示模型名" hint="展示给用户看的名称">
                  <input
                    value={uiModelName}
                    onChange={(event) => setUiModelName(event.target.value)}
                    className="h-11 w-full rounded-lg border border-white/10 bg-[#0c1222] px-3 text-sm outline-none transition focus:border-cyan-300/60"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock size={14} />
                Key 只保存在服务端 `.env`，前端不会读取完整密钥。
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} /> {saving ? '保存中' : '保存配置'}
              </button>
            </div>
          </form>

          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">运行概览</h2>
                <p className="mt-1 text-xs text-slate-500">当前轻量数据存储状态</p>
              </div>
              <HardDrive className="text-slate-500" size={18} />
            </div>
            <div className="space-y-3">
              {[
                ['API 端口', config?.port ? String(config.port) : '-'],
                ['本月用量', compact(overview?.usedThisMonth || 0)],
                ['模拟生成', compact(overview?.mockRenders || 0)],
                ['累计点赞', compact(overview?.totalLikes || 0)],
                ['累计收藏', compact(overview?.totalSaves || 0)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-[#0c1222] px-3 py-2.5 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-200">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 size={16} className="text-emerald-300" /> 最近生成
              </div>
              <div className="space-y-2">
                {(overview?.recent || []).slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/8 bg-[#0c1222] p-3">
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{item.source === 'api' ? 'Live' : 'Demo'} · {item.ratio}</span>
                      <span>{timeText(item.createdAt)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-300">{item.prompt}</p>
                  </div>
                ))}
                {!overview?.recent?.length ? <div className="text-sm text-slate-500">暂无生成记录</div> : null}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">用户管理</h2>
              <p className="mt-1 text-sm text-slate-500">基于 `data/db.json` 的最小用户系统，后续可平滑迁移到 MySQL 用户表。</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500">
              Active {overview?.activeUsers || 0} / {overview?.users || 0}
            </span>
          </div>
          {userError ? (
            <div className="mb-3 rounded-lg border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              <div className="mb-3">{userError}。使用管理员账号登录后可管理用户。</div>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#0c1222] px-3 text-sm outline-none" />
                <input value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} type="password" className="h-10 rounded-lg border border-white/10 bg-[#0c1222] px-3 text-sm outline-none" />
                <button
                  onClick={async () => {
                    try {
                      await login(adminEmail, adminPassword);
                      await load();
                    } catch (err) {
                      setUserError(err instanceof Error ? err.message : '管理员登录失败');
                    }
                  }}
                  className="rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-slate-950"
                >
                  管理员登录
                </button>
              </div>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] bg-[#0c1222] px-4 py-3 text-xs text-slate-500">
              <span>用户</span>
              <span>角色</span>
              <span>套餐</span>
              <span>状态</span>
              <span>数据</span>
            </div>
            {users.map((item) => (
              <div key={item.id} className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_1fr] items-center gap-3 border-t border-white/8 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-300/12 text-xs font-semibold text-cyan-100">{item.avatar}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-200">{item.name}</span>
                      <span className="block truncate text-xs text-slate-500">{item.email}</span>
                    </span>
                  </div>
                </div>
                <select
                  value={item.role}
                  onChange={(event) => patchUser(item.id, { role: event.target.value as AdminUser['role'] })}
                  className="h-9 rounded-lg border border-white/10 bg-[#0c1222] px-2 text-xs outline-none"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  value={item.plan}
                  onChange={(event) => patchUser(item.id, { plan: event.target.value as AdminUser['plan'] })}
                  className="h-9 rounded-lg border border-white/10 bg-[#0c1222] px-2 text-xs outline-none"
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                </select>
                <select
                  value={item.status}
                  onChange={(event) => patchUser(item.id, { status: event.target.value as AdminUser['status'] })}
                  className="h-9 rounded-lg border border-white/10 bg-[#0c1222] px-2 text-xs outline-none"
                >
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
                <div className="text-xs leading-5 text-slate-500">
                  <div>作品 {item.stats.works} · 公开 {item.stats.publicWorks} · Live {item.stats.liveRenders}</div>
                  <div>用量 {item.quota.usedThisMonth}/{item.quota.monthlyLimit} · 赞 {compact(item.stats.likes)}</div>
                </div>
              </div>
            ))}
            {!users.length && !userError ? <div className="px-4 py-6 text-sm text-slate-500">暂无用户</div> : null}
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">预留管理入口</h2>
              <p className="mt-1 text-sm text-slate-500">先占位信息架构，后续可逐步接入鉴权、数据库和任务队列。</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-500">Coming soon</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {moduleItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  disabled
                  className="group flex min-h-[116px] items-start justify-between rounded-lg border border-white/10 bg-[#0c1222] p-4 text-left opacity-80"
                >
                  <span>
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/6 text-cyan-200">
                      <Icon size={17} />
                    </span>
                    <span className="block text-sm font-semibold text-slate-200">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{item.desc}</span>
                  </span>
                  <ChevronRight size={16} className="mt-1 text-slate-600" />
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
