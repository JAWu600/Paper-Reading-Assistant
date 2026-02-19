// Background service worker for Paper精读全能助手

// ==================== AI问答服务配置 ====================
/**
 * AI提供商配置 - 支持多API降级策略
 * 便于扩展新的AI服务
 */
// AI提供商配置 - 每个提供商支持多个模型
const AI_PROVIDERS = {
  groq: {
    name: 'Groq（需梯子）',
    priority: 1,
    requiresKey: true,
    enabled: true,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: '高性能模型' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: '轻量快速' },
      { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', description: '通义千问' },
      { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', description: 'OpenAI开源' }
    ],
    defaultModel: 'llama-3.3-70b-versatile',
    description: '高速推理，免费使用',
    getApiKeyUrl: 'https://console.groq.com/keys'
  },
  huggingface: {
    name: 'Hugging Face（需梯子）',
    priority: 2,
    requiresKey: true,
    enabled: true,
    endpoint: 'https://router.huggingface.co/v1/chat/completions',
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', description: '阿里大模型' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: 'Meta开源' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: 'DeepSeek大模型' }
    ],
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    description: '开源模型丰富',
    getApiKeyUrl: 'https://huggingface.co/settings/tokens'
  }
};

// AI服务状态
let aiApiKeys = {};
let currentAIProvider = null;

// AI系统提示词
const AI_SYSTEM_PROMPT = `你是一个专业的学术论文解读助手。你的任务是：
1. 准确理解用户提供的论文内容
2. 用专业但易懂的语言回答问题
3. 引用论文中的具体内容来支持你的回答
4. 如果问题超出论文范围，请诚实告知
5. 回答要简洁明了，突出重点

请始终保持专业、客观的态度。`;

/**
 * AI问答主入口 - 支持指定提供商和模型
 * @param {string} context - 论文上下文
 * @param {string} question - 用户问题
 * @param {Object} options - 选项 { providerId, modelId }
 */
async function askQuestion(context, question, options = {}) {
  const { providerId: selectedProvider, modelId: selectedModel } = options;
  
  // 如果用户指定了提供商和模型，直接使用
  if (selectedProvider && selectedModel && AI_PROVIDERS[selectedProvider]) {
    const config = AI_PROVIDERS[selectedProvider];
    const apiKey = aiApiKeys[selectedProvider];
    
    if (config.requiresKey && !apiKey) {
      return {
        success: false,
        error: `请先在设置中配置 ${config.name} 的 API Key`
      };
    }
    
    try {
      console.log(`使用指定模型: ${config.name} / ${selectedModel}`);
      const result = await callExternalAI(selectedProvider, config, context, question, apiKey, selectedModel);
      currentAIProvider = selectedProvider;
      return result;
    } catch (error) {
      console.error(`${config.name} 调用失败:`, error);
      return {
        success: false,
        error: formatErrorMessage(error, config.name)
      };
    }
  }
  
  // 如果只指定了提供商，使用该提供商的默认模型
  if (selectedProvider && AI_PROVIDERS[selectedProvider]) {
    const config = AI_PROVIDERS[selectedProvider];
    const apiKey = aiApiKeys[selectedProvider];
    
    if (config.requiresKey && !apiKey) {
      return {
        success: false,
        error: `请先在设置中配置 ${config.name} 的 API Key`
      };
    }
    
    try {
      console.log(`使用指定提供商: ${config.name}`);
      const result = await callExternalAI(selectedProvider, config, context, question, apiKey, config.defaultModel);
      currentAIProvider = selectedProvider;
      return result;
    } catch (error) {
      console.error(`${config.name} 调用失败:`, error);
      return {
        success: false,
        error: formatErrorMessage(error, config.name)
      };
    }
  }

  // 未指定提供商，尝试使用已配置的第一个
  const providers = Object.entries(AI_PROVIDERS)
    .filter(([id, config]) => config.enabled && aiApiKeys[id])
    .sort((a, b) => a[1].priority - b[1].priority);

  if (providers.length === 0) {
    return {
      success: false,
      error: '请先在设置中配置至少一个 AI 服务的 API Key'
    };
  }

  // 使用第一个已配置的提供商
  const [providerId, config] = providers[0];
  const apiKey = aiApiKeys[providerId];
  
  try {
    console.log(`使用默认提供商: ${config.name}`);
    const result = await callExternalAI(providerId, config, context, question, apiKey, config.defaultModel);
    currentAIProvider = providerId;
    return result;
  } catch (error) {
    console.error(`${config.name} 调用失败:`, error);
    return {
      success: false,
      error: formatErrorMessage(error, config.name)
    };
  }
}

/**
 * 格式化错误信息
 */
function formatErrorMessage(error, providerName) {
  let errorMessage = error.message;
  if (errorMessage.includes('503')) {
    return `${providerName} 服务繁忙，请稍后重试`;
  } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return `${providerName} API Key 无效或已过期，请检查设置`;
  } else if (errorMessage.includes('404')) {
    return `${providerName} 模型不存在或已下线，请尝试其他模型`;
  } else if (errorMessage.includes('429')) {
    // 尝试解析速率限制信息
    if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return `${providerName} 已达到调用次数上限，请稍后再试或更换其他模型`;
    }
    return `${providerName} 请求过于频繁，请稍后再试`;
  } else if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded')) {
    return `${providerName} 已达到调用次数上限，请稍后再试或更换其他模型`;
  }
  return `${providerName} 调用失败: ${errorMessage}`;
}

/**
 * 调用外部AI API
 */
async function callExternalAI(providerId, config, context, question, apiKey, modelId) {
  const model = modelId || config.defaultModel;
  
  const messages = [
    { role: 'system', content: AI_SYSTEM_PROMPT }
  ];

  if (context && context.trim()) {
    messages.push({
      role: 'user',
      content: `论文内容：\n${context}\n\n问题：${question}`
    });
  } else {
    messages.push({ role: 'user', content: question });
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  // 根据提供商设置认证头
  if (providerId === 'groq') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (providerId === 'huggingface') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model,
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败 (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  
  return {
    success: true,
    answer: data.choices?.[0]?.message?.content || '未能获取回答',
    provider: config.name,
    model: model
  };
}

/**
 * 获取AI提供商配置信息
 */
function getAIProvidersConfig() {
  return Object.entries(AI_PROVIDERS).map(([id, config]) => ({
    id,
    name: config.name,
    priority: config.priority,
    requiresKey: config.requiresKey,
    description: config.description,
    getApiKeyUrl: config.getApiKeyUrl,
    hasKey: !!aiApiKeys[id],
    models: config.models || [],
    defaultModel: config.defaultModel
  }));
}

/**
 * 设置API Key
 */
function setAIApiKey(providerId, apiKey) {
  if (AI_PROVIDERS[providerId]) {
    aiApiKeys[providerId] = apiKey;
    // 持久化存储
    chrome.storage.local.set({ aiApiKeys });
    return true;
  }
  return false;
}

/**
 * 清除API Key
 */
function clearAIApiKey(providerId) {
  delete aiApiKeys[providerId];
  chrome.storage.local.set({ aiApiKeys });
}

// 初始化时加载保存的API Keys
chrome.storage.local.get(['aiApiKeys'], (result) => {
  if (result.aiApiKeys) {
    aiApiKeys = result.aiApiKeys;
  }
});

// ==================== 翻译服务配置 ====================
// 翻译服务配置 - 可扩展的翻译API
const TRANSLATION_SERVICES = {
  google: {
    name: 'Google翻译',
    endpoint: 'https://translate.googleapis.com/translate_a/single'
  },
  bing: {
    name: 'Bing翻译',
    endpoint: 'https://api.cognitive.microsofttranslator.com/translate'
  },
  libre: {
    name: 'LibreTranslate（免费开源）',
    endpoint: 'https://libretranslate.com/translate'
  }
};

/**
 * Google翻译实现
 */
async function googleTranslate(text, from, to) {
  try {
    const url = `${TRANSLATION_SERVICES.google.endpoint}?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google翻译API请求失败: ${response.status}`);
    }

    const data = await response.json();
    // Google翻译返回的数据结构: [[["译文", "原文", ...], ...], ...]
    const translatedText = data[0].map(item => item[0]).join('');

    return { translatedText };
  } catch (error) {
    console.error('Google翻译错误:', error);
    throw error;
  }
}

/**
 * Bing翻译实现（国际版）
 * 注意：需要获取Bing Translator的访问令牌
 */
async function bingTranslate(text, from, to) {
  try {
    // 构建翻译参数
    const params = new URLSearchParams({
      fromLang: from === 'auto' ? 'auto-detect' : from,
      to: to,
      text: text
    });

    const translateUrl = 'https://www.bing.com/ttranslatev3';
    const translateResponse = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!translateResponse.ok) {
      throw new Error(`Bing翻译API请求失败: ${translateResponse.status}`);
    }

    const data = await translateResponse.json();
    const translatedText = data[0].translations[0].text;

    return { translatedText };
  } catch (error) {
    console.error('Bing翻译错误:', error);
    // 如果Bing翻译失败，回退到Google翻译
    console.log('回退到Google翻译');
    return googleTranslate(text, from, to);
  }
}

/**
 * LibreTranslate实现 - 免费开源翻译API
 * 无需API密钥，可直接使用公共实例
 * 适用于国内用户，无需翻墙
 */
async function libreTranslate(text, from, to) {
  try {
    // 构建翻译请求
    const requestBody = {
      q: text,
      source: from === 'auto' ? 'auto' : from,
      target: to,
      format: 'text'
    };

    // 使用LibreTranslate的公共实例
    const translateUrl = 'https://libretranslate.com/translate';
    const translateResponse = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!translateResponse.ok) {
      throw new Error(`LibreTranslate API请求失败: ${translateResponse.status}`);
    }

    const data = await translateResponse.json();

    // LibreTranslate返回的数据结构: { translatedText: "译文" }
    if (!data || !data.translatedText) {
      throw new Error('LibreTranslate返回数据格式错误');
    }

    const translatedText = data.translatedText;

    return { translatedText };
  } catch (error) {
    console.error('LibreTranslate错误:', error);
    // 如果LibreTranslate失败，尝试使用Google翻译
    console.log('回退到Google翻译');
    return googleTranslate(text, from, to);
  }
}

/**
 * 翻译服务路由 - 支持扩展新的翻译API
 */
async function translateText(text, from, to, provider = 'google') {
  switch (provider) {
    case 'google':
      return googleTranslate(text, from, to);
    case 'bing':
      return bingTranslate(text, from, to);
    case 'libre':
      return libreTranslate(text, from, to);
    default:
      throw new Error(`不支持的翻译服务: ${provider}`);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Paper精读全能助手已安装');
});

chrome.action.onClicked.addListener((tab) => {
  // 发送消息到content script来切换侧边栏显示状态
  chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }).catch(() => {
    // 如果content script未加载,则注入它
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  });
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getTranslation') {
    // 调用翻译服务
    const { text, from, to, provider } = request;

    translateText(text, from, to, provider)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));

    return true; // 保持消息通道开启
  } else if (request.action === 'askQuestion') {
    // AI文献解读 - 支持指定提供商和模型
    const options = {
      providerId: request.providerId,
      modelId: request.modelId
    };
    askQuestion(request.context, request.question, options)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (request.action === 'getAIProviders') {
    // 获取AI提供商配置
    sendResponse({ providers: getAIProvidersConfig() });
    return true;
  } else if (request.action === 'setAIApiKey') {
    // 设置API Key
    const success = setAIApiKey(request.providerId, request.apiKey);
    sendResponse({ success });
    return true;
  } else if (request.action === 'clearAIApiKey') {
    // 清除API Key
    clearAIApiKey(request.providerId);
    sendResponse({ success: true });
    return true;
  } else if (request.action === 'getCitationMetadata') {
    // 使用DOI从Crossref获取文献元数据（用于UI显示标题等）
    getCitationMetadata(request.doi)
      .then(result => sendResponse({ data: result }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === 'getCitation') {
    // 按需获取单个引用格式（按需加载，避免一次性请求过多）
    getCitation(request.doi, request.style)
      .then(result => sendResponse({ data: result }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

/**
 * Crossref API配置
 * Crossref是全球最大的DOI注册机构，提供稳定的文献元数据服务
 */
const CROSSREF_API = {
  baseUrl: 'https://api.crossref.org',
  // 请求缓存，避免重复请求
  cache: new Map(),
  // 最小请求间隔（毫秒）- Crossref限制每秒1次请求
  minRequestInterval: 1000,
  lastRequestTime: 0
};

/**
 * 支持的引用格式列表
 * 使用Crossref内容协商支持的样式名称
 * 参考: https://api.crossref.org/swagger-ui/index.html
 */
const CITATION_STYLES = {
  apa: { name: 'APA格式', accept: 'text/bibliography; style=apa' },
  mla: { name: 'MLA格式', accept: 'text/bibliography; style=modern-language-association' },
  chicago: { name: 'Chicago格式', accept: 'text/bibliography; style=chicago-author-date' },
  harvard: { name: 'Harvard格式', accept: 'text/bibliography; style=harvard-cite-them-right' },
  ieee: { name: 'IEEE格式', accept: 'text/bibliography; style=ieee' },
  vancouver: { name: 'Vancouver格式', accept: 'text/bibliography; style=vancouver' },
  bibtex: { name: 'BibTeX格式', accept: 'application/x-bibtex' }
};

/**
 * 控制请求速率的辅助函数（适用于Crossref API）
 */
async function rateLimitedFetch(url, options = {}) {
  // 检查缓存
  const cacheKey = url + JSON.stringify(options);
  if (CROSSREF_API.cache.has(cacheKey)) {
    const cached = CROSSREF_API.cache.get(cacheKey);
    // 缓存有效期10分钟
    if (Date.now() - cached.timestamp < 10 * 60 * 1000) {
      console.log('使用缓存的Crossref API响应');
      return cached.response;
    } else {
      CROSSREF_API.cache.delete(cacheKey);
    }
  }

  // 控制请求速率
  const now = Date.now();
  const timeSinceLastRequest = now - CROSSREF_API.lastRequestTime;
  
  if (timeSinceLastRequest < CROSSREF_API.minRequestInterval) {
    const waitTime = CROSSREF_API.minRequestInterval - timeSinceLastRequest;
    console.log(`等待${waitTime}ms以遵守Crossref API速率限制`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  CROSSREF_API.lastRequestTime = Date.now();

  // 添加User-Agent头（Crossref要求）
  const headers = {
    'User-Agent': 'PaperReadingAssistant/1.0 (https://github.com/yourusername/paper-reading-assistant; mailto:your@email.com)',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // 执行请求
  const response = await fetch(url, { ...options, headers });

  // 缓存成功的响应
  if (response.ok) {
    CROSSREF_API.cache.set(cacheKey, {
      response: response.clone(),
      timestamp: Date.now()
    });
  }

  return response;
}

/**
 * 使用DOI从Crossref API获取文献元数据
 * 返回符合citation.js标准的CSL-JSON格式
 */
async function getCitationMetadata(doi) {
  try {
    // 验证DOI
    if (!doi) {
      throw new Error('DOI不能为空');
    }

    // 清理DOI中的常见前缀
    let cleanDOI = doi.trim();
    if (cleanDOI.startsWith('http')) {
      const doiMatch = cleanDOI.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
      if (doiMatch) {
        cleanDOI = doiMatch[0];
      }
    } else if (cleanDOI.startsWith('doi:')) {
      cleanDOI = cleanDOI.substring(4).trim();
    } else if (cleanDOI.startsWith('DOI:')) {
      cleanDOI = cleanDOI.substring(4).trim();
    }

    console.log('请求的DOI:', cleanDOI);

    // 构建URL - 保留斜杠不编码
    const encodedDOI = cleanDOI.replace(/[^A-Za-z0-9._~:/-]/g, (char) => {
      if (char === '/') {
        return '/';
      }
      return encodeURIComponent(char);
    });

    const url = `${CROSSREF_API.baseUrl}/works/${encodedDOI}`;
    console.log('请求URL:', url);

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Crossref API错误响应:', errorText);

      if (response.status === 404) {
        throw new Error(`未找到该文献: ${cleanDOI}`);
      } else if (response.status === 429) {
        throw new Error('Crossref API请求过于频繁，请稍后再试');
      } else if (response.status === 400) {
        throw new Error(`请求参数错误。DOI格式不正确: ${cleanDOI}`);
      }
      throw new Error(`获取文献元数据失败 (${response.status})`);
    }

    const data = await response.json();
    const item = data.message;

    if (!item) {
      throw new Error('返回的文献数据为空');
    }

    // 转换为CSL-JSON格式（citation.js标准格式）
    const cslJson = convertCrossrefToCSL(item);
    return cslJson;
  } catch (error) {
    console.error('获取文献元数据失败:', error);
    throw error;
  }
}

/**
 * 将Crossref数据转换为CSL-JSON格式
 */
function convertCrossrefToCSL(crossrefItem) {
  // 提取年份
  let year = null;
  if (crossrefItem.published?.date) {
    year = crossrefItem.published.date[0]?.year;
  } else if (crossrefItem.publishedPrint?.date) {
    year = crossrefItem.publishedPrint.date[0]?.year;
  } else if (crossrefItem.issued?.date) {
    year = crossrefItem.issued.date[0]?.year;
  } else if (crossrefItem.deposited?.['date-parts']) {
    year = crossrefItem.deposited['date-parts']?.[0]?.[0];
  }

  // 转换作者
  const authors = (crossrefItem.author || []).map(author => ({
    given: author.given || '',
    family: author.family || ''
  }));

  // 确定文献类型
  const type = crossrefItem.type || 'article-journal';

  // 构建CSL-JSON对象
  const cslJson = {
    id: crossrefItem.DOI || '',
    type: type,
    title: crossrefItem.title?.[0] || '',
    author: authors,
    issued: year ? { 'date-parts': [[year]] } : undefined,
    'container-title': crossrefItem['container-title']?.[0] || '',
    volume: crossrefItem.volume || '',
    issue: crossrefItem.issue || '',
    page: crossrefItem.page || '',
    publisher: crossrefItem.publisher || '',
    DOI: crossrefItem.DOI || '',
    URL: crossrefItem.URL || ''
  };

  // 移除undefined值
  Object.keys(cslJson).forEach(key => {
    if (cslJson[key] === undefined || cslJson[key] === '') {
      delete cslJson[key];
    }
  });

  return cslJson;
}

/**
 * 按需获取单个引用格式
 * 使用Crossref内容协商(Content Negotiation)直接获取格式化引用
 * 按需加载，避免一次性请求过多格式
 */
async function getCitation(doi, style) {
  try {
    // 获取样式配置
    const styleConfig = CITATION_STYLES[style];
    if (!styleConfig) {
      throw new Error(`不支持的引用格式: ${style}`);
    }

    // 清理DOI
    let cleanDOI = doi.trim();
    if (cleanDOI.startsWith('http')) {
      const doiMatch = cleanDOI.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
      if (doiMatch) {
        cleanDOI = doiMatch[0];
      }
    }

    // 构建URL - 使用 https://doi.org/ 进行内容协商
    // 这是Crossref推荐的DOI解析服务
    const url = `https://doi.org/${encodeURIComponent(cleanDOI)}`;
    console.log(`请求${style}格式引用:`, url);

    // 控制请求速率（遵守Crossref API限制）
    const now = Date.now();
    const timeSinceLastRequest = now - CROSSREF_API.lastRequestTime;
    if (timeSinceLastRequest < CROSSREF_API.minRequestInterval) {
      const waitTime = CROSSREF_API.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    CROSSREF_API.lastRequestTime = Date.now();

    // 发送请求，使用Accept头指定格式
    const response = await fetch(url, {
      headers: {
        'Accept': styleConfig.accept,
        'User-Agent': 'PaperReadingAssistant/1.0 (mailto:your@email.com)'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`未找到该DOI，请检查DOI是否有效`);
      } else if (response.status === 406) {
        throw new Error(`Crossref不支持该引用格式: ${styleConfig.name}`);
      }
      throw new Error(`引用获取失败 (${response.status})，请稍后重试`);
    }

    // 获取格式化引用文本，并清理空白字符
    const citationText = await response.text();
    return citationText.trim();
  } catch (error) {
    console.error(`获取${style}格式引用失败:`, error);
    throw error;
  }
}
