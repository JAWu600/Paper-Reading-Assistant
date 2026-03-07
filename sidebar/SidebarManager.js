/**
 * 侧边栏管理器 - 负责侧边栏的整体管理
 */

export class SidebarManager {
  constructor() {
    this.sidebar = null;
    this.tabManager = null;
    this.featureRegistry = null;
    this.TabManager = null;
    this.FeatureRegistry = null;
    this.isVisible = false;
    this.currentFeature = null;
    this.currentTheme = 'light'; // 默认浅色主题

    // 侧边栏宽度调整相关
    this.sidebarWidth = 400; // 默认宽度
    this.minWidth = 280; // 最小宽度
    this.maxWidth = 600; // 最大宽度
    this.isResizing = false;
    this.resizeStartX = 0;
    this.resizeStartWidth = 0;
  }

  /**
   * 初始化侧边栏
   */
  async init() {
    if (this.sidebar) {
      return; // 已初始化
    }

    // 动态加载依赖模块
    if (!this.TabManager) {
      const tabManagerModule = await import(chrome.runtime.getURL('sidebar/TabManager.js'));
      this.TabManager = tabManagerModule.TabManager;
    }

    if (!this.FeatureRegistry) {
      const featureRegistryModule = await import(chrome.runtime.getURL('sidebar/FeatureRegistry.js'));
      this.FeatureRegistry = featureRegistryModule.FeatureRegistry;
    }

    this.createSidebarElement();
    this.createResizeHandle();
    this.createOverlayElement();
    this.tabManager = new this.TabManager(this.sidebar);
    this.featureRegistry = new this.FeatureRegistry();

    // 加载保存的主题偏好
    await this.loadTheme();

    // 加载保存的宽度
    await this.loadWidth();

    // 注册所有功能
    await this.registerFeatures();

    // 初始化标签栏
    this.tabManager.createTabs(this.featureRegistry.getAll());

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 创建侧边栏DOM元素
   */
  createSidebarElement() {
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'paper-reading-assistant-sidebar';
    this.sidebar.className = 'hidden';
    this.sidebar.innerHTML = `
      <div id="pra-sidebar-header">
        <button id="pra-theme-btn" title="${chrome.i18n.getMessage('themeToggle')}">🌙</button>
        <button id="pra-close-btn">&times;</button>
        <div id="pra-sidebar-title">${chrome.i18n.getMessage('sidebarTitle')}</div>
        <div id="pra-feature-tabs"></div>
      </div>
      <div id="pra-sidebar-content"></div>
      <div id="pra-sidebar-footer">
        <div class="pra-footer-text">${chrome.i18n.getMessage('versionLabel')}</div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
  }

  /**
   * 创建宽度调整手柄
   */
  createResizeHandle() {
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'pra-resize-handle';
    this.sidebar.appendChild(resizeHandle);

    // 绑定拖动事件
    this.bindResizeEvents(resizeHandle);
  }

  /**
   * 绑定宽度调整事件
   */
  bindResizeEvents(resizeHandle) {
    // 鼠标按下开始拖动
    resizeHandle.addEventListener('mousedown', (e) => {
      this.isResizing = true;
      this.resizeStartX = e.clientX;
      this.resizeStartWidth = this.sidebar.offsetWidth;

      // 添加拖动中的样式
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      resizeHandle.classList.add('resizing');

      e.preventDefault();
    });

    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
      if (!this.isResizing) return;

      const deltaX = this.resizeStartX - e.clientX; // 向左拖动为正
      let newWidth = this.resizeStartWidth + deltaX;

      // 限制宽度范围
      newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));

      this.setSidebarWidth(newWidth);
    });

    // 鼠标释放结束拖动
    document.addEventListener('mouseup', () => {
      if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const resizeHandle = document.getElementById('pra-resize-handle');
        if (resizeHandle) {
          resizeHandle.classList.remove('resizing');
        }

        // 保存宽度设置
        this.saveWidth();

        // 更新页面缩进
        this.updatePageMargin();
      }
    });
  }

  /**
   * 设置侧边栏宽度
   */
  setSidebarWidth(width) {
    this.sidebarWidth = width;
    this.sidebar.style.width = `${width}px`;

    // 自适应字体大小
    this.adjustFontSize(width);
  }

  /**
   * 根据宽度自适应字体大小
   */
  adjustFontSize(width) {
    // 基于基准宽度400px计算缩放比例
    const baseWidth = 400;
    const scale = width / baseWidth;

    // 限制缩放范围
    const clampedScale = Math.max(0.85, Math.min(1.15, scale));

    // 设置CSS变量
    this.sidebar.style.setProperty('--pra-font-scale', clampedScale);
  }

  /**
   * 加载保存的宽度
   */
  async loadWidth() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['sidebarWidth'], (result) => {
        if (result.sidebarWidth) {
          this.sidebarWidth = result.sidebarWidth;
        }
        this.setSidebarWidth(this.sidebarWidth);
        resolve();
      });
    });
  }

  /**
   * 保存宽度设置
   */
  saveWidth() {
    chrome.storage.local.set({ sidebarWidth: this.sidebarWidth });
  }

  /**
   * 更新页面边距
   */
  updatePageMargin() {
    document.body.style.marginRight = `${this.sidebarWidth}px`;

    // 更新容器元素
    const commonSelectors = [
      'main',
      '[role="main"]',
      '.container',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'article',
      '.article',
      '.paper',
      '.paper-container'
    ];

    commonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element.dataset.originalWidth) {
          const currentMaxWidth = element.dataset.originalWidth || '100%';
          if (currentMaxWidth !== 'none' && currentMaxWidth !== 'auto') {
            element.style.maxWidth = `calc(${currentMaxWidth} - ${this.sidebarWidth}px)`;
          }
        }
      });
    });
  }

  /**
   * 创建遮罩层元素
   */
  createOverlayElement() {
    // 移除遮罩层，因为我们要实现并列显示而非覆盖
  }

  /**
   * 注册功能模块
   */
  async registerFeatures() {
    // 注册文本翻译功能
    this.featureRegistry.register('translate', {
      name: chrome.i18n.getMessage('featureTranslate'),
      icon: '🌐',
      component: async () => {
        const module = await import(chrome.runtime.getURL('sidebar/features/TranslationFeature.js'));
        return new module.TranslationFeature();
      }
    });

    // 注册AI文献解读功能
    this.featureRegistry.register('qa', {
      name: chrome.i18n.getMessage('featureQA'),
      icon: '🤖',
      component: async () => {
        const module = await import(chrome.runtime.getURL('sidebar/features/QAFeature.js'));
        return new module.QAFeature();
      }
    });

    // 注册引用功能
    this.featureRegistry.register('citation', {
      name: chrome.i18n.getMessage('featureCitation'),
      icon: '📝',
      component: async () => {
        const module = await import(chrome.runtime.getURL('sidebar/features/CitationFeature.js'));
        return new module.CitationFeature();
      }
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮
    const closeBtn = document.getElementById('pra-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // 主题切换按钮
    const themeBtn = document.getElementById('pra-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // 监听标签切换
    this.tabManager.on('tabChange', (featureKey) => {
      this.switchFeature(featureKey);
    });
  }

  /**
   * 加载保存的主题偏好
   */
  async loadTheme() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['theme'], (result) => {
        if (result.theme) {
          // 用户已设置主题偏好，使用用户的设置
          this.currentTheme = result.theme;
        } else {
          // 用户未设置主题偏好，检测系统主题
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
          } else {
            this.currentTheme = 'light';
          }
          
          // 监听系统主题变化
          if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addEventListener('change', (e) => {
              // 只有在用户没有设置主题偏好时才跟随系统主题
              chrome.storage.local.get(['theme'], (result) => {
                if (!result.theme) {
                  this.currentTheme = e.matches ? 'dark' : 'light';
                  this.applyTheme(this.currentTheme);
                }
              });
            });
          }
        }
        this.applyTheme(this.currentTheme);
        resolve();
      });
    });
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    // 保存主题偏好
    chrome.storage.local.set({ theme: this.currentTheme });
  }

  /**
   * 应用主题
   */
  applyTheme(theme) {
    const themeBtn = document.getElementById('pra-theme-btn');
    if (this.sidebar) {
      if (theme === 'dark') {
        this.sidebar.classList.add('dark-mode');
        if (themeBtn) {
          themeBtn.textContent = '☀️';
          themeBtn.title = chrome.i18n.getMessage('lightMode');
        }
      } else {
        this.sidebar.classList.remove('dark-mode');
        if (themeBtn) {
          themeBtn.textContent = '🌙';
          themeBtn.title = chrome.i18n.getMessage('darkMode');
        }
      }
    }
  }

  /**
   * 显示侧边栏
   */
  async show() {
    await this.init();
    this.sidebar.classList.remove('hidden');
    this.isVisible = true;

    // 缩进原始页面，为侧边栏腾出空间
    this.shrinkOriginalPage();

    // 默认激活第一个功能
    if (!this.currentFeature) {
      const firstFeature = this.featureRegistry.getAll()[0];
      if (firstFeature) {
        await this.switchFeature(firstFeature.key);
      }
    }
  }

  /**
   * 隐藏侧边栏
   */
  hide() {
    if (this.sidebar) {
      this.sidebar.classList.add('hidden');
      this.isVisible = false;

      // 恢复原始页面宽度
      this.restoreOriginalPage();
    }
  }

  /**
   * 缩进原始页面，为侧边栏腾出空间
   */
  shrinkOriginalPage() {
    // 为document.body添加右margin
    document.body.style.marginRight = `${this.sidebarWidth}px`;
    document.body.style.transition = 'margin-right 0.3s ease-in-out';

    // 尝试修改常见的容器元素
    const commonSelectors = [
      'main',
      '[role="main"]',
      '.container',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'article',
      '.article',
      '.paper',
      '.paper-container'
    ];

    commonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // 保存原始宽度
        if (!element.dataset.originalWidth) {
          const computedStyle = window.getComputedStyle(element);
          element.dataset.originalWidth = computedStyle.maxWidth;
          element.dataset.originalMargin = computedStyle.marginRight;
        }

        // 设置新的宽度和margin
        const currentMaxWidth = element.dataset.originalWidth || '100%';
        if (currentMaxWidth !== 'none' && currentMaxWidth !== 'auto') {
          element.style.maxWidth = `calc(${currentMaxWidth} - ${this.sidebarWidth}px)`;
        }
        element.style.transition = 'max-width 0.3s ease-in-out, margin-right 0.3s ease-in-out';
      });
    });
  }

  /**
   * 恢复原始页面宽度
   */
  restoreOriginalPage() {
    // 恢复document.body
    document.body.style.marginRight = '';

    // 恢复所有修改过的容器元素
    const commonSelectors = [
      'main',
      '[role="main"]',
      '.container',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'article',
      '.article',
      '.paper',
      '.paper-container'
    ];

    commonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // 恢复原始宽度
        if (element.dataset.originalWidth) {
          element.style.maxWidth = element.dataset.originalWidth;
        }
        element.style.transition = '';
      });
    });
  }

  /**
   * 切换侧边栏显示状态
   */
  async toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      await this.show();
    }
  }

  /**
   * 切换功能
   */
  async switchFeature(featureKey) {
    if (this.currentFeature === featureKey) {
      return; // 已经是当前功能
    }

    // 停止旧功能
    await this.stopCurrentFeature();

    // 切换到新功能
    const featureConfig = this.featureRegistry.get(featureKey);
    if (featureConfig) {
      this.currentFeature = featureKey;
      this.tabManager.setActiveTab(featureKey);

      // 动态加载并初始化功能组件
      const FeatureClass = await featureConfig.component();
      const container = document.getElementById('pra-sidebar-content');
      container.innerHTML = '';
      FeatureClass.render(container);
    }
  }

  /**
   * 停止当前功能
   */
  async stopCurrentFeature() {
    const contentContainer = document.getElementById('pra-sidebar-content');
    if (contentContainer) {
      contentContainer.innerHTML = '';
    }
  }

  /**
   * 销毁侧边栏
   */
  destroy() {
    this.hide();
    if (this.sidebar) {
      this.sidebar.remove();
      this.sidebar = null;
    }
  }
}
