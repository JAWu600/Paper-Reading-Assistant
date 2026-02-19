/**
 * 引用功能 - 使用Crossref API内容协商方案
 * 按需获取引用格式，优化性能和用户体验
 */
export class CitationFeature {
  constructor() {
    this.name = '引用';
    this.doi = null;
    this.metadata = null;
    this.citations = {}; // 缓存已获取的引用格式
  }

  /**
   * 渲染功能UI
   */
  render(container) {
    container.innerHTML = `
      <div class="pra-feature-panel active" data-feature="citation">
        <div class="pra-section-title">📝 引用</div>
        
        <div class="pra-info-text" style="margin-bottom: 12px; color: #666; font-size: 13px;">
          自动识别页面DOI，获取文献信息并生成引用
        </div>

        <button id="pra-citation-fetch-btn" class="pra-btn pra-btn-primary" style="width: 100%;">
          🔍 自动识别并获取文献
        </button>

        <div id="pra-citation-paper-info" style="display: none; margin-top: 16px;">
          <div class="pra-form-group">
            <label class="pra-label">文献标题</label>
            <input 
              type="text" 
              id="pra-citation-title" 
              class="pra-input" 
              readonly
            >
          </div>

          <div class="pra-form-group">
            <label class="pra-label">DOI</label>
            <input 
              type="text" 
              id="pra-citation-doi" 
              class="pra-input" 
              readonly
            >
          </div>

          <div class="pra-form-group">
            <label class="pra-label">引用格式</label>
            <select id="pra-citation-style" class="pra-select">
              <option value="apa">APA格式</option>
              <option value="mla">MLA格式</option>
              <option value="chicago">Chicago格式</option>
              <option value="harvard">Harvard格式</option>
              <option value="ieee">IEEE格式</option>
              <option value="vancouver">Vancouver格式</option>
              <option value="bibtex">BibTeX格式</option>
            </select>
          </div>

          <div id="pra-citation-result-container" style="display: none;">
            <div class="pra-form-group">
              <label class="pra-label">引用结果</label>
              <div id="pra-citation-result" class="pra-result-box">
              </div>
            </div>

            <button 
              id="pra-citation-copy-btn" 
              class="pra-btn pra-btn-secondary" 
              style="width: 100%; margin-top: 12px;"
            >
              📋 复制引用
            </button>

            <div style="margin-top: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666; text-align: center;">
              📚 引用格式由 <a href="https://www.crossref.org" target="_blank" style="color: #1976d2; text-decoration: none;">Crossref</a> 提供
            </div>
          </div>
        </div>

        <div id="pra-citation-error" style="display: none; margin-top: 16px;">
          <div class="pra-error-box"></div>
        </div>
      </div>
    `;

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const fetchBtn = document.getElementById('pra-citation-fetch-btn');
    const styleSelect = document.getElementById('pra-citation-style');
    const copyBtn = document.getElementById('pra-citation-copy-btn');

    if (fetchBtn) {
      fetchBtn.addEventListener('click', () => this.handleFetchPaperInfo());
    }

    if (styleSelect) {
      styleSelect.addEventListener('change', () => this.handleStyleChange());
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.handleCopy());
    }
  }

  /**
   * 自动识别并获取文献信息
   * 优化：只获取当前选中格式的引用，其他格式按需获取
   */
  async handleFetchPaperInfo() {
    const fetchBtn = document.getElementById('pra-citation-fetch-btn');
    const paperInfoDiv = document.getElementById('pra-citation-paper-info');
    const errorDiv = document.getElementById('pra-citation-error');
    const resultContainer = document.getElementById('pra-citation-result-container');

    // 重置UI
    paperInfoDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    resultContainer.style.display = 'none';

    // 清空缓存的引用
    this.citations = {};

    // 显示加载状态
    fetchBtn.disabled = true;
    fetchBtn.textContent = '⏳ 正在识别...';

    try {
      // 第1步：从页面提取DOI
      const doi = this.extractDOI();

      if (!doi) {
        throw new Error('无法从当前页面提取DOI。请确保页面包含文献的DOI信息。');
      }

      this.doi = doi;
      console.log('提取到的DOI:', doi);

      // 第2步：使用DOI从Crossref获取元数据（用于UI显示）
      const metadataResponse = await chrome.runtime.sendMessage({
        action: 'getCitationMetadata',
        doi: doi
      });

      if (metadataResponse.error) {
        throw new Error(metadataResponse.error);
      }

      this.metadata = metadataResponse.data;

      // 显示文献信息
      document.getElementById('pra-citation-title').value = this.metadata.title || '未知标题';
      document.getElementById('pra-citation-doi').value = this.doi;
      paperInfoDiv.style.display = 'block';

      // 第3步：只获取当前下拉框选中的那一个格式（按需加载）
      const currentStyle = document.getElementById('pra-citation-style').value;
      await this.fetchSingleCitation(doi, currentStyle);

      // 显示结果
      this.displayCitation(currentStyle);

    } catch (error) {
      console.error('获取文献信息失败:', error);
      errorDiv.style.display = 'block';
      errorDiv.querySelector('.pra-error-box').textContent = error.message;
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = '🔍 重新识别文献';
    }
  }

  /**
   * 从页面提取DOI
   * 支持多种常见的DOI元数据标签和格式
   */
  extractDOI() {
    // 1. 检查常见的meta标签
    const metaSelectors = [
      'meta[name="citation_doi"]',
      'meta[name="doi"]',
      'meta[name="DC.identifier"]',
      'meta[property="og:url"]',
      'meta[name="prism.doi"]'
    ];

    for (const selector of metaSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const content = element.getAttribute('content') || element.getAttribute('href');
        if (content && this.isValidDOI(content)) {
          return this.cleanDOI(content);
        }
      }
    }

    // 2. 检查页面内容中的DOI（正则表达式匹配）
    const doiPatterns = [
      /10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+/gi,
      /doi\s*[:=]\s*(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi,
      /https?:\/\/dx\.doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi,
      /https?:\/\/doi\.org\/(10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+)/gi
    ];

    const bodyText = document.body.innerText || document.body.textContent;

    for (const pattern of doiPatterns) {
      const matches = bodyText.match(pattern);
      if (matches) {
        const cleanedDOI = this.cleanDOI(matches[0]);
        if (this.isValidDOI(cleanedDOI)) {
          return cleanedDOI;
        }
      }
    }

    // 3. 检查URL中的DOI
    const urlMatch = window.location.href.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+/i);
    if (urlMatch) {
      return urlMatch[0];
    }

    // 4. 检查HighWire Press格式
    const highwireDOI = document.querySelector('meta[name="citation_doi"]');
    if (highwireDOI) {
      return highwireDOI.getAttribute('content');
    }

    // 5. 检查Dublin Core格式
    const dcDOI = document.querySelector('meta[name="DC.identifier"]');
    if (dcDOI) {
      const content = dcDOI.getAttribute('content');
      if (content && content.includes('10.')) {
        const doiMatch = content.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
        if (doiMatch) {
          return doiMatch[0];
        }
      }
    }

    return null;
  }

  /**
   * 验证DOI格式是否有效
   */
  isValidDOI(doi) {
    if (!doi) return false;
    const doiPattern = /^10\.\d{4,9}\/[-._;()/:A-Z0-9<>\[\]{}]+$/i;
    return doiPattern.test(doi);
  }

  /**
   * 清理DOI字符串
   */
  cleanDOI(doi) {
    if (!doi) return '';
    doi = doi.trim();
    
    // 移除常见前缀
    doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    doi = doi.replace(/^doi:\s*/i, '');
    doi = doi.replace(/^DOI:\s*/i, '');
    
    return doi;
  }

  /**
   * 按需获取单个引用格式
   * 如果已经获取过则直接返回缓存
   */
  async fetchSingleCitation(doi, style) {
    // 如果已经获取过，直接返回缓存
    if (this.citations[style]) {
      return this.citations[style];
    }

    const resultBox = document.getElementById('pra-citation-result');
    resultBox.textContent = '⏳ 正在生成引用格式...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getCitation',
        doi: doi,
        style: style
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // 缓存引用（已trim处理）
      this.citations[style] = response.data;
      return this.citations[style];

    } catch (error) {
      console.error(`获取${style}格式引用失败:`, error);
      this.citations[style] = `获取失败: ${error.message}`;
      return this.citations[style];
    }
  }

  /**
   * 显示特定格式的引用
   */
  displayCitation(style) {
    const resultContainer = document.getElementById('pra-citation-result-container');
    const resultBox = document.getElementById('pra-citation-result');

    const citation = this.citations[style];

    if (citation) {
      resultBox.textContent = citation;
    } else {
      resultBox.textContent = '无法获取该格式的引用';
    }

    resultContainer.style.display = 'block';
  }

  /**
   * 格式切换处理（按需加载）
   */
  async handleStyleChange() {
    const style = document.getElementById('pra-citation-style').value;

    // 如果切换到了一个还没抓取的样式，现场抓取
    if (!this.citations[style] && this.doi) {
      await this.fetchSingleCitation(this.doi, style);
    }

    this.displayCitation(style);
  }

  /**
   * 复制引用
   */
  async handleCopy() {
    const resultBox = document.getElementById('pra-citation-result');
    const text = resultBox.textContent;

    if (!text || text.includes('正在生成') || text.includes('获取失败')) {
      alert('请先获取有效的引用内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      const copyBtn = document.getElementById('pra-citation-copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      // 使用降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('已复制到剪贴板');
    }
  }

  /**
   * 销毁功能
   */
  destroy() {
    // 清理资源
    this.citations = {};
  }
}
