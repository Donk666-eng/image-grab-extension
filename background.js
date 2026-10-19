chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'OPEN_GALLERY') {
    // 存储提取到的图片列表并打开展示页
    chrome.storage.local.set({ extractedImages: message.images || [] }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
      sendResponse({ status: 'ok' });
    });
    return true; // 保持异步消息通道
  }
});