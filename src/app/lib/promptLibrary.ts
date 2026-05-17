export type PromptSource = 'YouMind' | 'ZeroLu';

export type PromptLibraryItem = {
  id: string;
  title: string;
  cn: string;
  category: string;
  source: PromptSource;
  image: string;
  prompt: string;
  desc: string;
  ratio: string;
  difficulty: '入门' | '进阶' | '专业';
  tags: string[];
};

const zeroLuRaw = 'https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main';

export const promptCategories = [
  { id: 'all', label: '全部', hint: 'All' },
  { id: 'photography', label: '摄影写实', hint: 'Photo' },
  { id: 'ui', label: 'UI / 社媒', hint: 'UI' },
  { id: 'infographic', label: '信息图', hint: 'Infographic' },
  { id: 'poster', label: '海报营销', hint: 'Poster' },
  { id: 'anime', label: '动漫角色', hint: 'Anime' },
  { id: 'game', label: '游戏娱乐', hint: 'Game' },
  { id: 'product', label: '产品设计', hint: 'Product' },
];

export const promptLibrary: PromptLibraryItem[] = [
  {
    id: "ym-facs-grid",
    title: "FACS 面部表情 3x3 网格",
    cn: "表情拼贴",
    category: "photography",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921868703_07e4em_HIZO0L_XwAAmPKY.jpg",
    ratio: "1:1",
    difficulty: "专业",
    tags: [
      "表情",
      "九宫格",
      "人像"
    ],
    desc: "用 FACS 面部动作编码生成同一人物的九种表情。",
    prompt: "创建一个受表现力时尚摄影启发的 3x3 肖像拼贴画，使用 FACS 面部动作编码定义每种面部表情。主体身份保持一致，9 个格子分别呈现开心、惊讶、愤怒、厌恶、恐惧、悲伤、轻蔑、沉思和微笑，彩色摄影，干净布光。"
  },
  {
    id: "ym-kimono-anime",
    title: "月光和服动漫女性",
    cn: "奇幻肖像",
    category: "anime",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921960879_z9jnsd_HIZFaItbAAAWVRR.jpg",
    ratio: "3:4",
    difficulty: "进阶",
    tags: [
      "动漫",
      "和服",
      "月光"
    ],
    desc: "华丽东亚奇幻场景中的竖版动漫肖像。",
    prompt: "创作一张精致的竖版动漫插画，年轻女性身处华丽东亚奇幻场景，身着精致和服，黑发带紫色挑染，月光、灯笼、花卉与飘动发丝构成戏剧性氛围，半身居中构图，细腻面料和柔和夜色。"
  },
  {
    id: "ym-night-flash",
    title: "一次性闪光灯夜间抓拍",
    cn: "胶片街拍",
    category: "photography",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778922023755_3hx53o_HIbP6NcWwAAAwNr.jpg",
    ratio: "3:4",
    difficulty: "入门",
    tags: [
      "闪光灯",
      "夜拍",
      "胶片"
    ],
    desc: "粗粝、真实、带一次性相机瑕疵的夜间抓拍。",
    prompt: "生成一张夜间一次性胶片相机抓拍照片，强闪光灯照亮主体，背景为昏暗街道或派对入口。画面有红眼、颗粒、轻微失焦、过曝高光和随机裁切，主体匿名化但姿态自然，像真实社交场合的瞬间记录。"
  },
  {
    id: "ym-crystal-flower",
    title: "发光水晶花触碰",
    cn: "微距奇幻",
    category: "photography",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921944470_mcb9yc_HIX8F4bawAAgeLU.jpg",
    ratio: "3:4",
    difficulty: "进阶",
    tags: [
      "微距",
      "奇幻",
      "发光"
    ],
    desc: "手指触碰半透明花朵的电影级微距场景。",
    prompt: "电影级微距奇幻场景，一只细腻的手指轻触发光半透明水晶花，花瓣内部散发蓝紫色微光，背景黑暗柔和虚化，空气中有细小粒子，皮肤纹理、花瓣折射和边缘高光清晰可见。"
  },
  {
    id: "ym-personality-ui",
    title: "个性诊断 UI 生成器",
    cn: "结果界面",
    category: "ui",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921912215_g5vfuh_HIWRFxdasAEqpEN.jpg",
    ratio: "3:2",
    difficulty: "专业",
    tags: [
      "App",
      "诊断",
      "数据卡"
    ],
    desc: "把人格分析结果做成完整应用结果页。",
    prompt: "生成一个个性诊断应用结果界面，长宽比 3:2。界面包含人格标题、评分雷达图、关键词标签、性格摘要、优势与风险、推荐行动和分享按钮。视觉为现代移动 App 截图风格，层级清晰，卡片布局，颜色克制。"
  },
  {
    id: "ym-tonkatsu-poster",
    title: "味噌猪排蘸食规则海报",
    cn: "餐厅信息图",
    category: "poster",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921960019_91cuzt_HIVWtObbMAAbb3u.jpg",
    ratio: "3:4",
    difficulty: "进阶",
    tags: [
      "日式",
      "餐厅",
      "规则"
    ],
    desc: "戏剧化餐厅规则说明和幽默警告角色。",
    prompt: "日式餐厅信息图海报，为味噌猪排“仅限蘸食”规则进行宣传。画面包含金黄炸猪排、浓厚味噌酱、醒目日文标题、禁止浇淋图标、讽刺漫画角色警告和清晰步骤说明，强烈戏剧感。"
  },
  {
    id: "ym-tokyo-sketch",
    title: "东京极简城市写生海报",
    cn: "旅行写生",
    category: "poster",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921867055_8zlvqo_HIVMjDzbsAAnRBX.jpg",
    ratio: "3:4",
    difficulty: "入门",
    tags: [
      "东京",
      "钢笔淡彩",
      "旅行"
    ],
    desc: "真实现场感的城市旅行写生。",
    prompt: "钢笔淡彩风格东京城市旅行写生海报，画面包含街角、电车、行人、招牌和轻微透视。线条简洁但有现场感，淡彩上色，留白充足，底部有小标题和日期。"
  },
  {
    id: "ym-legal-doc",
    title: "日文诉状文档页面",
    cn: "文档视觉",
    category: "infographic",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778921965358_hvjbd8_HIVDqvHaoAAvrTU.jpg",
    ratio: "3:4",
    difficulty: "专业",
    tags: [
      "文档",
      "日文",
      "排版"
    ],
    desc: "正式排版、印章和涂黑遮盖的法律文档图像。",
    prompt: "生成一份逼真的 A4 日文法律诉状文档页面，包含正式排版、页眉编号、红色印章、签名栏、涂黑遮盖文本和严肃但略带幽默的正文内容。纸张略有扫描质感，黑白为主，红印章点缀。"
  },
  {
    id: "ym-manga-app",
    title: "带标注的漫画 App 截图",
    cn: "漫画 UI",
    category: "ui",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778922017005_yys1ej_HIZQ41eaQAA0SQQ.jpg",
    ratio: "9:16",
    difficulty: "进阶",
    tags: [
      "漫画",
      "App",
      "箭头"
    ],
    desc: "手机漫画预览页，并用箭头高亮功能入口。",
    prompt: "生成一张日本漫画预览的竖版智能手机 App 截图。屏幕中展示漫画页面、顶部菜单和底部操作栏，用醒目的红色箭头和标注框高亮顶部菜单图标。整体像真实教程截图。"
  },
  {
    id: "ym-party-sheep-sheet",
    title: "Party Sheep 角色设定表",
    cn: "角色三视图",
    category: "anime",
    source: "YouMind",
    image: "https://cms-assets.youmind.com/media/1778922011412_9is10v_HIYSMQXWUAAPpZW.jpg",
    ratio: "16:9",
    difficulty: "专业",
    tags: [
      "设定表",
      "吉祥物",
      "三视图"
    ],
    desc: "包含多视角、资料和调色板的可爱角色设计图。",
    prompt: "创建一个可爱动漫吉祥物 Party Sheep 的角色设定表，白底规整版式，包含正面、侧面、背面和表情视图，旁边展示角色资料、服装细节、配色板和小道具说明，适合作为官方角色参考页。"
  },
  {
    id: "zl-handwritten-notes",
    title: "手写笔记本照片",
    cn: "桌面摄影",
    category: "photography",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/black-pen-handwritten-notes.jpg",
    ratio: "4:3",
    difficulty: "入门",
    tags: [
      "手写",
      "笔记",
      "iPhone"
    ],
    desc: "自然随意的个人笔记桌面照。",
    prompt: "一张业余照片：一本摊开的笔记本平放着，里面用黑色圆珠笔写满手写笔记。字迹自然随意、略显凌乱，带真实小瑕疵、划掉的词语和下划线标题。从略高角度拍摄，窗边自然日光，无闪光灯。"
  },
  {
    id: "zl-micro-rice",
    title: "米粒微型文字",
    cn: "微距挑战",
    category: "photography",
    source: "ZeroLu",
    image: "https://pbs.twimg.com/media/HGc-2eKWYAATrs9?format=jpg&name=large",
    ratio: "1:1",
    difficulty: "进阶",
    tags: [
      "微距",
      "文字",
      "细节"
    ],
    desc: "测试小尺寸文字和局部细节控制。",
    prompt: "一大堆白米的超微距照片，其中有一粒米上写着极小但清晰可读的文字“wOw”。浅景深、自然光、米粒纹理真实，只有这粒米被轻微聚焦突出。"
  },
  {
    id: "zl-panorama",
    title: "360 等距柱状全景图",
    cn: "空间全景",
    category: "photography",
    source: "ZeroLu",
    image: "https://pbs.twimg.com/amplify_video_thumb/2046725535439482880/img/v9e7898p1ynJv-xz.jpg",
    ratio: "16:9",
    difficulty: "进阶",
    tags: [
      "360",
      "空间",
      "全景"
    ],
    desc: "生成可用于全景浏览的等距柱状空间图。",
    prompt: "生成一个指定地点的 360 等距柱状全景图，水平连续无明显接缝，建筑、天空、地面和远处景物保持透视一致，适合全景查看器使用。地点可替换为博物馆大厅、未来地铁站或海边广场。"
  },
  {
    id: "zl-wukong-game",
    title: "《黑神话：悟空》游戏场景",
    cn: "动作游戏",
    category: "game",
    source: "ZeroLu",
    image: "https://github.com/user-attachments/assets/49e41036-4ad4-4908-a3a8-88a2f28f1148",
    ratio: "16:9",
    difficulty: "入门",
    tags: [
      "游戏",
      "悟空",
      "动作"
    ],
    desc: "带强动作感的国产神话游戏截图。",
    prompt: "生成一个《黑神话：悟空》风格的游戏场景，画面中悟空被二郎神击飞，烟尘、碎石和金色法力轨迹充满画面。镜头像 3A 游戏战斗截图，动态模糊、角色姿态清晰，环境为古代神话战场。"
  },
  {
    id: "zl-gta-beach",
    title: "GTA 6 风格海滩截图",
    cn: "开放世界",
    category: "game",
    source: "ZeroLu",
    image: "https://pbs.twimg.com/media/HFPAX19XMAAJ8V_?format=jpg&name=large",
    ratio: "16:9",
    difficulty: "入门",
    tags: [
      "GTA",
      "海滩",
      "屏摄"
    ],
    desc: "模拟手持拍摄固定 4K 显示器上的游戏画面。",
    prompt: "GTA 6 游戏内画面，非常细致、真实。镜头对着固定 4K 显示器近距离拍摄，轻微手持模糊。环境宽阔明亮，角色和一只狗一起走在海滩上，阳光、沙滩、海水和远处游客都有真实细节。"
  },
  {
    id: "zl-douyin-live",
    title: "抖音直播截图",
    cn: "竖屏直播",
    category: "ui",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/liu-yifei-douyin-live-chat.jpg",
    ratio: "9:16",
    difficulty: "进阶",
    tags: [
      "直播",
      "抖音",
      "竖屏"
    ],
    desc: "中文直播界面、聊天气泡和互动控件。",
    prompt: "9:16 纵向比例，生成一张抖音直播截图，画面中是一位女明星在直播，手里拿着牌子写着“今晚直播，欢迎来聊天！”。叠加真实直播间 UI、评论滚动、礼物动画、在线人数和底部输入栏。"
  },
  {
    id: "zl-ecommerce-home",
    title: "电商 App 首页",
    cn: "移动端 UI",
    category: "ui",
    source: "ZeroLu",
    image: "https://github.com/user-attachments/assets/6b709a24-b00a-4942-8c77-8f10ac03e8f8",
    ratio: "9:16",
    difficulty: "专业",
    tags: [
      "App",
      "电商",
      "组件"
    ],
    desc: "完整移动端商业首页结构，适合 UI 生成练习。",
    prompt: "生成一张高保真的移动电商 App 首页截图，灵感来自 2026 年中国主流电商 App。界面包含状态栏、城市选择器、圆角搜索框、消息和扫码图标、横向分类标签、促销 Banner、10 图标功能网格、限时秒杀模块、猜你喜欢双列瀑布流和底部五标签导航。"
  },
  {
    id: "zl-terminator-taobao",
    title: "T-800 淘宝商品详情页",
    cn: "商品详情",
    category: "product",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/terminator-taobao-page.jpeg",
    ratio: "3:4",
    difficulty: "专业",
    tags: [
      "淘宝",
      "机器人",
      "详情页"
    ],
    desc: "把虚构机器人包装成完整电商商品详情页。",
    prompt: "生成一个 T-800 机器人的淘宝商品详情页，展示机器人的正面、侧面和背面三视图，商品价格、商品详情、功能说明、使用场景、购买按钮、规格参数和中文卖点。整体像真实淘宝详情长图。"
  },
  {
    id: "zl-where-poster",
    title: "Where is 人群搜寻海报",
    cn: "视觉游戏",
    category: "poster",
    source: "ZeroLu",
    image: "https://pbs.twimg.com/media/HGcgIHWWgAEph1p?format=jpg&name=large",
    ratio: "3:4",
    difficulty: "进阶",
    tags: [
      "海报",
      "人群",
      "寻找"
    ],
    desc: "高密度人群中的找人游戏海报。",
    prompt: "生成一张 “Where is [你的名字]” 风格的人群搜寻海报，背景城市由你选择。画面中有大量不同人物、建筑、车辆、招牌和小事件，目标人物隐藏在复杂场景中，顶部大标题醒目，适合社交传播。"
  },
  {
    id: "zl-coffee-infographic",
    title: "咖啡旅程信息图",
    cn: "流程图",
    category: "infographic",
    source: "ZeroLu",
    image: "https://github.com/user-attachments/assets/ac0ed885-5b27-46d5-a163-f9e3c15dca3b",
    ratio: "3:4",
    difficulty: "专业",
    tags: [
      "咖啡",
      "流程",
      "科普"
    ],
    desc: "用模块化卡片讲清楚复杂流程。",
    prompt: "创建中文信息图海报，主题为“一杯咖啡如何来到你手里”。高级信息设计风格，包含流程方向、箭头、数据框、图标、简洁插图和模块化卡片。配色采用咖啡棕、奶白、墨黑和铜色点缀，包含种植、处理、烘焙、研磨、萃取和风味关键词。"
  },
  {
    id: "zl-character-map",
    title: "核心角色关系图",
    cn: "关系海报",
    category: "infographic",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/key-character-relationship-map.jpeg",
    ratio: "16:9",
    difficulty: "专业",
    tags: [
      "关系图",
      "角色",
      "叙事"
    ],
    desc: "把复杂人物关系变成高设计感信息可视化。",
    prompt: "请为某个故事主题生成一张核心角色关系图。选出 6 到 12 位关键角色，展示血缘、爱情、友情、联盟、敌对、师徒、背叛和隐藏关系。融合信息可视化、叙事结构和海报级设计，角色头像、连线和标签清晰可读。"
  },
  {
    id: "zl-museum-diagram",
    title: "博物馆中文拆解信息图",
    cn: "文博图录",
    category: "infographic",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/museum-level-chinese-disassembly-infographic.jpeg",
    ratio: "3:4",
    difficulty: "专业",
    tags: [
      "文博",
      "拆解",
      "中文标注"
    ],
    desc: "国家级博物馆展板风格的主体拆解图。",
    prompt: "围绕一个主题自动生成“博物馆图录风中文拆解信息图”。融合真实主体主视觉、结构拆解、中文标注、材质说明、纹样寓意、色彩寓意和核心特征总结。背景使用米白、丝白、浅茶色纸张纹理，高级克制且专业。"
  },
  {
    id: "zl-encyclopedia-card",
    title: "百科风知识卡",
    cn: "知识卡片",
    category: "infographic",
    source: "ZeroLu",
    image: "https://pbs.twimg.com/media/HGcAZlsa8AEpG1O?format=jpg&name=large",
    ratio: "3:4",
    difficulty: "专业",
    tags: [
      "百科",
      "知识卡",
      "模块"
    ],
    desc: "模块化教育信息图，适合社交媒体传播。",
    prompt: "为某个主题生成高质量竖版百科风信息图。它应像模块化教育知识卡，融合野外图鉴的清晰度、百科页面结构和生活方式知识卡的精致感。包含主题主视觉、放大细节标注、多个圆角信息区块、强标题层级和重点标签。"
  },
  {
    id: "zl-expression-sheet",
    title: "16 格动漫表情图",
    cn: "表情资产",
    category: "anime",
    source: "ZeroLu",
    image: "https://github.com/user-attachments/assets/27258fa9-086e-4dfa-b61e-d9ada90425b2",
    ratio: "1:1",
    difficulty: "专业",
    tags: [
      "表情",
      "一致性",
      "角色"
    ],
    desc: "同一角色 16 种表情的资产表。",
    prompt: "创建一张 16 格表情图，主角是一位银发蓝眼的动漫少女。脸型、发型和服装在所有格子中保持高度一致。16 种表情包含开心、难过、生气、惊讶、害羞、无语、邪魅一笑、沉思、好奇、自豪、委屈、不屑、困惑、害怕、哭泣和爱心表情。"
  },
  {
    id: "zl-official-character-sheet",
    title: "官方角色设定参考页",
    cn: "角色资料",
    category: "anime",
    source: "ZeroLu",
    image: "https://raw.githubusercontent.com/ZeroLu/awesome-gpt-image/main/assets/opennana/official-character-reference-sheet.jpeg",
    ratio: "16:9",
    difficulty: "专业",
    tags: [
      "三视图",
      "设定表",
      "角色"
    ],
    desc: "适合游戏、动画和 IP 角色设计。",
    prompt: "基于一个角色和背景，创建官方设定资料参考页。包含三视图：正面、侧面和背面；多种表情变化；服装与装备细节拆解；配色板；简短世界观说明。整体采用规整白底插画风版式。"
  }
];

export const promptGuideSections = [
  {
    title: '1. 先定义结果类型',
    body: '开头明确这是海报、App 截图、信息图、产品图、头像还是游戏截图。模型会先建立输出容器，后面的细节才不会散。',
    example: '生成一张 3:4 竖版新中式茶饮新品海报，而不是只写“做一张茶饮图”。',
  },
  {
    title: '2. 写清主体与场景',
    body: '主体负责画面焦点，场景负责可信度。主体、环境、时代、地点、材质和动作越具体，画面越稳定。',
    example: '中央是一杯冷泡茶，杯中有茶叶、柑橘、冰块和少量金箔，背景为宣纸纹理与山水留白。',
  },
  {
    title: '3. 指定构图和比例',
    body: '比例、镜头距离、网格、留白、标题区和底部信息区都属于构图。复杂图尤其需要说明版式结构。',
    example: '顶部标题，中间主视觉，右侧成分卡片，底部价格和活动信息；整体 3:4 竖版。',
  },
  {
    title: '4. 给出风格但避免堆词',
    body: '风格词要服务目标，不要把“电影感、8K、超细节、赛博、水墨”全部堆在一起。选择 2-4 个关键风格约束即可。',
    example: '新中式、轻奢、克制、商业海报，比“高级、好看、精致”更可执行。',
  },
  {
    title: '5. 对文字和 UI 使用精确文案',
    body: '如果图里必须出现文字，直接列出精确文案，并说明哪些是标题、卖点、按钮、标签或注释。',
    example: '必须准确展示：“山川茶事”“山柚观音”“新品上市”“限定尝鲜价”。',
  },
  {
    title: '6. 加入负面约束',
    body: '用少量负面约束避免常见失败：不要过度精修、不要乱码文字、不要多余手指、不要网红滤镜、不要改变上传人物身份。',
    example: '不要网红造型，面部和姿态必须像真实路人，不能过度精修。',
  },
];
