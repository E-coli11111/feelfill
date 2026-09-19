# FillFeel Chrome Extension

一个基于 WXT、React、TypeScript 和 Manifest V3 的浏览器扩展模板。

## 开始开发

```bash
npm install
npm run dev
```

WXT 会启动带有扩展的浏览器。也可以在 `chrome://extensions` 开启“开发者模式”，选择“加载已解压的扩展程序”，加载 `.output/chrome-mv3`。

## 侧边栏使用

点击“自定义要求”展开可选的补充要求输入框；再次点击可收起，已填写的内容会保留并用于本次解析。关闭扩展开关后内容清空，输入区恢复收起状态。

侧边栏与设置页采用统一的暖白、松绿色主题，包含一致的卡片、表单、焦点和状态提示样式。关闭扩展时显示使用引导；共享主题定义在 `src/styles/theme.css`，不会注入宿主网页。

在 Chrome 中点击扩展图标会打开 FeelFill 侧边栏；Firefox 使用浏览器原生的扩展侧栏入口。使用“开启 FeelFill”开关启用或关闭，状态自动保存。开启后可选择 PDF、Word 或 JPG/PNG 文件，侧边栏会使用附件卡片显示所选文件名；确认文件后点击“解析并填充”，才会向当前网页发起字段识别、文档解析和自动填充。关闭开关或关闭侧边栏后需重新选择文件。

点击底部“打开设置”进入扩展设置页。设置页左侧包含“鉴权”和“模型”：鉴权页可选择 OpenAI OAuth 浏览器登录或设备码登录，模型页只展示当前已登录方式支持的模型，并保存用于字段识别和文档提取的默认模型。Side Panel 和 Options UI 使用 shadcn/ui 组件与 Tailwind CSS 4；Side Panel 宽度跟随浏览器侧栏。

统一的 `OpenAICodexOAuth` Adapter 支持 Codex 浏览器 Authorization Code + PKCE 流程。它打开独立登录标签页，捕获并校验 `http://localhost:1455/auth/callback` 回调后交换、校验并保存 Token。

模型参数与认证凭据分开保存。Provider ID 只表示服务商，LLM 服务会按 `provider + auth_method` 找到认证 Adapter 和具体模型实现：例如 `openai + api-key` 使用 OpenAI Platform，`openai + oauth` 使用 Codex Responses。缺少、损坏或不支持的认证组合会在调用模型前给出明确错误。

## 常用命令

- `npm run dev`：Chrome 开发模式
- `npm run build`：生成 Chrome 生产构建
- `npm run compile`：TypeScript 类型检查
- `npm run zip`：生成用于发布的 zip 包
- `npm run dev:firefox` / `build:firefox`：Firefox 版本

## 目录

- `entrypoints/sidepanel`：浏览器侧边栏 React 入口
- `entrypoints/options`：扩展设置页
- `entrypoints/content`：通过 Shadow DOM 注入网页的 React UI
- `entrypoints/background.ts`：Manifest V3 后台 Service Worker
- `wxt.config.ts`：扩展名称、权限和 WXT 配置

WXT 会根据入口和配置自动生成 `manifest.json`，构建产物位于 `.output/`。
