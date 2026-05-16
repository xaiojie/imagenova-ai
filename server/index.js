import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const assetDir = path.join(dataDir, 'assets');
const uploadDir = path.join(dataDir, 'uploads');
const dbPath = path.join(dataDir, 'db.json');

loadEnv(path.join(rootDir, '.env'));

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IMAGE_API_BASE = normalizeApiBase(process.env.IMAGE_API_BASE || 'https://api.openai.com/v1');
const IMAGE_MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const UI_MODEL_NAME = process.env.UI_MODEL_NAME || 'GPT-image2';
let dbWriteQueue = Promise.resolve();

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
  { id: 'portrait', category: 'portrait', title: 'Portrait Photography', cn: '人像摄影', prompt: 'Editorial portrait, cinematic skin tones, soft key light, 85mm lens, detailed face, elegant styling', desc: 'Editorial-grade portraits with cinematic skin tones', uses: 12840 },
  { id: 'product', category: 'commerce', title: 'Product Poster', cn: '产品海报', prompt: 'Premium product poster, studio lighting, clean reflective surface, commercial campaign, high-end composition', desc: 'Studio-lit product posters for ecommerce and ads', uses: 9240 },
  { id: 'ink', category: 'illustration', title: 'Chinese Ink Painting', cn: '国风插画', prompt: '水墨意境的未来城市，朦胧光晕，留白构图，宣纸肌理，电影感', desc: '水墨意境 · misty mountains, brush textures, poetic', uses: 10820 },
  { id: 'scifi', category: 'scene', title: 'Sci-Fi Scenes', cn: '科幻场景', prompt: 'Massive sci-fi city, neon skyline, starships, cinematic volumetric light, ultra detailed architecture', desc: 'Spaceships, neon cities, otherworldly architecture', uses: 14670 },
  { id: 'character', category: 'game', title: 'Game Characters', cn: '游戏角色', prompt: 'Game character concept art, full body, expressive eyes, detailed costume, golden hour rim light', desc: 'Concept art, character sheets, stylized portraits', uses: 8930 },
  { id: 'architecture', category: 'space', title: 'Architectural Space', cn: '建筑空间', prompt: 'Futuristic interior architecture, warm ambient light, premium materials, clean composition, magazine render', desc: 'Interior renders, futuristic facades, modern spaces', uses: 11200 },
];

const mockPool = [
  'https://images.unsplash.com/photo-1664267665561-24e5c5af0645?w=1200&q=80',
  'https://images.unsplash.com/photo-1675733540715-be9e6444c658?w=1200&q=80',
  'https://images.unsplash.com/photo-1668608380298-00f7fbb572d3?w=1200&q=80',
  'https://images.unsplash.com/photo-1774391048185-f947203cf6c0?w=1200&q=80',
  'https://images.unsplash.com/photo-1766342088275-c3081723881f?w=1200&q=80',
  'https://images.unsplash.com/photo-1761942407242-bec5f94898e2?w=1200&q=80',
  'https://images.unsplash.com/photo-1761075665827-bf5282094678?w=1200&q=80',
  'https://images.unsplash.com/photo-1768609956823-f92a042eb320?w=1200&q=80',
  'https://images.unsplash.com/photo-1559765431-47b1e9725cee?w=1200&q=80',
  'https://images.unsplash.com/photo-1614249102574-94b6b58d02ee?w=1200&q=80',
];

function now() {
  return Date.now();
}

function id(prefix) {
  return `${prefix}_${now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultDb() {
  const createdAt = now() - 1000 * 60 * 60 * 12;
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
      selectedModel: UI_MODEL_NAME,
    },
    images: mockPool.slice(0, 8).map((url, index) => ({
      id: `seed_${index + 1}`,
      url,
      prompt: [
        'Cyberpunk woman with neon reflections, cinematic, 35mm film grain, ultra detailed',
        'Abstract liquid dreamscape, iridescent waves, surreal painterly style',
        'Portrait bathed in red and blue light, editorial fashion photography',
        'Liquid metal sculpture, soft studio lighting, abstract concept render',
        'Neon line geometry, futurist grid, glitch core aesthetic',
        'Pink-haired character close-up, hyperreal skin, cinematic anime lighting',
        'A surreal portal in a stormy field, cinematic concept art',
        'Woman in green face paint, editorial macro portrait',
      ][index],
      ratio: ['3:4', '16:9', '3:4', '9:16', '16:9', '3:4', '1:1', '3:4'][index],
      model: UI_MODEL_NAME,
      providerModel: IMAGE_MODEL,
      createdAt: createdAt - index * 1000 * 60 * 45,
      seed: 100000 + index * 721,
      quality: index % 3 === 0 ? 'standard' : 'ultra',
      creativity: 7.5,
      steps: 42,
      style: ['cyber', 'concept', 'realistic', '3d', 'cyber', 'anime', 'concept', 'realistic'][index],
      source: 'mock',
      owner: index < 2 ? 'me' : `creator_${index}`,
      author: index < 2 ? { user: 'nova.k', avatar: 'NK' } : { user: ['aurora.li', 'noctis_studio', 'mira.q', 'kai.render', 'pixel.dust', 'sienna.r'][index - 2] || 'creator', avatar: ['A', 'N', 'M', 'K', 'P', 'S'][index - 2] || 'C' },
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
  try {
    await fs.access(dbPath);
  } catch {
    await writeDb(defaultDb());
  }
}

async function readDb() {
  await ensureData();
  return JSON.parse(await fs.readFile(dbPath, 'utf8'));
}

async function writeDb(db) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
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
  const endpoint = referenceFile ? `${IMAGE_API_BASE}/images/edits` : `${IMAGE_API_BASE}/images/generations`;
  const finalPrompt = buildFinalPrompt(req);

  let res;
  if (referenceFile) {
    const form = new FormData();
    form.append('model', IMAGE_MODEL);
    form.append('prompt', finalPrompt);
    form.append('size', ratioToSize[req.ratio]);
    form.append('n', String(req.n));
    form.append('quality', toOpenAiQuality(req.quality));
    form.append('background', 'auto');
    form.append('output_format', 'png');
    form.append('image', new Blob([referenceFile.buffer], { type: referenceFile.mimetype }), referenceFile.originalname || 'reference.png');
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });
  } else {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: finalPrompt,
        size: ratioToSize[req.ratio],
        n: req.n,
        quality: toOpenAiQuality(req.quality),
        background: 'auto',
        output_format: 'png',
      }),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image API ${res.status}: ${text.slice(0, 280)}`);
  }
  const data = await res.json();
  return data.data || [];
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

function createImageRecord(base, url, source, index, referenceImage) {
  const imageId = id('img');
  return {
    id: imageId,
    url,
    prompt: buildFinalPrompt(base),
    originalPrompt: base.prompt,
    ratio: base.ratio,
    model: UI_MODEL_NAME,
    providerModel: IMAGE_MODEL,
    createdAt: now(),
    seed: base.seed + index,
    quality: base.quality,
    creativity: base.creativity,
    steps: source === 'api' ? null : 42,
    style: base.style,
    source,
    owner: 'me',
    author: { user: 'nova.k', avatar: 'NK' },
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

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/api/assets', express.static(assetDir));
app.use('/api/uploads', express.static(uploadDir));

app.get('/api/health', async (_req, res) => {
  const db = await readDb();
  res.json({ ok: true, hasApiKey: Boolean(OPENAI_API_KEY), model: UI_MODEL_NAME, providerModel: IMAGE_MODEL, membership: db.settings.membership });
});

app.get('/api/models', (_req, res) => {
  res.json({
    selected: UI_MODEL_NAME,
    models: [
      { id: UI_MODEL_NAME, providerModel: IMAGE_MODEL, name: UI_MODEL_NAME, status: OPENAI_API_KEY ? 'live' : 'demo', supportsReference: true },
      { id: 'mock-nova', providerModel: 'mock', name: 'Mock Nova', status: 'demo', supportsReference: false },
    ],
  });
});

app.get('/api/membership', async (_req, res) => {
  const db = await readDb();
  res.json(db.settings.membership);
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
    const body = normalizeGenerationBody(req.body);
    if (!body.prompt) return res.status(400).json({ error: 'Prompt is required.' });
    if (body.prompt.length > 1500) return res.status(400).json({ error: 'Prompt must be 1500 characters or less.' });

    const configDb = await readDb();
    body.n = Math.min(body.n, configDb.settings.membership.maxBatch || 4);
    const referenceImage = await saveReference(req.file);

    let records = [];
    if (OPENAI_API_KEY) {
      try {
        const apiItems = await callOpenAiImage(body, req.file);
        for (let i = 0; i < apiItems.length; i += 1) {
          const imageId = id('img');
          const url = await persistApiImage(apiItems[i], imageId, i);
          records.push({ ...createImageRecord(body, url, 'api', i, referenceImage), id: imageId });
        }
      } catch (error) {
        await updateDb((db) => {
          db.notifications.unshift({ id: id('n'), type: 'warning', title: 'Live generation failed', body: error.message, read: false, createdAt: now() });
        });
      }
    }

    if (records.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      records = Array.from({ length: body.n }).map((_, i) => createImageRecord(body, mockPool[(now() + i) % mockPool.length], 'mock', i, referenceImage));
    }

    await updateDb((db) => {
      db.images.unshift(...records);
      db.settings.membership.usedThisMonth += records.length;
    });
    res.json({ items: records, source: records[0]?.source || 'mock' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Generation failed.' });
  }
});

app.get('/api/works', async (req, res) => {
  const db = await readDb();
  const mine = db.images.filter((i) => i.owner === 'me');
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
  const publicImages = db.images.filter((i) => i.public);
  const filtered = filterImages(publicImages, req.query);
  const sorted = sortImages(filtered, req.query.sort || req.query.filter || 'trending');
  res.json(paginate(sorted, req.query));
});

app.get('/api/images/:id', async (req, res) => {
  const { image } = await findImage(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found.' });
  res.json(image);
});

app.patch('/api/images/:id', async (req, res) => {
  try {
    const image = await updateDb((db) => {
      const target = db.images.find((i) => i.id === req.params.id);
      if (!target) return null;
      if (typeof req.body.public === 'boolean') {
        target.public = req.body.public;
        target.private = !req.body.public;
      }
      if (req.body.style && stylePresets[req.body.style]) target.style = req.body.style;
      return target;
    });
    if (!image) return res.status(404).json({ error: 'Image not found.' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Update failed.' });
  }
});

app.delete('/api/works/:id', async (req, res) => {
  const ok = await updateDb((db) => {
    const before = db.images.length;
    db.images = db.images.filter((i) => !(i.id === req.params.id && i.owner === 'me'));
    return before !== db.images.length;
  });
  res.json({ ok });
});

app.post('/api/images/:id/:action', async (req, res) => {
  const image = await updateDb((db) => {
    const target = db.images.find((i) => i.id === req.params.id);
    if (!target) return null;
    if (req.params.action === 'like') {
      target.liked = !target.liked;
      target.likes = Math.max(0, target.likes + (target.liked ? 1 : -1));
    } else if (req.params.action === 'save') {
      target.saved = !target.saved;
      target.saves = Math.max(0, target.saves + (target.saved ? 1 : -1));
    } else if (req.params.action === 'copy') {
      target.copies = (target.copies || 0) + 1;
    } else if (req.params.action === 'share') {
      target.shares = (target.shares || 0) + 1;
    } else {
      return false;
    }
    return target;
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
  console.log(`ImageNova API listening on http://127.0.0.1:${PORT}`);
  console.log(OPENAI_API_KEY ? `Live image provider enabled: ${IMAGE_MODEL}` : 'No OPENAI_API_KEY set; using persistent mock generation.');
});
