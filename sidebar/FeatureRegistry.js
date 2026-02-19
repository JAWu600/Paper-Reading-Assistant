/**
 * 功能注册表 - 管理所有可用的功能模块
 */
export class FeatureRegistry {
  constructor() {
    this.features = new Map();
  }

  /**
   * 注册功能
   * @param {string} key - 功能唯一标识
   * @param {object} config - 功能配置
   *   - name: 显示名称
   *   - icon: 图标
   *   - component: 功能组件(函数,返回Promise)
   */
  register(key, config) {
    if (!key || !config || !config.name || !config.component) {
      throw new Error('Invalid feature configuration');
    }

    this.features.set(key, {
      key,
      name: config.name,
      icon: config.icon || '📦',
      component: config.component
    });

    // 通知TabManager更新标签
    this.notifyUpdate();
  }

  /**
   * 获取功能配置
   */
  get(key) {
    return this.features.get(key);
  }

  /**
   * 获取所有功能
   */
  getAll() {
    return Array.from(this.features.values());
  }

  /**
   * 检查功能是否存在
   */
  has(key) {
    return this.features.has(key);
  }

  /**
   * 注销功能
   */
  unregister(key) {
    this.features.delete(key);
    this.notifyUpdate();
  }

  /**
   * 清空所有功能
   */
  clear() {
    this.features.clear();
    this.notifyUpdate();
  }

  /**
   * 通知更新(会被TabManager监听)
   */
  notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pra-features-update', {
        detail: {
          features: this.getAll()
        }
      }));
    }
  }
}
