# FillFeel Chrome Extension

一个基于 WXT、React、TypeScript 和 Manifest V3 的浏览器扩展模板。

## 开始开发

```bash
npm install
npm run dev
```

WXT 会启动带有扩展的浏览器。也可以在 `chrome://extensions` 开启“开发者模式”，选择“加载已解压的扩展程序”，加载 `.output/chrome-mv3`。

## Popup 使用

点击扩展图标打开 FeelFill 弹窗，使用“开启 FeelFill”开关启用或关闭，状态自动保存。开启后可选择 PDF、Word 或 JPG/PNG 文件，弹窗会使用附件卡片显示所选文件名；关闭开关或关闭弹窗后需重新选择文件。当前仅实现文件选择 UI，尚未接入文件解析与网页填充。

点击底部“打开设置”进入扩展设置页。设置页左侧包含“鉴权”和“模型”：鉴权页可选择 OpenAI OAuth 浏览器登录或设备码登录，模型页只展示当前已登录方式支持的模型，并保存用于字段识别和文档提取的默认模型。Popup 和 Options UI 使用 shadcn/ui 组件与 Tailwind CSS 4；弹窗默认宽度为 360px，窄视口下自动收缩。

统一的 `OpenAICodexOAuth` Adapter 支持 Codex 浏览器 Authorization Code + PKCE 流程。它打开独立登录标签页，捕获并校验 `http://localhost:1455/auth/callback` 回调后交换、校验并保存 Token。

模型参数与认证凭据分开保存。Provider ID 只表示服务商，LLM 服务会按 `provider + auth_method` 找到认证 Adapter 和具体模型实现：例如 `openai + api-key` 使用 OpenAI Platform，`openai + oauth` 使用 Codex Responses。缺少、损坏或不支持的认证组合会在调用模型前给出明确错误。

## 常用命令

- `npm run dev`：Chrome 开发模式
- `npm run build`：生成 Chrome 生产构建
- `npm run compile`：TypeScript 类型检查
- `npm run zip`：生成用于发布的 zip 包
- `npm run dev:firefox` / `build:firefox`：Firefox 版本

## 目录

- `entrypoints/popup`：点击工具栏图标后的 React 弹窗
- `entrypoints/options`：扩展设置页
- `entrypoints/content`：通过 Shadow DOM 注入网页的 React UI
- `entrypoints/background.ts`：Manifest V3 后台 Service Worker
- `wxt.config.ts`：扩展名称、权限和 WXT 配置

WXT 会根据入口和配置自动生成 `manifest.json`，构建产物位于 `.output/`。
