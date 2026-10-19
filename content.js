(function () {
  // 防止重复注入
  if (document.getElementById('ig-extract-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ig-extract-btn';
  btn.innerText = '获取图片';
  document.body.appendChild(btn);

  // 补全相对路径并清理电商缩略图后缀
  function normalizeUrl(rawUrl) {
    if (!rawUrl || rawUrl.startsWith('data:')) return null;
    try {
      let url = new URL(rawUrl, window.location.href).href;
      // 移除常见淘宝/京东缩略图尾巴以获取高清原图
      url = url.replace(/(_\d+x\d+.*|\.\d+x\d+.*|!cc_\d+x\d+.*)$/i, '');
      return url;
    } catch (e) {
      return null;
    }
  }

  // 提取页面所有符合条件的图片
  function extractImages() {
    const urlSet = new Set();

    // 1. 扫描所有 img 标签及懒加载属性
    const imgElements = document.querySelectorAll('img');
    imgElements.forEach((img) => {
      const candidates = [
        img.src,
        img.getAttribute('data-src'),
        img.getAttribute('data-lazy-src'),
        img.getAttribute('data-ks-lazyload'),
        img.getAttribute('srcset')?.split(' ')[0]
      ];

      // 过滤明显的微小图标（若已加载且宽高均小于 100px 则跳过）
      if (img.complete && img.naturalWidth > 0 && (img.naturalWidth < 100 || img.naturalHeight < 100)) {
        return;
      }

      candidates.forEach((src) => {
        const cleanUrl = normalizeUrl(src);
        if (cleanUrl && !/icon|logo|avatar|placeholder|spacer|loading/i.test(cleanUrl)) {
          urlSet.add(cleanUrl);
        }
      });
    });

    // 2. 扫描带有 background-image 的元素
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.includes('url(')) {
        const match = bg.match(/url\(["']?(.*?)["']?\)/);
        if (match && match[1]) {
          const cleanUrl = normalizeUrl(match[1]);
          if (cleanUrl && !/icon|logo|sprite/i.test(cleanUrl)) {
            urlSet.add(cleanUrl);
          }
        }
      }
    });

    return Array.from(urlSet);
  }

  btn.addEventListener('click', () => {
    btn.innerText = '提取中...';
    const images = extractImages();
    chrome.runtime.sendMessage({ action: 'OPEN_GALLERY', images }, () => {
      btn.innerText = '获取图片';
    });
  });
})();