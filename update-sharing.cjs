// config.js から、SNSクローラーが読む静的なOGP情報を更新します。
// 使い方: node update-sharing.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const scope = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'config.js'), 'utf8'), scope, {timeout:1000});
const config = scope.window.PUZZLE_CONFIG || {};
const baseFlag = process.argv.indexOf('--base-url');
const input = String(config.pageURL || (baseFlag >= 0 ? process.argv[baseFlag + 1] : '') || '').trim();
let pageURL = '';
let imageURL = 'thumbnail.png';
if (input) {
  const parsed = new URL(input);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('pageURL は https:// または http:// で始まるURLにしてください。');
  pageURL = parsed.href;
  const directory = new URL(pageURL);
  directory.search = ''; directory.hash = '';
  if (!/\.[^/]+$/.test(directory.pathname) && !directory.pathname.endsWith('/')) directory.pathname += '/';
  imageURL = new URL('thumbnail.png', directory).href;
}
const png = fs.readFileSync(path.join(__dirname, 'thumbnail.png'));
if (png.subarray(0,8).toString('hex') !== '89504e470d0a1a0a') throw new Error('thumbnail.png がPNG画像ではありません。');
const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
const escape = value => value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const meta = [
  '<!-- SHARE-META:START -->',
  '<meta property="og:type" content="website">',
  '<meta property="og:title" content="9 in total.">',
  '<meta property="og:description" content="9つの記号で、ひとつの等式を完成させるWeb謎。">',
  ...(pageURL ? [`<meta property="og:url" content="${escape(pageURL)}">`, `<link rel="canonical" href="${escape(pageURL)}">`] : []),
  `<meta property="og:image" content="${escape(imageURL)}">`,
  '<meta property="og:image:type" content="image/png">',
  `<meta property="og:image:width" content="${width}">`,
  `<meta property="og:image:height" content="${height}">`,
  '<meta property="og:image:alt" content="Web謎 9 in total. サムネイル">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="9 in total.">',
  '<meta name="twitter:description" content="9つの記号で、ひとつの等式を完成させるWeb謎。">',
  `<meta name="twitter:image" content="${escape(imageURL)}">`,
  '<meta name="twitter:image:alt" content="Web謎 9 in total. サムネイル">',
  '<!-- SHARE-META:END -->'
].join('\n');
for (const file of ['index.html','game.html']) {
  const filename = path.join(__dirname, file);
  let html = fs.readFileSync(filename,'utf8');
  const block = /<!-- SHARE-META:START -->[\s\S]*?<!-- SHARE-META:END -->/;
  html = block.test(html) ? html.replace(block,meta) : html.replace('</head>',meta+'\n</head>');
  fs.writeFileSync(filename,html);
}
console.log(`共有設定を更新しました（画像 ${width} × ${height}）。`);
if (!pageURL) console.log('公開前です。config.js の pageURL を設定してから、もう一度実行してください。');
