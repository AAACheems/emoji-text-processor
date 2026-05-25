/**
 * Emoji 智能文本处理器
 * 
 * 功能：语义化 emoji 推荐、自定义 emoji、主题切换、流畅动画
 */

// ==================== Emoji 数据库 ====================
const emojiDatabase = {
    // 天气相关
    weather: {
        keywords: ['天气', '晴天', '下雨', '雪', '刮风', '多云', '阴天', '雾霾', '雷阵雨', '冰雹', '台风', '阳光', '雨', '风'],
        emojis: ['☀️', '🌤️', '⛅', '🌥️', '🌦️', '🌧️', '⛈️', '❄️', '🌨️', '🌀', '🌪️', '🌫️', '🌈', '☔']
    },
    // 时间相关
    time: {
        keywords: ['今天', '明天', '昨天', '早上', '中午', '晚上', '下午', '凌晨', '深夜', '周末', '假期', '星期', '早晨', '傍晚'],
        emojis: ['⏰', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '☀️', '🌙', '⭐', '🌅', '🌆', '🌃']
    },
    // 地点相关
    place: {
        keywords: ['公园', '学校', '公司', '家', '商店', '超市', '餐厅', '咖啡馆', '电影院', '医院', '车站', '机场', '海边', '山', '城市', '街道'],
        emojis: ['🏠', '🏢', '🏬', '🏪', '🏫', '🏥', '🏭', '🏰', '⛲', '🌳', '🌊', '🏔️', '🌆', '🚇', '🚌', '✈️', '🚂', '☕', '🍽️', '🎬']
    },
    // 活动相关
    activity: {
        keywords: ['散步', '跑步', '游泳', '健身', '运动', '打球', '看电影', '听音乐', '读书', '学习', '工作', '开会', '吃饭', '喝茶', '聊天', '睡觉', '旅行', '购物'],
        emojis: ['🚶', '🏃', '🏊', '🏋️', '⚽', '🏀', '🎾', '🎬', '🎵', '📚', '💻', '📝', '🍽️', '☕', '💬', '😴', '✈️', '🛍️', '🎯', '🏆']
    },
    // 情感相关
    emotion: {
        keywords: ['开心', '高兴', '快乐', '幸福', '悲伤', '难过', '生气', '愤怒', '无聊', '疲惫', '惊喜', '兴奋', '期待', '想念', '爱', '喜欢'],
        emojis: ['😊', '😄', '😃', '😀', '🥰', '😍', '😭', '😢', '😤', '😡', '😴', '😪', '🤩', '😱', '💖', '❤️', '💔', '💯', '🥳']
    },
    // 食物相关
    food: {
        keywords: ['饭', '面', '菜', '水果', '咖啡', '茶', '蛋糕', '冰淇淋', '零食', '早餐', '午餐', '晚餐', '火锅', '烧烤', '披萨', '汉堡'],
        emojis: ['🍚', '🍜', '🍲', '🍳', '🥗', '🍕', '🍔', '🍟', '🌭', '🍿', '🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍒', '☕', '🍵', '🍰', '🍦', '🍩', '🥤']
    },
    // 动物相关
    animal: {
        keywords: ['猫', '狗', '鸟', '鱼', '兔子', '熊猫', '老虎', '大象', '熊', '马', '牛', '羊', '猪', '鸡', '鸭'],
        emojis: ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🐠']
    },
    // 节日相关
    holiday: {
        keywords: ['春节', '新年', '圣诞', '元旦', '中秋', '国庆', '生日', '情人节', '儿童节', '母亲节', '父亲节', '礼物'],
        emojis: ['🎄', '🎅', '🎉', '🎊', '🎁', '🎈', '🏮', '🎑', '🎇', '🎆', '🎂', '💝', '👨👩👧👦', '🥳']
    },
    // 工作学习相关
    work: {
        keywords: ['工作', '学习', '作业', '报告', '会议', '项目', '代码', '编程', '设计', '写作', '考试', '面试', '毕业'],
        emojis: ['💼', '📊', '📈', '📉', '📋', '📝', '💻', '⌨️', '🎨', '✏️', '📚', '🎓', '👔', '🏆']
    },
    // 交通相关
    transport: {
        keywords: ['车', '地铁', '公交', '火车', '飞机', '船', '打车', '步行', '骑行', '出发', '到达'],
        emojis: ['🚗', '🚙', '🚌', '🚎', '🚇', '🚆', '🚄', '✈️', '🚢', '🚴', '🚶', '🚀', '🛫', '🛬']
    }
};

// 单个词的 emoji 映射
const wordEmojiMap = {
    '好': ['👍', '😊', '👏'],
    '棒': ['👍', '👏', '🎉'],
    '赞': ['👍', '👏'],
    '爱': ['❤️', '💖', '💕'],
    '想': ['💭', '🤔'],
    '要': ['✅', '📋'],
    '去': ['🚶', '✈️'],
    '来': ['🚶', '🏃'],
    '有': ['✅', '💼'],
    '没有': ['❌', '🚫'],
    '能': ['✅', '👍'],
    '不能': ['❌', '🚫'],
    '会': ['✅', '💡'],
    '不会': ['❌', '🤔'],
    '希望': ['✨', '🌟'],
    '谢谢': ['🙏', '😊'],
    '对不起': ['😔', '🙏'],
    '再见': ['👋', '👋🏻'],
    '你好': ['👋', '👋🏻', '😊'],
    '快乐': ['🎉', '😊', '😄'],
    '开心': ['😊', '😄', '😃'],
    '难过': ['😢', '😔'],
    '生气': ['😤', '😡'],
    '饿': ['🍔', '🍕', '🍽️'],
    '渴': ['💧', '🍵', '☕'],
    '累': ['😴', '😪'],
    '困': ['😴', '💤'],
    '冷': ['❄️', '🧣'],
    '热': ['🔥', '☀️'],
    '美': ['🌸', '💅', '✨'],
    '漂亮': ['🌸', '💅', '✨'],
    '帅': ['😎', '💪'],
    '酷': ['😎', '🆒'],
    '有趣': ['😄', '🤣', '🎮'],
    '无聊': ['😴', '🥱'],
    '惊喜': ['🤩', '😱', '🎉'],
    '礼物': ['🎁', '🎀'],
    '钱': ['💰', '💵', '💴'],
    '时间': ['⏰', '🕐'],
    '今天': ['📅', '☀️'],
    '明天': ['📅', '🔮'],
    '周末': ['🎉', '☀️'],
    '朋友': ['👫', '👬', '👭'],
    '家人': ['👨👩👧👦', '👪']
};

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
    '👍', '👏', '🎉', '🎊', '❤️', '💖', '✨', '🌟', '🔥', '💪',
    '🚀', '💡', '📚', '💻', '🎵', '🎬', '🍕', '🍔', '☕', '🍵'
];

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initCustomEmojis();
    initEmojiGrid();
    initEventListeners();
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
    showToast('🎨', `已切换到${state.currentTheme === 'dark' ? '暗色' : '亮色'}主题 💫`);
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
        showToast('⚠️', '请输入一个 emoji 😊');
        return;
    }
    
    if (state.customEmojis.includes(emoji)) {
        showToast('⚠️', '这个 emoji 已经在列表中了 🤨');
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
    showToast('✅', '已添加自定义 emoji 🎉');
}

function deleteCustomEmoji(emoji) {
    const index = state.customEmojis.indexOf(emoji);
    if (index > -1) {
        state.customEmojis.splice(index, 1);
        try {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_EMOJIS, JSON.stringify(state.customEmojis));
        } catch (e) {}
        renderCustomEmojis();
        showToast('🗑️', '已删除自定义 emoji 👋');
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

// ==================== 智能文本处理（优化版本）====================
function processText(text) {
    if (!text || text.trim() === '') {
        return { result: '', emojiCount: 0 };
    }

    let result = text;
    let emojiCount = 0;
    const processedWords = new Set();

    // 批量处理完整短语匹配
    for (const [category, data] of Object.entries(emojiDatabase)) {
        for (const keyword of data.keywords) {
            if (text.includes(keyword) && !processedWords.has(keyword)) {
                result = result.replace(new RegExp(keyword, 'g'), match => {
                    if (!processedWords.has(match)) {
                        emojiCount++;
                        processedWords.add(match);
                        return `${match}${getRandomEmoji(data.emojis)}`;
                    }
                    return match;
                });
            }
        }
    }

    // 处理单个词的 emoji 映射
    const words = result.split(/(\s+)/);
    result = words.map(word => {
        if (word.trim() === '' || processedWords.has(word.trim())) {
            return word;
        }
        
        for (const [keyword, emojis] of Object.entries(wordEmojiMap)) {
            if (word.includes(keyword)) {
                emojiCount++;
                processedWords.add(word);
                const emoji = getRandomEmoji(emojis);
                return `${word}${emoji}`;
            }
        }
        
        return word;
    }).join('');

    // 语义补全：为无 emoji 的句子智能添加语境 emoji
    const semantic = addSemanticEmojis(result);
    result = semantic.result;
    emojiCount += semantic.addedCount;

    return { result, emojiCount };
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
            { kws: ['吃','喝','饭','餐','菜','饮','食','饿','渴','味道','好吃'], emojis: ['🍽️','🥢','🍴','😋'] },
            { kws: ['看书','阅读','书','小说','文章','读'], emojis: ['📖','📚','📕'] },
            { kws: ['音乐','唱歌','歌','听','曲','旋律'], emojis: ['🎵','🎶','🎤','🎧'] },
            { kws: ['运动','锻炼','健身','跑步','打球','游泳','练'], emojis: ['🏃','💪','🏋️','⚽'] },
            { kws: ['电影','电视','视频','看'], emojis: ['🎬','📺','🎥','🍿'] },
            { kws: ['睡觉','睡','困','晚安','疲','乏','熬夜'], emojis: ['😴','🌙','💤','🛏️'] },
            { kws: ['旅行','旅游','出去','出发','逛逛','玩','度假','游玩'], emojis: ['✈️','🚗','🎒','🗺️'] },
            { kws: ['电脑','手机','游戏','打字','编程','写代码'], emojis: ['🎮','🖥️','📱','⌨️'] },
            { kws: ['一起','我们','大家','聚会','见面','团','组','队'], emojis: ['👫','🤝','🎉','👥'] },
            { kws: ['生日','快乐','生日快乐'], emojis: ['🎂','🎉','🎁','🥳'] },
            { kws: ['谢谢','感谢','多谢','感激'], emojis: ['🙏','😊','❤️','🌸'] },
            { kws: ['对不起','抱歉','不好意思','道歉','赔罪'], emojis: ['😔','🙏','😅','😳'] },
            { kws: ['再见','拜拜','明天见','下次','回见'], emojis: ['👋','👋🏻','😊'] },
            { kws: ['加油','努力','奋斗','坚持','冲','拼','继续'], emojis: ['💪','🔥','🎯','🚀'] },
            { kws: ['学习','作业','考试','毕业','上课','老师','同学','学校'], emojis: ['📚','✏️','🎓','📝'] },
            { kws: ['工作','上班','同事','老板','客户','项目','加班'], emojis: ['💼','📊','👔','💻'] },
            { kws: ['健康','生病','感冒','医院','药','身体','医生'], emojis: ['🏥','💊','🩺','🌿'] },
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
        if ((cp >= 0x1F000 && cp <= 0x1FFFF) ||
            (cp >= 0x2600 && cp <= 0x27BF) ||
            cp === 0x00A9 || cp === 0x00AE) {
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
        showToast('✅', '复制成功！快去分享吧 📤');
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = elements.resultText.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('✅', '复制成功！快去分享吧 📤');
    }
}

// ==================== Toast 通知 ====================
let toastTimer = null;

function showToast(icon, message) {
    if (toastTimer) {
        clearTimeout(toastTimer);
    }
    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    toastTimer = setTimeout(() => {
        elements.toast.classList.remove('show');
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
    showToast('🧹', '已清除所有内容 ✨');
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
                showToast('🎉', `处理完成！添加了 ${emojiCount} 个表情 🎨`);
            } else {
                showToast('🤔', '没有找到匹配的关键词哦~');
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