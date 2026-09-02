# AGENTS.md

本文件为在本仓库中工作的开发者与 AI 编码代理提供项目上下文和操作约定。其作用域覆盖仓库根目录及所有子目录；若某个子目录以后出现更具体的 `AGENTS.md`，则该文件对其所在子树具有更高优先级。

## 项目概览

- 项目名称：FeelFill（npm 包名当前为 `feelfill`）
- 项目类型：Chrome / Firefox 浏览器扩展
- 扩展规范：Manifest V3（由 WXT 根据入口和配置自动生成）
- 主要语言：TypeScript、TSX、CSS
- UI 框架：React 19
- 扩展框架：WXT 0.21
- 样式方案：Tailwind CSS 4，通过 `@tailwindcss/vite` 接入
- 包管理器：npm，锁文件为 `package-lock.json`

## 设计目标

- 获取网页中可编辑的输入框以及要求填入的内容，读取用户提供文件的内容，自动填充到网页中。

## 项目结构

```text
fillfeel/
├─ entrypoints/
│  ├─ background.ts          # MV3 后台 Service Worker
│  ├─ popup/
│  │  ├─ index.html          # 工具栏弹窗 HTML 入口
│  │  ├─ main.tsx            # Popup React 挂载入口
│  │  ├─ App.tsx             # Popup UI 与状态逻辑
│  │  └─ style.css           # Popup Tailwind/CSS 入口
│  ├─ options/
│  │  ├─ index.html          # 设置页 HTML 入口
│  │  ├─ main.tsx            # Options React 应用与逻辑
│  │  └─ style.css           # Options Tailwind/CSS 入口
│  └─ content/
│     ├─ index.tsx           # Content Script 与 Shadow DOM 挂载逻辑
│     ├─ App.tsx             # 注入网页的 React UI
│     └─ style.css           # Shadow Root 内的 Tailwind/CSS 入口
├─ src/                      # 非入口源码与跨入口共享模块
│  ├─ components/            # Popup、Options、Content 等可复用 React 组件
│  ├─ hooks/                 # 可复用 React Hooks
│  ├─ types/                 # 消息、存储及业务 TypeScript 类型
│  ├─ utils/                 # 无状态、无副作用的通用工具函数
│  ├─ services/              # browser API、存储、消息及远程请求封装
│  └─ constants/             # 共享常量和默认值
├─ wxt.config.ts             # WXT、Vite/Tailwind、扩展 Manifest 配置
├─ tsconfig.json             # TypeScript 严格模式；继承 WXT 生成配置
├─ package.json              # 脚本与依赖
├─ package-lock.json         # npm 锁文件
├─ README.md                 # 面向使用者的开发说明
├─ .env / .env.sh            # 本地环境文件；不得提交或泄露内容
├─ .wxt/                     # WXT 生成的类型和临时配置；不得手工编辑
└─ .output/                  # 构建产物；不得手工编辑
```

## 入口与运行机制

### Background

`entrypoints/background.ts`：

- 扩展首次安装时将 `enabled` 写入 `browser.storage.local`。
- 监听 `{ type: 'PING' }` 消息，用于验证 Popup 与后台的连接。
- Background 是 Manifest V3 Service Worker；不要依赖长期驻留的内存状态。

### Popup

`entrypoints/popup/`：

- 读取并切换 `browser.storage.local.enabled`。
- 通过 runtime message 检查 Background 是否可用。
- 可以打开扩展的 Options 页面。
- Popup 关闭后 React 内存状态会丢失；需要持久化的状态应放入扩展存储。

### Options

`entrypoints/options/`：

- 提供 `enabled` 设置并保存到 `browser.storage.local`。
- 目前与 Popup 使用同一存储字段。

### Content Script

`entrypoints/content/`：

- 匹配 `http://*/*` 和 `https://*/*`。
- 使用 `createShadowRootUi` 将 React UI 注入网页。
- 必须保留 `cssInjectionMode: 'ui'`，使样式注入 Shadow Root。
- 监听 `browser.storage.onChanged`，根据 `enabled` 动态挂载或移除 UI。
- 避免让扩展 CSS、事件或 DOM 选择器污染宿主网页。

## 样式约定

- Tailwind CSS 通过 `wxt.config.ts` 中的 `@tailwindcss/vite` 插件启用。
- Popup、Options 和 Content Script 是三个独立构建入口，因此当前各自保留一个 `style.css`。
- 每个入口样式文件通过 `@import "tailwindcss";` 引入 Tailwind。
- 新 UI 优先使用 Tailwind utility class；仅在 utility class 不合适时增加局部 CSS。
- Content Script 位于 Shadow DOM 中。其 `rem` 单位仍可能受到宿主网页根字体大小影响；尺寸必须稳定时优先使用明确的像素任意值，如 `w-[48px]`。
- 不要为了共享少量样式而破坏 Content Script 的 Shadow DOM 样式隔离。

## 常用命令

```bash
npm install
npm run dev
npm run dev:firefox
npm run compile
npm run build
npm run build:firefox
npm run zip
npm run zip:firefox
```

- 开发 Chrome 扩展：`npm run dev`
- TypeScript 检查：`npm run compile`
- Chrome 生产构建：`npm run build`
- 发布前打包：`npm run zip`
- 安装依赖后，`postinstall` 会执行 `wxt prepare` 并生成 `.wxt/`。

## 修改与验证规则

- 修改 TypeScript、TSX、WXT 配置或依赖后，至少运行：

  ```bash
  npm run compile
  npm run build
  ```

- 修改 Content Script UI 后，应在普通 HTTP/HTTPS 页面上人工检查：挂载、开关、Shadow DOM 样式隔离及控制台错误。
- 修改 Popup 或 Options 后，应分别在扩展环境中打开并检查，不能只按普通网页测试。
- 修改存储字段时，应同步检查 Background、Popup、Options 和 Content Script 的所有读写位置。
- 修改 `permissions`、`host_permissions` 或匹配范围时，应说明原因，并遵循最小权限原则。
- 不要手工修改 `.wxt/`、`.output/` 或 `node_modules/`。
- 不要读取、输出、提交或覆盖 `.env`、`.env.sh` 中的秘密信息。
- 不要无理由更换包管理器或删除 `package-lock.json`。

## 编码约定

- 保持 TypeScript `strict` 模式，不用 `any` 绕过类型检查。
- React 使用函数组件和 Hooks。
- `src/` 用于存放非入口源码及跨入口共享代码；WXT 入口及其启动、挂载逻辑仍放在 `entrypoints/`。
- 被两个或更多入口复用的代码应放在 `src/`；只服务于单个入口的组件、Hooks 或辅助代码应就近放在对应的 `entrypoints/<name>/` 下。
- 共享 React 组件放在 `src/components/`，共享 Hooks 放在 `src/hooks/`，共享类型放在 `src/types/`，纯工具函数放在 `src/utils/`。
- `src/utils/` 应优先保持无状态和无副作用；涉及 `browser.*`、扩展存储、消息通信或远程请求的封装放在 `src/services/`。
- Content Script 的组件运行于 Shadow DOM。提取共享组件时，不得依赖 Popup 或 Options 的页面结构和入口私有样式。
- 从入口引用共享模块时优先使用 WXT 已配置的根路径别名，例如 `@/src/types/messages`；不要手工修改 `.wxt/tsconfig.json`。
- 仅导入 TypeScript 类型时使用 `import type`。
- 异步扩展 API 调用应明确处理 Promise；不等待结果时使用 `void` 表达意图。
- 浏览器扩展 API 使用 WXT 提供的 `browser` 接口。
- 入口运行时代码应放在 `defineBackground`、`defineContentScript` 等入口函数内部，避免构建时访问浏览器专属全局对象。
- 消息负载应具有明确且稳定的 `type` 字段。新增复杂消息时，应先定义共享的 TypeScript 类型。
- 用户可见文案目前以中文为主；新增文案保持同一语言，除非已经引入国际化方案。
- 尽量保持变更小而聚焦，不顺带重构与当前任务无关的代码。

### 注释
- 所有 export 的函数、类、类型和常量应有 JSDoc 注释（除了react默认组件如APP，WXT 入口函数、配置函数，等框架规范的常见的函数）。
- 在代码内部逻辑复杂或容易误解的地方，应添加行内注释。
- 所有注释必须使用英文注释

## 生成物与版本控制

以下内容不应提交：

- `node_modules/`
- `.wxt/`
- `.output/`
- 构建生成的 `*.zip`
- `.env` 和其他本地环境变量文件

应提交：

- 源码和配置
- `package.json`
- `package-lock.json`
- 与行为变化对应的文档
