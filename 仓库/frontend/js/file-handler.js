function populateFileList(containerId, files) {
  const el = document.getElementById(containerId);
  if (!files || files.length === 0) {
    el.className = 'file-list empty';
    el.innerHTML = '<span>暂无文件</span>';
    updateCount(containerId, 0);
    return;
  }
  el.className = 'file-list';
  el.innerHTML = files.map((f,i) =>
    `<div class="file-item${i===0?' selected':''}" onclick="selectFile(this)">
      <span class="file-icon">🎵</span>
      <span class="file-name">${f.name}</span>
      <span class="file-size">${f.size ? formatSize(f.size) : ''}</span>
    </div>`
  ).join('');
  updateCount(containerId, files.length);
}
function selectFile(el) {
  el.parentElement.querySelectorAll('.file-item').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
function updateCount(containerId, count) {
  const prefix = containerId === 'fileListDecrypt' ? 'countDecrypt' : 'countConvert';
  document.getElementById(prefix).textContent = `已选择 ${count} 个文件`;
}

function onFilePicked(tab, fileList) {
  const isDecrypt = tab === 'decrypt';
  const arr = isDecrypt ? _decryptFiles : _convertFiles;
  const id = isDecrypt ? 'fileListDecrypt' : 'fileListConvert';
  for (const f of fileList) {
    if (!arr.some(e => e.name === f.name && e.size === f.size))
      arr.push(f);
  }
  populateFileList(id, arr);
  addLog(`已添加 ${fileList.length} 个文件`, 'info');
  document.getElementById(isDecrypt ? 'fileInputDecrypt' : 'fileInputConvert').value = '';
}

function onFolderPicked(tab, fileList) {
  const isDecrypt = tab === 'decrypt';
  const arr = isDecrypt ? _decryptFiles : _convertFiles;
  const id = isDecrypt ? 'fileListDecrypt' : 'fileListConvert';
  const filterExt = isDecrypt ? 'ncm' : document.getElementById('folderFilterConvert').value;
  const exts = { 'mp3':1,'wav':1,'flac':1,'aac':1,'ogg':1,'m4a':1,'wma':1,'ape':1,'ncm':1 };
  let added = 0;
  for (const f of fileList) {
    const fe = f.name.split('.').pop().toLowerCase();
    if (filterExt !== 'all' && fe !== filterExt) continue;
    if (!arr.some(e => e.name === f.name && e.size === f.size)) {
      arr.push(f);
      added++;
    }
  }
  if (added > 0) populateFileList(id, arr);
  addLog(`已从文件夹添加 ${added} 个文件`, 'info');
  document.getElementById(isDecrypt ? 'folderInputDecrypt' : 'folderInputConvert').value = '';
}

function clearFiles(tab) {
  if (tab === 'decrypt') {
    _decryptFiles = [];
    populateFileList('fileListDecrypt', []);
    addLog('已清空文件列表', 'info');
  } else {
    _convertFiles = [];
    populateFileList('fileListConvert', []);
    addLog('已清空文件列表', 'info');
  }
}

document.querySelectorAll('.drop-zone').forEach(zone => {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const isDecrypt = zone.id === 'dropDecrypt';
    const arr = isDecrypt ? _decryptFiles : _convertFiles;
    const id = isDecrypt ? 'fileListDecrypt' : 'fileListConvert';
    const dropped = Array.from(e.dataTransfer.files);
    const audioExts = ['mp3','wav','flac','aac','ogg','m4a','wma','ape'];
    for (const f of dropped) {
      const ext = f.name.split('.').pop().toLowerCase();
      if (isDecrypt) { if (ext !== 'ncm') continue; }
      else { if (!audioExts.includes(ext)) continue; }
      if (!arr.some(e => e.name === f.name && e.size === f.size))
        arr.push(f);
    }
    populateFileList(id, arr);
    addLog(`拖入了 ${dropped.length} 个文件`, 'info');
  });
});

function browseOutput(id) {
  addLog('浏览文件夹（需后端支持）', 'debug');
}
