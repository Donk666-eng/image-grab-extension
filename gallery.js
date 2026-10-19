const grid = document.getElementById('gallery-grid');
const selectedCountEl = document.getElementById('selected-count');
const totalCountEl = document.getElementById('total-count');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let validCards = [];

// 更新顶部选中数量
function updateCounter() {
  const checked = validCards.filter((item) => item.checkbox.checked);
  selectedCountEl.textContent = checked.length;
  totalCountEl.textContent = validCards.length;
}

// 将任意图片 URL 转换为 PNG DataURL
async function convertUrlToPngDataUrl(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return canvas.toDataURL('image/png');
}

// 渲染图片卡片
chrome.storage.local.get(['extractedImages'], (res) => {
  const urls = res.extractedImages || [];
  urls.forEach((url) => {
    const card = document.createElement('div');
    card.className = 'img-card selected';

    const img = document.createElement('img');
    img.src = url;

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const dimSpan = document.createElement('span');
    dimSpan.textContent = '加载中...';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'card-checkbox';
    checkbox.checked = true;

    meta.appendChild(dimSpan);
    meta.appendChild(checkbox);
    card.appendChild(img);
    card.appendChild(meta);

    // 图片加载后检测真实尺寸，小于 100x100 自动剔除
    img.onload = () => {
      if (img.naturalWidth < 100 || img.naturalHeight < 100) {
        card.remove();
        return;
      }
      dimSpan.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
      validCards.push({ url, card, checkbox });
      grid.appendChild(card);
      updateCounter();
    };

    // 点击卡片切换选中状态
    card.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      card.classList.toggle('selected', checkbox.checked);
      updateCounter();
    });
  });
});

// 全选
document.getElementById('btn-select-all').addEventListener('click', () => {
  validCards.forEach((item) => {
    item.checkbox.checked = true;
    item.card.classList.add('selected');
  });
  updateCounter();
});

// 反选
document.getElementById('btn-invert').addEventListener('click', () => {
  validCards.forEach((item) => {
    item.checkbox.checked = !item.checkbox.checked;
    item.card.classList.toggle('selected', item.checkbox.checked);
  });
  updateCounter();
});

// 批量下载为 PNG
document.getElementById('btn-download').addEventListener('click', async () => {
  const selected = validCards.filter((item) => item.checkbox.checked);
  if (selected.length === 0) {
    alert('请至少勾选一张图片！');
    return;
  }

  progressBar.classList.remove('hidden');
  for (let i = 0; i < selected.length; i++) {
    const indexStr = String(i + 1).padStart(3, '0');
    progressText.textContent = `正在转换并下载：${i + 1} / ${selected.length}`;
    try {
      const pngDataUrl = await convertUrlToPngDataUrl(selected[i].url);
      await chrome.downloads.download({
        url: pngDataUrl,
        filename: `商品图_${indexStr}.png`,
        saveAs: false
      });
    } catch (err) {
      console.error('下载失败:', selected[i].url, err);
    }
  }
  progressText.textContent = `✅ 全部下载完成！共保存 ${selected.length} 张 PNG 图片。`;
});