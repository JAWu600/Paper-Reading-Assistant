/**
 * 文本翻译功能
 */
export class TranslationFeature {
  constructor() {
    this.name = '文本翻译';
    // 翻译服务配置 - 可扩展
    this.translationProviders = [
      { key: 'google', name: 'Google翻译' },
      { key: 'bing', name: 'Bing翻译' },
      { key: 'libre', name: 'LibreTranslate（免费开源）' }
    ];
  }

  /**
   * 渲染功能UI
   */
  render(container) {
    // 生成翻译服务选项
    const providerOptions = this.translationProviders.map(
      provider => `<option value="${provider.key}">${provider.name}</option>`
    ).join('');

    // 支持的语言列表
    const languageOptions = [
      { value: 'auto', name: '自动检测' },
      { value: 'zh', name: '中文' },
      { value: 'en', name: '英语' },
      { value: 'ja', name: '日语' },
      { value: 'ko', name: '韩语' },
      { value: 'fr', name: '法语' },
      { value: 'de', name: '德语' },
      { value: 'ru', name: '俄语' },
      { value: 'ar', name: '阿拉伯语' },
      { value: 'es', name: '西班牙语' },
      { value: 'pt', name: '葡萄牙语' },
      { value: 'it', name: '意大利语' },
      { value: 'nl', name: '荷兰语' },
      { value: 'pl', name: '波兰语' },
      { value: 'tr', name: '土耳其语' },
      { value: 'vi', name: '越南语' },
      { value: 'th', name: '泰语' },
      { value: 'id', name: '印尼语' },
      { value: 'hi', name: '印地语' },
      { value: 'sv', name: '瑞典语' },
      { value: 'da', name: '丹麦语' },
      { value: 'fi', name: '芬兰语' },
      { value: 'no', name: '挪威语' },
      { value: 'el', name: '希腊语' },
      { value: 'cs', name: '捷克语' },
      { value: 'ro', name: '罗马尼亚语' },
      { value: 'hu', name: '匈牙利语' }
    ];

    // 生成语言选项（自动检测只在源语言中显示）
    const fromLanguageOptions = languageOptions.map(lang => `<option value="${lang.value}">${lang.name}</option>`).join('');
    const toLanguageOptions = languageOptions.filter(lang => lang.value !== 'auto').map(lang => `<option value="${lang.value}">${lang.name}</option>`).join('');

    container.innerHTML = `
      <div class="pra-feature-panel active" data-feature="translate">
        <div class="pra-section-title">🌐 文本翻译</div>

        <div class="pra-form-group" style="font-size: 13px; color: #666; margin-bottom: 16px;">
          请先在页面上选中需要翻译的文本，然后点击"翻译"按钮
        </div>

        <div class="pra-form-group">
          <label class="pra-label">翻译服务</label>
          <select id="pra-translate-provider" class="pra-select">
            ${providerOptions}
          </select>
        </div>

        <div class="pra-form-group">
          <div class="pra-row">
            <div class="pra-col">
              <label class="pra-label">源语言</label>
              <select id="pra-translate-from" class="pra-select">
                ${fromLanguageOptions}
              </select>
            </div>
            <div class="pra-col">
              <label class="pra-label">目标语言</label>
              <select id="pra-translate-to" class="pra-select">
                ${toLanguageOptions}
              </select>
            </div>
          </div>
        </div>

        <button id="pra-translate-btn" class="pra-btn pra-btn-primary">
          翻译
        </button>

        <div class="pra-form-group" style="margin-top: 16px;">
          <label class="pra-label">翻译结果</label>
          <div id="pra-translate-result" class="pra-result-box">
            翻译结果将显示在这里...
          </div>
        </div>

        <button
          id="pra-translate-copy-btn"
          class="pra-btn pra-btn-secondary"
          style="display: none; margin-top: 12px;"
        >
          📋 复制翻译结果
        </button>
      </div>
    `;

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const translateBtn = document.getElementById('pra-translate-btn');
    const copyBtn = document.getElementById('pra-translate-copy-btn');

    if (translateBtn) {
      translateBtn.addEventListener('click', () => this.handleTranslate());
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.handleCopy());
    }
  }

  /**
   * 获取当前选中的文本
   */
  getSelectedText() {
    return window.getSelection().toString().trim();
  }

  /**
   * 处理翻译
   */
  async handleTranslate() {
    const selectedText = this.getSelectedText();
    const provider = document.getElementById('pra-translate-provider').value;
    const fromLang = document.getElementById('pra-translate-from').value;
    const toLang = document.getElementById('pra-translate-to').value;
    const resultBox = document.getElementById('pra-translate-result');

    if (!selectedText) {
      resultBox.innerHTML = '<span class="pra-error">请先在页面上选择需要翻译的文本</span>';
      return;
    }

    if (selectedText.length > 5000) {
      resultBox.innerHTML = '<span class="pra-error">选中文本过长，请减少到5000字以内</span>';
      return;
    }

    // 显示加载状态
    resultBox.innerHTML = '<span class="pra-loading">翻译中...</span>';

    try {
      // 调用翻译API
      const response = await chrome.runtime.sendMessage({
        action: 'getTranslation',
        text: selectedText,
        from: fromLang,
        to: toLang,
        provider: provider
      });

      if (response.error) {
        resultBox.innerHTML = `<span class="pra-error">翻译失败: ${response.error}</span>`;
        return;
      }

      // 显示结果
      resultBox.innerHTML = `<div class="pra-success">${response.translatedText}</div>`;

      // 显示复制按钮
      const copyBtn = document.getElementById('pra-translate-copy-btn');
      if (copyBtn) {
        copyBtn.style.display = 'block';
      }
    } catch (error) {
      resultBox.innerHTML = `<span class="pra-error">翻译失败: ${error.message}</span>`;
    }
  }

  /**
   * 复制翻译结果
   */
  async handleCopy() {
    const resultBox = document.getElementById('pra-translate-result');
    const text = resultBox.textContent;

    try {
      await navigator.clipboard.writeText(text);

      const copyBtn = document.getElementById('pra-translate-copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案：使用传统的复制方法
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      const copyBtn = document.getElementById('pra-translate-copy-btn');
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = '📋 复制翻译结果';
      }, 2000);
    }
  }

  /**
   * 销毁功能
   */
  destroy() {
    // 清理事件监听
    // 注意：由于selectionchange是全局事件，这里可以选择保留监听
    // 或者通过更精细的事件管理来清理
  }
}
