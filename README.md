# Paper精读全能助手 Paper Deep Reading Assistant

一款专为科研人员打造的 Edge 浏览器扩展，集成 `文本翻译`、`AI文献解读`、`引用生成`三大核心功能，助力高效阅读与理解学术论文。支持中文、英文（跟随浏览器默认语言）。已经在Edge商店中发布，点击链接可一键安装: https://microsoftedge.microsoft.com/addons/detail/paper%E7%B2%BE%E8%AF%BB%E5%85%A8%E8%83%BD%E5%8A%A9%E6%89%8B/caopenjadgljahlniclfddhnhopaoneo

An Edge browser extension designed for academic researchers, integrating three core features: `text translation`, `AI Q&A`, and `citation generation`, to facilitate efficient reading and understanding of academic papers. Supports Chinese and English (following browser default language). Already in the Edge store: https://microsoftedge.microsoft.com/addons/detail/paper-reading-assistant/caopenjadgljahlniclfddhnhopaoneo

如果喜欢，请给项目点个Star，谢谢！

如果有问题，欢迎联系我的个人邮箱：augustus_wu@126.com

<img src="figures\cover.png">

if you like this project, please give it a star, thanks!

If you have any questions, feel free to contact me at my personal email address: augustus_wu@126.com

<img src="figures\cover-en.png">

---

## <1> 核心功能 Core Features

### 🌐 文本翻译

- 支持多语言互译，自动检测源语言
- 翻译结果自动复制到剪贴板

<img src="figures\text-translation.png">

### 🌐 Text Translation

- Multi-language translation with automatic source language detection
- Automatically copy translation results to clipboard

<img src="figures\text-translation-en.png">

### 🤖 AI文献解读

- 基于论文内容智能问答，深入理解文献
- 支持多种AI服务商（Groq、Hugging Face）
- 多模型选择，满足不同场景需求
- 对话历史保存，便于后续查阅

<img src="figures\AI-QA.png">

### 🤖 AI Q&A

- Intelligent Q&A based on paper content for in-depth understanding
- Support for multiple AI providers (Groq, Hugging Face)
- Multiple model options for different scenarios
- Conversation history saved for future reference

<img src="figures\AI-QA-en.png">

### 📝 引用生成

- 支持7种主流引用格式：APA、MLA、Chicago、Harvard、IEEE、Vancouver、BibTeX
- 一键生成标准引用，快速复制到剪贴板
- 基于Crossref API，自动识别页面DOI

<img src="figures\citation.png">

### 📝 Citation Generation

- Support for 7 mainstream citation formats: APA, MLA, Chicago, Harvard, IEEE, Vancouver, BibTeX
- One-click generation of standard citations with quick copy to clipboard
- Based on Crossref API for automatic DOI detection from web pages

<img src="figures\citation-en.png">

---

## <2> 使用方法 Usage

### 1. 基本操作

1. 点击浏览器工具栏中的扩展图标，打开侧边栏
2. 通过顶部标签切换功能模块
3. 点击左上角的主题切换按钮（🌙/☀️）可在浅色模式和深色模式之间切换

### 1. Basic Operations

1. Click the extension icon in the browser toolbar to open the sidebar
2. Switch between feature modules using the top tabs
3. Click the theme toggle button (🌙/☀️) in the top-left corner to switch between light mode and dark mode

### 2. 文本翻译

1. 选择「翻译」标签
2. 在网页上选中待翻译的文本
3. 点击翻译按钮获取结果

### 2. Text Translation

1. Select the "Translation" tab
2. Select the text to translate on the web page
3. Click the translate button to get the result

### 3. AI文献解读

1. 选择「AI解读」标签
2. 首次使用需配置 API Key（点击设置按钮⚙️）
3. 输入问题，获取基于论文内容的智能回答
4. 支持多轮对话，历史记录自动保存

### 3. AI Q&A

1. Select the "AI Q&A" tab
2. Configure API Key on first use (click the settings button⚙️)
3. Enter your question to get intelligent answers based on paper content
4. Multi-turn dialogue supported with automatic history saving

### 4. 引用生成

1. 选择「引用」标签
2. 选择目标引用格式
3. 点击生成，一键复制到剪贴板

### 4. Citation Generation

1. Select the "Citation" tab
2. Choose the target citation format
3. Click generate and copy to clipboard with one click

### 5. AI服务配置说明 AI Service Configuration

#### Groq（国内需梯子）

1. 访问 [Groq Console](https://console.groq.com/keys)
2. 注册账号并创建 API Key
3. 在扩展设置中选择 Groq 服务商并填入 Key

支持模型：

- Llama 3.3 70B（高性能模型）
- Llama 3.1 8B（轻量快速）
- Qwen3 32B（通义千问）
- GPT-OSS 20B（OpenAI开源）

#### Groq

1. Visit [Groq Console](https://console.groq.com/keys)
2. Register an account and create an API Key
3. Select Groq provider in extension settings and enter the Key

Supported Models:

- Llama 3.3 70B (High performance model)
- Llama 3.1 8B (Lightweight and fast)
- Qwen3 32B (Tongyi Qianwen)
- GPT-OSS 20B (OpenAI open source)

#### Hugging Face（国内需梯子）

1. 访问 [Hugging Face Tokens](https://huggingface.co/settings/tokens)
2. 创建 Access Token
3. 在扩展设置中选择 Hugging Face 服务商并填入 Token

支持模型：

- Qwen 2.5 72B（阿里大模型）
- Llama 3.3 70B（Meta开源）
- DeepSeek V3（DeepSeek大模型）

#### Hugging Face

1. Visit [Hugging Face Tokens](https://huggingface.co/settings/tokens)
2. Create an Access Token
3. Select Hugging Face provider in extension settings and enter the Token

Supported Models:

- Qwen 2.5 72B (Alibaba's large model)
- Llama 3.3 70B (Meta open source)
- DeepSeek V3 (DeepSeek large model)

---

## <3> 安装指南 Installation Guide

### 前置要求

- Edge 浏览器（或 Chromium 内核浏览器）
- AI服务需配置 Groq 或 Hugging Face API Key

### Prerequisites

- Edge browser (or Chromium-based browser)
- Groq or Hugging Face API Key required for AI services

### 安装步骤

1. 下载本项目源码并解压

   ```bash
   git clone https://github.com/JAWu600/Paper-Reading-Assistant.git
   ```
2. 打开 Edge 浏览器，访问 `edge://extensions/`
3. 开启右上角「开发人员模式」
4. 点击「加载解压缩的扩展」，选择项目文件夹
5. 安装完成后，点击扩展图标即可使用

### Installation Steps

1. Download and extract the project source code

   ```bash
   git clone https://github.com/JAWu600/Paper-Reading-Assistant.git
   ```
2. Open Edge browser and navigate to `edge://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the project folder
5. After installation, click the extension icon to start using

---

## <4> 项目结构 Project Structure

```
paper-reading-assistant/
├── manifest.json              # 扩展配置文件 / Extension configuration file
├── background.js              # 后台服务脚本 / Background service script
├── content.js                 # 内容脚本 / Content script
├── content.css                # 内容样式 / Content styles
├── _locales/                  # 国际化语言文件 / Internationalization files
│   ├── zh_CN/                 # 简体中文 / Simplified Chinese
│   │   └── messages.json      # 中文语言包 / Chinese language pack
│   └── en/                    # 英文 / English
│       └── messages.json      # 英文语言包 / English language pack
├── sidebar/                   # 侧边栏模块 / Sidebar module
│   ├── SidebarManager.js      # 侧边栏管理器 / Sidebar manager
│   ├── TabManager.js          # 标签管理器 / Tab manager
│   ├── FeatureRegistry.js     # 功能注册表 / Feature registry
│   ├── sidebar.css            # 侧边栏样式 / Sidebar styles
│   └── features/              # 功能模块 / Feature modules
│       ├── TranslationFeature.js  # 文本翻译 / Text translation
│       ├── QAFeature.js           # AI文献解读 / AI Q&A
│       └── CitationFeature.js     # 引用生成 / Citation generation
├── icons/                     # 图标文件 / Icon files
│   └── icon.png               # 扩展图标 / Extension icon
├── figures/                   # 文档截图 / Documentation screenshots
│   ├── cover.png              # 界面封面 / Interface cover
│   ├── text-translation.png   # 翻译功能截图 / Translation feature screenshot
│   ├── AI-QA.png              # AI问答截图 / AI Q&A screenshot
│   └── citation.png           # 引用功能截图 / Citation feature screenshot
└── README.md                  # 说明文档 / Documentation
```

---

## <5> 补充说明 Additional Information

### 国际化支持

本扩展支持中文和英文两种语言，采用 Chrome 扩展标准的 i18n 国际化方案：

- 默认语言：简体中文 (`zh_CN`)
- 支持语言：
  - 简体中文 (`zh_CN`) - 默认
  - English (`en`)
- 语言文件位置：`_locales/` 目录

扩展会根据浏览器语言设置自动切换界面语言。

### Internationalization Support

This extension supports both Chinese and English languages using the Chrome extension standard i18n internationalization scheme:

- Default language: Simplified Chinese (`zh_CN`)
- Supported languages:
  - Simplified Chinese (`zh_CN`) - Default
  - English (`en`)
- Language files location: `_locales/` directory

The extension automatically switches the interface language based on browser language settings.
