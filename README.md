# FillFeel Chrome Extension

一个基于 WXT、React、TypeScript 和 Manifest V3 的浏览器扩展模板。

## 开始开发

```bash
npm install
npm run dev
```

WXT 会启动带有扩展的浏览器。也可以在 `chrome://extensions` 开启“开发者模式”，选择“加载已解压的扩展程序”，加载 `.output/chrome-mv3`。

## Popup 使用

点击扩展图标打开 FeelFill 弹窗，使用“开启 FeelFill”开关启用或关闭，状态自动保存。开启后可选择 PDF、Word 或 JPG/PNG 文件，弹窗会显示所选文件名；关闭开关或关闭弹窗后需重新选择文件。当前仅实现文件选择 UI，尚未接入文件解析与网页填充。

点击底部“打开设置”进入扩展设置页。弹窗默认宽度为 360px，窄视口下自动收缩，长文件名自动换行。

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
