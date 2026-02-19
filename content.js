// Content script for Paper精读全能助手
// 使用动态导入来加载SidebarManager,避免ES6模块导入问题

let sidebarManager = null;

// 动态加载SidebarManager
async function loadSidebarManager() {
  if (window.SidebarManager) {
    return window.SidebarManager;
  }

  // 动态加载所有需要的模块
  const moduleURL = chrome.runtime.getURL('sidebar/SidebarManager.js');
  const module = await import(moduleURL);

  window.SidebarManager = module.SidebarManager;
  return module.SidebarManager;
}

// 初始化侧边栏
async function initSidebar() {
  if (!sidebarManager) {
    const SidebarManager = await loadSidebarManager();
    sidebarManager = new SidebarManager();
  }
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSidebar') {
    initSidebar().then(() => {
      sidebarManager.toggle();
    });
  } else if (request.action === 'showSidebar') {
    initSidebar().then(() => {
      sidebarManager.show();
    });
  } else if (request.action === 'hideSidebar') {
    if (sidebarManager) {
      sidebarManager.hide();
    }
  }
});

// 页面加载完成后不自动初始化,等待扩展图标点击
console.log('Paper精读全能助手 Content Script 已加载');

