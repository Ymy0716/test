// 页面切换逻辑
function switchPage(pageId) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(page => {
    page.classList.add('hidden');
  });

  // 显示选中的页面
  document.getElementById(pageId).classList.remove('hidden');

  // 如果切换到复习页面，展示复习单词并更新统计信息
  if (pageId === 'page2') {
    showReviewWord(); // 在复习页面显示一个单词
    updateReviewStats(); // 更新复习页面的统计信息
  }
}

// 初始化全局变量
let vocab = []; // 生词列表
let remembered = new Set(); // 记录已掌握单词的集合
let reviewWords = []; // 复习词库
let currentIndex = 0; // 当前生词索引
let reviewIndex = 0; // 当前复习单词索引
let wordCounter = 0; // 全局计数器，用于记录显示过的单词数量
let activePool = []; // 活跃复习池，用于循环的单词

// 初始化每日学习目标
let dailyGoal = 50; // 每日学习目标
let remainingWords = dailyGoal; // 剩余单词数量

// 加载词汇数据
fetch('vocab.json')
  .then(response => response.json())
  .then(data => {
    vocab = data.map((word, index) => ({
      ...word,
      proficiency: 0, // 初始化为未掌握
      id: index // 分配唯一 ID
    }));
    shuffle(vocab);
    showCard();
    updateStats();
  })
  .catch(err => console.error('加载词汇失败:', err));

// 随机打乱单词数组
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 显示生词卡片
function showCard() {
  if (vocab.length === 0) return;

  const card = vocab[currentIndex];
  document.getElementById('word').textContent = card.italian;
  document.getElementById('meaning').textContent = card.chinese;
  document.getElementById('partOfSpeech').textContent = `词性：${card.partOfSpeech || '未知'}`;

  speakWord(card.italian);
}

// 显示复习页面中的单词
function showReviewWord() {
  if (reviewWords.length === 0) {
    document.getElementById('flashcard-empty').innerHTML = '<p>复习词库为空！</p>';
    return;
  }

  const card = reviewWords[reviewIndex];
  document.getElementById('flashcard-empty').innerHTML = `
    <h2>${card.italian}</h2>
    <p>${card.chinese}</p>
    <p>词性：${card.partOfSpeech || '未知'}</p>`;

  speakWord(card.italian); // 自动朗读

  // 更新复习页面的统计信息
  updateReviewStats(reviewIndex); // 传递当前索引
}

// 使用 Web Speech API 朗读单词
function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'it-IT'; // 设置为意大利语
    speechSynthesis.speak(utterance);
  }
}

// 更新统计信息
function updateStats() {
  const total = vocab.length;
  const rememberedCount = vocab.filter(word => word.proficiency === 2).length;
  const percentage = total > 0 ? Math.round((rememberedCount / total) * 100) : 0;

  document.getElementById('stats').textContent =
    `记住的单词：${rememberedCount}/${total} (${percentage}%)`;
  
  // 更新每日学习目标显示
  document.getElementById('daily-goal').textContent = remainingWords; // 只显示数字
}

// 恢复学习进度
function loadProgress() {
  try {
    const savedData = JSON.parse(localStorage.getItem('vocabProgress'));
    if (savedData) {
      vocab = savedData;
      updateStats();
    }
  } catch (error) {
    console.error('加载进度失败:', error);
  }
}

// 每日重置逻辑
function resetDailyGoal() {
  const now = new Date();
  const lastReset = localStorage.getItem('lastReset');

  // 检查是否到达零点并重置
  if (!lastReset || new Date(lastReset).setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0)) {
    remainingWords = dailyGoal; // 重置为每日目标
    localStorage.setItem('lastReset', now.toISOString()); // 更新最后重置时间
  }
}

// 鼓励话语数组
const encouragementMessages = [
  "媳妇儿真棒，要注意劳逸结合哦",
  "世界上最努力的小孩",
  "谁家小宝宝背单词这么快呀",
  "媳妇儿辛苦了",
  "永远在你身边",
  "加油，我们一起去意大利"
];

// 调整字体大小以适应背景
function adjustFontSize(element) {
  const maxWidth = 250; // 设置最大宽度
  let fontSize = 24; // 初始字体大小

  element.style.fontSize = fontSize + 'px'; // 设置初始字体大小

  // 循环调整字体大小，直到文本宽度小于最大宽度
  while (element.offsetWidth > maxWidth && fontSize > 10) { // 最小字体大小为10px
    fontSize -= 1; // 减小字体大小
    element.style.fontSize = fontSize + 'px'; // 更新字体大小
  }
}

// 显示鼓励话语
function showEncouragement() {
  const encouragementDiv = document.getElementById('encouragement');
  const randomMessage = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  encouragementDiv.textContent = randomMessage;
  encouragementDiv.classList.remove('hidden'); // 显示元素

  // 调整字体大小以适应背景
  adjustFontSize(encouragementDiv);

  // 设置定时器在4秒后淡出
  setTimeout(() => {
    encouragementDiv.style.opacity = 0; // 开始淡出
    setTimeout(() => {
      encouragementDiv.classList.add('hidden'); // 隐藏元素
      encouragementDiv.style.opacity = 1; // 重置不透明度
    }, 1000); // 等待淡出动画完成后再隐藏
  }, 4000); // 显示4秒
}

// 用户操作：更新熟练度
function updateResponse(responseType) {
  const card = vocab[currentIndex];

  if (responseType === 'easy') {
    card.proficiency = 2; // 标记为已掌握
    remembered.add(card.id); // 添加到已记住集合
    if (!reviewWords.includes(card)) {
      reviewWords.push(card);
    }
    if (remainingWords > 0) { // 只有在剩余单词大于0时才减少
      remainingWords--; // 每次记住单词减少剩余数量
      if (remainingWords === 0) { // 如果计数器到达0
        showEncouragement(); // 显示鼓励话语
      }
    }
  } else if (responseType === 'medium') {
    card.proficiency = 1; // 标记为有点难
  } else if (responseType === 'hard') {
    card.proficiency = 0; // 重置为未掌握
  }

  saveProgress(); // 保存学习进度
  showNextCard(); // 显示下一个单词
  updateStats(); // 更新统计
}

// 保存熟练度进度到 LocalStorage
function saveProgress() {
  try {
    localStorage.setItem('vocabProgress', JSON.stringify(vocab));
  } catch (error) {
    console.error('保存进度失败:', error);
  }
}

// 显示下一个单词
function showNextCard() {
  if (vocab.length > 0) {
    currentIndex = (currentIndex + 1) % vocab.length;
    showCard();
  }
}

// 显示上一个单词
function showPreviousCard() {
  if (vocab.length > 0) {
    currentIndex = (currentIndex - 1 + vocab.length) % vocab.length;
    showCard();
  }
}

// 添加触摸事件监听器
let startX;

window.addEventListener('touchstart', function(event) {
  startX = event.touches[0].clientX;
});

window.addEventListener('touchend', function(event) {
  const endX = event.changedTouches[0].clientX;
  const diffX = startX - endX;

  if (Math.abs(diffX) > 30) {
    if (diffX > 0) {
      showNextCard();
    } else {
      showPreviousCard();
    }
  }
});

// 为复习界面添加触摸事件监听器
window.addEventListener('touchstart', function(event) {
  startX = event.touches[0].clientX;
});

window.addEventListener('touchend', function(event) {
  const endX = event.changedTouches[0].clientX;
  const diffX = startX - endX;

  if (Math.abs(diffX) > 30) {
    if (diffX > 0) {
      showNextReviewWord();
    } else {
      showPreviousReviewWord();
    }
  }
});

// 再次朗读按钮
document.getElementById('speakButton').addEventListener('click', function() {
  const card = vocab[currentIndex];
  speakWord(card.italian);
});

// 为复习界面添加再次朗读按钮
document.getElementById('reviewSpeakButton').addEventListener('click', function() {
  const card = reviewWords[reviewIndex];
  speakWord(card.italian);
});

// 显示复习页面中的下一个单词
function showNextReviewWord() {
  if (reviewWords.length > 0) {
    reviewIndex = (reviewIndex + 1) % reviewWords.length;
    showReviewWord();
  }
}

// 显示复习页面中的上一个单词
function showPreviousReviewWord() {
  if (reviewWords.length > 0) {
    reviewIndex = (reviewIndex - 1 + reviewWords.length) % reviewWords.length;
    showReviewWord();
  }
}

// 更新复习页面的统计信息
function updateReviewStats(currentIndex) {
  const total = reviewWords.length;
  const rememberedCount = reviewWords.filter(word => word.proficiency === 2).length; // 统计已记住的单词
  const percentage = total > 0 ? Math.round((rememberedCount / total) * 100) : 0;

  document.getElementById('review-stats').textContent =
    `记住的单词：${currentIndex + 1}/${total} (${percentage}%)`; // 更新为当前单词索引
}

// 继续学习功能
function continueLearning() {
  remainingWords = dailyGoal; // 重置剩余单词数量
  updateStats(); // 更新显示
}

// 在页面加载时调用
window.addEventListener('load', function() {
  loadProgress(); // 恢复学习进度
  resetDailyGoal(); // 检查并重置每日目标
});

// 添加继续学习按钮事件
document.getElementById('continueButton').addEventListener('click', continueLearning);
