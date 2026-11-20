"use strict";
(() => {
  const base = new URL('./', location.href);
  const config = window.PUZZLE_CONFIG || {};
  function publicURL(value) {
    try {
      const parsed = new URL(String(value || '').trim());
      return /^https?:$/.test(parsed.protocol) ? parsed.href : '';
    } catch { return ''; }
  }
  const url = publicURL(config.pageURL) || (/^https?:$/.test(base.protocol) && !['localhost','127.0.0.1','[::1]'].includes(base.hostname) ? base.href : '');
  const announcement = publicURL(config.announcementPostURL);
  document.querySelectorAll('[data-post]').forEach(link => {
    const clear = link.dataset.post === 'clear';
    const text = clear ? 'Web謎「9 in total.」をクリアしました！' : 'Web謎「9 in total.」に挑戦します！';
    const links = [...new Set([url, clear ? announcement : ''].filter(Boolean))];
    link.href = 'https://x.com/intent/post?text=' + encodeURIComponent(text + (links.length ? '\n\n' + links.join('\n') : '') + '\n#Web_9inTotal');
  });
})();
