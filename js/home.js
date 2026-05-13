// 首頁：顯示等級、XP、統計數字
import { store, save } from './state.js';
import { getLevel } from './levels.js';
import { showToast } from './ui.js';

export function updateHome() {
  const lv = getLevel(store.state.xp);
  document.getElementById('heroLevelName').textContent = lv.name;
  document.getElementById('heroXpBar').style.width = lv.pct + '%';
  document.getElementById('heroXpLabel').textContent = lv.label;
  document.getElementById('headerXP').textContent = store.state.xp;
  document.getElementById('headerLevel').textContent = lv.num;
  document.getElementById('statWords').textContent = store.state.words.length;
  document.getElementById('statQuizzes').textContent = store.state.totalQuizzes;
  document.getElementById('statCorrect').textContent = store.state.totalCorrect;
}

// XP 加分（從原本 ==== XP ==== 區塊搬過來）
export function addXP(amount) {
  const before = getLevel(store.state.xp).num;
  store.state.xp += amount;
  const after = getLevel(store.state.xp).num;
  save();
  updateHome();
  document.getElementById('headerXP').textContent = store.state.xp;
  document.getElementById('headerLevel').textContent = after;
  if (before !== after) {
    showToast('已晉升至「' + getLevel(store.state.xp).name + '」');
  }
}
