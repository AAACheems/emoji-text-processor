/**
 * Emoji 智能文本处理器
 * 
 * 功能：语义化 emoji 推荐、自定义 emoji、主题切换、流畅动画
 */

// ==================== Emoji 数据库 ====================
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

// 单个词的 emoji 映射
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

// ==================== Trie 匹配引擎 ====================
class TrieNode {
    constructor() {
        this.children = {};
        this.emojis = null;
    }
}

let _keywordTrie = null;

function getKeywordTrie() {
    if (_keywordTrie) return _keywordTrie;
    _keywordTrie = new TrieNode();

    for (const [, data] of Object.entries(emojiDatabase)) {
        for (const keyword of data.keywords) {
            _insertTrie(_keywordTrie, keyword, data.emojis);
        }
    }

    for (const [keyword, emojis] of Object.entries(wordEmojiMap)) {
        _insertTrie(_keywordTrie, keyword, emojis);
    }

    return _keywordTrie;
}

function _insertTrie(root, keyword, emojis) {
    let node = root;
    for (let i = 0; i < keyword.length; i++) {
        const ch = keyword[i];
        if (!node.children[ch]) {
            node.children[ch] = new TrieNode();
        }
        node = node.children[ch];
    }
    if (!node.emojis) {
        node.emojis = emojis;
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================== 配置 ====================
const STORAGE_KEYS = {
    THEME: 'emoji-app-theme',
    CUSTOM_EMOJIS: 'emoji-app-custom-emojis'
};

// ==================== 状态管理 ====================
const state = {
    customEmojis: [],
    currentTheme: 'dark'
};

// ==================== DOM 元素 ====================
const elements = {
    inputTextarea: document.getElementById('input-text'),
    processBtn: document.getElementById('process-btn'),
    clearBtn: document.getElementById('clear-btn'),
    copyBtn: document.getElementById('copy-btn'),
    outputPlaceholder: document.getElementById('output-placeholder'),
    outputContent: document.getElementById('output-content'),
    resultText: document.getElementById('result-text'),
    resultBadge: document.getElementById('result-badge'),
    emojiGrid: document.getElementById('emoji-grid'),
    customEmojiSection: document.getElementById('custom-emoji-section'),
    customEmojiBtn: document.getElementById('custom-emoji-btn'),
    closeCustomEmoji: document.getElementById('close-custom-emoji'),
    customEmojiInput: document.getElementById('custom-emoji-input'),
    addCustomEmoji: document.getElementById('add-custom-emoji'),
    customEmojiList: document.getElementById('custom-emoji-list'),
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.querySelector('.theme-icon'),
    themeText: document.querySelector('.theme-text'),
    charCount: document.querySelector('.char-count'),
    toast: document.getElementById('toast'),
    toastIcon: document.querySelector('.toast-icon'),
    toastMessage: document.querySelector('.toast-message')
};

// 常用 emoji 快速选择
const quickEmojis = [
    '😊', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😅', '😢', '😭',
    '😡', '🥹', '🤩', '😱', '😴', '😳', '🥺', '😏', '😜', '🤗',
    '👍', '👏', '🎉', '🎊', '❤️', '💖', '💔', '💯', '✨', '🌟',
    '🔥', '💪', '🚀', '💡', '🙏', '👋', '🎂', '🍀', '🎯', '💫'
];

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCustomEmojis();
    initEmojiGrid();
    initEventListeners();
    updateCharCount();
    elements.inputTextarea.focus();
});

// ==================== 主题功能 ====================
function initTheme() {
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme) {
            state.currentTheme = savedTheme;
        }
    } catch (e) {
        // localStorage 不可用（如 Safari 私密模式），使用默认主题
    }
    updateThemeUI();
    applyTheme();
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    try {
        localStorage.setItem(STORAGE_KEYS.THEME, state.currentTheme);
    } catch (e) {}
    updateThemeUI();
    applyTheme();
    showToast('🎨', `已切换到${state.currentTheme === 'dark' ? '暗色' : '亮色'}主题 💫`, 'info');
}

function updateThemeUI() {
    elements.themeIcon.textContent = state.currentTheme === 'dark' ? '🌙' : '☀️';
    elements.themeText.textContent = state.currentTheme === 'dark' ? '暗模式' : '亮模式';
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.currentTheme);
}

// ==================== 自定义 Emoji ====================
function initCustomEmojis() {
    try {
        const savedEmojis = localStorage.getItem(STORAGE_KEYS.CUSTOM_EMOJIS);
        if (savedEmojis) {
            state.customEmojis = JSON.parse(savedEmojis);
        }
    } catch (e) {
        state.customEmojis = [];
    }
    renderCustomEmojis();
}

function toggleCustomEmojiSection() {
    const isHidden = elements.customEmojiSection.style.display === 'none';
    elements.customEmojiSection.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        elements.customEmojiInput.focus();
    }
}

function addCustomEmoji() {
    const emoji = elements.customEmojiInput.value.trim();
    
    if (!emoji) {
        showToast('⚠️', '请输入一个 emoji 😊', 'warning');
        return;
    }
    
    if (state.customEmojis.includes(emoji)) {
        showToast('⚠️', '这个 emoji 已经在列表中了 🤨', 'warning');
        return;
    }
    
    state.customEmojis.push(emoji);
    try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_EMOJIS, JSON.stringify(state.customEmojis));
    } catch (e) {
        // localStorage 不可用时静默失败
    }
    renderCustomEmojis();
    elements.customEmojiInput.value = '';
    showToast('✅', '已添加自定义 emoji 🎉', 'success');
}

function deleteCustomEmoji(emoji) {
    const index = state.customEmojis.indexOf(emoji);
    if (index > -1) {
        state.customEmojis.splice(index, 1);
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_EMOJIS, JSON.stringify(state.customEmojis));
        } catch (e) {}
        renderCustomEmojis();
        showToast('🗑️', '已删除自定义 emoji 👋', 'info');
    }
}

function renderCustomEmojis() {
    elements.customEmojiList.innerHTML = '';
    state.customEmojis.forEach(emoji => {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-emoji-item';
        
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji;
        btn.addEventListener('click', () => insertEmoji(emoji));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'custom-emoji-delete';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomEmoji(emoji);
        });
        
        wrapper.appendChild(btn);
        wrapper.appendChild(deleteBtn);
        elements.customEmojiList.appendChild(wrapper);
    });
}

// ==================== Emoji 网格 ====================
function initEmojiGrid() {
    elements.emojiGrid.innerHTML = '';
    quickEmojis.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'emoji-btn';
        button.textContent = emoji;
        button.title = emoji;
        button.addEventListener('click', () => insertEmoji(emoji));
        elements.emojiGrid.appendChild(button);
    });
}

function insertEmoji(emoji) {
    const textarea = elements.inputTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newValue = text.substring(0, start) + emoji + text.substring(end);
    textarea.value = newValue;
    
    textarea.focus();
    textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    
    updateCharCount();
}

// ==================== 字符计数 ====================
function updateCharCount() {
    const count = elements.inputTextarea.value.length;
    const displayCount = Math.min(count, 2000);
    elements.charCount.textContent = `${displayCount} / 2000`;
    
    if (count > 2000) {
        elements.charCount.style.color = 'var(--danger-color)';
        elements.inputTextarea.value = elements.inputTextarea.value.substring(0, 2000);
        elements.processBtn.disabled = false;
    } else {
        elements.charCount.style.color = '';
        elements.processBtn.disabled = count === 0;
    }
}

// ==================== 智能文本处理（Trie 单次扫描）====================
function processText(text) {
    if (!text || text.trim() === '') {
        return { result: '', emojiCount: 0 };
    }

    const trie = getKeywordTrie();
    const matches = [];

    for (let i = 0; i < text.length; i++) {
        let node = trie;
        let bestMatch = null;
        let bestEnd = i;

        for (let j = i; j < text.length; j++) {
            node = node.children[text[j]];
            if (!node) break;
            if (node.emojis) {
                bestMatch = node.emojis;
                bestEnd = j;
            }
        }

        if (bestMatch) {
            matches.push({ end: bestEnd, emojis: bestMatch });
            i = bestEnd;
        }
    }

    let result = text;
    for (let k = matches.length - 1; k >= 0; k--) {
        const match = matches[k];
        const emoji = getRandomEmoji(match.emojis);
        result = result.slice(0, match.end + 1) + emoji + result.slice(match.end + 1);
    }

    const semantic = addSemanticEmojis(result);

    return {
        result: semantic.result,
        emojiCount: matches.length + semantic.addedCount
    };
}

function getRandomEmoji(emojis) {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// ==================== 语义分析引擎 ====================
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
        const positives = ['好','棒','赞','美','喜欢','爱','开心','快乐','幸福','感谢','谢谢','恭喜','厉害','优秀','漂亮','帅','顺利','成功','美好','满意','完美'];
        const negatives = ['坏','差','烂','讨厌','恨','难过','悲伤','痛苦','累','烦','无聊','生气','愤怒','糟糕','失败','哭','伤心','失望','倒霉','崩溃','焦虑'];
        let score = 0;
        positives.forEach(w => { if (sentence.includes(w)) score++; });
        negatives.forEach(w => { if (sentence.includes(w)) score--; });
        return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    },

    getTopic(sentence) {
        const topics = [
            { kws: ['吃','喝','饭','餐','菜','饮','食','饿','渴','味道','好吃','早点','宵夜','外卖','打包'], emojis: ['🍽️','🥢','🍴','😋'] },
            { kws: ['书','阅读','读','小说','文章','图书馆','书店'], emojis: ['📖','📚','📕'] },
            { kws: ['音乐','唱歌','歌','听','曲','旋律','演唱会','KTV','乐队'], emojis: ['🎵','🎶','🎤','🎧'] },
            { kws: ['运动','锻炼','健身','跑步','打球','游泳','练','瑜伽','跳舞','散步','爬山','骑行'], emojis: ['🏃','💪','🏋️','⚽'] },
            { kws: ['电影','电视','视频','看','追剧','综艺','动漫','纪录片'], emojis: ['🎬','📺','🎥','🍿'] },
            { kws: ['睡','困','晚安','熬夜','失眠','早起','午休'], emojis: ['😴','🌙','💤','🛏️'] },
            { kws: ['旅行','旅游','出去','出发','逛逛','玩','度假','游玩','自驾','景区','攻略'], emojis: ['✈️','🚗','🎒','🗺️'] },
            { kws: ['电脑','手机','游戏','打字','编程','写代码','上网','刷','APP','软件','更新','下载'], emojis: ['🎮','🖥️','📱','⌨️'] },
            { kws: ['一起','我们','大家','聚会','见面','团','组','队','约','邀','群'], emojis: ['👫','🤝','🎉','👥'] },
            { kws: ['生日','祝你','祝您'], emojis: ['🎂','🎉','🎁','🥳'] },
            { kws: ['谢谢','感谢','多谢','感激','感恩','辛苦了'], emojis: ['🙏','😊','❤️','🌸'] },
            { kws: ['对不起','抱歉','不好意思','道歉','赔罪','打扰了','麻烦'], emojis: ['😔','🙏','😅','😳'] },
            { kws: ['再见','拜拜','明天见','下次','回见','回头见','拜'], emojis: ['👋','👋🏻','😊'] },
            { kws: ['加油','努力','奋斗','坚持','冲','拼','继续','搞定','拿下','必胜'], emojis: ['💪','🔥','🎯','🚀'] },
            { kws: ['学习','作业','考试','毕业','上课','老师','同学','学校','考研','留学','论文','成绩','分数'], emojis: ['📚','✏️','🎓','📝'] },
            { kws: ['工作','上班','同事','老板','客户','项目','加班','辞职','升职','加薪','面试','培训','出差','会议','汇报'], emojis: ['💼','📊','👔','💻'] },
            { kws: ['健康','生病','感冒','医院','药','身体','医生','护士','体检','养生','锻炼','休息','调理','康复'], emojis: ['🏥','💊','🩺','🌿'] },
            { kws: ['天气','下雨','雪','晴','阳光','风','冷','热','暖','凉','多云','台风','雾'], emojis: ['☀️','🌧️','❄️','🌈'] },
            { kws: ['花','草','树','大海','海','山','星空','星星','月亮','夕阳','日出','晚霞','蓝天','风景','大自然','公园'], emojis: ['🌸','🌊','🏔️','🌟','🌙'] },
            { kws: ['买','购物','商店','超市','网购','快递','包裹','拆','逛街','商场','下单'], emojis: ['🛍️','💰','📦','🎁'] },
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
            'excited_positive':    ['🎉','🔥','🤩','🥳','✨'],
            'excited_negative':    ['😤','💢','😡','🤬'],
            'excited_neutral':     ['⚡','🔥','💪','🚀','🎯'],
            'questioning_positive':['🤔','🧐','💭'],
            'questioning_negative':['😕','🤨','😒','😐'],
            'questioning_neutral': ['🤔','❓','🤷','🧐'],
            'pensive_*':    ['💭','😌','🌸','🌙','✨'],
            'playful_*':    ['😜','✨','🎵','💫','🌟'],
            'suggestive_*': ['💡','👍','✨','😊','👉'],
            'rhetorical_*': ['🤔','😏','💭','🤷','✨'],
            'exclamation_*':['😮','👀','💬','🤭','😲'],
            'neutral_positive': ['😊','👍','✨','🌟'],
            'neutral_negative': ['😔','💧','🍂','🌧️','😞'],
            'neutral_neutral':  ['💬','📝','✨','👉','💫'],
        };

        const special = ['pensive','playful','suggestive','rhetorical','exclamation'];
        const key = special.includes(mood) ? `${mood}_*` : `${mood}_${sentiment}`;
        const list = table[key] || table['neutral_neutral'];
        return list[Math.floor(Math.random() * list.length)];
    }
};

function hasEmoji(str) {
    for (let i = 0; i < str.length; i++) {
        const cp = str.codePointAt(i);
        if (cp === undefined) continue;
        // 精确的 Emoji Unicode 区块（排除麻将牌、扑克牌等非表情符号）
        if ((cp >= 0x1F300 && cp <= 0x1F5FF) ||  // 杂项符号与象形文字
            (cp >= 0x1F600 && cp <= 0x1F64F) ||  // 表情符号
            (cp >= 0x1F680 && cp <= 0x1F6FF) ||  // 交通与地图
            (cp >= 0x1F900 && cp <= 0x1F9FF) ||  // 补充符号与象形文字
            (cp >= 0x1FA70 && cp <= 0x1FAFF) ||  // 符号与象形文字扩展-A
            (cp >= 0x2600 && cp <= 0x27BF) ||     // 杂项符号 + 装饰符号
            (cp >= 0x2300 && cp <= 0x23FF) ||     // 杂项技术（⌚⌛等）
            cp === 0x00A9 || cp === 0x00AE) {     // © ®
            return true;
        }
        if (cp > 0xFFFF) i++;
    }
    return false;
}

function addSemanticEmojis(text) {
    const sentenceRegex = /[^。！？\n!?]+[。！？\n!?]?/g;
    const sentences = text.match(sentenceRegex);
    if (!sentences) return { result: text, addedCount: 0 };

    let result = '';
    let addedCount = 0;

    for (let raw of sentences) {
        const trimmed = raw.trim();
        if (trimmed.length <= 1) { result += raw; continue; }
        if (hasEmoji(trimmed)) { result += raw; continue; }

        const emoji = semanticEngine.analyze(trimmed);
        if (emoji) {
            raw = raw.replace(/([。！？\n!?]*)$/, (m) => ` ${emoji}${m}`);
            addedCount++;
        }
        result += raw;
    }

    return { result, addedCount };
}

// ==================== 显示结果 ====================
function displayResult(result, emojiCount) {
    elements.resultText.textContent = result;
    elements.resultBadge.textContent = `${emojiCount} 个 emoji`;
    
    // 徽章弹性动画
    elements.resultBadge.style.transform = 'scale(1.3)';
    requestAnimationFrame(() => {
        elements.resultBadge.style.transform = '';
    });
    
    elements.outputPlaceholder.style.display = 'none';
    elements.outputContent.style.display = 'block';
    elements.copyBtn.disabled = false;
    
    // 重启动画：先清除再应用，确保每次处理结果都有入场动画
    elements.outputContent.style.animation = 'none';
    requestAnimationFrame(() => {
        elements.outputContent.style.animation = '';
    });
}

// ==================== 复制功能 ====================
async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(elements.resultText.textContent);
        showToast('✅', '复制成功！快去分享吧 📤', 'success');
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = elements.resultText.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('✅', '复制成功！快去分享吧 📤', 'success');
    }
}

// ==================== Toast 通知 ====================
let toastTimer = null;

function showToast(icon, message, type = 'success') {
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.className = `toast toast-${type} show`;
    
    toastTimer = setTimeout(() => {
        elements.toast.className = `toast toast-${type}`;
        toastTimer = null;
    }, 2000);
}

// ==================== 清除功能 ====================
function clearAll() {
    elements.inputTextarea.value = '';
    elements.outputPlaceholder.style.display = 'flex';
    elements.outputContent.style.display = 'none';
    elements.resultText.textContent = '';
    elements.resultBadge.textContent = '0 个 emoji';
    elements.copyBtn.disabled = true;
    elements.processBtn.disabled = true;
    updateCharCount();
    elements.inputTextarea.focus();
    showToast('🧹', '已清除所有内容 ✨', 'info');
}

// ==================== 事件监听器 ====================
function initEventListeners() {
    elements.processBtn.addEventListener('click', () => {
        const text = elements.inputTextarea.value.trim();
        if (!text || elements.processBtn.disabled) return;
        
        elements.processBtn.disabled = true;
        elements.processBtn.classList.add('btn-loading');
        elements.processBtn.querySelector('.btn-icon').textContent = '⏳';
        
        // 允许 UI 更新按钮状态后再执行同步处理
        setTimeout(() => {
            const { result, emojiCount } = processText(text);
            displayResult(result, emojiCount);
            
            elements.processBtn.classList.remove('btn-loading');
            elements.processBtn.querySelector('.btn-icon').textContent = '✨';
            elements.processBtn.disabled = false;
            updateCharCount();
            
            if (emojiCount > 0) {
                showToast('🎉', `处理完成！添加了 ${emojiCount} 个表情 🎨`, 'success');
            } else {
                showToast('🤔', '没有找到匹配的关键词哦~', 'warning');
            }
        }, 300);
    });

    elements.clearBtn.addEventListener('click', clearAll);
    elements.copyBtn.addEventListener('click', copyToClipboard);
    elements.inputTextarea.addEventListener('input', updateCharCount);
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.customEmojiBtn.addEventListener('click', toggleCustomEmojiSection);
    elements.closeCustomEmoji.addEventListener('click', toggleCustomEmojiSection);
    elements.addCustomEmoji.addEventListener('click', addCustomEmoji);

    // 按钮涟漪效果
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.style.setProperty('--ripple-x', `${x}px`);
            this.style.setProperty('--ripple-y', `${y}px`);
            this.classList.add('ripple-active');
            setTimeout(() => this.classList.remove('ripple-active'), 500);
        });
    });

    elements.inputTextarea.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            elements.processBtn.click();
        }
    });

    elements.customEmojiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addCustomEmoji();
        }
    });
}