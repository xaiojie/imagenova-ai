import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const assetDir = path.join(dataDir, 'assets');
const uploadDir = path.join(dataDir, 'uploads');
const dbPath = path.join(dataDir, 'db.json');
const envPath = path.join(rootDir, '.env');

loadEnv(envPath);

const PORT = Number(process.env.PORT || 8787);
const SESSION_COOKIE = 'imagenova_session';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;
const DATA_DRIVER = process.env.DATA_DRIVER === 'mysql' ? 'mysql' : 'json';
let dbWriteQueue = Promise.resolve();
let mysqlPool;
let dataReady = false;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

function loadEnv(envPath) {
  if (!fsSync.existsSync(envPath)) return;
  const lines = fsSync.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeApiBase(baseUrl) {
  const value = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!value) return value;
  return value.endsWith('/v1') ? value : `${value}/v1`;
}

function getRuntimeConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    rawImageApiBase: String(process.env.IMAGE_API_BASE || 'https://api.openai.com/v1').trim().replace(/\/+$/, ''),
    imageApiBase: normalizeApiBase(process.env.IMAGE_API_BASE || 'https://api.openai.com/v1'),
    imageModel: process.env.IMAGE_MODEL || 'gpt-image-1',
    uiModelName: process.env.UI_MODEL_NAME || 'GPT-image2',
  };
}

function getMysqlConfig() {
  return {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || 'imagenova',
    user: process.env.MYSQL_USER || 'imagenova',
    password: process.env.MYSQL_PASSWORD || 'imagenova_dev',
  };
}

function getMysqlPool() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      ...getMysqlConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      charset: 'utf8mb4',
    });
  }
  return mysqlPool;
}

function maskApiKey(key) {
  if (!key) return '';
  if (key.length <= 12) return `${key.slice(0, 3)}***`;
  return `${key.slice(0, 7)}...${key.slice(-6)}`;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function parseCookies(req) {
  return String(req.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const index = item.indexOf('=');
      if (index > -1) acc[item.slice(0, index)] = decodeURIComponent(item.slice(index + 1));
      return acc;
    }, {});
}

function setSessionCookie(res, token, expiresAt) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function defaultQuota(plan = 'free') {
  return {
    monthlyLimit: plan === 'pro' ? 1000 : 80,
    usedThisMonth: 0,
    maxBatch: plan === 'pro' ? 8 : 4,
    hdDownload: plan === 'pro',
    privateGallery: plan === 'pro',
    concurrentJobs: plan === 'pro' ? 3 : 1,
  };
}

function makeUser({ email, password, name, role = 'user', plan = 'free', status = 'active' }) {
  const createdAt = now();
  return {
    id: id('user'),
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
    avatar: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U',
    role,
    plan,
    status,
    quota: defaultQuota(plan),
    createdAt,
    lastLoginAt: null,
  };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function getAuthor(user) {
  return { user: user?.name || 'Creator', avatar: user?.avatar || 'U' };
}

function parseDbJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

async function updateEnvFile(updates) {
  const existing = fsSync.existsSync(envPath) ? await fs.readFile(envPath, 'utf8') : '';
  const lines = existing.split(/\r?\n/);
  const seen = new Set();
  const nextLines = lines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (!match || !(match[1] in updates)) return line;
    const key = match[1];
    seen.add(key);
    return `${key}=${updates[key]}`;
  });

  Object.entries(updates).forEach(([key, value]) => {
    if (!seen.has(key)) nextLines.push(`${key}=${value}`);
  });

  await fs.writeFile(envPath, `${nextLines.filter((line, index) => line.trim() || index < nextLines.length - 1).join('\n')}\n`);
}

const ratioToSize = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '9:16': '1024x1536',
  '4:3': '1536x1024',
  '3:4': '1024x1536',
};

const stylePresets = {
  cinematic: { label: 'Cinematic', cn: '电影感', prompt: 'cinematic lighting, film grain, dramatic composition' },
  realistic: { label: 'Realistic', cn: '写实', prompt: 'photorealistic, natural texture, true-to-life lighting' },
  anime: { label: 'Anime', cn: '动漫', prompt: 'anime illustration, expressive character design, polished line art' },
  product: { label: 'Product Shot', cn: '产品', prompt: 'premium product photography, studio lighting, commercial poster' },
  concept: { label: 'Concept Art', cn: '概念', prompt: 'concept art, high detail environment design, painterly finish' },
  cyber: { label: 'Cyberpunk', cn: '赛博', prompt: 'cyberpunk neon, futuristic city mood, high contrast' },
  ink: { label: 'Chinese Ink', cn: '国风水墨', prompt: 'Chinese ink painting, misty atmosphere, poetic brush texture' },
  '3d': { label: '3D Render', cn: '三维', prompt: '3D render, octane style lighting, clean materials' },
};

const promptPresets = [
  { id: 'vr-exploded', category: 'product', title: 'VR 头显爆炸视图海报', cn: '产品爆炸图', prompt: '高科技 VR 头显的垂直堆叠爆炸视图海报，展示外壳、摄像头、主板、Pancake 透镜、电池、头带与面部接口，紫蓝渐变背景，8 个精致组件标注，简洁 3D 渲染，摄影棚灯光，发光装饰。', desc: '高科技产品爆炸图，适合硬件发布海报。', uses: 18640 },
  { id: 'food-map', category: 'infographic', title: '手绘城市美食地图', cn: '地图信息图', prompt: '复古羊皮纸上的水彩墨水手绘城市美食地图，标题为“成都吃货暴走地图”，包含卡通红辣椒吉祥物、绿叶与红辣椒藤蔓边框、编号当地特色美食、地标建筑和清晰图例。', desc: '手绘水彩旅游地图，包含美食、地标与图例。', uses: 17420 },
  { id: 'live-commerce', category: 'ui', title: '电商直播 UI 样机', cn: '直播界面', prompt: '逼真的社交媒体电商直播界面样机，人物肖像作为背景，叠加实时聊天消息、礼物弹窗、在线人数、商品购买卡片、限时优惠按钮和直播间互动控件，手机竖屏 UI。', desc: '直播带货界面与商品购买卡片样机。', uses: 16110 },
  { id: 'anime-fight', category: 'anime', title: '动漫武术对决', cn: '动作场景', prompt: '动态动漫插画，两名少女在传统木质道场内进行武术对决，低位拳法架势与闪避动作，元素光环、飞散木屑、强烈透视、运动模糊、戏剧性光影。', desc: '高动态动漫动作场景，适合角色和战斗海报。', uses: 15280 },
  { id: 'evolution-steps', category: 'infographic', title: '3D 石阶演化信息图', cn: '教育视觉', prompt: '将演化时间轴设计为高度逼真的 3D 石阶信息图，每一级石阶展示不同生物的照片级 3D 模型，配合结构化侧边栏、时间标签、自然材质和博物馆级展示灯光。', desc: '3D 教育信息图，把时间线变成石阶叙事。', uses: 14330 },
  { id: 'cyber-portrait', category: 'portrait', title: '赛博美学霓虹肖像', cn: '霓虹头像', prompt: '未来感赛博美学肖像，年轻女性佩戴发光霓虹黄色眼镜，脸部和夹克上投射数学公式与 HUD 图形，暗色电影背景，高对比霓虹光，科技感时尚摄影。', desc: '霓虹眼镜与 HUD 投影的赛博头像。', uses: 13960 },
];

const showcaseItems = [
  { url: '/assets/showcase/1776658772018-lukyfw-hgsufldbiaeimwz-b0eb3f27.jpg', prompt: promptPresets[0].prompt, ratio: '16:9', style: '3d', author: { user: 'YouMind Lab', avatar: 'Y' } },
  { url: '/assets/showcase/1776662673014-nf0taw-hgrmndybsaagg88-72e7da42.jpg', prompt: promptPresets[1].prompt, ratio: '16:9', style: 'ink', author: { user: 'Map Studio', avatar: 'M' } },
  { url: '/assets/showcase/1776699445498-ga2ry5-hgo7h0dwkaapdkk-ab96ec6c.jpg', prompt: promptPresets[2].prompt, ratio: '9:16', style: 'product', author: { user: 'Commerce UI', avatar: 'C' } },
  { url: '/assets/showcase/1776756799880-c8u8w7-hgukjjaasaavvra-a99be45a.jpg', prompt: promptPresets[3].prompt, ratio: '16:9', style: 'anime', author: { user: 'Anime Dojo', avatar: 'A' } },
  { url: '/assets/showcase/1776661968404-8a5flm-hgqc-koamaa2vt0-0d1ee4bb.jpg', prompt: promptPresets[4].prompt, ratio: '16:9', style: '3d', author: { user: 'Edu Visual', avatar: 'E' } },
  { url: '/assets/showcase/1778921891612-x61gjv-hix-aadakaqoycj-dd3480e1.jpg', prompt: promptPresets[5].prompt, ratio: '3:4', style: 'cyber', author: { user: 'Neon Face', avatar: 'N' } },
  { url: '/assets/showcase/1778922047354-0u5p7u-hiybwlowwaasxok-0dc6824c.jpg', prompt: 'Q 版动漫吉祥物特写插画，粉色双马尾女孩手持醒目的三角形品牌标志，白色干净背景，超大闪亮眼睛，柔和腮红，适合品牌头像与推广海报。', ratio: '1:1', style: 'anime', author: { user: 'Mascot Lab', avatar: 'Q' } },
  { url: '/assets/showcase/1778921879298-86knan-hix7rmjakacvvqz-db73c36e.jpg', prompt: 'Q 版旅行 Vlog 海报设计，迷你旅行者在世界城市中探险，巨大 3D 城市字体内填充地标摄影，光泽杂志质感，可爱而明亮。', ratio: '3:4', style: 'concept', author: { user: 'Vlog Poster', avatar: 'V' } },
  { url: '/assets/showcase/1778921961875-i1n9vo-hizvittbaaae-3g-393fd79d.jpg', prompt: '深色主题 PowerPoint 风格图像编辑窗口截图，展示背景移除后的梦幻可爱兔图标，日文界面、圆角模态框、42% 缩放指示器，适合 UI 原型展示。', ratio: '4:3', style: 'product', author: { user: 'Slide UI', avatar: 'S' } },
  { url: '/assets/showcase/1778921884401-0kutj1-hixcmi3auaaryej-8a859714.jpg', prompt: '柔和手工层叠纸雕插画，平滑圆润形状、极简面部细节、豆豆眼与红晕，温暖舒适的手作纸艺立体模型美学。', ratio: '3:4', style: 'concept', author: { user: 'Paper Craft', avatar: 'P' } },
  { url: '/assets/showcase/1778921974908-m837gj-hiv1z88bgaekx6z-188cdcb2.jpg', prompt: '2×2 照片级逼真眼镜店室内对比拼贴图，每个面板标注不同图像模型名称，现代光学商店、展示架、镜框细节与真实商业摄影质感。', ratio: '16:9', style: 'realistic', author: { user: 'Optic Grid', avatar: 'O' } },
  { url: '/assets/showcase/1778921976047-imleff-hiv12qfbuaaz4xy-c1c76ae9.jpg', prompt: '四格对比拼图，展示不同图像模型如何重现同一份日本 DX Report 信息图，白色背景、2×2 网格、密集日文图表与清晰信息层级。', ratio: '16:9', style: 'concept', author: { user: 'DX Report', avatar: 'D' } },
];

const mockPool = showcaseItems.map((item) => item.url);

function now() {
  return Date.now();
}

function id(prefix) {
  return `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultDb() {
  const createdAt = now() - 1000 * 60 * 60 * 12;
  const { imageModel, uiModelName } = getRuntimeConfig();
  const adminUser = makeUser({ email: 'admin@imagenova.local', password: 'admin123456', name: 'Admin', role: 'admin', plan: 'pro' });
  const demoUser = makeUser({ email: 'demo@imagenova.local', password: 'demo123456', name: 'nova.k', role: 'user', plan: 'free' });
  return {
    meta: { version: 1 },
    settings: {
      membership: {
        plan: 'free',
        maxBatch: 4,
        hdDownload: false,
        privateGallery: false,
        concurrentJobs: 1,
        monthlyLimit: 80,
        usedThisMonth: 0,
      },
      selectedModel: uiModelName,
    },
    users: [adminUser, demoUser],
    sessions: [],
    interactions: [],
    images: showcaseItems.slice(0, 8).map((item, index) => ({
      id: `seed_${index + 1}`,
      url: item.url,
      prompt: item.prompt,
      ratio: item.ratio,
      model: uiModelName,
      providerModel: imageModel,
      createdAt: createdAt - index * 1000 * 60 * 45,
      seed: 100000 + index * 721,
      quality: index % 3 === 0 ? 'standard' : 'ultra',
      creativity: 7.5,
      steps: 42,
      style: item.style,
      source: 'mock',
      owner: index < 2 ? demoUser.id : `creator_${index}`,
      ownerId: index < 2 ? demoUser.id : null,
      author: index < 2 ? getAuthor(demoUser) : item.author,
      public: index > 1,
      private: index <= 1,
      likes: 120 + index * 317,
      saves: 18 + index * 41,
      copies: 0,
      shares: 0,
      liked: false,
      saved: false,
      referenceImage: null,
    })),
    promptPresets,
    notifications: [
      { id: 'n_1', type: 'system', title: 'Welcome to ImageNova', body: 'Demo backend is ready. Set OPENAI_API_KEY on the server for live generation.', read: false, createdAt: now() },
    ],
  };
}

async function ensureData() {
  await fs.mkdir(assetDir, { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
  if (dataReady) return;
  if (DATA_DRIVER === 'mysql') {
    await ensureMysqlData();
    dataReady = true;
    return;
  }
  try {
    await fs.access(dbPath);
    const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));
    if (migrateDb(db)) await writeDb(db);
  } catch {
    await writeDb(defaultDb());
  }
  dataReady = true;
}

async function ensureMysqlData() {
  await ensureMysqlSchema();
  const pool = getMysqlPool();
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM app_settings');
  if (Number(rows[0]?.total || 0) > 0) return;

  let seed = defaultDb();
  if (fsSync.existsSync(dbPath)) {
    try {
      seed = JSON.parse(await fs.readFile(dbPath, 'utf8'));
      migrateDb(seed);
    } catch {
      seed = defaultDb();
    }
  }
  await writeMysqlDb(seed);
}

async function ensureMysqlSchema() {
  const pool = getMysqlPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      \`key\` VARCHAR(80) PRIMARY KEY,
      \`value\` JSON NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(80) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name VARCHAR(120) NOT NULL,
      avatar VARCHAR(16) NOT NULL,
      role VARCHAR(32) NOT NULL,
      plan VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      quota JSON NOT NULL,
      created_at BIGINT NOT NULL,
      last_login_at BIGINT NULL,
      INDEX idx_users_role (role),
      INDEX idx_users_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(80) PRIMARY KEY,
      user_id VARCHAR(80) NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL,
      INDEX idx_sessions_user (user_id),
      INDEX idx_sessions_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS images (
      id VARCHAR(80) PRIMARY KEY,
      owner_id VARCHAR(80) NULL,
      owner VARCHAR(80) NULL,
      url TEXT NOT NULL,
      prompt TEXT NOT NULL,
      original_prompt TEXT NULL,
      ratio VARCHAR(16) NOT NULL,
      model VARCHAR(80) NOT NULL,
      provider_model VARCHAR(80) NULL,
      created_at BIGINT NOT NULL,
      seed BIGINT NULL,
      quality VARCHAR(32) NULL,
      creativity DOUBLE NULL,
      steps INT NULL,
      style VARCHAR(40) NULL,
      source VARCHAR(20) NOT NULL,
      author JSON NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      is_private BOOLEAN NOT NULL DEFAULT TRUE,
      likes INT NOT NULL DEFAULT 0,
      saves INT NOT NULL DEFAULT 0,
      copies INT NOT NULL DEFAULT 0,
      shares INT NOT NULL DEFAULT 0,
      reference_image TEXT NULL,
      extra JSON NULL,
      INDEX idx_images_owner (owner_id),
      INDEX idx_images_public (is_public),
      INDEX idx_images_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS interactions (
      id VARCHAR(80) PRIMARY KEY,
      user_id VARCHAR(80) NOT NULL,
      image_id VARCHAR(80) NOT NULL,
      liked BOOLEAN NOT NULL DEFAULT FALSE,
      saved BOOLEAN NOT NULL DEFAULT FALSE,
      copies INT NOT NULL DEFAULT 0,
      shares INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL,
      UNIQUE KEY uniq_interaction_user_image (user_id, image_id),
      INDEX idx_interactions_image (image_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompt_presets (
      id VARCHAR(80) PRIMARY KEY,
      category VARCHAR(80) NOT NULL,
      title VARCHAR(255) NOT NULL,
      cn VARCHAR(255) NULL,
      prompt TEXT NOT NULL,
      \`desc\` TEXT NULL,
      uses INT NOT NULL DEFAULT 0,
      extra JSON NULL,
      INDEX idx_prompts_category (category),
      INDEX idx_prompts_uses (uses)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(80) PRIMARY KEY,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NULL,
      \`read\` BOOLEAN NOT NULL DEFAULT FALSE,
      created_at BIGINT NOT NULL,
      extra JSON NULL,
      INDEX idx_notifications_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function migrateDb(db) {
  let changed = false;
  db.meta ||= { version: 1 };
  db.settings ||= {};
  db.settings.membership ||= { plan: 'free', ...defaultQuota('free') };
  db.images ||= [];
  db.notifications ||= [];
  db.promptPresets ||= promptPresets;

  if (!Array.isArray(db.users)) {
    const adminUser = makeUser({ email: 'admin@imagenova.local', password: 'admin123456', name: 'Admin', role: 'admin', plan: 'pro' });
    const demoUser = makeUser({ email: 'demo@imagenova.local', password: 'demo123456', name: 'nova.k', role: 'user', plan: 'free' });
    const usedThisMonth = db.settings?.membership?.usedThisMonth || 0;
    demoUser.quota.usedThisMonth = usedThisMonth;
    db.users = [adminUser, demoUser];
    db.images.forEach((image) => {
      if (image.owner === 'me' || !image.ownerId) {
        image.owner = demoUser.id;
        image.ownerId = demoUser.id;
        image.author = getAuthor(demoUser);
      }
    });
    changed = true;
  }

  if (!Array.isArray(db.sessions)) {
    db.sessions = [];
    changed = true;
  }

  if (!Array.isArray(db.interactions)) {
    db.interactions = [];
    db.images.forEach((image) => {
      delete image.liked;
      delete image.saved;
    });
    changed = true;
  }

  db.users.forEach((user) => {
    if (!user.status) {
      user.status = 'active';
      changed = true;
    }
    if (!user.plan) {
      user.plan = user.role === 'admin' ? 'pro' : 'free';
      changed = true;
    }
    if (!user.quota) {
      user.quota = defaultQuota(user.plan);
      changed = true;
    }
    if (!user.avatar) {
      user.avatar = user.name?.slice(0, 2).toUpperCase() || 'U';
      changed = true;
    }
  });

  const demoUser = db.users.find((user) => user.email === 'demo@imagenova.local') || db.users.find((user) => user.role === 'user') || db.users[0];
  db.images.forEach((image) => {
    if (image.owner === 'me') {
      image.owner = demoUser.id;
      changed = true;
    }
    if (!image.ownerId && db.users.some((user) => user.id === image.owner)) {
      image.ownerId = image.owner;
      changed = true;
    }
    if (!image.ownerId && image.author?.user === 'nova.k') {
      image.ownerId = demoUser.id;
      image.owner = demoUser.id;
      image.author = getAuthor(demoUser);
      changed = true;
    }
    if ('liked' in image) {
      delete image.liked;
      changed = true;
    }
    if ('saved' in image) {
      delete image.saved;
      changed = true;
    }
  });

  db.sessions = db.sessions.filter((session) => session.expiresAt > now());
  return changed;
}

async function readDb() {
  await ensureData();
  if (DATA_DRIVER === 'mysql') return readMysqlDb();
  return JSON.parse(await fs.readFile(dbPath, 'utf8'));
}

async function writeDb(db) {
  if (DATA_DRIVER === 'mysql') {
    await writeMysqlDb(db);
    return;
  }
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

async function readMysqlDb() {
  const pool = getMysqlPool();
  const [[metaRow], [settingsRows], [userRows], [sessionRows], [imageRows], [interactionRows], [promptRows], [notificationRows]] = await Promise.all([
    pool.query("SELECT `value` FROM app_settings WHERE `key` = 'meta'"),
    pool.query("SELECT `key`, `value` FROM app_settings WHERE `key` <> 'meta'"),
    pool.query('SELECT * FROM users ORDER BY created_at DESC'),
    pool.query('SELECT * FROM sessions WHERE expires_at > ? ORDER BY created_at DESC', [now()]),
    pool.query('SELECT * FROM images ORDER BY created_at DESC'),
    pool.query('SELECT * FROM interactions ORDER BY updated_at DESC'),
    pool.query('SELECT * FROM prompt_presets ORDER BY uses DESC'),
    pool.query('SELECT * FROM notifications ORDER BY created_at DESC'),
  ]);

  const settings = {};
  settingsRows.forEach((row) => {
    settings[row.key] = parseDbJson(row.value);
  });

  return {
    meta: parseDbJson(metaRow[0]?.value, { version: 1 }),
    settings,
    users: userRows.map((row) => ({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      avatar: row.avatar,
      role: row.role,
      plan: row.plan,
      status: row.status,
      quota: parseDbJson(row.quota, defaultQuota(row.plan)),
      createdAt: Number(row.created_at),
      lastLoginAt: row.last_login_at == null ? null : Number(row.last_login_at),
    })),
    sessions: sessionRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      createdAt: Number(row.created_at),
      expiresAt: Number(row.expires_at),
    })),
    images: imageRows.map((row) => ({
      ...(parseDbJson(row.extra, {}) || {}),
      id: row.id,
      url: row.url,
      prompt: row.prompt,
      originalPrompt: row.original_prompt,
      ratio: row.ratio,
      model: row.model,
      providerModel: row.provider_model,
      createdAt: Number(row.created_at),
      seed: row.seed == null ? null : Number(row.seed),
      quality: row.quality,
      creativity: row.creativity == null ? null : Number(row.creativity),
      steps: row.steps,
      style: row.style,
      source: row.source,
      owner: row.owner,
      ownerId: row.owner_id,
      author: parseDbJson(row.author, { user: 'Creator', avatar: 'C' }),
      public: Boolean(row.is_public),
      private: Boolean(row.is_private),
      likes: Number(row.likes || 0),
      saves: Number(row.saves || 0),
      copies: Number(row.copies || 0),
      shares: Number(row.shares || 0),
      referenceImage: row.reference_image,
    })),
    interactions: interactionRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      imageId: row.image_id,
      liked: Boolean(row.liked),
      saved: Boolean(row.saved),
      copies: Number(row.copies || 0),
      shares: Number(row.shares || 0),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    })),
    promptPresets: promptRows.map((row) => ({
      ...(parseDbJson(row.extra, {}) || {}),
      id: row.id,
      category: row.category,
      title: row.title,
      cn: row.cn,
      prompt: row.prompt,
      desc: row.desc,
      uses: Number(row.uses || 0),
    })),
    notifications: notificationRows.map((row) => ({
      ...(parseDbJson(row.extra, {}) || {}),
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      read: Boolean(row.read),
      createdAt: Number(row.created_at),
    })),
  };
}

async function writeMysqlDb(db) {
  migrateDb(db);
  const pool = getMysqlPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM interactions');
    await conn.query('DELETE FROM sessions');
    await conn.query('DELETE FROM images');
    await conn.query('DELETE FROM prompt_presets');
    await conn.query('DELETE FROM notifications');
    await conn.query('DELETE FROM users');
    await conn.query('DELETE FROM app_settings');

    await conn.query('INSERT INTO app_settings (`key`, `value`) VALUES (?, CAST(? AS JSON))', ['meta', JSON.stringify(db.meta || { version: 1 })]);
    for (const [key, value] of Object.entries(db.settings || {})) {
      await conn.query('INSERT INTO app_settings (`key`, `value`) VALUES (?, CAST(? AS JSON))', [key, JSON.stringify(value)]);
    }

    for (const user of db.users || []) {
      await conn.query(
        `INSERT INTO users (id, email, password_hash, name, avatar, role, plan, status, quota, created_at, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?)`,
        [user.id, user.email, user.passwordHash, user.name, user.avatar, user.role, user.plan, user.status, JSON.stringify(user.quota || defaultQuota(user.plan)), user.createdAt || now(), user.lastLoginAt],
      );
    }

    for (const session of db.sessions || []) {
      await conn.query(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [session.id, session.userId, session.tokenHash, session.createdAt || now(), session.expiresAt],
      );
    }

    for (const image of db.images || []) {
      const known = new Set(['id', 'url', 'prompt', 'originalPrompt', 'ratio', 'model', 'providerModel', 'createdAt', 'seed', 'quality', 'creativity', 'steps', 'style', 'source', 'owner', 'ownerId', 'author', 'public', 'private', 'likes', 'saves', 'copies', 'shares', 'referenceImage', 'liked', 'saved']);
      const extra = Object.fromEntries(Object.entries(image).filter(([key]) => !known.has(key)));
      await conn.query(
        `INSERT INTO images (id, owner_id, owner, url, prompt, original_prompt, ratio, model, provider_model, created_at, seed, quality, creativity, steps, style, source, author, is_public, is_private, likes, saves, copies, shares, reference_image, extra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        [
          image.id, image.ownerId || null, image.owner || image.ownerId || null, image.url, image.prompt, image.originalPrompt || null,
          image.ratio, image.model, image.providerModel || null, image.createdAt || now(), image.seed || null, image.quality || null,
          image.creativity ?? null, image.steps ?? null, image.style || null, image.source || 'mock', JSON.stringify(image.author || { user: 'Creator', avatar: 'C' }),
          Boolean(image.public), Boolean(image.private), image.likes || 0, image.saves || 0, image.copies || 0, image.shares || 0,
          image.referenceImage || null, JSON.stringify(extra),
        ],
      );
    }

    for (const item of db.interactions || []) {
      await conn.query(
        `INSERT INTO interactions (id, user_id, image_id, liked, saved, copies, shares, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.userId, item.imageId, Boolean(item.liked), Boolean(item.saved), item.copies || 0, item.shares || 0, item.createdAt || now(), item.updatedAt || now()],
      );
    }

    for (const preset of db.promptPresets || []) {
      const known = new Set(['id', 'category', 'title', 'cn', 'prompt', 'desc', 'uses']);
      const extra = Object.fromEntries(Object.entries(preset).filter(([key]) => !known.has(key)));
      await conn.query(
        `INSERT INTO prompt_presets (id, category, title, cn, prompt, \`desc\`, uses, extra)
         VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        [preset.id, preset.category, preset.title, preset.cn || null, preset.prompt, preset.desc || null, preset.uses || 0, JSON.stringify(extra)],
      );
    }

    for (const note of db.notifications || []) {
      const known = new Set(['id', 'type', 'title', 'body', 'read', 'createdAt']);
      const extra = Object.fromEntries(Object.entries(note).filter(([key]) => !known.has(key)));
      await conn.query(
        `INSERT INTO notifications (id, type, title, body, \`read\`, created_at, extra)
         VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON))`,
        [note.id, note.type || 'system', note.title, note.body || null, Boolean(note.read), note.createdAt || now(), JSON.stringify(extra)],
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

function updateDb(mutator) {
  const run = dbWriteQueue.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  });
  dbWriteQueue = run.catch(() => {});
  return run;
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeGenerationBody(body) {
  const prompt = String(body.prompt || '').trim();
  const ratio = ratioToSize[body.ratio] ? body.ratio : '1:1';
  const style = stylePresets[body.style] ? body.style : 'cinematic';
  const quality = ['standard', 'hd', 'ultra'].includes(body.quality) ? body.quality : 'ultra';
  const creativity = Math.max(0, Math.min(10, Number(body.creativity || 7.5)));
  const seed = clampInt(body.seed, 1, 999999999, Math.floor(Math.random() * 1_000_000));
  const publish = body.publish === true || body.publish === 'true';
  const n = clampInt(body.n, 1, 8, 4);
  const tags = Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  return { prompt, ratio, style, quality, creativity, seed, publish, n, tags };
}

function buildFinalPrompt(req) {
  const stylePrompt = stylePresets[req.style]?.prompt;
  const parts = [req.prompt, stylePrompt, ...req.tags].filter(Boolean);
  parts.push(`creativity ${req.creativity}/10`);
  return parts.join(', ');
}

function toOpenAiQuality(quality) {
  if (quality === 'standard') return 'auto';
  if (quality === 'hd') return 'high';
  return 'auto';
}

async function callOpenAiImage(req, referenceFile) {
  const { apiKey, imageApiBase, imageModel } = getRuntimeConfig();
  const endpoint = referenceFile ? `${imageApiBase}/images/edits` : `${imageApiBase}/images/generations`;
  const finalPrompt = buildFinalPrompt(req);

  const fetchImage = async () => {
    if (!referenceFile) {
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: finalPrompt,
          size: ratioToSize[req.ratio],
          n: req.n,
          quality: toOpenAiQuality(req.quality),
          background: 'auto',
          output_format: 'png',
        }),
      });
    }

    const form = new FormData();
    form.append('model', imageModel);
    form.append('prompt', finalPrompt);
    form.append('size', ratioToSize[req.ratio]);
    form.append('n', String(req.n));
    form.append('quality', toOpenAiQuality(req.quality));
    form.append('background', 'auto');
    form.append('output_format', 'png');
    form.append('image', new Blob([referenceFile.buffer], { type: referenceFile.mimetype }), referenceFile.originalname || 'reference.png');
    return fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  };

  let res;
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      res = await fetchImage();
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  if (!res) throw lastError || new Error('Image provider request failed.');

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image API ${res.status}: ${text.slice(0, 280)}`);
  }
  const data = await res.json();
  return data.data || [];
}

async function callOpenAiImages(req, referenceFile) {
  const requested = req.n;
  const items = [];
  let attempts = 0;

  while (items.length < requested && attempts < requested) {
    const remaining = requested - items.length;
    let next;
    try {
      next = await callOpenAiImage({ ...req, n: remaining }, referenceFile);
    } catch (error) {
      if (remaining <= 1) throw error;
      next = await callOpenAiImage({ ...req, n: 1 }, referenceFile);
    }
    if (next.length === 0) break;
    items.push(...next.slice(0, remaining));
    attempts += 1;
  }

  return items;
}

async function persistApiImage(payload, imageId, index) {
  if (payload.b64_json) {
    const filename = `${imageId}_${index}.png`;
    await fs.writeFile(path.join(assetDir, filename), Buffer.from(payload.b64_json, 'base64'));
    return `/api/assets/${filename}`;
  }

  if (payload.url) {
    try {
      const response = await fetch(payload.url);
      if (!response.ok || !response.body) throw new Error(`download ${response.status}`);
      const filename = `${imageId}_${index}.png`;
      await pipeline(response.body, createWriteStream(path.join(assetDir, filename)));
      return `/api/assets/${filename}`;
    } catch {
      return payload.url;
    }
  }

  return '';
}

async function saveReference(file) {
  if (!file) return null;
  const ext = path.extname(file.originalname || '') || '.png';
  const filename = `${id('ref')}${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), file.buffer);
  return `/api/uploads/${filename}`;
}

function createImageRecord(base, url, source, index, referenceImage, user) {
  const imageId = id('img');
  const { imageModel, uiModelName } = getRuntimeConfig();
  return {
    id: imageId,
    url,
    prompt: buildFinalPrompt(base),
    originalPrompt: base.prompt,
    ratio: base.ratio,
    model: uiModelName,
    providerModel: imageModel,
    createdAt: now(),
    seed: base.seed + index,
    quality: base.quality,
    creativity: base.creativity,
    steps: source === 'api' ? null : 42,
    style: base.style,
    source,
    owner: user.id,
    ownerId: user.id,
    author: getAuthor(user),
    public: base.publish,
    private: !base.publish,
    likes: 0,
    saves: 0,
    copies: 0,
    shares: 0,
    liked: false,
    saved: false,
    referenceImage,
  };
}

function sortImages(items, sort = 'recent') {
  const list = [...items];
  if (sort === 'trending') return list.sort((a, b) => ((b.likes * 2) + b.saves + b.shares) - ((a.likes * 2) + a.saves + a.shares));
  if (sort === 'rising') return list.sort((a, b) => ((b.likes + b.saves) / Math.max(1, (now() - b.createdAt) / 3600000)) - ((a.likes + a.saves) / Math.max(1, (now() - a.createdAt) / 3600000)));
  if (sort === 'oldest') return list.sort((a, b) => a.createdAt - b.createdAt);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

function filterImages(items, query) {
  let result = [...items];
  if (query.tab === 'public') result = result.filter((i) => i.public);
  if (query.tab === 'private') result = result.filter((i) => i.private);
  if (query.tab === 'liked') result = result.filter((i) => i.liked || i.saved);
  if (query.ratio) result = result.filter((i) => i.ratio === query.ratio);
  if (query.style) result = result.filter((i) => i.style === query.style);
  if (query.source) result = result.filter((i) => i.source === query.source);
  if (query.q) {
    const q = String(query.q).toLowerCase();
    result = result.filter((i) => `${i.prompt} ${i.author?.user || ''}`.toLowerCase().includes(q));
  }
  return result;
}

function paginate(items, query) {
  const page = clampInt(query.page, 1, 9999, 1);
  const pageSize = clampInt(query.pageSize, 1, 60, 12);
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total: items.length,
    hasMore: start + pageSize < items.length,
    items: items.slice(start, start + pageSize),
  };
}

async function findImage(idValue) {
  const db = await readDb();
  const image = db.images.find((i) => i.id === idValue);
  return { db, image };
}

function getSessionToken(req) {
  return parseCookies(req)[SESSION_COOKIE] || '';
}

function getUserFromDb(db, req) {
  const token = getSessionToken(req);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const session = db.sessions.find((item) => item.tokenHash === tokenHash && item.expiresAt > now());
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId && item.status === 'active');
  return user || null;
}

async function requireUser(req, res) {
  const db = await readDb();
  const user = getUserFromDb(db, req);
  if (!user) {
    res.status(401).json({ error: 'Please sign in first.' });
    return null;
  }
  return { db, user };
}

async function requireAdmin(req, res) {
  const auth = await requireUser(req, res);
  if (!auth) return null;
  if (auth.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin permission is required.' });
    return null;
  }
  return auth;
}

function membershipForUser(user) {
  const quota = user?.quota || defaultQuota(user?.plan || 'free');
  return {
    plan: user?.plan || 'free',
    maxBatch: quota.maxBatch,
    hdDownload: quota.hdDownload,
    privateGallery: quota.privateGallery,
    concurrentJobs: quota.concurrentJobs,
    monthlyLimit: quota.monthlyLimit,
    usedThisMonth: quota.usedThisMonth || 0,
  };
}

function hydrateImages(db, items, user) {
  const interactions = user ? db.interactions.filter((item) => item.userId === user.id) : [];
  return items.map((image) => {
    const interaction = interactions.find((item) => item.imageId === image.id);
    return {
      ...image,
      liked: Boolean(interaction?.liked),
      saved: Boolean(interaction?.saved),
    };
  });
}

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/assets', express.static(assetDir));
app.use('/api/uploads', express.static(uploadDir));

app.get('/api/auth/me', async (req, res) => {
  const db = await readDb();
  const user = getUserFromDb(db, req);
  res.json({ user: sanitizeUser(user), membership: membershipForUser(user) });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim() || email.split('@')[0];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const result = await updateDb((db) => {
      if (db.users.some((user) => user.email === email)) return null;
      const user = makeUser({ email, password, name, role: 'user', plan: 'free' });
      const token = randomBytes(32).toString('hex');
      const expiresAt = now() + SESSION_TTL;
      user.lastLoginAt = now();
      db.users.push(user);
      db.sessions.push({ id: id('sess'), userId: user.id, tokenHash: hashToken(token), createdAt: now(), expiresAt });
      return { user, token, expiresAt };
    });

    if (!result) return res.status(409).json({ error: 'Email is already registered.' });
    setSessionCookie(res, result.token, result.expiresAt);
    res.json({ user: sanitizeUser(result.user), membership: membershipForUser(result.user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Register failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const result = await updateDb((db) => {
      const user = db.users.find((item) => item.email === email);
      if (!user || user.status !== 'active' || !verifyPassword(password, user.passwordHash)) return null;
      const token = randomBytes(32).toString('hex');
      const expiresAt = now() + SESSION_TTL;
      user.lastLoginAt = now();
      db.sessions.push({ id: id('sess'), userId: user.id, tokenHash: hashToken(token), createdAt: now(), expiresAt });
      db.sessions = db.sessions.filter((session) => session.expiresAt > now());
      return { user, token, expiresAt };
    });

    if (!result) return res.status(401).json({ error: 'Invalid email or password.' });
    setSessionCookie(res, result.token, result.expiresAt);
    res.json({ user: sanitizeUser(result.user), membership: membershipForUser(result.user) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Login failed.' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const token = getSessionToken(req);
  if (token) {
    const tokenHash = hashToken(token);
    await updateDb((db) => {
      db.sessions = db.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/health', async (req, res) => {
  const db = await readDb();
  const user = getUserFromDb(db, req);
  const { apiKey, imageModel, uiModelName } = getRuntimeConfig();
  res.json({ ok: true, hasApiKey: Boolean(apiKey), model: uiModelName, providerModel: imageModel, membership: membershipForUser(user), user: sanitizeUser(user) });
});

app.get('/api/models', (_req, res) => {
  const { apiKey, imageModel, uiModelName } = getRuntimeConfig();
  res.json({
    selected: uiModelName,
    models: [
      { id: uiModelName, providerModel: imageModel, name: uiModelName, status: apiKey ? 'live' : 'demo', supportsReference: true },
      { id: 'mock-nova', providerModel: 'mock', name: 'Mock Nova', status: 'demo', supportsReference: false },
    ],
  });
});

app.get('/api/admin/config', (_req, res) => {
  const { apiKey, rawImageApiBase, imageApiBase, imageModel, uiModelName } = getRuntimeConfig();
  res.json({
    imageApiBase: rawImageApiBase,
    normalizedImageApiBase: imageApiBase,
    imageModel,
    uiModelName,
    hasApiKey: Boolean(apiKey),
    maskedApiKey: maskApiKey(apiKey),
    port: PORT,
  });
});

app.put('/api/admin/config', async (req, res) => {
  try {
    const imageApiBase = String(req.body?.imageApiBase || '').trim().replace(/\/+$/, '');
    const apiKey = String(req.body?.apiKey || '').trim();
    const imageModel = String(req.body?.imageModel || '').trim();
    const uiModelName = String(req.body?.uiModelName || '').trim();

    if (!imageApiBase) return res.status(400).json({ error: 'API Base is required.' });
    if (!imageModel) return res.status(400).json({ error: 'Default provider model is required.' });
    if (!uiModelName) return res.status(400).json({ error: 'Display model name is required.' });

    const updates = {
      IMAGE_API_BASE: imageApiBase,
      IMAGE_MODEL: imageModel,
      UI_MODEL_NAME: uiModelName,
      PORT: String(PORT),
    };
    if (apiKey && !apiKey.includes('*') && !apiKey.includes('...')) updates.OPENAI_API_KEY = apiKey;

    Object.assign(process.env, updates);
    await updateEnvFile(updates);

    const next = getRuntimeConfig();
    res.json({
      ok: true,
      imageApiBase: next.rawImageApiBase,
      normalizedImageApiBase: next.imageApiBase,
      imageModel: next.imageModel,
      uiModelName: next.uiModelName,
      hasApiKey: Boolean(next.apiKey),
      maskedApiKey: maskApiKey(next.apiKey),
      port: PORT,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Save config failed.' });
  }
});

app.get('/api/admin/overview', async (_req, res) => {
  const db = await readDb();
  const images = db.images || [];
  const publicImages = images.filter((i) => i.public);
  const myWorks = images.filter((i) => i.ownerId || i.owner);
  const sinceMonth = now() - 1000 * 60 * 60 * 24 * 30;
  res.json({
    users: db.users?.length || 0,
    activeUsers: db.users?.filter((user) => user.status === 'active').length || 0,
    works: myWorks.length,
    publicWorks: publicImages.length,
    liveRenders: images.filter((i) => i.source === 'api').length,
    mockRenders: images.filter((i) => i.source === 'mock').length,
    promptPresets: (db.promptPresets || []).length,
    usedThisMonth: db.settings?.membership?.usedThisMonth || images.filter((i) => i.createdAt >= sinceMonth).length,
    totalLikes: images.reduce((sum, i) => sum + (i.likes || 0), 0),
    totalSaves: images.reduce((sum, i) => sum + (i.saves || 0), 0),
    recent: images
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .map((i) => ({ id: i.id, prompt: i.originalPrompt || i.prompt, source: i.source, createdAt: i.createdAt, ratio: i.ratio, public: i.public })),
  });
});

app.get('/api/admin/users', async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { db } = auth;
  const users = db.users
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((user) => {
      const works = db.images.filter((image) => image.ownerId === user.id || image.owner === user.id);
      return {
        ...sanitizeUser(user),
        stats: {
          works: works.length,
          publicWorks: works.filter((image) => image.public).length,
          liveRenders: works.filter((image) => image.source === 'api').length,
          likes: works.reduce((sum, image) => sum + (image.likes || 0), 0),
        },
      };
    });
  res.json({ items: users });
});

app.patch('/api/admin/users/:id', async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  try {
    const updated = await updateDb((db) => {
      const user = db.users.find((item) => item.id === req.params.id);
      if (!user) return null;
      if (['active', 'disabled'].includes(req.body.status)) user.status = req.body.status;
      if (['user', 'admin'].includes(req.body.role)) user.role = req.body.role;
      if (['free', 'pro'].includes(req.body.plan)) {
        user.plan = req.body.plan;
        user.quota = { ...defaultQuota(req.body.plan), usedThisMonth: user.quota?.usedThisMonth || 0 };
      }
      return sanitizeUser(user);
    });
    if (!updated) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Update user failed.' });
  }
});

app.get('/api/membership', async (req, res) => {
  const db = await readDb();
  const user = getUserFromDb(db, req);
  res.json(membershipForUser(user));
});

app.get('/api/notifications', async (_req, res) => {
  const db = await readDb();
  res.json({ items: db.notifications.sort((a, b) => b.createdAt - a.createdAt) });
});

app.post('/api/inspiration', express.json(), (req, res) => {
  const style = stylePresets[req.body?.style] || stylePresets.cinematic;
  const seeds = [
    '未来城市中的赛博朋克少女，雨夜霓虹反射，电影级光影，35mm 胶片颗粒',
    '一款透明玻璃质感的智能耳机，漂浮在柔和渐变背景中，高级商业海报',
    '水墨山峦中的未来空间站，云雾缭绕，国风科幻，留白构图',
    '孤独宇航员站在粉色沙漠，远处有巨大月亮，概念艺术，体积光',
    '复古游戏角色设定图，精致服装，表情丰富，黄金时刻边缘光',
  ];
  const base = String(req.body?.prompt || '').trim();
  const pick = seeds[Math.floor(Math.random() * seeds.length)];
  res.json({ prompt: base ? `${base}，${style.cn}，${style.prompt}` : pick });
});

app.post('/api/generate', upload.single('reference'), async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;
    const { user } = auth;
    const { apiKey } = getRuntimeConfig();
    const body = normalizeGenerationBody(req.body);
    if (!body.prompt) return res.status(400).json({ error: 'Prompt is required.' });
    if (body.prompt.length > 1500) return res.status(400).json({ error: 'Prompt must be 1500 characters or less.' });

    const membership = membershipForUser(user);
    const remaining = Math.max(0, membership.monthlyLimit - membership.usedThisMonth);
    if (remaining <= 0) return res.status(402).json({ error: 'Monthly generation quota has been used up.' });
    body.n = Math.min(body.n, membership.maxBatch || 4, remaining);
    const referenceImage = await saveReference(req.file);

    let records = [];
    if (apiKey) {
      try {
        const apiItems = await callOpenAiImages(body, req.file);
        for (let i = 0; i < apiItems.length; i += 1) {
          const imageId = id('img');
          const url = await persistApiImage(apiItems[i], imageId, i);
          records.push({ ...createImageRecord(body, url, 'api', i, referenceImage, user), id: imageId });
        }
      } catch (error) {
        await updateDb((db) => {
          db.notifications.unshift({ id: id('n'), type: 'warning', title: 'Live generation failed', body: error.message, read: false, createdAt: now() });
        });
      }
    }

    if (records.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      records = Array.from({ length: body.n }).map((_, i) => createImageRecord(body, mockPool[(now() + i) % mockPool.length], 'mock', i, referenceImage, user));
    }

    await updateDb((db) => {
      const freshUser = db.users.find((item) => item.id === user.id);
      db.images.unshift(...records);
      if (freshUser) {
        freshUser.quota ||= defaultQuota(freshUser.plan);
        freshUser.quota.usedThisMonth = (freshUser.quota.usedThisMonth || 0) + records.length;
      }
    });
    res.json({ items: records, source: records[0]?.source || 'mock' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Generation failed.' });
  }
});

app.get('/api/works', async (req, res) => {
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { db, user } = auth;
  const mine = hydrateImages(db, db.images.filter((i) => i.ownerId === user.id || i.owner === user.id), user);
  const filtered = filterImages(mine, req.query);
  const sorted = sortImages(filtered, req.query.sort || 'recent');
  res.json({ ...paginate(sorted, req.query), stats: {
    total: mine.length,
    live: mine.filter((i) => i.source === 'api').length,
    likes: mine.reduce((sum, i) => sum + i.likes, 0),
    saves: mine.reduce((sum, i) => sum + i.saves, 0),
  } });
});

app.get('/api/gallery', async (req, res) => {
  const db = await readDb();
  const user = getUserFromDb(db, req);
  const publicImages = hydrateImages(db, db.images.filter((i) => i.public), user);
  const filtered = filterImages(publicImages, req.query);
  const sorted = sortImages(filtered, req.query.sort || req.query.filter || 'trending');
  res.json(paginate(sorted, req.query));
});

app.get('/api/images/:id', async (req, res) => {
  const { db, image } = await findImage(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  const user = getUserFromDb(db, req);
  res.json(hydrateImages(db, [image], user)[0]);
});

app.patch('/api/images/:id', async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;
    const { user } = auth;
    const image = await updateDb((db) => {
      const target = db.images.find((i) => i.id === req.params.id);
      if (!target) return null;
      if (target.ownerId !== user.id && target.owner !== user.id && user.role !== 'admin') return false;
      if (typeof req.body.public === 'boolean') {
        target.public = req.body.public;
        target.private = !req.body.public;
      }
      if (req.body.style && stylePresets[req.body.style]) target.style = req.body.style;
      return target;
    });
    if (!image) return res.status(image === false ? 403 : 404).json({ error: image === false ? 'No permission to update this image.' : 'Image not found.' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Update failed.' });
  }
});

app.delete('/api/works/:id', async (req, res) => {
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { user } = auth;
  const ok = await updateDb((db) => {
    const before = db.images.length;
    db.images = db.images.filter((i) => !(i.id === req.params.id && (i.ownerId === user.id || i.owner === user.id)));
    db.interactions = db.interactions.filter((item) => item.imageId !== req.params.id);
    return before !== db.images.length;
  });
  res.json({ ok });
});

app.post('/api/images/:id/:action', async (req, res) => {
  const auth = await requireUser(req, res);
  if (!auth) return;
  const { user } = auth;
  const image = await updateDb((db) => {
    const target = db.images.find((i) => i.id === req.params.id);
    if (!target) return null;
    let interaction = db.interactions.find((item) => item.userId === user.id && item.imageId === target.id);
    if (!interaction) {
      interaction = { id: id('act'), userId: user.id, imageId: target.id, liked: false, saved: false, copies: 0, shares: 0, createdAt: now(), updatedAt: now() };
      db.interactions.push(interaction);
    }
    if (req.params.action === 'like') {
      interaction.liked = !interaction.liked;
      target.likes = Math.max(0, (target.likes || 0) + (interaction.liked ? 1 : -1));
    } else if (req.params.action === 'save') {
      interaction.saved = !interaction.saved;
      target.saves = Math.max(0, (target.saves || 0) + (interaction.saved ? 1 : -1));
    } else if (req.params.action === 'copy') {
      target.copies = (target.copies || 0) + 1;
      interaction.copies = (interaction.copies || 0) + 1;
    } else if (req.params.action === 'share') {
      target.shares = (target.shares || 0) + 1;
      interaction.shares = (interaction.shares || 0) + 1;
    } else {
      return false;
    }
    interaction.updatedAt = now();
    return hydrateImages(db, [target], user)[0];
  });
  if (!image) return res.status(image === false ? 400 : 404).json({ error: image === false ? 'Unsupported action.' : 'Image not found.' });
  res.json({ image, prompt: image.prompt, shareUrl: `/image/${image.id}` });
});

app.get('/api/images/:id/download', async (req, res) => {
  const { image } = await findImage(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  if (image.url.startsWith('/api/assets/')) {
    return res.download(path.join(assetDir, path.basename(image.url)), `${image.id}.png`);
  }
  return res.redirect(image.url);
});

app.get('/api/prompts', async (req, res) => {
  const db = await readDb();
  let items = [...db.promptPresets];
  if (req.query.category) items = items.filter((p) => p.category === req.query.category);
  if (req.query.q) {
    const q = String(req.query.q).toLowerCase();
    items = items.filter((p) => `${p.title} ${p.cn} ${p.desc} ${p.prompt}`.toLowerCase().includes(q));
  }
  if (req.query.sort === 'popular') items.sort((a, b) => b.uses - a.uses);
  else items.sort((a, b) => a.title.localeCompare(b.title));
  res.json({ items });
});

app.post('/api/prompts/:id/use', async (req, res) => {
  const preset = await updateDb((db) => {
    const target = db.promptPresets.find((p) => p.id === req.params.id);
    if (!target) return null;
    target.uses += 1;
    return target;
  });
  if (!preset) return res.status(404).json({ error: 'Prompt preset not found.' });
  res.json({ prompt: preset.prompt, preset });
});

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err.message || 'Server error.' });
});

await ensureData();
app.listen(PORT, '127.0.0.1', () => {
  const { apiKey, imageModel } = getRuntimeConfig();
  console.log(`ImageNova API listening on http://127.0.0.1:${PORT}`);
  console.log(apiKey ? `Live image provider enabled: ${imageModel}` : 'No OPENAI_API_KEY set; using persistent mock generation.');
});
