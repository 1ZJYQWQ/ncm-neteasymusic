function addLog(msg, level = 'info') {
  const log = document.getElementById('logContent');
  const time = new Date().toTimeString().slice(0,8);
  const line = document.createElement('div');
  line.className = 'log-entry';
  line.innerHTML = `<span class="log-level ${level}">${level.toUpperCase()}</span><span class="log-time">[${time}]</span><span class="log-msg">${msg}</span>`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
  document.getElementById('lastLogLine').textContent = `[${level.toUpperCase()}] ${msg}`;
}

function toggleLog() {
  const area = document.getElementById('logArea');
  area.classList.toggle('collapsed');
}
