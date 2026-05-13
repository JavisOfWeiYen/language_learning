// 文字轉語音
import { store } from './state.js';
import { LANG_CONFIG } from './lang-config.js';
import { showToast } from './ui.js';

export function speak(text, rate = 0.85) {
  if (!window.speechSynthesis) {
    showToast('此裝置不支援語音');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG_CONFIG[store.currentLang].tts;
  u.rate = rate;
  window.speechSynthesis.speak(u);
}
