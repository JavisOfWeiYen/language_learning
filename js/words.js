// 單字列表、新增、刪除
import { store, save } from './state.js';
import { LANG_CONFIG } from './lang-config.js';
import { showToast } from './ui.js';
import { addXP } from './home.js';
import { speak } from './tts.js';

export function renderWordList() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('wordListContainer');
  const words = store.state.words.filter(w =>
    !q || w.en.toLowerCase().includes(q) || w.zh.includes(q)
  );
  if (!words.length) {
    container.innerHTML = `<div class="empty-state"><p>尚無單字。請至「新增」頁面建立第一個單字。</p></div>`;
    return;
  }
  const icons = ['🍎','🐶','⭐','🎈','🌈','🦁','🌸','🚀','🎵','🍭','🐠','🌻'];
  container.innerHTML = words.map((w, i) => {
    const streakClass = w.streak >= 5 ? 'streak-great' : w.streak >= 2 ? 'streak-good' : 'streak-new';
    const streakLabel = w.streak >= 5 ? '熟練' : w.streak >= 2 ? '良好' : '新字';
    return `<div class="word-item">
      <div class="word-item-icon">${icons[i % icons.length]}</div>
      <div class="word-info">
        <div class="word-en">${w.en} ${w.pos ? `<span style="font-size:12px;color:#90A4AE;font-weight:600">${w.pos}</span>` : ''}</div>
        <div class="word-zh">${w.zh}</div>
        ${w.sentence ? `<div class="word-sentence" style="display:flex;align-items:center;gap:6px">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${w.sentence}</span>
          <button class="speak-btn" style="flex-shrink:0;width:28px;height:28px;font-size:13px" onclick="speak('${w.sentence.replace(/'/g,"\\'").replace(/`/g,'\\`')}')">🔊</button>
        </div>` : ''}
      </div>
      <div class="word-meta">
        <span class="word-streak ${streakClass}">${streakLabel}</span>
        <button class="speak-btn" onclick="speak('${w.en.replace(/'/g,"\\'")}')">🔊</button>
      </div>
      <button class="delete-btn" onclick="deleteWord(${store.state.words.indexOf(w)})">×</button>
    </div>`;
  }).join('');
}

export function addWord() {
  const en = document.getElementById('addWord').value.trim();
  const zh = document.getElementById('addZh').value.trim();
  const pos = document.getElementById('addPos').value.trim();
  const sentence = document.getElementById('addSentence').value.trim();
  if (!en || !zh) { showToast(LANG_CONFIG[store.currentLang].missingInput); return; }
  store.state.words.push({ en, zh, pos, sentence, streak: 0, nextReview: Date.now() });
  save();
  document.getElementById('addWord').value = '';
  document.getElementById('addZh').value = '';
  document.getElementById('addPos').value = '';
  document.getElementById('addSentence').value = '';
  showToast('單字加入成功');
  addXP(5);
}

export function addSentence() {
  const en = document.getElementById('addSentenceEn').value.trim();
  const zh = document.getElementById('addSentenceZh').value.trim();
  if (!en || !zh) { showToast('請填入句子和翻譯'); return; }
  store.state.sentences.push({ en, zh, streak: 0, nextReview: Date.now() });
  save();
  document.getElementById('addSentenceEn').value = '';
  document.getElementById('addSentenceZh').value = '';
  showToast('句子加入成功');
  addXP(8);
}

export function deleteWord(idx) {
  if (confirm('確定要刪除這個單字嗎？')) {
    store.state.words.splice(idx, 1);
    save();
    renderWordList();
    showToast('已刪除');
  }
}
