// 通用 UI 工具：頁面切換、toast 提示

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  // 動態載入對應 module 並呼叫對應 render 函數（避免循環依賴）
  if (name === 'words') import('./words.js').then(m => m.renderWordList());
  if (name === 'wrong') import('./wrong.js').then(m => m.renderWrong());
  if (name === 'home') import('./home.js').then(m => m.updateHome());
  if (name === 'quiz') import('./quiz.js').then(m => m.resetQuiz());
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
