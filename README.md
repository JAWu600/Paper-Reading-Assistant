# Paper精读全能助手

一款专为学术研究者打造的 Edge 浏览器扩展，集成文本翻译、AI文献解读、引用生成三大核心功能，助力高效阅读与理解学术论文。

<img src="figures\cover.png" alt="Paper精读全能助手 界面">

## 核心功能

### 🌐 文本翻译
- 支持多语言互译，自动检测源语言
- 支持翻译结果朗读，提升阅读效率
- 翻译历史记录，方便回顾查阅

<img src="figures\text-translation.png" alt="文本翻译功能">

### 🤖 AI文献解读
- 基于论文内容智能问答，深入理解文献
- 支持多种AI服务商（Groq、Hugging Face）
- 多模型选择，满足不同场景需求
- 对话历史保存，便于后续查阅

<img src="figures\AI-QA.png" alt="AI文献解读功能">

### 📝 引用生成
- 支持7种主流引用格式：APA、MLA、Chicago、Harvard、IEEE、Vancouver、BibTeX
- 一键生成标准引用，快速复制到剪贴板
- 基于Crossref API，自动识别页面DOI

<img src="figures\citation.png" alt="引用生成功能">

## 安装指南

### 前置要求
- Edge 浏览器（或 Chromium 内核浏览器）
- AI服务需配置 Groq 或 Hugging Face API Key

### 安装步骤

1. 下载本项目源码并解压
   ```bash
   git clone https://github.com/your-username/paper-reading-assistant.git
   ```

2. 打开 Edge 浏览器，访问 `edge://extensions/`

3. 开启右上角「开发人员模式」

4. 点击「加载解压缩的扩展」，选择项目文件夹

5. 安装完成后，点击扩展图标即可使用

## 配置说明

### AI 服务配置

#### Groq（需梯子）
1. 访问 [Groq Console](https://console.groq.com/keys)
2. 注册账号并创建 API Key
3. 在扩展设置中选择 Groq 服务商并填入 Key

支持模型：
- Llama 3.3 70B（高性能模型）
- Llama 3.1 8B（轻量快速）
- Qwen3 32B（通义千问）
- GPT-OSS 20B（OpenAI开源）

#### Hugging Face（需梯子）
1. 访问 [Hugging Face Tokens](https://huggingface.co/settings/tokens)
2. 创建 Access Token
3. 在扩展设置中选择 Hugging Face 服务商并填入 Token

支持模型：
- Qwen 2.5 72B（阿里大模型）
- Llama 3.3 70B（Meta开源）
- DeepSeek V3（DeepSeek大模型）

## 使用方法

### 基本操作
1. 点击浏览器工具栏中的扩展图标，打开侧边栏
2. 通过顶部标签切换功能模块

### 文本翻译
1. 选择「翻译」标签
2. 在网页上选中待翻译的文本
3. 点击翻译按钮获取结果

### AI文献解读
1. 选择「AI解读」标签
2. 首次使用需配置 API Key（点击设置按钮）
3. 输入问题，获取基于论文内容的智能回答
4. 支持多轮对话，历史记录自动保存

### 引用生成
1. 选择「引用」标签
2. 选择目标引用格式
3. 点击生成，一键复制到剪贴板

## 项目结构

```
paper-reading-assistant/
├── manifest.json              # 扩展配置文件
├── background.js              # 后台服务脚本
├── content.js                 # 内容脚本
├── content.css                # 内容样式
├── _locales/                  # 国际化语言文件
│   └── zh_CN/                 # 简体中文
│       └── messages.json      # 中文语言包
├── sidebar/                   # 侧边栏模块
│   ├── SidebarManager.js      # 侧边栏管理器
│   ├── TabManager.js          # 标签管理器
│   ├── FeatureRegistry.js     # 功能注册表
│   ├── sidebar.css            # 侧边栏样式
│   └── features/              # 功能模块
│       ├── TranslationFeature.js  # 文本翻译
│       ├── QAFeature.js           # AI文献解读
│       └── CitationFeature.js     # 引用生成
├── icons/                     # 图标文件
│   └── icon.png               # 扩展图标 (128x128)
├── figures/                   # 文档截图
│   ├── cover.png              # 界面封面
│   ├── text-translation.png   # 翻译功能截图
│   ├── AI-QA.png              # AI问答截图
│   └── citation.png           # 引用功能截图
└── README.md                  # 说明文档
```

## 补充内容

### 国际化支持

本扩展已支持中文语言包，采用 Chrome 扩展标准的 i18n 国际化方案：

- 默认语言：简体中文 (`zh_CN`)
- 语言文件位置：`_locales/zh_CN/messages.json`

如需添加其他语言支持，只需创建对应语言目录和 `messages.json` 文件，例如：
- `_locales/en/messages.json` - 英文
- `_locales/zh_TW/messages.json` - 繁体中文