// 批量匯入：貼上文字、CSV 檔案
import { store, save } from './state.js';
import { LANG_CONFIG } from './lang-config.js';
import { showToast } from './ui.js';
import { updateHome } from './home.js';

// ---------- 批量貼上 ----------

// 解析一行：支援中英文逗號，trim 空白
function parseBulkLine(line) {
  // 把全形逗號統一成半形
  const normalized = line.replace(/，/g, ',');
  return normalized.split(',').map(s => s.trim());
}

// 即時預覽：oninput 觸發
export function bulkPreview() {
  const raw = document.getElementById('bulkInput').value;
  const previewBox = document.getElementById('bulkPreviewBox');
  const submitBtn = document.getElementById('bulkSubmitBtn');

  if (!raw.trim()) {
    previewBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = '匯入';
    return;
  }

  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const seenInThisBatch = new Set();
  const rows = lines.map((line, idx) => {
    const cells = parseBulkLine(line);
    const en = cells[0] || '';
    const zh = cells[1] || '';
    const pos = cells[2] || '';
    const sentence = cells[3] || '';

    let status = 'ok';
    let errorMsg = '';

    if (!en || !zh) {
      status = 'err';
      errorMsg = !en && !zh ? '缺少單字與翻譯' : !en ? '缺少單字' : '缺少翻譯';
    } else if (seenInThisBatch.has(en)) {
      status = 'err';
      errorMsg = '與上方某一行重複';
    } else if (store.state.words.find(w => w.en === en)) {
      status = 'dup';
      errorMsg = '已存在於單字庫，將跳過';
    }

    if (en) seenInThisBatch.add(en);

    return { lineNo: idx + 1, en, zh, pos, sentence, status, errorMsg };
  });

  const okCount = rows.filter(r => r.status === 'ok').length;
  const dupCount = rows.filter(r => r.status === 'dup').length;
  const errCount = rows.filter(r => r.status === 'err').length;

  let html = `<div class="bulk-summary">
    <div class="bulk-summary-item"><span class="bulk-summary-num ok">${okCount}</span><span class="bulk-summary-label">可匯入</span></div>
    ${dupCount > 0 ? `<div class="bulk-summary-item"><span class="bulk-summary-num warn">${dupCount}</span><span class="bulk-summary-label">重複</span></div>` : ''}
    ${errCount > 0 ? `<div class="bulk-summary-item"><span class="bulk-summary-num err">${errCount}</span><span class="bulk-summary-label">無法匯入</span></div>` : ''}
  </div>`;

  html += '<div class="bulk-rows">';
  rows.forEach(r => {
    const rowClass = r.status === 'err' ? 'invalid' : r.status === 'dup' ? 'duplicate' : '';
    const statusLabel = r.status === 'ok' ? '可匯入' : r.status === 'dup' ? '已存在' : '無法匯入';
    html += `<div class="bulk-row ${rowClass}">
      <div class="bulk-row-num">${r.lineNo}</div>
      <div class="bulk-row-content">
        <span class="bulk-row-en">${escapeHtml(r.en) || '—'}</span>
        ${r.zh ? `<span class="bulk-row-zh">${escapeHtml(r.zh)}</span>` : ''}
        ${r.pos ? `<span class="bulk-row-pos">${escapeHtml(r.pos)}</span>` : ''}
        ${r.errorMsg ? `<div class="bulk-row-error-msg">${r.errorMsg}</div>` : ''}
      </div>
      <div class="bulk-row-status ${r.status}">${statusLabel}</div>
    </div>`;
  });
  html += '</div>';

  previewBox.innerHTML = html;
  previewBox.style.display = 'block';

  submitBtn.disabled = okCount === 0;
  submitBtn.textContent = okCount > 0 ? `匯入 ${okCount} 筆` : '無可匯入項目';
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function bulkImport() {
  const raw = document.getElementById('bulkInput').value;
  if (!raw.trim()) return;

  const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const seenInThisBatch = new Set();
  let added = 0;

  lines.forEach(line => {
    const cells = parseBulkLine(line);
    const en = cells[0] || '';
    const zh = cells[1] || '';
    const pos = cells[2] || '';
    const sentence = cells[3] || '';

    if (!en || !zh) return;
    if (seenInThisBatch.has(en)) return;
    if (store.state.words.find(w => w.en === en)) return;

    store.state.words.push({
      en, zh, pos, sentence,
      streak: 0,
      nextReview: Date.now()
    });
    seenInThisBatch.add(en);
    added++;
  });

  save();
  updateHome();

  document.getElementById('bulkInput').value = '';
  document.getElementById('bulkPreviewBox').style.display = 'none';
  document.getElementById('bulkSubmitBtn').disabled = true;
  document.getElementById('bulkSubmitBtn').textContent = '匯入';

  showToast(`已匯入 ${added} 筆單字`);
}

// ---------- CSV 匯入 / 匯出 ----------

export function exportCSV() {
  if (!store.state.words.length) {
    showToast('單字庫是空的，無內容可匯出');
    return;
  }
  const cfg = LANG_CONFIG[store.currentLang];
  const header = cfg.csvHeader + '\n';
  const rows = store.state.words.map(w => {
    return [w.en || '', w.zh || '', w.pos || '', w.sentence || '']
      .map(csvEscape).join(',');
  }).join('\n');
  const csv = '\uFEFF' + header + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${cfg.csvFilenamePrefix}_${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`已匯出 ${store.state.words.length} 個單字`);
}

function csvEscape(s) {
  s = String(s == null ? '' : s);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('csvStatus');
  status.style.display = 'block';
  status.style.color = '#7B1FA2';
  status.textContent = '讀取中...';

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      const rows = parseCSV(text);
      if (!rows.length) {
        status.style.color = '#EF5350';
        status.textContent = '檔案是空的';
        event.target.value = '';
        return;
      }
      const cfg = LANG_CONFIG[store.currentLang];
      let startIdx = 0;
      const firstRow = rows[0].map(c => (c || '').trim());
      if (firstRow.some(c => cfg.csvHeaderKeyword.test(c) || /中文/.test(c))) {
        startIdx = 1;
      }
      let added = 0, skipped = 0;
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        const en = (r[0] || '').trim();
        const zh = (r[1] || '').trim();
        const pos = (r[2] || '').trim();
        const sentence = (r[3] || '').trim();
        if (!en || !zh) { skipped++; continue; }
        if (store.state.words.find(w => w.en === en)) { skipped++; continue; }
        store.state.words.push({
          en, zh, pos, sentence,
          streak: 0,
          nextReview: Date.now()
        });
        added++;
      }
      save();
      updateHome();
      status.style.color = '#388E3C';
      status.textContent = `成功匯入 ${added} 個單字到「${cfg.label}」單字庫（跳過 ${skipped} 個重複或無效）`;
      showToast(`已匯入 ${added} 個單字`);
    } catch (err) {
      status.style.color = '#EF5350';
      status.textContent = '讀取失敗：' + err.message;
    }
    event.target.value = '';
  };
  reader.onerror = () => {
    status.style.color = '#EF5350';
    status.textContent = '無法讀取檔案';
    event.target.value = '';
  };
  reader.readAsText(file, 'UTF-8');
}

// 簡易 CSV 解析器（支援雙引號跳脫）
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell); cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}
