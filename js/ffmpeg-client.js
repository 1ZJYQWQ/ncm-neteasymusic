const CDN_FFCORE_JS  = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js';
const CDN_FFCORE_WASM = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.wasm';

const ENCODE_MAP = {
  mp3: { codec: 'libmp3lame', suffix: '.mp3', mime: 'audio/mpeg' },
  wav: { codec: 'pcm_s16le', suffix: '.wav', mime: 'audio/wav' },
  flac: { codec: 'flac', suffix: '.flac', mime: 'audio/flac' },
  aac: { codec: 'aac', suffix: '.m4a', mime: 'audio/mp4' },
  ogg: { codec: 'libvorbis', suffix: '.ogg', mime: 'audio/ogg' },
  wma: { codec: 'wmav2', suffix: '.wma', mime: 'audio/x-ms-wma' },
};
const WAV_CODECS = { '16bit int': 'pcm_s16le', '24bit int': 'pcm_s24le', '32bit float': 'pcm_f32le' };

const WORKER_TEMPLATE = [
'var M=null;',
'self.onmessage=async function(e){',
  'var d=e.data;',
  'try{',
    'if(d.type==="LOAD"){',
      'M=await self.createFFmpegCore({wasmBinary:d.data.w});',
      'M.ret=0;',
      'M.setTimeout=function(){};',
      'M.reset=function(){};',
      'M.setLogger=function(fn){M.print=M.printErr=fn};',
      'M.setProgress=function(){};',
      'M.exec=function(){',
        'var a=arguments,f=["ffmpeg"];',
        'for(var i=0;i<a.length;i++)f.push(a[i]);',
        'var c=f.length,ap=M._malloc((c+1)<<2);',
        'for(var i=0;i<c;i++){',
          'var s=f[i],p=M._malloc(s.length+1);',
          'M.stringToUTF8(s,p,s.length+1);',
          'M.HEAP32[(ap>>2)+i]=p;',
        '}',
        'M.HEAP32[(ap>>2)+c]=0;',
        'try{M.ret=M._main(c,ap);}catch(x){M.ret=x.status!==void 0?x.status:1}',
        'for(var i=0;i<c;i++)M._free(M.HEAP32[(ap>>2)+i]);',
        'M._free(ap);',
        'return M.ret;',
      '};',
      'self.postMessage({id:d.id,type:"LOAD",data:{ok:1}});',
    '}else if(d.type==="EXEC"){',
      'M.exec(...d.data.args);',
      'self.postMessage({id:d.id,type:"EXEC",data:M.ret});',
    '}else if(d.type==="WRITE_FILE"){',
      'M.FS.writeFile(d.data.path,d.data.data);',
      'self.postMessage({id:d.id,type:"WRITE_FILE",data:true});',
    '}else if(d.type==="READ_FILE"){',
      'var b=M.FS.readFile(d.data.path,{encoding:d.data.enc||"binary"});',
      'self.postMessage({id:d.id,type:"READ_FILE",data:b});',
    '}else if(d.type==="DELETE_FILE"){',
      'M.FS.unlink(d.data.path);',
      'self.postMessage({id:d.id,type:"DELETE_FILE",data:true});',
    '}',
  '}catch(x){self.postMessage({id:d.id,type:"ERROR",data:(x&&x.message)||String(x)})}',
  '}'
].join('\n');

class FFmpegW {
  #w=null;#cb={};#id=0;
  loaded=false;
  async load(wBuf) {
    const resp = await fetch(CDN_FFCORE_JS);
    if (!resp.ok) throw new Error('FFmpeg core JS 加载失败: HTTP ' + resp.status);
    const jsStr = await resp.text();
    const fullSrc = jsStr + '\n' + WORKER_TEMPLATE;
    const b = new Blob([fullSrc], {type:'text/javascript'});
    this.#w = new Worker(URL.createObjectURL(b));
    this.#w.onmessage = ({data:m}) => {
      const c = this.#cb[m.id]; if (!c) return;
      m.type === 'ERROR' ? c.rej(new Error(m.data)) : c.res(m.data);
      delete this.#cb[m.id];
    };
    const r = await this.#s('LOAD', {w: wBuf}, [wBuf]);
    this.loaded = true; return r;
  }
  #s(t, d, x) {
    return new Promise((res, rej) => {
      const id = this.#id++; this.#cb[id] = {res, rej};
      this.#w.postMessage({id, type: t, data: d}, x);
    });
  }
  writeFile(p, d) { return this.#s('WRITE_FILE', {path:p, data:d}); }
  readFile(p, e) { return this.#s('READ_FILE', {path:p, enc:e}); }
  deleteFile(p) { return this.#s('DELETE_FILE', {path:p}); }
  exec(...a) { return this.#s('EXEC', {args:a}); }
  terminate() { this.#w?.terminate(); this.#w = null; this.loaded = false; }
}

let _ffmpeg = null;

function getEncoderArgs(fmt, qlt) {
  if (fmt === 'wav') return ['-c:a', WAV_CODECS[qlt] || 'pcm_s16le'];
  if (fmt === 'flac') return ['-c:a', 'flac', '-compression_level', qlt.replace(/[^0-9]/g, '')];
  const q = qlt.replace(/[^0-9]/g, '');
  if (q) return ['-c:a', ENCODE_MAP[fmt].codec, '-b:a', q + 'k'];
  return ['-c:a', ENCODE_MAP[fmt].codec];
}

async function startConvert() {
  const files = _convertFiles;
  if (files.length === 0) { addLog('请先添加音频文件', 'warn'); return; }
  const btn = document.getElementById('startConvert');
  btn.disabled = true;
  const fmt = document.getElementById('fmtConvert').value;
  const qlt = document.getElementById('qltConvert').value;
  const map = ENCODE_MAP[fmt];
  const totalP = document.getElementById('progTextConvert');
  const pBar = document.querySelector('#tab-convert .progress-fill');

  if (!_ffmpeg) _ffmpeg = new FFmpegW();
  if (!_ffmpeg.loaded) {
    addLog('正在从 CDN 加载 FFmpeg 核心 (~24MB)...', 'info');
    btn.textContent = '加载中...';
    try {
      const resp = await fetch(CDN_FFCORE_WASM);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const wsBuf = await resp.arrayBuffer();
      await _ffmpeg.load(wsBuf);
      addLog('FFmpeg 核心加载完成', 'info');
    } catch(e) {
      addLog('FFmpeg 加载失败: ' + (e.message || e), 'error');
      btn.disabled = false; btn.textContent = '开始转换'; return;
    }
  }

  let ok = 0, err = 0;
  const total = files.length;
  for (let i = 0; i < total; i++) {
    const f = files[i];
    btn.textContent = '转换中 (' + (i+1) + '/' + total + ')...';
    if (totalP) totalP.textContent = ok + ' / ' + total;
    if (pBar) pBar.style.width = Math.round(ok/total*100) + '%';
    try {
      const u8 = new Uint8Array(await f.arrayBuffer());
      await _ffmpeg.writeFile('in', u8);
      const outName = 'out' + map.suffix;
      const args = ['-y', '-i', 'in'].concat(getEncoderArgs(fmt, qlt)).concat([outName]);
      addLog('转换: ' + f.name + ' → ' + fmt.toUpperCase(), 'info');
      var ret = await _ffmpeg.exec(...args);
      if (ret !== 0) throw new Error('ffmpeg exit: ' + ret);
      const data = await _ffmpeg.readFile(outName);
      await _ffmpeg.deleteFile('in'); await _ffmpeg.deleteFile(outName);
      const baseName = f.name.replace(/\.[^.]+$/, '');
      downloadBlob(new Blob([data], {type:map.mime}), baseName + map.suffix);
      ok++;
    } catch(e) {
      addLog(f.name + ' 转换失败: ' + (e.message || e), 'error');
      err++;
    }
  }
  if (pBar) pBar.style.width = ok/total*100 + '%';
  if (totalP) totalP.textContent = ok + ' / ' + total;
  addLog('转换完成: ' + ok + ' 成功, ' + err + ' 失败', err > 0 ? 'warn' : 'info');
  saveStats('convert', ok);
  btn.disabled = false; btn.textContent = '开始转换';
}

function cancelConvert() { addLog('已取消', 'warn'); }
