const HABITS_KEY = 'ncm_habits';

function openSettings() {
  document.getElementById('settingsOverlay').classList.add('open');
}
function openSection(name) {
  document.getElementById('settingsOverlay').classList.remove('open');
  if (name === 'theme') {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('#themeOverlay .theme-radio').forEach(r => {
      const match = r.dataset.theme === cur;
      r.classList.toggle('selected', match);
      r.querySelector('input[type="radio"]').checked = match;
    });
  }
  if (name === 'stats') {
    const stats = window._habitsStats || { decryptOk: 0, convertOk: 0 };
    document.getElementById('statDecrypt').textContent = stats.decryptOk;
    document.getElementById('statConvert').textContent = stats.convertOk;
  }
  if (name === 'pref') {
    const cur = window._habitsPref || 'auto';
    document.querySelectorAll('#prefOverlay .pref-radio').forEach(r => {
      const match = r.dataset.pref === cur;
      r.classList.toggle('selected', match);
      r.querySelector('input[type="radio"]').checked = match;
    });
  }
  document.getElementById(name + 'Overlay').classList.add('open');
}
function backToSettings() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
  document.getElementById('settingsOverlay').classList.add('open');
}
function closeSettings() {
  document.querySelectorAll('.overlay').forEach(o => o.classList.remove('open'));
}
function selectTheme(el, theme) {
  document.querySelectorAll('#themeOverlay .theme-radio').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
  document.documentElement.setAttribute('data-theme', theme);
  addLog(`主题已切换为: ${theme === 'dark' ? '深色' : theme === 'light' ? '浅色' : '蓝色'}`, 'info');
  saveHabits();
}
function switchPref(mode, el) {
  document.querySelectorAll('#prefOverlay .pref-radio').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input[type="radio"]').checked = true;
  window._habitsPref = mode;
  saveHabits();
  addLog(`偏好已切换: ${mode === 'auto' ? '记录上次行为' : '用户手动指定'}`, 'info');
}
function resetStats() {
  window._habitsStats = { decryptOk: 0, convertOk: 0 };
  document.getElementById('statDecrypt').textContent = '0';
  document.getElementById('statConvert').textContent = '0';
  saveHabits();
  addLog('统计已重置', 'info');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.querySelector('.overlay.open'))
    closeSettings();
});

function loadHabits() {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) { addLog('习惯记录: 无已保存数据', 'debug'); return; }
    const h = JSON.parse(raw);
    addLog('习惯记录: 已读取, theme=' + h.theme + ', fmtQuality=' + JSON.stringify(h.fmtQuality), 'debug');
    if (h.theme && ['dark','light','blue','tech','pixel'].includes(h.theme)) {
      document.documentElement.setAttribute('data-theme', h.theme);
    }
    window._fmtQuality = h.fmtQuality || {};
    window._habitsPref = h.pref || 'auto';
    if (h.stats && (h.stats.decryptOk || h.stats.convertOk)) {
      addLog('历史统计: 解密 ' + (h.stats.decryptOk||0) + ' 次, 转换 ' + (h.stats.convertOk||0) + ' 次', 'info');
    }
  } catch(e) { addLog('习惯记录加载失败: ' + e.message, 'error'); }
}

function saveHabits() {
  try {
    const h = {
      theme: document.documentElement.getAttribute('data-theme') || 'dark',
      fmtQuality: window._fmtQuality || {},
      stats: window._habitsStats || { decryptOk: 0, convertOk: 0 },
      pref: window._habitsPref || 'auto',
    };
    localStorage.setItem(HABITS_KEY, JSON.stringify(h));
  } catch(e) { addLog('习惯记录保存失败: ' + e.message, 'warn'); }
}

function saveStats(type, ok) {
  if (!window._habitsStats) window._habitsStats = { decryptOk: 0, convertOk: 0 };
  if (type === 'decrypt') window._habitsStats.decryptOk += ok;
  if (type === 'convert') window._habitsStats.convertOk += ok;
  saveHabits();
}
