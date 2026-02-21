/**
 * 文本翻译功能
 */
export class TranslationFeature {
  constructor() {
    this.name = chrome.i18n.getMessage('featureTranslate');
    // 翻译服务配置 - 可扩展
    this.translationProviders = [
      { key: 'google', name: chrome.i18n.getMessage('googleTranslate') },
      { key: 'bing', name: chrome.i18n.getMessage('bingTranslate') },
      { key: 'libre', name: chrome.i18n.getMessage('libreTranslate') }
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
      { value: 'auto', name: chrome.i18n.getMessage('autoDetect') },
      { value: 'zh', name: chrome.i18n.getMessage('languageZh') },
      { value: 'en', name: chrome.i18n.getMessage('languageEn') },
      { value: 'ja', name: '日本語' },
      { value: 'ko', name: '한국어' },
      { value: 'fr', name: 'Français' },
      { value: 'de', name: 'Deutsch' },
      { value: 'ru', name: 'Русский' },
      { value: 'ar', name: 'العربية' },
      { value: 'es', name: 'Español' },
      { value: 'pt', name: 'Português' },
      { value: 'it', name: 'Italiano' },
      { value: 'nl', name: 'Nederlands' },
      { value: 'pl', name: 'Polski' },
      { value: 'tr', name: 'Türkçe' },
      { value: 'vi', name: 'Tiếng Việt' },
      { value: 'th', name: 'ไทย' },
      { value: 'id', name: 'Bahasa Indonesia' },
      { value: 'hi', name: 'हिन्दी' },
      { value: 'sv', name: 'Svenska' },
      { value: 'da', name: 'Dansk' },
      { value: 'fi', name: 'Suomi' },
      { value: 'no', name: 'Norsk' },
      { value: 'el', name: 'Ελληνικά' },
      { value: 'cs', name: 'Čeština' },
      { value: 'ro', name: 'Română' },
      { value: 'hu', name: 'Magyar' }
    ];

    // 生成语言选项（自动检测只在源语言中显示）
    const fromLanguageOptions = languageOptions.map(lang => `<option value="${lang.value}">${lang.name}</option>`).join('');
    const toLanguageOptions = languageOptions.filter(lang => lang.value !== 'auto').map(lang => `<option value="${lang.value}">${lang.name}</option>`).join('');

    container.innerHTML = `
      <div class="pra-feature-panel active" data-feature="translate">
        <div class="pra-section-title">${chrome.i18n.getMessage('translateLabel')}</div>

        <div class="pra-form-group" style="font-size: 13px; color: #666; margin-bottom: 16px;">
          ${chrome.i18n.getMessage('selectTextFirst')}
        </div>

        <div class="pra-form-group">
          <label class="pra-label">${chrome.i18n.getMessage('translateProvider')}</label>
          <select id="pra-translate-provider" class="pra-select">
            ${providerOptions}
          </select>
        </div>

        <div class="pra-form-group">
          <div class="pra-row">
            <div class="pra-col">
              <label class="pra-label">${chrome.i18n.getMessage('sourceLanguage')}</label>
              <select id="pra-translate-from" class="pra-select">
                ${fromLanguageOptions}
              </select>
            </div>
            <div class="pra-col">
              <label class="pra-label">${chrome.i18n.getMessage('targetLanguage')}</label>
              <select id="pra-translate-to" class="pra-select">
                ${toLanguageOptions}
              </select>
            </div>
          </div>
        </div>

        <button id="pra-translate-btn" class="pra-btn pra-btn-primary">
          ${chrome.i18n.getMessage('translateButton')}
        </button>

        <div class="pra-form-group" style="margin-top: 16px;">
          <label class="pra-label">${chrome.i18n.getMessage('translateResult')}</label>
          <div id="pra-translate-result" class="pra-result-box">
            ${chrome.i18n.getMessage('translationResultPlaceholder')}
          </div>
        </div>

        <button
          id="pra-translate-copy-btn"
          class="pra-btn pra-btn-secondary"
          style="display: none; margin-top: 12px;"
        >
          ${chrome.i18n.getMessage('copyTranslationResult')}
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
      resultBox.innerHTML = `<span class="pra-error">${chrome.i18n.getMessage('selectTextError')}</span>`;
      return;
    }

    if (selectedText.length > 5000) {
      resultBox.innerHTML = `<span class="pra-error">${chrome.i18n.getMessage('textTooLongError')}</span>`;
      return;
    }

    // 显示加载状态
    resultBox.innerHTML = `<span class="pra-loading">${chrome.i18n.getMessage('translating')}</span>`;

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
        resultBox.innerHTML = `<span class="pra-error">${chrome.i18n.getMessage('translationFailed')}: ${response.error}</span>`;
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
      resultBox.innerHTML = `<span class="pra-error">${chrome.i18n.getMessage('translationFailed')}: ${error.message}</span>`;
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
      copyBtn.textContent = chrome.i18n.getMessage('copied');
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
      copyBtn.textContent = chrome.i18n.getMessage('copied');
      setTimeout(() => {
        copyBtn.textContent = chrome.i18n.getMessage('copyTranslationResult');
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
