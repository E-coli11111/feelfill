# FillFeel Chrome Extension

一个基于 WXT、React、TypeScript 和 Manifest V3 的浏览器扩展模板。

## 开始开发

```bash
npm install
npm run dev
```

WXT 会启动带有扩展的浏览器。也可以在 `chrome://extensions` 开启“开发者模式”，选择“加载已解压的扩展程序”，加载 `.output/chrome-mv3`。

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
