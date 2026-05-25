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
    currentTheme: 'dark',
    isProcessing: false
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
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) {
        state.currentTheme = savedTheme;
    }
    updateThemeUI();
    applyTheme();
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, state.currentTheme);
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
    const savedEmojis = localStorage.getItem(STORAGE_KEYS.CUSTOM_EMOJIS);
    if (savedEmojis) {
        state.customEmojis = JSON.parse(savedEmojis);
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
    localStorage.setItem(STORAGE_KEYS.CUSTOM_EMOJIS, JSON.stringify(state.customEmojis));
    renderCustomEmojis();
    elements.customEmojiInput.value = '';
    showToast('✅', '已添加自定义 emoji 🎉');
}

function deleteCustomEmoji(emoji) {
    const index = state.customEmojis.indexOf(emoji);
    if (index > -1) {
        state.customEmojis.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_EMOJIS, JSON.stringify(state.customEmojis));
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
    elements.charCount.textContent = `${count} / 2000`;
    
    if (count > 2000) {
        elements.charCount.style.color = 'var(--danger-color)';
        elements.inputTextarea.value = elements.inputTextarea.value.substring(0, 2000);
        updateCharCount();
    } else {
        elements.charCount.style.color = '';
    }
    
    elements.processBtn.disabled = count === 0 || state.isProcessing;
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
                const emoji = getRandomEmoji(data.emojis);
                result = result.replace(new RegExp(keyword, 'g'), match => {
                    if (!processedWords.has(match)) {
                        emojiCount++;
                        processedWords.add(match);
                        return `${match}${emoji}`;
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

    return { result, emojiCount };
}

function getRandomEmoji(emojis) {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

// ==================== 显示结果 ====================
function displayResult(result, emojiCount) {
    elements.resultText.textContent = result;
    elements.resultBadge.textContent = `${emojiCount} 个 emoji`;
    
    elements.outputPlaceholder.style.display = 'none';
    elements.outputContent.style.display = 'block';
    elements.copyBtn.disabled = false;
    
    elements.outputContent.style.animation = 'none';
    setTimeout(() => {
        elements.outputContent.style.animation = 'slideIn 0.3s ease';
    }, 10);
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
function showToast(icon, message) {
    elements.toastIcon.textContent = icon;
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
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
        if (!text || state.isProcessing) return;
        
        // 开始处理
        state.isProcessing = true;
        elements.processBtn.disabled = true;
        elements.processBtn.classList.add('btn-loading');
        elements.processBtn.querySelector('.btn-icon').textContent = '⏳';
        
        // 使用 requestAnimationFrame 优化性能，减少延迟到 150ms
        requestAnimationFrame(() => {
            setTimeout(() => {
                const { result, emojiCount } = processText(text);
                displayResult(result, emojiCount);
                
                // 恢复按钮状态
                state.isProcessing = false;
                elements.processBtn.classList.remove('btn-loading');
                elements.processBtn.querySelector('.btn-icon').textContent = '✨';
                elements.processBtn.disabled = false;
                updateCharCount();
                
                // 显示完成提示
                if (emojiCount > 0) {
                    showToast('🎉', `处理完成！添加了 ${emojiCount} 个表情 🎨`);
                } else {
                    showToast('🤔', '没有找到匹配的关键词哦~');
                }
            }, 150);
        });
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