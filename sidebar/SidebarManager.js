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
    this.createOverlayElement();
    this.tabManager = new this.TabManager(this.sidebar);
    this.featureRegistry = new this.FeatureRegistry();

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
        <button id="pra-close-btn">&times;</button>
        <div id="pra-sidebar-title">📚 Paper精读全能助手</div>
        <div id="pra-feature-tabs"></div>
      </div>
      <div id="pra-sidebar-content"></div>
      <div id="pra-sidebar-footer">
        <div class="pra-footer-text">Version 1.0.0</div>
      </div>
    `;

    document.body.appendChild(this.sidebar);
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
      name: '文本翻译',
      icon: '🌐',
      component: async () => {
        const module = await import(chrome.runtime.getURL('sidebar/features/TranslationFeature.js'));
        return new module.TranslationFeature();
      }
    });

    // 注册AI文献解读功能
    this.featureRegistry.register('qa', {
      name: 'AI文献解读',
      icon: '🤖',
      component: async () => {
        const module = await import(chrome.runtime.getURL('sidebar/features/QAFeature.js'));
        return new module.QAFeature();
      }
    });

    // 注册引用功能
    this.featureRegistry.register('citation', {
      name: '引用',
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

    // 监听标签切换
    this.tabManager.on('tabChange', (featureKey) => {
      this.switchFeature(featureKey);
    });
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
    const SIDEBAR_WIDTH = 400;

    // 为document.body添加右margin
    document.body.style.marginRight = `${SIDEBAR_WIDTH}px`;
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
          element.style.maxWidth = `calc(${currentMaxWidth} - ${SIDEBAR_WIDTH}px)`;
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
