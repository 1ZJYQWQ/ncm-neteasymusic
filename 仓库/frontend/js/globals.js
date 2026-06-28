let _decryptFiles = [];
let _convertFiles = [];
let themeOptions = ['原格式 (不转换)', 'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];

const QUALITY_MAP = {
  'mp3': ['128k','192k','256k','320k'],
  'wav': ['16bit int','24bit int','32bit float'],
  'flac': ['0 (无损)','1','2','3','4','5 (默认)','6','7','8 (最大压缩)'],
  'aac': ['96k','128k','192k','256k','320k'],
  'ogg': ['64k','96k','128k','192k','256k'],
  'wma': ['64k','96k','128k','160k','192k'],
  '原格式 (不转换)': [],
};
