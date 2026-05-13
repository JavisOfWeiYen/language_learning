// 錯題本：列出答錯次數最多的單字
import { store } from './state.js';

export function renderWrong() {
  const container = document.getElementById('wrongContainer');
  const entries = Object.entries(store.state.wrongWords).filter(([, v]) => v > 0);
  if (!entries.length) {
    container.innerHTML = `<div class="empty-state"><p>尚無錯題記錄。</p></div>`;
    return;
  }
  entries.sort((a, b) => b[1] - a[1]);
  container.innerHTML = entries.map(([en, count]) => {
    const w = store.state.words.find(x => x.en === en);
    return `<div class="wrong-item">
      <div class="wrong-en">${en}</div>
      ${w ? `<div class="wrong-zh">${w.zh}</div>` : ''}
      <div class="wrong-count">答錯 ${count} 次</div>
    </div>`;
  }).join('');
}
