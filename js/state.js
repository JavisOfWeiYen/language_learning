// 中央資料層：所有語言的資料、目前選的語言、存取 localStorage
//
// 設計上的關鍵：因為多個模組都要讀寫同一份 state，
// 不能直接 export 一個變數（那樣其他模組拿到的是「快照」），
// 必須 export 一個 store 物件，所有模組透過 store.currentLang / store.state 存取。

export const store = {
  currentLang: 'en',
  allLangs: {
    en: { words: [], sentences: [], xp: 0, totalQuizzes: 0, totalCorrect: 0, wrongWords: {} },
    ja: { words: [], sentences: [], xp: 0, totalQuizzes: 0, totalCorrect: 0, wrongWords: {} },
    ko: { words: [], sentences: [], xp: 0, totalQuizzes: 0, totalCorrect: 0, wrongWords: {} }
  },
  // state 永遠指向當前語言的資料；切換語言時要呼叫 setLang() 來重綁
  state: null
};

// 啟動時要先呼叫一次，把 store.state 指向當前語言
function bindState() {
  store.state = store.allLangs[store.currentLang];
}

export function setLang(lang) {
  store.currentLang = lang;
  bindState();
}

export function save() {
  try {
    localStorage.setItem('lm_state', JSON.stringify({
      currentLang: store.currentLang,
      allLangs: store.allLangs
    }));
  } catch (e) {}
}

export function load() {
  try {
    // 新版格式
    const s = localStorage.getItem('lm_state');
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed.allLangs) {
        ['en', 'ja', 'ko'].forEach(lang => {
          if (parsed.allLangs[lang]) {
            store.allLangs[lang] = { ...store.allLangs[lang], ...parsed.allLangs[lang] };
          }
        });
        store.currentLang = parsed.currentLang || 'en';
        bindState();
        return;
      }
    }
    // 向下相容：舊版單一語言資料（韓文版）
    const old = localStorage.getItem('ea_state');
    if (old) {
      const oldData = JSON.parse(old);
      store.allLangs.ko = { ...store.allLangs.ko, ...oldData };
      store.currentLang = 'ko';
      bindState();
      save();
      return;
    }
  } catch (e) {}
  bindState(); // 即使沒讀到任何資料，也要綁定一次
}
