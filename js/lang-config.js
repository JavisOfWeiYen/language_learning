// 各語言的設定：TTS 語音、UI 文字、範例 placeholder
import { store, setLang, save } from './state.js';
import { showToast } from './ui.js';

export const LANG_CONFIG = {
  en: {
    flag: '🇬🇧',
    label: '英文',
    tts: 'en-US',
    fieldLabel: '英文單字',
    fieldPlaceholder: '例：apple',
    sentenceLabel: '英文句子',
    sentencePlaceholder: '例：She goes to school every day.',
    examplePlaceholder: '例：I like to eat apples.',
    zhExample: '例：蘋果',
    zhSentenceExample: '例：她每天去上學。',
    quizSpellingTitle: '英聽拼寫單字',
    quizSpellingDesc: '聽到英文，把單字拼出來',
    quizSentenceTitle: '英聽寫出句子',
    quizSentenceDesc: '聽到英文句子，把它寫出來',
    quizSpellingHint: '聽聲音，把英文單字拼出來',
    quizSentenceHint: '聽聲音，把英文句子寫出來',
    quizSpellingInput: '輸入英文單字...',
    quizSentenceInput: '輸入英文句子...',
    missingInput: '請填入英文和中文',
    csvHeader: '英文,中文,詞性,例句',
    csvHeaderKeyword: /英文|英語|english|word/i,
    csvFilenamePrefix: '英文單字庫',
    bulkPlaceholder: 'apple, 蘋果, n., I like apples.\nbook, 書, n., This is my book.\nrun, 跑, v.'
  },
  ja: {
    flag: '🇯🇵',
    label: '日文',
    tts: 'ja-JP',
    fieldLabel: '日文單字',
    fieldPlaceholder: '例：りんご',
    sentenceLabel: '日文句子',
    sentencePlaceholder: '例：彼女は毎日学校に行きます。',
    examplePlaceholder: '例：りんごが好きです。',
    zhExample: '例：蘋果',
    zhSentenceExample: '例：她每天去上學。',
    quizSpellingTitle: '日聽拼寫單字',
    quizSpellingDesc: '聽到日文，把單字拼出來',
    quizSentenceTitle: '日聽寫出句子',
    quizSentenceDesc: '聽到日文句子，把它寫出來',
    quizSpellingHint: '聽聲音，把日文單字拼出來',
    quizSentenceHint: '聽聲音，把日文句子寫出來',
    quizSpellingInput: '輸入日文單字...',
    quizSentenceInput: '輸入日文句子...',
    missingInput: '請填入日文和中文',
    csvHeader: '日文,中文,詞性,例句',
    csvHeaderKeyword: /日文|日語|japanese|word/i,
    csvFilenamePrefix: '日文單字庫',
    bulkPlaceholder: 'りんご, 蘋果, n., りんごが好きです。\n本, 書, n., これは私の本です。\n行く, 去, v.'
  },
  ko: {
    flag: '🇰🇷',
    label: '韓文',
    tts: 'ko-KR',
    fieldLabel: '韓文單字',
    fieldPlaceholder: '例：사과',
    sentenceLabel: '韓文句子',
    sentencePlaceholder: '例：그녀는 매일 학교에 가요.',
    examplePlaceholder: '例：저는 사과를 좋아해요.',
    zhExample: '例：蘋果',
    zhSentenceExample: '例：她每天去上學。',
    quizSpellingTitle: '韓聽拼寫單字',
    quizSpellingDesc: '聽到韓文，把單字拼出來',
    quizSentenceTitle: '韓聽寫出句子',
    quizSentenceDesc: '聽到韓文句子，把它寫出來',
    quizSpellingHint: '聽聲音，把韓文單字拼出來',
    quizSentenceHint: '聽聲音，把韓文句子寫出來',
    quizSpellingInput: '輸入韓文單字...',
    quizSentenceInput: '輸入韓文句子...',
    missingInput: '請填入韓文和中文',
    csvHeader: '韓文,中文,詞性,例句',
    csvHeaderKeyword: /韓文|韓語|korean|word/i,
    csvFilenamePrefix: '韓文單字庫',
    bulkPlaceholder: '사과, 蘋果, n., 저는 사과를 좋아해요.\n책, 書, n., 이것은 제 책입니다.\n가다, 去, v.'
  }
};

export function switchLang(lang) {
  if (!LANG_CONFIG[lang]) return;
  setLang(lang);
  applyLangUI();
  save();
  // 重新整理當前螢幕。為避免循環依賴，這些 render 函數透過動態 import 取得
  const activeScreen = document.querySelector('.screen.active');
  if (activeScreen) {
    const id = activeScreen.id.replace('screen-', '');
    Promise.all([
      import('./home.js'),
      import('./words.js'),
      import('./wrong.js'),
      import('./quiz.js')
    ]).then(([home, words, wrong, quiz]) => {
      if (id === 'words') words.renderWordList();
      if (id === 'wrong') wrong.renderWrong();
      if (id === 'home') home.updateHome();
      if (id === 'quiz') quiz.resetQuiz();
      home.updateHome();
    });
  } else {
    import('./home.js').then(m => m.updateHome());
  }
  showToast(`已切換到${LANG_CONFIG[lang].label}`);
}

export function applyLangUI() {
  const cfg = LANG_CONFIG[store.currentLang];
  // 國旗按鈕的 active 狀態
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === store.currentLang);
  });
  const $ = (id) => document.getElementById(id);
  // 新增單字頁面的標籤與 placeholder
  if ($('label-addWord')) $('label-addWord').textContent = cfg.fieldLabel;
  if ($('addWord')) $('addWord').placeholder = cfg.fieldPlaceholder;
  if ($('addZh')) $('addZh').placeholder = cfg.zhExample;
  if ($('addSentence')) $('addSentence').placeholder = cfg.examplePlaceholder;
  if ($('label-addSentenceEn')) $('label-addSentenceEn').textContent = cfg.sentenceLabel;
  if ($('addSentenceEn')) $('addSentenceEn').placeholder = cfg.sentencePlaceholder;
  if ($('addSentenceZh')) $('addSentenceZh').placeholder = cfg.zhSentenceExample;
  // 測驗選單上的標題與說明
  if ($('quiz-spelling-title')) $('quiz-spelling-title').textContent = cfg.quizSpellingTitle;
  if ($('quiz-spelling-desc')) $('quiz-spelling-desc').textContent = cfg.quizSpellingDesc;
  if ($('quiz-sentence-title')) $('quiz-sentence-title').textContent = cfg.quizSentenceTitle;
  if ($('quiz-sentence-desc')) $('quiz-sentence-desc').textContent = cfg.quizSentenceDesc;
  // CSV 區塊的說明
  if ($('csvHelp')) {
    $('csvHelp').innerHTML = `CSV 欄位順序：<b>${cfg.csvHeader}</b>（後兩欄可留空）。<br>用 Excel 或 Google 試算表打開時請選 UTF-8 編碼。`;
  }
  // 批量貼上區的格式提示與 placeholder
  if ($('bulkFormatHint')) {
    $('bulkFormatHint').textContent = `${cfg.fieldLabel.replace('單字','')}, 中文, 詞性, 例句`;
  }
  if ($('bulkInput')) {
    $('bulkInput').placeholder = cfg.bulkPlaceholder;
  }
  // 切換語言時重新預覽（避免循環依賴用動態 import）
  if ($('bulkInput') && $('bulkInput').value.trim()) {
    import('./import-export.js').then(m => m.bulkPreview());
  }
}
