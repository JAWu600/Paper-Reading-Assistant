/**
 * 标签管理器 - 负责功能标签的创建和切换
 */
export class TabManager {
  constructor(sidebar) {
    this.sidebar = sidebar;
    this.tabsContainer = document.getElementById('pra-feature-tabs');
    this.tabs = [];
    this.activeTab = null;
    this.listeners = {};
  }

  /**
   * 创建标签按钮
   */
  createTabs(features) {
    this.tabsContainer.innerHTML = '';
    this.tabs = [];

    features.forEach(feature => {
      const tab = document.createElement('button');
      tab.className = 'pra-tab-button';
      tab.innerHTML = `${feature.icon} ${feature.name}`;
      tab.dataset.feature = feature.key;
      tab.addEventListener('click', () => this.setActiveTab(feature.key));
      
      this.tabsContainer.appendChild(tab);
      this.tabs.push(tab);
    });
  }

  /**
   * 设置活动标签
   */
  setActiveTab(featureKey) {
    // 移除之前的激活状态
    if (this.activeTab) {
      this.tabs.forEach(tab => {
        if (tab.dataset.feature === this.activeTab) {
          tab.classList.remove('active');
        }
      });
    }

    // 设置新的激活状态
    this.activeTab = featureKey;
    this.tabs.forEach(tab => {
      if (tab.dataset.feature === featureKey) {
        tab.classList.add('active');
      }
    });

    // 触发事件
    this.emit('tabChange', featureKey);
  }

  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * 更新标签(当功能注册表更新时调用)
   */
  updateTabs(features) {
    this.createTabs(features);
    if (this.activeTab) {
      this.setActiveTab(this.activeTab);
    }
  }
}
