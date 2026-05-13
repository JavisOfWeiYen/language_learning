// 測驗：spelling / sentence / cloze 三種題型，含間隔重複
import { store, save } from './state.js';
import { LANG_CONFIG } from './lang-config.js';
import { showToast } from './ui.js';
import { speak } from './tts.js';
import { addXP } from './home.js';

// 模組級狀態：測驗中的題目進度
const quiz = { questions: [], idx: 0, correct: 0, type: '' };

function getSpacedWords() {
  const now = Date.now();
  const due = store.state.words.filter(w => w.nextReview <= now);
  const notDue = store.state.words.filter(w => w.nextReview > now);
  const pool = [...due, ...notDue].slice(0, 10);
  return pool.length >= 1 ? pool : store.state.words.slice(0, 10);
}

function buildQuestions(type) {
  const words = getSpacedWords();
  if (!words.length) return [];
  const qs = [];
  const hasSentences = store.state.sentences.length > 0;

  for (let i = 0; i < Math.min(10, words.length + (hasSentences ? store.state.sentences.length : 0)); i++) {
    let t = type;
    if (type === 'mixed') {
      const options = ['spelling'];
      if (store.state.sentences.length) options.push('sentence');
      if (words.some(w => w.sentence)) options.push('cloze');
      t = options[i % options.length];
    }
    if (t === 'spelling' || t === 'mixed') {
      const w = words[i % words.length];
      qs.push({ type: 'spelling', word: w });
    } else if (t === 'sentence') {
      const s = store.state.sentences[i % store.state.sentences.length];
      qs.push({ type: 'sentence', sentence: s });
    } else if (t === 'cloze') {
      const w = words.find(x => x.sentence);
      if (w) qs.push({ type: 'cloze', word: w });
      else {
        const fallback = words[i % words.length];
        qs.push({ type: 'spelling', word: fallback });
      }
    }
  }
  return qs.slice(0, 10);
}

export function startQuiz(type) {
  if (!store.state.words.length) { showToast('請先新增單字'); return; }
  quiz.type = type;
  quiz.questions = buildQuestions(type);
  if (!quiz.questions.length) { showToast('單字不足'); return; }
  quiz.idx = 0;
  quiz.correct = 0;
  document.getElementById('quizMenu').style.display = 'none';
  document.getElementById('quizPlay').classList.add('active');
  document.getElementById('quizResult').classList.remove('active');
  renderQuestion();
}

function renderQuestion() {
  const q = quiz.questions[quiz.idx];
  const total = quiz.questions.length;
  document.getElementById('quizProgressText').textContent = `${quiz.idx + 1} / ${total}`;
  document.getElementById('quizScoreText').textContent = `${quiz.correct} / ${quiz.questions.length}`;
  document.getElementById('quizProgressBar').style.width = Math.round((quiz.idx / total) * 100) + '%';
  document.getElementById('feedbackBox').style.display = 'none';
  document.getElementById('feedbackBox').className = 'feedback-box';
  document.getElementById('checkBtn').style.display = 'block';
  document.getElementById('nextBtn').style.display = 'none';

  let html = '';
  if (q.type === 'spelling') {
    const cfg = LANG_CONFIG[store.currentLang];
    html = `<div class="question-type-label">${cfg.quizSpellingTitle}</div>
      <button class="speak-big-btn" id="speakBtn" onclick="speakQuestion()">🔊</button>
      <div class="question-hint">${cfg.quizSpellingHint}</div>
      <div class="question-zh">${q.word.zh}</div>
      <input class="answer-input" id="answerInput" type="text" placeholder="${cfg.quizSpellingInput}" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">`;
  } else if (q.type === 'sentence') {
    const cfg = LANG_CONFIG[store.currentLang];
    html = `<div class="question-type-label">${cfg.quizSentenceTitle}</div>
      <button class="speak-big-btn" id="speakBtn" onclick="speakQuestion()">🔊</button>
      <div class="question-hint">${cfg.quizSentenceHint}</div>
      <div class="question-zh">${q.sentence.zh}</div>
      <input class="answer-input" id="answerInput" type="text" placeholder="${cfg.quizSentenceInput}" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">`;
  } else if (q.type === 'cloze') {
    const sentence = q.word.sentence;
    const answer = q.word.en;
    const blanked = sentence.replace(new RegExp(answer, 'gi'), '______');
    html = `<div class="question-type-label">克漏字測驗</div>
      <div class="question-hint" style="margin-bottom:12px">填入正確的單字</div>
      <div class="cloze-sentence">${blanked}</div>
      <div class="question-zh" style="margin-bottom:12px">${q.word.zh}</div>
      <input class="answer-input" id="answerInput" type="text" placeholder="填入單字..." autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">`;
  }
  document.getElementById('questionCard').innerHTML = html;

  // 短暫延遲後自動朗讀
  setTimeout(() => speakQuestion(), 400);
}

export function speakQuestion() {
  const q = quiz.questions[quiz.idx];
  const btn = document.getElementById('speakBtn');
  if (!btn) return;
  btn.classList.add('speaking');
  let text = '';
  if (q.type === 'spelling') text = q.word.en;
  else if (q.type === 'sentence') text = q.sentence.en;
  else if (q.type === 'cloze') text = q.word.sentence;
  speak(text, 0.8);
  setTimeout(() => btn && btn.classList.remove('speaking'), 2000);
}

export function checkAnswer() {
  const q = quiz.questions[quiz.idx];
  const input = document.getElementById('answerInput');
  const val = input.value.trim();
  if (!val) { showToast('請填入答案'); return; }

  let correct = '';
  if (q.type === 'spelling') correct = q.word.en;
  else if (q.type === 'sentence') correct = q.sentence.en;
  else if (q.type === 'cloze') correct = q.word.en;

  const isCorrect = val.toLowerCase() === correct.toLowerCase();
  const fb = document.getElementById('feedbackBox');
  fb.style.display = 'block';

  if (isCorrect) {
    input.className = 'answer-input correct';
    fb.className = 'feedback-box correct';
    document.getElementById('feedbackEmoji').textContent = '✓';
    document.getElementById('feedbackText').textContent = '正確';
    document.getElementById('feedbackAnswer').textContent = '';
    quiz.correct++;
    store.state.totalCorrect++;
    if (q.type === 'spelling') {
      q.word.streak = (q.word.streak || 0) + 1;
      const delay = Math.pow(2, q.word.streak) * 24 * 60 * 60 * 1000;
      q.word.nextReview = Date.now() + delay;
    }
    playCorrectSound();
  } else {
    input.className = 'answer-input wrong';
    fb.className = 'feedback-box wrong';
    document.getElementById('feedbackEmoji').textContent = '✕';
    document.getElementById('feedbackText').textContent = '不正確';
    document.getElementById('feedbackAnswer').textContent = `正確答案：${correct}`;
    if (q.type === 'spelling') {
      q.word.streak = 0;
      q.word.nextReview = Date.now() + 10 * 60 * 1000;
      store.state.wrongWords[q.word.en] = (store.state.wrongWords[q.word.en] || 0) + 1;
    }
  }

  document.getElementById('checkBtn').style.display = 'none';
  document.getElementById('nextBtn').style.display = 'block';
  save();
}

export function nextQuestion() {
  quiz.idx++;
  if (quiz.idx >= quiz.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function finishQuiz() {
  store.state.totalQuizzes++;
  const earned = quiz.correct * 10;
  addXP(earned);
  document.getElementById('quizPlay').classList.remove('active');
  const result = document.getElementById('quizResult');
  result.classList.add('active');
  const pct = Math.round((quiz.correct / quiz.questions.length) * 100);
  const emoji = pct >= 90 ? '✓' : pct >= 70 ? '✓' : pct >= 50 ? '○' : '✕';
  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultScore').textContent = `${quiz.correct} / ${quiz.questions.length}`;
  document.getElementById('resultXP').textContent = `+${earned} XP`;
  save();
}

export function resetQuiz() {
  document.getElementById('quizMenu').style.display = 'block';
  document.getElementById('quizPlay').classList.remove('active');
  document.getElementById('quizResult').classList.remove('active');
}

// 答對時的音效（Web Audio API）
function playCorrectSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.25);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.25);
    });
  } catch (e) {}
}
