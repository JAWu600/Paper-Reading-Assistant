/**
 * AI文献解读功能
 * 支持多API降级策略
 */

export class QAFeature {
  constructor() {
    this.name = 'AI文献解读';
    this.providers = [];
    this.selectedProvider = null;
    this.selectedModel = null;
    this.isLoading = false;
  }

  /**
   * 渲染功能UI
   */
  render(container) {
    container.innerHTML = `
      <div class="pra-feature-panel active" data-feature="qa">
        <div class="pra-section-title">🤖 AI文献解读</div>
        
        <!-- 模型选择区 -->
        <div class="pra-form-group">
          <label class="pra-label">🧠 选择AI模型</label>
          <div class="pra-model-selector">
            <select id="pra-provider-select" class="pra-select">
              <option value="">-- 选择服务商 --</option>
            </select>
            <select id="pra-model-select" class="pra-select" disabled>
              <option value="">-- 先选择服务商 --</option>
            </select>
            <button id="pra-qa-settings-btn" class="pra-settings-btn" title="API设置">⚙️</button>
          </div>
          <div id="pra-qa-api-status" class="pra-api-status-mini">
            <span class="pra-status-text">正在加载...</span>
          </div>
        </div>
        
        <!-- 问题输入区 -->
        <div class="pra-form-group">
          <label class="pra-label">❓ 你的问题</label>
          <textarea 
            id="pra-qa-question" 
            class="pra-textarea" 
            placeholder="请输入你的问题...&#10;&#10;例如：这篇论文的主要贡献是什么？"
            rows="2"
          ></textarea>
        </div>

        <!-- 操作按钮 -->
        <div class="pra-button-row">
          <button id="pra-qa-btn" class="pra-btn pra-btn-primary">
            🚀 提问
          </button>
        </div>

        <!-- 回答展示区 -->
        <div class="pra-form-group" style="margin-top: 16px;">
          <div class="pra-result-header">
            <label class="pra-label">💡 AI回答</label>
            <span id="pra-qa-provider-info" class="pra-provider-info"></span>
          </div>
          <div id="pra-qa-result" class="pra-result-box pra-result-markdown">
            请先选择AI模型并输入问题...
          </div>
          <div class="pra-result-actions" id="pra-qa-actions" style="display: none;">
            <button id="pra-qa-copy" class="pra-action-btn" title="复制回答">📋 复制</button>
            <button id="pra-qa-retry" class="pra-action-btn" title="重新回答">🔄 重试</button>
          </div>
        </div>

        <!-- 历史对话 -->
        <div class="pra-history-section">
          <div class="pra-section-title" style="font-size: 14px; margin-top: 20px;">
            💬 历史对话
            <button id="pra-qa-clear-history" class="pra-clear-btn" title="清空历史">🗑️</button>
          </div>
          <div id="pra-qa-history" class="pra-history-list">
            <div class="pra-empty-history">暂无历史对话</div>
          </div>
        </div>
      </div>
    `;

    // 加载API提供商信息
    this.loadProviders();
    
    // 绑定事件
    this.bindEvents();
  }

  /**
   * 加载API提供商配置
   */
  async loadProviders() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAIProviders' });
      this.providers = response.providers || [];
      this.updateAPIStatus();
    } catch (error) {
      console.error('加载API提供商失败:', error);
      this.updateAPIStatus();
    }
  }

  /**
   * 更新API状态显示
   */
  updateAPIStatus() {
    const statusEl = document.getElementById('pra-qa-api-status');
    const providerSelect = document.getElementById('pra-provider-select');
    
    if (!statusEl || !providerSelect) return;

    // 清空并填充服务商下拉框
    providerSelect.innerHTML = '<option value="">-- 选择服务商 --</option>';
    
    this.providers.forEach(provider => {
      const option = document.createElement('option');
      option.value = provider.id;
      option.textContent = provider.name;
      option.disabled = !provider.hasKey;
      if (provider.hasKey) {
        option.textContent += ' ✅';
      } else {
        option.textContent += ' (未配置)';
      }
      providerSelect.appendChild(option);
    });

    // 更新状态文本
    const configuredCount = this.providers.filter(p => p.hasKey).length;
    if (configuredCount === 0) {
      statusEl.innerHTML = '<span class="pra-status-text">⚠️ 请在设置中配置API Key</span>';
      statusEl.className = 'pra-api-status-mini warning';
    } else {
      statusEl.innerHTML = `<span class="pra-status-text">✅ 已配置 ${configuredCount} 个服务</span>`;
      statusEl.className = 'pra-api-status-mini configured';
    }
  }

  /**
   * 更新模型下拉框
   */
  updateModelSelect(providerId) {
    const modelSelect = document.getElementById('pra-model-select');
    if (!modelSelect) return;

    if (!providerId) {
      modelSelect.innerHTML = '<option value="">-- 先选择服务商 --</option>';
      modelSelect.disabled = true;
      return;
    }

    const provider = this.providers.find(p => p.id === providerId);
    if (!provider || !provider.models || provider.models.length === 0) {
      modelSelect.innerHTML = '<option value="">无可用模型</option>';
      modelSelect.disabled = true;
      return;
    }

    modelSelect.innerHTML = '<option value="">-- 选择模型 --</option>';
    provider.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      // 显示模型名称、描述和调用限制
      let displayText = `${model.name} - ${model.description}`;
      if (model.limits) {
        displayText += ` [${model.limits}]`;
      }
      option.textContent = displayText;
      if (model.id === provider.defaultModel) {
        option.textContent += ' (推荐)';
        option.selected = true;
      }
      modelSelect.appendChild(option);
    });
    
    modelSelect.disabled = false;
    
    // 自动选择默认模型
    this.selectedModel = provider.defaultModel;
    modelSelect.value = provider.defaultModel;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 服务商选择
    const providerSelect = document.getElementById('pra-provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        this.selectedProvider = e.target.value;
        this.updateModelSelect(this.selectedProvider);
      });
    }

    // 模型选择
    const modelSelect = document.getElementById('pra-model-select');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        this.selectedModel = e.target.value;
      });
    }

    // 提问按钮
    const qaBtn = document.getElementById('pra-qa-btn');
    if (qaBtn) {
      qaBtn.addEventListener('click', () => this.handleAsk());
    }

    // 设置按钮
    const settingsBtn = document.getElementById('pra-qa-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettings());
    }

    // 复制按钮
    const copyBtn = document.getElementById('pra-qa-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyResult());
    }

    // 重试按钮
    const retryBtn = document.getElementById('pra-qa-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.handleAsk());
    }

    // 清空历史
    const clearHistoryBtn = document.getElementById('pra-qa-clear-history');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    // 回车提交
    const questionInput = document.getElementById('pra-qa-question');
    if (questionInput) {
      questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleAsk();
        }
      });
    }
  }

  /**
   * 自动获取网页论文内容
   */
  getPageContent() {
    // 尝试获取论文正文内容
    const selectors = [
      'article',
      '.paper-content',
      '.article-content',
      '.ltx_document',  // arXiv
      '.paper-body',
      '#content',
      'main',
      '.post-content',
      '.entry-content'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 100) {
        return element.innerText.trim().substring(0, 15000); // 限制长度
      }
    }
    
    // 如果没有找到特定容器，获取body内容（排除导航等）
    const body = document.body.cloneNode(true);
    const removeSelectors = ['nav', 'header', 'footer', 'aside', '.sidebar', '.navigation', '.menu', 'script', 'style'];
    removeSelectors.forEach(s => {
      body.querySelectorAll(s).forEach(el => el.remove());
    });
    
    const text = body.innerText.trim();
    return text.length > 100 ? text.substring(0, 15000) : '';
  }

  /**
   * 处理提问
   */
  async handleAsk() {
    if (this.isLoading) return;

    // 自动获取网页内容
    const context = this.getPageContent();
    const question = document.getElementById('pra-qa-question').value;
    const resultBox = document.getElementById('pra-qa-result');
    const actionsEl = document.getElementById('pra-qa-actions');
    const providerInfo = document.getElementById('pra-qa-provider-info');

    // 验证模型选择
    if (!this.selectedProvider) {
      resultBox.innerHTML = '<span class="pra-error">⚠️ 请先选择AI服务商</span>';
      return;
    }

    if (!this.selectedModel) {
      resultBox.innerHTML = '<span class="pra-error">⚠️ 请选择具体的AI模型</span>';
      return;
    }

    if (!question.trim()) {
      resultBox.innerHTML = '<span class="pra-error">⚠️ 请输入你的问题</span>';
      return;
    }

    // 显示加载状态
    this.isLoading = true;
    resultBox.innerHTML = '<span class="pra-loading">🤔 思考中...</span>';
    actionsEl.style.display = 'none';
    providerInfo.textContent = '';

    try {
      // 调用AI问答API
      const response = await chrome.runtime.sendMessage({
        action: 'askQuestion',
        context: context,
        question: question,
        providerId: this.selectedProvider,
        modelId: this.selectedModel
      });

      if (response.success) {
        // 显示结果
        resultBox.innerHTML = `<div class="pra-success">${this.formatMarkdown(response.answer)}</div>`;
        actionsEl.style.display = 'flex';
        
        // 显示提供商和模型信息
        const provider = this.providers.find(p => p.id === this.selectedProvider);
        const modelName = provider?.models?.find(m => m.id === this.selectedModel)?.name || this.selectedModel;
        providerInfo.innerHTML = `<span class="pra-badge">${provider?.name || ''} / ${modelName}</span>`;

        // 添加到历史记录
        this.addToHistory(question, response.answer);
      } else {
        resultBox.innerHTML = `<span class="pra-error">❌ 提问失败: ${response.error || '未知错误'}</span>`;
      }
    } catch (error) {
      resultBox.innerHTML = `<span class="pra-error">❌ 网络错误: ${error.message}</span>`;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 格式化Markdown（简单实现）
   */
  formatMarkdown(text) {
    return text
      // 粗体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 斜体
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // 换行
      .replace(/\n/g, '<br>')
      // 列表项
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // 数字列表
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  }

  /**
   * 显示API设置弹窗
   */
  showSettings() {
    // 创建设置弹窗
    const overlay = document.createElement('div');
    overlay.className = 'pra-modal-overlay';
    overlay.id = 'pra-settings-modal';

    overlay.innerHTML = `
      <div class="pra-modal">
        <div class="pra-modal-header">
          <h3>⚙️ API设置</h3>
          <button class="pra-modal-close" id="pra-modal-close">&times;</button>
        </div>
        <div class="pra-modal-body">
          <div class="pra-settings-intro">
            <p>💡 配置API Key后即可使用对应的AI服务。以下服务均提供免费额度：</p>
          </div>
          
          <div class="pra-provider-list">
            ${this.providers.map(p => `
              <div class="pra-provider-item ${p.hasKey ? 'has-key' : ''}">
                <div class="pra-provider-info">
                  <span class="pra-provider-name">${p.name}</span>
                  <span class="pra-provider-desc">${p.description}</span>
                </div>
                <div class="pra-provider-actions">
                  ${p.hasKey 
                    ? `<span class="pra-key-status">✅ 已配置</span>
                       <button class="pra-clear-key-btn" data-provider="${p.id}">清除</button>`
                    : `<input type="password" class="pra-api-key-input" 
                         placeholder="输入API Key" data-provider="${p.id}">
                       <button class="pra-save-key-btn" data-provider="${p.id}">保存</button>`
                  }
                </div>
                ${p.getApiKeyUrl ? `
                  <a href="${p.getApiKeyUrl}" target="_blank" class="pra-get-key-link">
                    获取免费API Key →
                  </a>
                ` : ''}
              </div>
            `).join('')}
          </div>

          <div class="pra-settings-note">
            <p>🔒 API Key仅存储在本地浏览器中，不会上传到任何服务器</p>
            <p>📌 推荐使用 <strong>Groq</strong>，速度快且免费额度充足</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 绑定弹窗事件
    document.getElementById('pra-modal-close').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // 保存API Key
    overlay.querySelectorAll('.pra-save-key-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.provider;
        const input = overlay.querySelector(`.pra-api-key-input[data-provider="${providerId}"]`);
        const apiKey = input.value.trim();

        if (!apiKey) {
          alert('请输入API Key');
          return;
        }

        btn.textContent = '保存中...';
        btn.disabled = true;

        try {
          const response = await chrome.runtime.sendMessage({
            action: 'setAIApiKey',
            providerId,
            apiKey
          });

          if (response.success) {
            // 更新本地状态
            const provider = this.providers.find(p => p.id === providerId);
            if (provider) provider.hasKey = true;
            
            this.updateAPIStatus();
            overlay.remove();
            this.showSettings(); // 刷新设置界面
          } else {
            alert('保存失败');
          }
        } catch (error) {
          alert('保存失败: ' + error.message);
        } finally {
          btn.textContent = '保存';
          btn.disabled = false;
        }
      });
    });

    // 清除API Key
    overlay.querySelectorAll('.pra-clear-key-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const providerId = btn.dataset.provider;
        
        if (confirm('确定要清除该API Key吗？')) {
          await chrome.runtime.sendMessage({
            action: 'clearAIApiKey',
            providerId
          });

          // 更新本地状态
          const provider = this.providers.find(p => p.id === providerId);
          if (provider) provider.hasKey = false;
          
          this.updateAPIStatus();
          overlay.remove();
          this.showSettings(); // 刷新设置界面
        }
      });
    });
  }

  /**
   * 复制回答结果
   */
  async copyResult() {
    const resultBox = document.getElementById('pra-qa-result');
    const text = resultBox.innerText;

    try {
      await navigator.clipboard.writeText(text);
      
      const copyBtn = document.getElementById('pra-qa-copy');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      alert('复制失败');
    }
  }

  /**
   * 添加到历史记录
   */
  addToHistory(question, answer) {
    const historyList = document.getElementById('pra-qa-history');
    const emptyHistory = historyList.querySelector('.pra-empty-history');
    
    if (emptyHistory) {
      emptyHistory.remove();
    }

    const historyItem = document.createElement('div');
    historyItem.className = 'pra-history-item';
    historyItem.innerHTML = `
      <div class="pra-history-question">Q: ${this.escapeHtml(question)}</div>
      <div class="pra-history-answer">${this.escapeHtml(answer.substring(0, 100))}${answer.length > 100 ? '...' : ''}</div>
    `;

    // 点击历史记录可以恢复问题
    historyItem.addEventListener('click', () => {
      document.getElementById('pra-qa-question').value = question;
      document.getElementById('pra-qa-question').focus();
    });

    historyList.insertBefore(historyItem, historyList.firstChild);

    // 限制历史记录数量
    const items = historyList.querySelectorAll('.pra-history-item');
    if (items.length > 20) {
      items[items.length - 1].remove();
    }
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    if (confirm('确定要清空所有历史对话吗？')) {
      const historyList = document.getElementById('pra-qa-history');
      historyList.innerHTML = '<div class="pra-empty-history">暂无历史对话</div>';
    }
  }

  /**
   * HTML转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 销毁功能
   */
  destroy() {
    // 清理资源
    const modal = document.getElementById('pra-settings-modal');
    if (modal) modal.remove();
  }
}
