function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-'+tab));
  updateTabIndicator();
}
function updateTabIndicator() {
  const active = document.querySelector('.tab-btn.active');
  if (!active) return;
  const tabs = document.getElementById('tabs');
  const ind = document.getElementById('tabIndicator');
  const tr = active.getBoundingClientRect();
  const pr = tabs.getBoundingClientRect();
  ind.style.left = (tr.left - pr.left) + 'px';
  ind.style.width = tr.width + 'px';
}
window.addEventListener('load', updateTabIndicator);
window.addEventListener('resize', updateTabIndicator);

function updateQuality(fmtId, qltId) {
  const fmt = document.getElementById(fmtId).value;
  const qlt = document.getElementById(qltId);
  const opts = QUALITY_MAP[fmt];
  if (!opts || opts.length === 0) {
    qlt.disabled = true;
    qlt.innerHTML = '<option>默认</option>';
    return;
  }
  qlt.disabled = false;
  qlt.innerHTML = opts.map(o => `<option>${o}</option>`).join('');
  if (window._habitsPref !== 'manual') {
    const saved = window._fmtQuality && window._fmtQuality[fmt];
    if (saved && opts.includes(saved)) qlt.value = saved;
  }
  window._fmtQuality[fmt] = qlt.value;
  saveHabits();
}

function saveQuality(qltId, fmtId) {
  const fmt = document.getElementById(fmtId).value;
  const qlt = document.getElementById(qltId).value;
  window._fmtQuality[fmt] = qlt;
  saveHabits();
}

window._fmtQuality = {};
try { localStorage.getItem('_test'); addLog('localStorage: 可用', 'debug'); } catch(e) { addLog('localStorage: 不可用 - ' + e.message, 'warn'); }
loadHabits();
updateQuality('fmtDecrypt', 'qltDecrypt');
updateQuality('fmtConvert', 'qltConvert');
addLog('程序已启动', 'info');
