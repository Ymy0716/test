let vocab = [];
let remembered = new Set();
let currentIndex = 0;
let wordCounter = 0; // 全局计数器，记录当前显示的单词数量
let activePool = []; // 活跃复习池，只包含需要循环的单词

// 加载词汇数据
fetch('vocab.json')
  .then(response => response.json())
  .then(data => {
    vocab = data.map((word, index) => ({
      ...word,
      proficiency: 0, // 初始化熟练度为未掌握
      nextAppearance: wordCounter, // 初始化为当前计数
      id: index // 为每个单词分配唯一 ID
    }));
    shuffle(vocab);
    showCard();
    updateStats();
  })
  .catch(err => console.error('加载词汇失败:', err));

// 随机打乱数组
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// 获取下一个单词索引
function getNextCardIndex() {
  wordCounter++; // 全局计数器递增
  const pool = [];

  // 检查有点难和没记住的单词总数
  const difficultWords = vocab.filter(word => word.proficiency === 0 || word.proficiency === 1);

  // 如果总数达到或超过 7，只使用活跃复习池
  if (difficultWords.length >= 7) {
    activePool = difficultWords; // 更新活跃池
  } else {
    // 否则动态生成随机池
    vocab.forEach((word, index) => {
      if (word.proficiency === 0 && word.nextAppearance <= wordCounter) {
        pool.push(index, index, index, index); // 未掌握：超高频率
        word.nextAppearance = wordCounter + 4 + Math.floor(Math.random() * 3); // 4-6 次后再出现
      } else if (word.proficiency === 1 && word.nextAppearance <= wordCounter) {
        pool.push(index, index, index); // 有点难：较高频率
        word.nextAppearance = wordCounter + 5 + Math.floor(Math.random() * 3); // 5-7 次后再出现
      }
      // 已掌握的单词不会加入池
    });
  }

  // 从活跃复习池中选择
  if (activePool.length > 0) {
    const activeIndex = Math.floor(Math.random() * activePool.length);
    return vocab.indexOf(activePool[activeIndex]); // 返回单词在原始数组中的索引
  }

  // 如果没有活跃池，使用动态池
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 0;
}

// 显示当前单词卡片
function showCard() {
  if (vocab.length === 0) return;

  currentIndex = getNextCardIndex(); // 获取下一个单词索引
  const card = vocab[currentIndex];

  document.getElementById('word').textContent = card.italian;

  if (card.partOfSpeech) {
    document.getElementById('meaning').innerHTML = `
      <small style="font-size: 14px; color: #777;">${card.partOfSpeech}</small><br>${card.chinese}`;
  } else {
    document.getElementById('meaning').textContent = card.chinese;
  }

  speakWord(card.italian);
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
}

// 用户操作：更新熟练度
function updateResponse(responseType) {
  const card = vocab[currentIndex];

  if (responseType === 'easy') {
    card.proficiency = 2; // 标记为已掌握
    remembered.add(card.id); // 添加到已记住集合

    // 如果活跃池中有该单词，将其移除
    activePool = activePool.filter(word => word.id !== card.id);
  } else if (responseType === 'medium') {
    card.proficiency = 1; // 标记为有点难
    card.nextAppearance = wordCounter + 5 + Math.floor(Math.random() * 3); // 5-7 次后再出现

    // 确保单词加入活跃池
    if (!activePool.includes(card)) activePool.push(card);
  } else if (responseType === 'hard') {
    card.proficiency = 0; // 重置为未掌握
    card.nextAppearance = wordCounter + 4 + Math.floor(Math.random() * 3); // 4-6 次后再出现

    // 确保单词加入活跃池
    if (!activePool.includes(card)) activePool.push(card);
  }

  saveProgress(); // 保存学习进度
  showCard(); // 显示下一个单词
  updateStats(); // 更新统计
}

// 保存熟练度进度到 LocalStorage
function saveProgress() {
  localStorage.setItem('vocabProgress', JSON.stringify(vocab));
}

// 恢复学习进度
function loadProgress() {
  const savedData = JSON.parse(localStorage.getItem('vocabProgress'));
  if (savedData) {
    vocab = savedData;
    updateStats();
  }
}

window.addEventListener('load', loadProgress);