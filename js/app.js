// 入口：匯入所有模組、設定全域 onclick 接口、啟動 App
//
// 因為 ES Modules 預設不會把 export 暴露到全域，
// 但 HTML 的 onclick="foo()" 需要 window.foo 存在，
// 所以這裡明確把需要被 onclick 呼叫的函數掛到 window。

import { load, save } from './state.js';
import { switchLang, applyLangUI } from './lang-config.js';
import { showScreen, showToast } from './ui.js';
import { speak } from './tts.js';
import { updateHome } from './home.js';
import { renderWordList, addWord, addSentence, deleteWord } from './words.js';
import { renderWrong } from './wrong.js';
import { startQuiz, speakQuestion, checkAnswer, nextQuestion, resetQuiz } from './quiz.js';
import { bulkPreview, bulkImport, exportCSV, importCSV } from './import-export.js';

// 把要被 onclick / oninput 用到的函數掛到 window
Object.assign(window, {
  // 語言切換
  switchLang,
  // 頁面切換
  showScreen,
  // 單字操作
  addWord,
  addSentence,
  deleteWord,
  renderWordList,
  // 測驗
  startQuiz,
  speakQuestion,
  checkAnswer,
  nextQuestion,
  resetQuiz,
  // 語音
  speak,
  // 匯入匯出
  bulkPreview,
  bulkImport,
  exportCSV,
  importCSV
});

// 啟動
load();
applyLangUI();
updateHome();
