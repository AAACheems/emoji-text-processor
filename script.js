/* ==========================================================================
   Emoji 智能文本处理器
   核心：Trie 一次扫描匹配 + 语义补全 + 精确映射优先级
   ========================================================================== */
'use strict';

/* -------------------- 常量 -------------------- */
const MAX_TEXT = 2000;          // 输入上限
const MAX_EMOJIS = 24;          // 单次处理 emoji 上限（防止刷屏）
const MAX_CUSTOM = 40;          // 自定义 emoji 上限
const STORAGE_KEYS = {
    THEME: 'emoji-app-theme',
    CUSTOM: 'emoji-app-custom-emojis',
    LIVE: 'emoji-app-live'
};

/* -------------------- 工具函数 -------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function debounce(fn, ms) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

/** 按字素簇切分文本（支持 ZWJ 组合 emoji），无 Intl.Segmenter 时退化为码点 */
function graphemes(text) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        return [...new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text)].map(s => s.segment);
    }
    return [...text];
}

/** 判断某个码点是否属于 emoji 区块 */
function isEmojiCodePoint(cp) {
    if (cp === undefined) return false;
    if (cp === 0x00A9 || cp === 0x00AE || cp === 0xFE0F) return true; // © ® 变体选择符
    return (cp >= 0x1F300 && cp <= 0x1F5FF) ||   // 杂项符号与象形文字
        (cp >= 0x1F600 && cp <= 0x1F64F) ||      // 表情符号
        (cp >= 0x1F680 && cp <= 0x1F6FF) ||      // 交通与地图
        (cp >= 0x1F900 && cp <= 0x1F9FF) ||      // 补充符号与象形文字
        (cp >= 0x1FA70 && cp <= 0x1FAFF) ||      // 符号与象形文字扩展-A
        (cp >= 0x2600 && cp <= 0x27BF) ||        // 杂项符号 + 装饰符号
        (cp >= 0x2300 && cp <= 0x23FF);          // 杂项技术
}

/** 字符串是否包含 emoji */
function hasEmoji(str) {
    for (let i = 0; i < str.length; i++) {
        if (isEmojiCodePoint(str.codePointAt(i))) return true;
        if (str.codePointAt(i) > 0xFFFF) i++;
    }
    return false;
}

/** 安全的按码点截断（避免切断代理对） */
function truncateByCodePoints(str, max) {
    const chars = [...str];
    if (chars.length <= max) return str;
    return chars.slice(0, max).join('');
}

/* -------------------- Emoji 数据（精确映射优先） -------------------- */
// 高频词的精确映射：插入 Trie 顺序最靠前，优先级最高
const preciseEmojiMap = {
    // 天气
    '天气': ['🌤️', '☀️', '⛅'],
    '晴天': ['☀️', '😎', '🌞'],
    '下雨': ['🌧️', '☔', '💧'],
    '下雪': ['❄️', '☃️', '🌨️'],
    '刮风': ['💨', '🍃', '🌬️'],
    '台风': ['🌀', '🌧️', '⚠️'],
    '彩虹': ['🌈', '✨'],
    '阳光': ['☀️', '🌞', '😎'],
    '星星': ['⭐', '🌟', '✨'],
    '月亮': ['🌙', '🌕', '✨'],
    // 时间
    '早上': ['🌅', '☀️', '🌤️'],
    '中午': ['☀️', '🍱', '🕛'],
    '下午': ['🌤️', '☕', '🕒'],
    '晚上': ['🌙', '🌃', '✨'],
    '晚安': ['🌙', '😴', '💤'],
    '周末': ['🎉', '😎', '🛋️'],
    '假期': ['🏖️', '🌴', '😌'],
    '深夜': ['🌙', '🌃', '🦉'],
    // 地点
    '公园': ['🌳', '🏞️', '🌿'],
    '海边': ['🌊', '🏖️', '🐚'],
    '学校': ['🏫', '🎒', '📚'],
    '公司': ['🏢', '💼', '🏬'],
    '超市': ['🛒', '🏪', '🧺'],
    '电影院': ['🎬', '🍿', '🎥'],
    '图书馆': ['📚', '📖', '🏛️'],
    '健身房': ['🏋️', '💪', '🏃'],
    '咖啡馆': ['☕', '🫖', '🍰'],
    '餐厅': ['🍽️', '🍷', '🥂'],
    '机场': ['✈️', '🛫', '🧳'],
    '地铁': ['🚇', '🚉', '🚄'],
    // 活动
    '散步': ['🚶', '🚶‍♀️', '👟'],
    '跑步': ['🏃', '🏃‍♂️', '🏃‍♀️'],
    '游泳': ['🏊', '🏊‍♀️', '🌊'],
    '健身': ['💪', '🏋️', '🔥'],
    '打球': ['🏀', '⚽', '🏸'],
    '看电影': ['🎬', '🍿', '📽️'],
    '听音乐': ['🎧', '🎵', '🎶'],
    '唱歌': ['🎤', '🎶', '🎵'],
    '跳舞': ['💃', '🕺', '🎵'],
    '读书': ['📖', '📚', '🤓'],
    '睡觉': ['😴', '💤', '🛌'],
    '旅行': ['✈️', '🧳', '🗺️'],
    '旅游': ['🏝️', '🧳', '📸'],
    '爬山': ['⛰️', '🥾', '🏞️'],
    '野餐': ['🧺', '🥪', '🌳'],
    '露营': ['⛺', '🏕️', '🔥'],
    '拍照': ['📷', '🤳', '📸'],
    '购物': ['🛍️', '🛒', '💳'],
    '逛街': ['🛍️', '👟', '🛒'],
    '约会': ['💑', '🌹', '🥰'],
    '加班': ['💻', '🌙', '😩'],
    '出差': ['✈️', '💼', '🏨'],
    '上班': ['💼', '🏢', '🚇'],
    '下班': ['🏠', '😌', '🚗'],
    '开会': ['📋', '🗣️', '👥'],
    '学习': ['📚', '✏️', '💡'],
    '写作业': ['📝', '✍️', '📚'],
    '考试': ['📝', '🧠', '✍️'],
    '面试': ['🤝', '💼', '😅'],
    '锻炼': ['🏃', '💪', '🤸'],
    '瑜伽': ['🧘', '🧘‍♀️', '🌿'],
    '休息': ['😌', '🛋️', '☕'],
    '回家': ['🏠', '🚪', '😊'],
    '出发': ['🚀', '🧳', '👟'],
    '到达': ['🏁', '📍', '🎉'],
    // 情感
    '开心': ['😄', '😊', '🥳'],
    '伤心': ['😢', '💔', '😭'],
    '生气': ['😠', '😤', '💢'],
    '惊喜': ['🤩', '🎁', '😮'],
    '无聊': ['🥱', '😴', '😑'],
    '疲惫': ['😩', '🥱', '💤'],
    '期待': ['🥰', '✨', '🤩'],
    '紧张': ['😰', '🤯', '😬'],
    '害怕': ['😨', '😱', '😰'],
    '尴尬': ['😅', '🙈', '😳'],
    '感动': ['🥹', '😭', '💖'],
    '幸福': ['🥰', '💖', '😊'],
    '崩溃': ['😫', '🤯', '😭'],
    '焦虑': ['😰', '😣', '😵'],
    // 食物
    '咖啡': ['☕', '🤎'],
    '奶茶': ['🧋', '🥤', '😋'],
    '蛋糕': ['🍰', '🎂', '🧁'],
    '火锅': ['🍲', '🌶️', '🥢'],
    '烧烤': ['🍢', '🔥', '🍖'],
    '披萨': ['🍕', '🧀', '😋'],
    '汉堡': ['🍔', '🍟', '😋'],
    '冰淇淋': ['🍦', '🍨', '😋'],
    '水果': ['🍎', '🍊', '🍇'],
    '早餐': ['🥐', '🍳', '☕'],
    '午餐': ['🍱', '🍚', '🥢'],
    '晚餐': ['🍽️', '🍷', '🍜'],
    '面条': ['🍜', '🥢', '🍝'],
    '饺子': ['🥟', '🥢', '😋'],
    '寿司': ['🍣', '🥢', '🍱'],
    '米饭': ['🍚', '🥢', '🍛'],
    '面包': ['🍞', '🥐', '🥖'],
    '牛奶': ['🥛', '🐄', '🧋'],
    '外卖': ['🛵', '🥡', '🍜'],
    // 动物
    '猫咪': ['🐱', '😺', '😻'],
    '狗狗': ['🐶', '🐕', '🦮'],
    '兔子': ['🐰', '🐇', '🥕'],
    '熊猫': ['🐼', '🐾', '🎋'],
    '老虎': ['🐯', '🐅', '🐾'],
    '大象': ['🐘', '🐾', '🌴'],
    '猴子': ['🐵', '🐒', '🍌'],
    '狐狸': ['🦊', '🍂', '🐾'],
    '小鸟': ['🐦', '🐤', '🪶'],
    '蝴蝶': ['🦋', '🌸', '🌼'],
    '蜜蜂': ['🐝', '🌸', '🍯'],
    '海豚': ['🐬', '🌊', '🐾'],
    '鲸鱼': ['🐋', '🌊', '🐳'],
    '企鹅': ['🐧', '❄️', '🐾'],
    '乌龟': ['🐢', '🌿', '🐾'],
    '螃蟹': ['🦀', '🌊', '🦞'],
    // 节日 / 祝福
    '生日': ['🎂', '🎁', '🎉'],
    '新年': ['🧧', '🎆', '🎉'],
    '圣诞': ['🎄', '🎅', '🎁'],
    '礼物': ['🎁', '🎀', '🎈'],
    '婚礼': ['💒', '💍', '🎉'],
    '恭喜': ['🎉', '🎊', '🥳'],
    // 工作 / 科技
    '工作': ['💼', '📊', '👔'],
    '项目': ['📋', '🚀', '📈'],
    '代码': ['👨‍💻', '💻', '⌨️'],
    '编程': ['👨‍💻', '💻', '🧑‍💻'],
    '手机': ['📱', '🤳', '🔋'],
    '电脑': ['💻', '🖥️', '⌨️'],
    '游戏': ['🎮', '🕹️', '👾'],
    '视频': ['🎬', '📹', '📺'],
    '音乐': ['🎵', '🎶', '🎧'],
    '直播': ['📺', '🎥', '🔴'],
    '网络': ['🌐', '📶', '🖥️'],
    '会议': ['📋', '💬', '🤝'],
    '报告': ['📄', '📊', '🗂️'],
    '总结': ['📝', '✅', '🗒️'],
    '计划': ['📅', '🗓️', '📝'],
    // 交通
    '飞机': ['✈️', '🛫', '🛬'],
    '高铁': ['🚄', '🚆', '💨'],
    '火车': ['🚂', '🛤️', '🚆'],
    '公交': ['🚌', '🚏', '🚍'],
    '打车': ['🚕', '🚗', '📱'],
    '自驾': ['🚗', '🛣️', '🗺️'],
    '堵车': ['🚗', '🚦', '😩'],
    // 健康
    '生病': ['🤒', '🤧', '💊'],
    '感冒': ['🤧', '😷', '💊'],
    '发烧': ['🤒', '🌡️', '💊'],
    '医院': ['🏥', '🩺', '💉'],
    '医生': ['🧑‍⚕️', '🩺', '💊'],
    '健康': ['💪', '🌿', '❤️'],
    '减肥': ['🥗', '🏃‍♀️', '💪'],
    '熬夜': ['🌙', '🥱', '😵'],
    '早睡': ['🌙', '😴', '💤'],
    // 高频单字（语义明确）
    '家': ['🏠', '💒'],
    '车': ['🚗', '🚙', '🚕'],
    '山': ['⛰️', '🏔️'],
    '海': ['🌊', '🌅'],
    '花': ['🌸', '🌺', '🌼'],
    '草': ['🌿', '🍀'],
    '树': ['🌳', '🌲']
};

// ====== emoji 分类数据库（分类兜底） ======
const emojiDatabase = {
    // 天气/自然
    weather: {
        keywords: ['天气', '晴天', '下雨', '下雪', '刮风', '多云', '阴天', '雾霾', '雷阵雨', '冰雹', '台风', '阳光', '彩虹', '闪电', '打雷', '降温', '回暖', '闷热', '干燥', '潮湿', '大雾'],
        emojis: ['☀️', '🌤️', '⛅', '🌥️', '🌦️', '🌧️', '⛈️', '❄️', '🌨️', '🌀', '🌪️', '🌫️', '🌈', '☔']
    },
    // 时间
    time: {
        keywords: ['今天', '明天', '昨天', '早上', '中午', '晚上', '下午', '凌晨', '深夜', '周末', '假期', '星期', '早晨', '傍晚', '上午', '今夜', '今早', '今晚', '明早', '明晚', '昨晚', '下周', '下月', '去年', '今年', '明年', '春天', '夏天', '秋天', '冬天', '春季', '夏季', '秋季', '冬季'],
        emojis: ['⏰', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '☀️', '🌙', '⭐', '🌅', '🌆', '🌃']
    },
    // 地点
    place: {
        keywords: ['公园', '学校', '公司', '家', '商店', '超市', '餐厅', '咖啡馆', '电影院', '医院', '车站', '机场', '海边', '山', '城市', '街道', '教室', '图书馆', '体育馆', '宿舍', '办公室', '厨房', '卧室', '客厅', '阳台', '花园', '广场', '商场', '书店', '酒吧', '酒店', '博物馆', '动物园', '游乐园', '寺庙'],
        emojis: ['🏠', '🏢', '🏬', '🏪', '🏫', '🏥', '🏭', '🏰', '⛲', '🌳', '🌊', '🏔️', '🌆', '🚇', '🚌', '✈️', '🚂', '☕', '🍽️', '🎬']
    },
    // 活动
    activity: {
        keywords: ['散步', '跑步', '游泳', '健身', '运动', '打球', '看电影', '听音乐', '读书', '学习', '工作', '开会', '吃饭', '喝茶', '聊天', '睡觉', '旅行', '购物', '逛街', '爬山', '露营', '野餐', '钓鱼', '画画', '唱歌', '跳舞', '瑜伽', '骑行', '做饭', '打扫', '整理', '写作业', '上课', '下课', '放假', '加班', '出差', '拍照', '旅游', '度假'],
        emojis: ['🚶', '🏃', '🏊', '🏋️', '⚽', '🏀', '🎾', '🎬', '🎵', '📚', '💻', '📝', '🍽️', '☕', '💬', '😴', '✈️', '🛍️', '🎯', '🏆']
    },
    // 情感
    emotion: {
        keywords: ['开心', '高兴', '快乐', '幸福', '悲伤', '难过', '生气', '愤怒', '无聊', '疲惫', '惊喜', '兴奋', '期待', '想念', '爱', '喜欢', '激动', '紧张', '害怕', '担心', '后悔', '尴尬', '委屈', '感动', '满足', '骄傲', '自豪', '绝望', '失望', '烦躁', '郁闷', '崩溃', '焦虑', '慌张', '淡定'],
        emojis: ['😊', '😄', '😃', '😀', '🥰', '😍', '😭', '😢', '😤', '😡', '😴', '😪', '🤩', '😱', '💖', '❤️', '💔', '💯', '🥳']
    },
    // 食物
    food: {
        keywords: ['水果', '咖啡', '蛋糕', '冰淇淋', '零食', '早餐', '午餐', '晚餐', '火锅', '烧烤', '披萨', '汉堡', '面条', '饺子', '包子', '米饭', '面包', '牛奶', '果汁', '可乐', '啤酒', '红酒', '奶茶', '酸奶', '巧克力', '糖果', '饼干', '薯片', '寿司', '烤肉', '麻辣烫', '串串', '牛排', '沙拉', '汤', '粥'],
        emojis: ['🍚', '🍜', '🍲', '🍳', '🥗', '🍕', '🍔', '🍟', '🌭', '🍿', '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '☕', '🍵', '🍰', '🍦', '🍩', '🥤']
    },
    // 动物（单字动物 -> wordEmojiMap 专用映射，此处仅保留多字动物）
    animal: {
        keywords: ['兔子', '熊猫', '老虎', '大象', '猴子', '狐狸', '刺猬', '松鼠', '蜗牛', '蝴蝶', '蜜蜂', '蜻蜓', '海豚', '鲸鱼', '鲨鱼', '螃蟹', '乌龟', '鹦鹉', '老鹰', '孔雀', '企鹅', '天鹅'],
        emojis: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🐠']
    },
    // 节日
    holiday: {
        keywords: ['春节', '新年', '圣诞', '元旦', '中秋', '国庆', '生日', '情人节', '儿童节', '母亲节', '父亲节', '礼物', '除夕', '元宵', '端午', '清明', '重阳', '腊八', '跨年', '纪念日', '婚礼', '毕业典礼'],
        emojis: ['🎄', '🎅', '🎉', '🎊', '🎁', '🎈', '🏮', '🎑', '🎇', '🎆', '🎂', '💝', '👨👩👧👦', '🥳']
    },
    // 工作/学习
    work: {
        keywords: ['工作', '学习', '作业', '报告', '会议', '项目', '代码', '编程', '设计', '写作', '考试', '面试', '毕业', '论文', '教案', '备课', '培训', '演讲', '汇报', '总结', '计划', '方案', '预算', '出差', '招聘', '简历', '升职', '加薪', '辞职', '退休'],
        emojis: ['💼', '📊', '📈', '📉', '📋', '📝', '💻', '⌨️', '🎨', '✏️', '📚', '🎓', '👔', '🏆']
    },
    // 交通
    transport: {
        keywords: ['车', '地铁', '公交', '火车', '飞机', '高铁', '船', '打车', '步行', '骑行', '出发', '到达', '开车', '自驾', '堵车', '停车', '上车', '下车', '转机', '登机', '托运', '候机', '检票', '进站', '出站'],
        emojis: ['🚗', '🚙', '🚌', '🚎', '🚇', '🚆', '🚄', '✈️', '🚢', '🚴', '🚶', '🚀', '🛫', '🛬']
    },
    // 健康
    health: {
        keywords: ['健康', '生病', '感冒', '发烧', '咳嗽', '头痛', '肚子疼', '医院', '医生', '护士', '药', '吃药', '打针', '体检', '手术', '住院', '出院', '休息', '锻炼', '养生', '运动', '健身', '瑜伽', '跑步', '散步', '睡眠', '饮食', '营养', '维生素', '口罩', '疫苗'],
        emojis: ['🏥', '💊', '🩺', '🌿', '💪', '🧘', '🏃', '😷', '❤️']
    },
    // 自然
    nature: {
        keywords: ['花', '草', '树', '森林', '大海', '星星', '月亮', '太阳', '星空', '流星', '夕阳', '日出', '晚霞', '蓝天', '白云', '瀑布', '河流', '湖泊', '沙漠', '草原', '樱花', '玫瑰', '向日葵', '荷花', '枫叶', '雪花'],
        emojis: ['🌸', '🌿', '🌲', '🌻', '🌺', '🌹', '🌷', '🌼', '🌊', '🏔️', '🌟', '🌙', '☀️', '⛰️', '🏞️']
    },
    // 科技
    tech: {
        keywords: ['电脑', '手机', '网络', 'WiFi', '软件', '应用', '游戏', 'AI', '人工智能', '数据', '服务器', '网页', '网站', 'APP', '程序', '系统', '更新', '下载', '上传', '登录', '注册', '密码', '账号', '邮箱', '消息', '通知', '设置', '搜索', '视频', '直播'],
        emojis: ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '📀', '🎮', '📡', '🔋', '🔌', '🛜']
    },
    // 社交/问候
    social: {
        keywords: ['你好', '您好', '大家好', '早上好', '下午好', '晚上好', '晚安', '拜拜', '回见', '明天见', '待会', '回头', '约', '邀请', '欢迎', '聚会', '派对', '见面', '打招呼', '认识', '介绍', '联系', '回复', '点赞', '关注', '分享', '转发', '评论', '私信', '群聊', '加好友'],
        emojis: ['👋', '😊', '🖐️', '🤝', '👥', '🎉', '🎊', '💬', '📱', '❤️', '👍']
    }
};

// ====== 常用词精确映射 ======
const wordEmojiMap = {
    // --- 程度/评价（避免单字误匹配，使用双字以上短语） ---
    '真好': ['👍', '😊', '👏'],
    '很好': ['👍', '😊', '👏'],
    '太好': ['🎉', '👏', '🤩'],
    '太棒': ['👍', '👏', '🎉'],
    '很棒': ['👍', '👏', '💪'],
    '真棒': ['👍', '👏', '💪'],
    '不错': ['👍', '👏', '😊'],
    '真美': ['🌸', '✨', '💅'],
    '好看': ['👀', '😍', '✨'],
    '好吃': ['😋', '🍽️', '😊'],
    '好听': ['🎵', '🎶', '👏'],
    '好玩': ['🎮', '😄', '🎯'],
    '累了': ['😴', '😪'],
    '困了': ['😴', '💤'],
    '饿了': ['🍔', '🍕', '🍽️'],
    '渴了': ['💧', '🍵', '☕'],
    '冷了': ['❄️', '🧣'],
    '热了': ['🔥', '☀️'],

    // --- 社交/问候 ---
    '谢谢': ['🙏', '😊', '❤️'],
    '感谢': ['🙏', '😊', '❤️'],
    '对不起': ['😔', '🙏', '😅'],
    '抱歉': ['😔', '🙏', '😅'],
    '再见': ['👋', '😊'],
    '回头见': ['👋', '😊'],
    '明天见': ['👋', '🌙'],
    '加油': ['💪', '🔥', '🎯'],
    '恭喜': ['🎉', '🎊', '🎈'],
    '恭喜发财': ['🧧', '💰', '🎉'],
    '欢迎': ['👏', '🎉', '😊'],
    '辛苦': ['💪', '😊', '☕'],
    '厉害': ['👍', '👏', '🤩'],
    '优秀': ['🏆', '👏', '🌟'],
    '完美': ['💯', '✨', '👏'],

    // --- 情感 ---
    '开心': ['😊', '😄', '😃'],
    '高兴': ['😊', '😄', '😃'],
    '快乐': ['🎉', '😊', '😄'],
    '难过': ['😢', '😔', '😭'],
    '伤心': ['😢', '😭', '💔'],
    '生气': ['😤', '😡', '💢'],
    '惊喜': ['🤩', '😱', '🎉'],
    '无聊': ['😴', '🥱', '😐'],
    '期待': ['✨', '🌟', '🥰'],
    '感动': ['😭', '🥹', '💖'],
    '幸福': ['🥰', '💖', '😊'],
    '崩溃': ['😫', '🤯', '😭'],
    '焦虑': ['😰', '😣', '😵'],
    '烦躁': ['😩', '😤', '😣'],
    '害羞': ['😳', '🥰', '☺️'],
    '尴尬': ['😅', '😳', '🙈'],
    '无语': ['😑', '🙄', '😅'],
    '羡慕': ['😍', '👀', '🌟'],
    '佩服': ['👏', '🤩', '💯'],
    '讨厌': ['😣', '🙄', '😤'],
    '喜欢': ['❤️', '🥰', '😍'],
    '想念': ['💭', '🥺', '💕'],

    // --- 日常用语 ---
    '没问题': ['👍', '✅', '👌'],
    '没关系': ['👍', '😊', '🆗'],
    '知道了': ['👍', '✅', '📋'],
    '明白了': ['💡', '👍', '✅'],
    '等一下': ['⏰', '✋', '⏳'],
    '慢慢来': ['😊', '💪', '🐢'],
    '快点': ['⏩', '💨', '🏃'],
    '开始了': ['🎬', '🚀', '🎯'],
    '结束了': ['🏁', '👏', '🎉'],
    '继续': ['💪', '👉', '🚀'],
    '等等': ['⏰', '✋', '⏳'],
    '随便': ['🤷', '😐', '🤲'],
    '真的': ['😮', '🤔', '✅'],
    '确实': ['👍', '✅', '💯'],
    '原来': ['🤔', '💡', '😮'],
    '终于': ['🙌', '🎉', '✅'],
    '居然': ['😱', '😮', '🤯'],
    '当然': ['👍', '✅', '💯'],
    '反正': ['🤷', '💁', '🙌'],

    // --- 祝愿 ---
    '生日快乐': ['🎂', '🎉', '🎁'],
    '新年快乐': ['🎆', '🎉', '🧧'],
    '圣诞快乐': ['🎄', '🎅', '🎁'],
    '好运': ['🍀', '✨', '🌟'],
    '顺利': ['🍀', '👍', '✨'],
    '成功': ['🏆', '🎉', '🌟'],
    '希望': ['✨', '🌟', '💪'],

    // --- 人物 ---
    '朋友': ['👫', '👬', '👭'],
    '家人': ['👨👩👧👦', '👪', '💖'],
    '同事': ['👥', '🤝', '💼'],
    '同学': ['👥', '🎓', '📚'],
    '大家': ['👥', '👏', '🎉'],
    '自己': ['💪', '😊', '🌟'],
    '别人': ['👥', '🤝', '💬'],

    // --- 时间 ---
    '今天': ['📅', '☀️', '🌤️'],
    '明天': ['📅', '🔮', '✨'],
    '昨天': ['📅', '🌙', '💭'],
    '周末': ['🎉', '☀️', '😊'],
    '现在': ['⏰', '⌛', '💫'],
    '马上': ['⏩', '💨', '🚀'],
    '时间': ['⏰', '🕐', '⌛'],

    // --- 价值/货币 ---
    '钱': ['💰', '💵', '💴', '💸'],
    '免费': ['🆓', '🎁', '😍'],
    '打折': ['🏷️', '💵', '😍'],

    // --- 感叹词/语气词 ---
    '哈哈': ['😂', '🤣', '😄'],
    '嘻嘻': ['😄', '😊', '😁'],
    '嘿嘿': ['😏', '😜', '😄'],
    '呵呵': ['😊', '🙂'],
    '呜呜': ['😢', '😭', '🥹'],
    '嗯嗯': ['👍', '😊', '👌'],
    '哦哦': ['👀', '😮', '👍'],
    '啊啊': ['😱', '😲', '😫'],
    '哇塞': ['😮', '🤩', '😱'],
    '哎呀': ['😅', '😳', '🤦'],
    '天哪': ['😱', '😮', '🤯'],
    '不会吧': ['😱', '😮', '🤯'],
    '不是吧': ['😱', '😲', '😅'],
    '真的吗': ['🤔', '😮', '🤨'],

    // --- 网络用语 ---
    '666': ['👏', '🤩', '💯'],
    '牛逼': ['🤩', '👏', '💪'],
    '绝了': ['🤩', '👏', '😱'],
    '笑死': ['😂', '🤣', '💀'],
    '哭了': ['😭', '😢', '😅'],
    '爱了': ['❤️', '🥰', '💖'],
    '服了': ['😅', '🤦', '🙄'],
    '醉了': ['😵', '😅', '🤦'],
    '懂了': ['💡', '👍', '✅'],
    '收到': ['✅', '👍', '📋'],

    // --- 单字（仅保留语义明确、不易误配的） ---
    '饿': ['🍔', '🍕', '🍽️'],
    '渴': ['💧', '🍵', '☕'],
    '累': ['😴', '😪'],
    '困': ['😴', '💤'],
    '冷': ['❄️', '🧣'],
    '热': ['🔥', '☀️'],
    '美': ['🌸', '💅', '✨'],
    '帅': ['😎', '💪'],
    '酷': ['😎', '🆒'],
    '漂亮': ['🌸', '💅', '✨'],

    // --- 遗留常用（保留测试） ---
    '有趣': ['😄', '🤣', '🎮'],
    '礼物': ['🎁', '🎀'],
    '没有': ['❌', '🚫'],
    '不能': ['❌', '🚫'],
    '不会': ['❌', '🤔'],

    // --- 动物专用映射（确保精确匹配） ---
    '猫': ['🐱', '😺', '😸'],
    '狗': ['🐶', '🐕', '🦮'],
    '鸟': ['🐦', '🐧', '🦅'],
    '鱼': ['🐠', '🐟', '🐡'],
    '猪': ['🐷', '🐖', '🐽'],
    '鸡': ['🐔', '🐓', '🐤'],
    '鸭': ['🦆', '🐤'],
    '熊': ['🐻', '🧸'],
    '马': ['🐴', '🐎', '🏇'],
    '牛': ['🐮', '🐄', '🐂'],
    '羊': ['🐑', '🐐', '🐏'],
    '蛇': ['🐍', '🦎'],
    '龙': ['🐉', '🐲'],
    '鹿': ['🦌', '🫎'],
    '狼': ['🐺', '🐾'],
    '虾': ['🦐', '🦞'],

    // --- 食物专用映射 ---
    '饭': ['🍚', '🍛', '🍱'],
    '面': ['🍜', '🍝', '🥟'],
    '菜': ['🥗', '🥬', '🥦'],
    '茶': ['🍵', '🫖', '☕']
};

/* -------------------- Trie 匹配引擎 -------------------- */
class TrieNode {
    constructor() {
        this.children = {};
        this.emojis = null;
    }
}

let _trie = null;

function getTrie() {
    if (_trie) return _trie;
    _trie = new TrieNode();

    // 插入顺序 = 优先级顺序：精确映射 > 常用词映射 > 分类兜底
    const insert = (keyword, emojis) => {
        let node = _trie;
        for (const ch of keyword) {
            if (!node.children[ch]) node.children[ch] = new TrieNode();
            node = node.children[ch];
        }
        if (!node.emojis) node.emojis = emojis; // 先到先得
    };

    for (const [kw, list] of Object.entries(preciseEmojiMap)) insert(kw, list);
    for (const [kw, list] of Object.entries(wordEmojiMap)) insert(kw, list);
    for (const data of Object.values(emojiDatabase)) {
        for (const kw of data.keywords) insert(kw, data.emojis);
    }

    return _trie;
}

/* -------------------- 状态 -------------------- */
const state = {
    theme: 'dark',
    live: false,
    customEmojis: [],
    lastResult: '',
    lastEmoji: null
};

/* -------------------- DOM -------------------- */
const elements = {
    themeToggle: $('#theme-toggle'),
    themeIcon: $('.theme-icon'),
    themeText: $('.theme-text'),
    inputTextarea: $('#input-text'),
    charCount: $('#char-count'),
    liveToggle: $('#live-toggle'),
    processBtn: $('#process-btn'),
    clearBtn: $('#clear-btn'),
    copyBtn: $('#copy-btn'),
    outputPlaceholder: $('#output-placeholder'),
    outputContent: $('#output-content'),
    resultText: $('#result-text'),
    resultBadge: $('#result-badge'),
    resultTime: $('#result-time'),
    emojiGrid: $('#emoji-grid'),
    customEmojiSection: $('#custom-emoji-section'),
    customEmojiBtn: $('#custom-emoji-btn'),
    closeCustomEmoji: $('#close-custom-emoji'),
    customEmojiInput: $('#custom-emoji-input'),
    addCustomEmoji: $('#add-custom-emoji'),
    customEmojiList: $('#custom-emoji-list'),
    customEmpty: $('#custom-empty'),
    toast: $('#toast'),
    toastIcon: $('.toast-icon'),
    toastMessage: $('.toast-message'),
    toastProgress: $('.toast-progress'),
    exampleChips: $$('.example-chip')
};

const quickEmojis = [
    '😊', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😅', '😢', '😭',
    '😡', '🥹', '🤩', '😱', '😴', '😳', '🥺', '😏', '😜', '🤗',
    '👍', '👏', '🎉', '🎊', '❤️', '💖', '💔', '💯', '✨', '🌟',
    '🔥', '💪', '🚀', '💡', '🙏', '👋', '🎂', '🍀', '🎯', '💫'
];

/* -------------------- 主题 -------------------- */
function initTheme() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.THEME);
        if (saved === 'light' || saved === 'dark') state.theme = saved;
    } catch (e) { /* localStorage 不可用时忽略 */ }
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    elements.themeText.textContent = state.theme === 'dark' ? '暗色' : '亮色';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#0b0a1a' : '#eef0fb');
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEYS.THEME, state.theme); } catch (e) {}
    applyTheme();
    showToast('🎨', `已切换到${state.theme === 'dark' ? '暗色' : '亮色'}主题`, 'info');
}

/* -------------------- 自定义 Emoji -------------------- */
function initCustomEmojis() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM) || '[]');
        if (Array.isArray(saved)) state.customEmojis = saved.slice(0, MAX_CUSTOM);
    } catch (e) {
        state.customEmojis = [];
    }
    renderCustomEmojis();
}

function renderCustomEmojis() {
    elements.customEmojiList.innerHTML = '';
    state.customEmojis.forEach(emoji => {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-emoji-item';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.title = `插入 ${emoji}`;
        btn.addEventListener('click', () => insertEmoji(emoji));

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'custom-emoji-delete';
        del.textContent = '×';
        del.title = '删除';
        del.setAttribute('aria-label', `删除 ${emoji}`);
        del.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomEmoji(emoji);
        });

        wrapper.append(btn, del);
        elements.customEmojiList.appendChild(wrapper);
    });
    elements.customEmpty.hidden = state.customEmojis.length > 0;
}

function toggleCustomSection(force) {
    const willShow = force !== undefined ? force : elements.customEmojiSection.hidden;
    elements.customEmojiSection.hidden = !willShow;
    if (willShow) setTimeout(() => elements.customEmojiInput.focus(), 60);
}

function addCustomEmoji() {
    const raw = elements.customEmojiInput.value.trim();
    if (!raw) {
        showToast('⚠️', '请先输入一个 emoji 哦', 'warning');
        return;
    }
    if (!hasEmoji(raw)) {
        showToast('⚠️', '输入内容需要包含 emoji', 'warning');
        return;
    }
    if (state.customEmojis.includes(raw)) {
        showToast('⚠️', '这个 emoji 已经在列表里啦', 'warning');
        return;
    }
    if (state.customEmojis.length >= MAX_CUSTOM) {
        showToast('⚠️', `最多保存 ${MAX_CUSTOM} 个自定义 emoji`, 'warning');
        return;
    }
    state.customEmojis.push(raw);
    saveCustomEmojis();
    renderCustomEmojis();
    elements.customEmojiInput.value = '';
    showToast('✅', '已添加自定义 emoji', 'success');
}

function deleteCustomEmoji(emoji) {
    const idx = state.customEmojis.indexOf(emoji);
    if (idx < 0) return;
    state.customEmojis.splice(idx, 1);
    saveCustomEmojis();
    renderCustomEmojis();
    showToast('🗑️', '已删除该 emoji', 'info');
}

function saveCustomEmojis() {
    try { localStorage.setItem(STORAGE_KEYS.CUSTOM, JSON.stringify(state.customEmojis)); } catch (e) {}
}

/* -------------------- Emoji 快捷插入 -------------------- */
function initEmojiGrid() {
    elements.emojiGrid.innerHTML = '';
    quickEmojis.forEach((emoji, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.title = emoji;
        btn.addEventListener('click', () => insertEmoji(emoji));
        elements.emojiGrid.appendChild(btn);
    });
}

function insertEmoji(emoji) {
    const ta = elements.inputTextarea;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    let value = ta.value.slice(0, start) + emoji + ta.value.slice(end);
    value = truncateByCodePoints(value, MAX_TEXT);
    ta.value = value;
    ta.focus();
    const pos = start + emoji.length;
    ta.setSelectionRange(pos, pos);
    updateCharCount();
}

/* -------------------- 字符计数 -------------------- */
function updateCharCount() {
    const count = [...elements.inputTextarea.value].length; // 按码点计数
    const display = Math.min(count, MAX_TEXT);
    elements.charCount.textContent = `${display} / ${MAX_TEXT}`;

    if (count > MAX_TEXT) {
        elements.inputTextarea.value = truncateByCodePoints(elements.inputTextarea.value, MAX_TEXT);
    }
    elements.charCount.classList.toggle('over', count > MAX_TEXT);

    const hasText = elements.inputTextarea.value.trim().length > 0;
    elements.processBtn.disabled = !hasText;
    elements.clearBtn.disabled = !hasText;
}

/* -------------------- 智能处理 -------------------- */
let _lastEmoji = null;

function pickEmoji(list) {
    if (!list || !list.length) return '';
    if (list.length === 1) return list[0];
    let pool = list.filter(e => e !== _lastEmoji);
    if (!pool.length) pool = list;
    const emoji = pool[Math.floor(Math.random() * pool.length)];
    _lastEmoji = emoji;
    return emoji;
}

/** Trie 单次扫描：命中关键词且后一位不是 emoji 时记录（避免重复堆叠） */
function scanKeywordMatches(text, trie) {
    const matches = [];
    let i = 0;
    const n = text.length;
    while (i < n) {
        let node = trie;
        let best = null;
        let bestEnd = i - 1;
        for (let j = i; j < n; j++) {
            node = node.children[text[j]];
            if (!node) break;
            if (node.emojis) { best = node.emojis; bestEnd = j; }
        }
        if (best) {
            const after = bestEnd + 1;
            if (after >= n || !hasEmoji(text.slice(after, after + 2))) {
                matches.push({ start: i, end: bestEnd, emojis: best });
            }
            i = bestEnd + 1;
        } else {
            i++;
        }
        if (matches.length >= MAX_EMOJIS) break;
    }
    return matches;
}

function processText(text) {
    const t0 = performance.now();
    const trimmed = text.trim();
    if (!trimmed) return { result: '', emojiCount: 0, ms: 0 };

    _lastEmoji = null;
    const trie = getTrie();
    const matches = scanKeywordMatches(text, trie);

    // 从后往前插入，保证下标不失效
    let result = text;
    for (let k = matches.length - 1; k >= 0; k--) {
        const m = matches[k];
        const emoji = pickEmoji(m.emojis);
        result = result.slice(0, m.end + 1) + emoji + result.slice(m.end + 1);
    }

    // 语义补全（句末追加）
    const semantic = addSemanticEmojis(result, matches.length);
    const emojiCount = matches.length + semantic.addedCount;

    return {
        result: semantic.result,
        emojiCount,
        ms: performance.now() - t0
    };
}

/* -------------------- 语义引擎 -------------------- */
const semanticEngine = {
    getMood(sentence) {
        if (/[！!]/.test(sentence)) return 'excited';
        if (/[？?]/.test(sentence)) return 'questioning';
        if (/…|\.{3,}/.test(sentence)) return 'pensive';
        if (/[～~]/.test(sentence)) return 'playful';
        const t = sentence.trim();
        if (/[吧]$/.test(t)) return 'suggestive';
        if (/[吗么]$/.test(t)) return 'questioning';
        if (/[呢]$/.test(t)) return 'rhetorical';
        if (/^(哎|哦|呃|嗯|哈|嘿|啊|呀)/.test(t)) return 'exclamation';
        return 'neutral';
    },

    getSentiment(sentence) {
        const positives = ['好', '棒', '赞', '美', '喜欢', '爱', '开心', '快乐', '幸福', '感谢', '谢谢', '恭喜', '厉害', '优秀', '漂亮', '帅', '顺利', '成功', '美好', '满意', '完美'];
        const negatives = ['坏', '差', '烂', '讨厌', '恨', '难过', '悲伤', '痛苦', '累', '烦', '无聊', '生气', '愤怒', '糟糕', '失败', '哭', '伤心', '失望', '倒霉', '崩溃', '焦虑'];
        let score = 0;
        positives.forEach(w => { if (sentence.includes(w)) score++; });
        negatives.forEach(w => { if (sentence.includes(w)) score--; });
        return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    },

    getTopic(sentence) {
        const topics = [
            { kws: ['吃', '喝', '饭', '餐', '菜', '饮', '食', '饿', '渴', '味道', '好吃', '早点', '宵夜', '外卖', '打包'], emojis: ['🍽️', '🥢', '🍴', '😋'] },
            { kws: ['书', '阅读', '读', '小说', '文章', '图书馆', '书店'], emojis: ['📖', '📚', '📕'] },
            { kws: ['音乐', '唱歌', '歌', '听', '曲', '旋律', '演唱会', 'KTV', '乐队'], emojis: ['🎵', '🎶', '🎤', '🎧'] },
            { kws: ['运动', '锻炼', '健身', '跑步', '打球', '游泳', '练', '瑜伽', '跳舞', '散步', '爬山', '骑行'], emojis: ['🏃', '💪', '🏋️', '⚽'] },
            { kws: ['电影', '电视', '视频', '看', '追剧', '综艺', '动漫', '纪录片'], emojis: ['🎬', '📺', '🎥', '🍿'] },
            { kws: ['睡', '困', '晚安', '熬夜', '失眠', '早起', '午休'], emojis: ['😴', '🌙', '💤', '🛏️'] },
            { kws: ['旅行', '旅游', '出去', '出发', '逛逛', '玩', '度假', '游玩', '自驾', '景区', '攻略'], emojis: ['✈️', '🚗', '🎒', '🗺️'] },
            { kws: ['电脑', '手机', '游戏', '打字', '编程', '写代码', '上网', '刷', 'APP', '软件', '更新', '下载'], emojis: ['🎮', '🖥️', '📱', '⌨️'] },
            { kws: ['一起', '我们', '大家', '聚会', '见面', '团', '组', '队', '约', '邀', '群'], emojis: ['👫', '🤝', '🎉', '👥'] },
            { kws: ['生日', '祝你', '祝您'], emojis: ['🎂', '🎉', '🎁', '🥳'] },
            { kws: ['谢谢', '感谢', '多谢', '感激', '感恩', '辛苦了'], emojis: ['🙏', '😊', '❤️', '🌸'] },
            { kws: ['对不起', '抱歉', '不好意思', '道歉', '赔罪', '打扰了', '麻烦'], emojis: ['😔', '🙏', '😅', '😳'] },
            { kws: ['再见', '拜拜', '明天见', '下次', '回见', '回头见', '拜'], emojis: ['👋', '👋🏻', '😊'] },
            { kws: ['加油', '努力', '奋斗', '坚持', '冲', '拼', '继续', '搞定', '拿下', '必胜'], emojis: ['💪', '🔥', '🎯', '🚀'] },
            { kws: ['学习', '作业', '考试', '毕业', '上课', '老师', '同学', '学校', '考研', '留学', '论文', '成绩', '分数'], emojis: ['📚', '✏️', '🎓', '📝'] },
            { kws: ['工作', '上班', '同事', '老板', '客户', '项目', '加班', '辞职', '升职', '加薪', '面试', '培训', '出差', '会议', '汇报'], emojis: ['💼', '📊', '👔', '💻'] },
            { kws: ['健康', '生病', '感冒', '医院', '药', '身体', '医生', '护士', '体检', '养生', '锻炼', '休息', '调理', '康复'], emojis: ['🏥', '💊', '🩺', '🌿'] },
            { kws: ['天气', '下雨', '雪', '晴', '阳光', '风', '冷', '热', '暖', '凉', '多云', '台风', '雾'], emojis: ['☀️', '🌧️', '❄️', '🌈'] },
            { kws: ['花', '草', '树', '大海', '海', '山', '星空', '星星', '月亮', '夕阳', '日出', '晚霞', '蓝天', '风景', '大自然', '公园'], emojis: ['🌸', '🌊', '🏔️', '🌟', '🌙'] },
            { kws: ['买', '购物', '商店', '超市', '网购', '快递', '包裹', '拆', '逛街', '商场', '下单'], emojis: ['🛍️', '💰', '📦', '🎁'] },
        ];
        for (const topic of topics) {
            for (const kw of topic.kws) {
                if (sentence.includes(kw)) {
                    return topic.emojis[Math.floor(Math.random() * topic.emojis.length)];
                }
            }
        }
        return null;
    },

    analyze(sentence) {
        const trimmed = sentence.trim();
        if (trimmed.length <= 1) return null;

        const topicEmoji = this.getTopic(trimmed);
        if (topicEmoji) return topicEmoji;

        const mood = this.getMood(trimmed);
        const sentiment = this.getSentiment(trimmed);

        const table = {
            'excited_positive':     ['🎉', '🔥', '🤩', '🥳', '✨'],
            'excited_negative':     ['😤', '💢', '😡', '🤬'],
            'excited_neutral':      ['⚡', '🔥', '💪', '🚀', '🎯'],
            'questioning_positive': ['🤔', '🧐', '💭'],
            'questioning_negative': ['😕', '🤨', '😒', '😐'],
            'questioning_neutral':  ['🤔', '❓', '🤷', '🧐'],
            'pensive_*':     ['💭', '😌', '🌸', '🌙', '✨'],
            'playful_*':     ['😜', '✨', '🎵', '💫', '🌟'],
            'suggestive_*':  ['💡', '👍', '✨', '😊', '👉'],
            'rhetorical_*':  ['🤔', '😏', '💭', '🤷', '✨'],
            'exclamation_*': ['😮', '👀', '💬', '🤭', '😲'],
            'neutral_positive': ['😊', '👍', '✨', '🌟'],
            'neutral_negative': ['😔', '💧', '🍂', '🌧️', '😞'],
            'neutral_neutral':  ['💬', '📝', '✨', '👉', '💫'],
        };

        const special = ['pensive', 'playful', 'suggestive', 'rhetorical', 'exclamation'];
        const key = special.includes(mood) ? `${mood}_*` : `${mood}_${sentiment}`;
        const list = table[key] || table['neutral_neutral'];
        return list[Math.floor(Math.random() * list.length)];
    }
};

/** 句子级语义补全：句末追加一个 emoji（句子已含 emoji 则跳过） */
function addSemanticEmojis(text, keywordCount) {
    const sentenceRegex = /[^。！？\n!?]+[。！？\n!?]?/g;
    const sentences = text.match(sentenceRegex);
    if (!sentences) return { result: text, addedCount: 0 };

    let result = '';
    let addedCount = 0;

    for (let raw of sentences) {
        const trimmed = raw.trim();
        if (trimmed.length <= 1) { result += raw; continue; }
        if (hasEmoji(trimmed)) { result += raw; continue; }
        if (keywordCount + addedCount >= MAX_EMOJIS) { result += raw; continue; }

        const emoji = semanticEngine.analyze(trimmed);
        if (emoji) {
            raw = raw.replace(/([。！？\n!?]*)$/, (m) => ` ${emoji}${m}`);
            addedCount++;
        }
        result += raw;
    }

    return { result, addedCount };
}

/* -------------------- 渲染结果 -------------------- */
function renderResultText(result) {
    let html = '';
    let emojiIndex = 0;
    for (const g of graphemes(result)) {
        if (hasEmoji(g)) {
            const delay = Math.min(emojiIndex * 40, 500);
            html += `<span class="rl-emoji" style="animation-delay:${delay}ms">${g}</span>`;
            emojiIndex++;
        } else {
            html += escapeHtml(g);
        }
    }
    elements.resultText.innerHTML = html;
}

function displayResult(result, emojiCount, ms) {
    state.lastResult = result;
    renderResultText(result);
    elements.resultBadge.textContent = `${emojiCount} 个 emoji`;
    elements.resultTime.textContent = `${Math.max(1, Math.round(ms))} ms`;

    // 徽章弹跳
    elements.resultBadge.classList.remove('pop');
    void elements.resultBadge.offsetWidth;
    elements.resultBadge.classList.add('pop');

    elements.outputPlaceholder.hidden = true;
    elements.outputContent.hidden = false;
    elements.copyBtn.disabled = false; // 有结果即可复制

    // 重放入场动画
    elements.outputContent.style.animation = 'none';
    void elements.outputContent.offsetWidth;
    elements.outputContent.style.animation = '';
}

function resetResult() {
    state.lastResult = '';
    elements.resultText.textContent = '';
    elements.resultBadge.textContent = '0 个 emoji';
    elements.resultTime.textContent = '—';
    elements.outputPlaceholder.hidden = false;
    elements.outputContent.hidden = true;
    elements.copyBtn.disabled = true;
}

/* -------------------- 处理流程 -------------------- */
function runProcess({ silent = false } = {}) {
    const text = elements.inputTextarea.value.trim();
    if (!text) {
        resetResult();
        if (!silent) showToast('🤔', '请先输入一些文字～', 'info');
        return;
    }
    const { result, emojiCount, ms } = processText(text);
    displayResult(result, emojiCount, ms);

    if (!silent) {
        if (emojiCount > 0) {
            showToast('🎉', `处理完成！添加了 ${emojiCount} 个表情`, 'success');
        } else {
            showToast('🤔', '没有匹配到关键词，换个说法试试～', 'info');
        }
    }
}

async function handleProcess() {
    if (elements.processBtn.disabled) return;
    elements.processBtn.disabled = true;
    elements.processBtn.classList.add('btn-loading');
    elements.processBtn.querySelector('.btn-icon').textContent = '⏳';

    await sleep(360); // 保留一点仪式感，让加载动画可见

    runProcess();

    elements.processBtn.classList.remove('btn-loading');
    elements.processBtn.querySelector('.btn-icon').textContent = '✨';
    elements.processBtn.disabled = !elements.inputTextarea.value.trim();
}

const liveProcess = debounce(() => {
    if (!state.live) return;
    const text = elements.inputTextarea.value.trim();
    if (!text) { resetResult(); return; }
    runProcess({ silent: true });
}, 550);

/* -------------------- 复制 -------------------- */
async function copyToClipboard() {
    if (!state.lastResult) return;
    try {
        await navigator.clipboard.writeText(state.lastResult);
    } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = state.lastResult;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
    showToast('📋', '复制成功！快去分享吧', 'success');
}

/* -------------------- Toast -------------------- */
let toastTimer = null;

function showToast(icon, message, type = 'success') {
    if (toastTimer) clearTimeout(toastTimer);

    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast toast-${type}`;

    // 重启动画
    elements.toastProgress.style.animation = 'none';
    void elements.toastProgress.offsetWidth;
    elements.toastProgress.style.animation = '';

    void elements.toast.offsetWidth;
    elements.toast.classList.add('show');

    toastTimer = setTimeout(() => {
        elements.toast.classList.remove('show');
        toastTimer = null;
    }, 2000);
}

/* -------------------- 清除 -------------------- */
function clearAll() {
    elements.inputTextarea.value = '';
    resetResult();
    updateCharCount();
    elements.inputTextarea.focus();
    showToast('🧹', '已清除所有内容', 'info');
}

/* -------------------- 事件绑定 -------------------- */
function initEvents() {
    elements.processBtn.addEventListener('click', handleProcess);
    elements.clearBtn.addEventListener('click', clearAll);
    elements.copyBtn.addEventListener('click', copyToClipboard);

    elements.inputTextarea.addEventListener('input', () => {
        updateCharCount();
        liveProcess();
    });
    elements.inputTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!state.live) handleProcess(); else runProcess({ silent: true });
        }
    });

    elements.themeToggle.addEventListener('click', toggleTheme);

    elements.customEmojiBtn.addEventListener('click', () => toggleCustomSection());
    elements.closeCustomEmoji.addEventListener('click', () => toggleCustomSection(false));
    elements.addCustomEmoji.addEventListener('click', addCustomEmoji);
    elements.customEmojiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomEmoji();
    });

    // 实时处理开关
    elements.liveToggle.addEventListener('change', () => {
        state.live = elements.liveToggle.checked;
        try { localStorage.setItem(STORAGE_KEYS.LIVE, String(state.live)); } catch (e) {}
        document.querySelector('.live-toggle').classList.toggle('is-live', state.live);
        if (state.live && elements.inputTextarea.value.trim()) {
            runProcess({ silent: true });
        } else if (!state.live && !elements.inputTextarea.value.trim()) {
            resetResult();
        }
    });

    // 示例填充
    elements.exampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            elements.inputTextarea.value = chip.dataset.example || '';
            updateCharCount();
            elements.inputTextarea.focus();
            if (state.live) runProcess({ silent: true });
        });
    });

    // 按钮涟漪（事件委托）
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        btn.style.setProperty('--ripple-x', `${e.clientX - rect.left}px`);
        btn.style.setProperty('--ripple-y', `${e.clientY - rect.top}px`);
        btn.classList.remove('ripple-active');
        void btn.offsetWidth;
        btn.classList.add('ripple-active');
        setTimeout(() => btn.classList.remove('ripple-active'), 550);
    });
}

/* -------------------- 初始化 -------------------- */
function init() {
    initTheme();
    initCustomEmojis();
    initEmojiGrid();

    // 实时处理偏好
    try {
        state.live = localStorage.getItem(STORAGE_KEYS.LIVE) === 'true';
    } catch (e) {}
    elements.liveToggle.checked = state.live;
    document.querySelector('.live-toggle').classList.toggle('is-live', state.live);

    initEvents();
    updateCharCount();
    elements.inputTextarea.focus();
}

document.addEventListener('DOMContentLoaded', init);