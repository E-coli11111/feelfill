# AGENTS.md

本文件为在本仓库中工作的开发者与 AI 编码代理提供项目上下文和操作约定，作用域覆盖仓库根目录及所有子目录。若子目录存在更具体的 `AGENTS.md`，以子目录文件为准。

代码、`package.json` 和 WXT 配置是实现状态的最终依据。本文件中的“当前实现”和“已知缺口”必须随相关代码变更同步更新，不要保留已经失效的描述。

## 项目概览

- 项目名称：FeelFill，npm 包名为 `feelfill`。
- 项目类型：Chrome / Firefox 浏览器扩展。
- 当前阶段：功能原型；字段识别、文件解析、消息协议和页面填充链路尚未完整贯通。
- 扩展规范：Manifest V3（由 WXT 根据入口和配置自动生成）
- 主要语言：TypeScript、TSX、CSS。
- UI 框架：React 19。
- 扩展框架：WXT 0.21。
- 样式方案：Tailwind CSS 4，通过 `@tailwindcss/vite` 接入
- LLM 集成：LangChain；依赖中包含 Zod，但当前代码尚未使用。
- 包管理器：npm；必须保留并同步更新 `package-lock.json`。

## 设计目标

- 获取网页中可编辑的输入框以及要求填入的内容，读取用户提供文件的内容，自动填充到网页中。

## 项目结构

```text
feelfill/
├─ entrypoints/
│  ├─ types.ts               # 扩展入口之间共享的消息类型
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
│     ├─ index.tsx           # 当前只注册消息监听器
│     ├─ App.tsx             # 已存在但尚未由 Content Script 挂载
│     └─ style.css
├─ src/
│  ├─ components/            # 所有 React 组件；按功能子目录组织
│  ├─ hooks/                 # react hooks；按功能子目录组织
│  ├─ services/llm/          # LLM 调用、Provider 创建、Prompt 构建和该包导出的类型
│  ├─ utils/                 # 当前包含文件 Base64 转换
│  └─ constants.ts           # 当前为空
├─ wxt.config.ts             # WXT、Vite/Tailwind、扩展 Manifest 配置
├─ tsconfig.json             # TypeScript 严格模式；继承 WXT 生成配置
├─ package.json              # 脚本与依赖
├─ package-lock.json         # npm 锁文件
├─ README.md                 # 面向使用者的开发说明
├─ .env / .env.sh            # 本地环境文件；不得提交或泄露内容
├─ .wxt/                     # WXT 生成的类型和临时配置；不得手工编辑
└─ .output/                  # 构建产物；不得手工编辑
```

创建新目录时遵循以下职责：

- 核心复杂 React 组件放在 `src/components/`按照功能子目录组织.
- 所有可复用 React hooks 放在 `src/hooks/` ，不可复用的 hooks 放在对应的组件目录下 `hooks.ts`。
- 每个功能包对外导出的类型统一声明在该包目录下的 `types.ts` 中；仅在单个文件内部使用的类型就近声明，不创建全局类型目录。
- 无状态、无副作用的纯函数放在 `src/utils/`。
- 涉及 `browser.*`、存储、消息或远程请求的代码放在 `src/service/`；当前目录名是单数 `service`，不要同时创建 `src/services/`。
- 只服务于单个入口的组件或辅助代码放在对应的 `entrypoints/<name>/` 附近。
- WXT 入口的启动、注册和挂载逻辑保留在 `entrypoints/`。

## 入口与运行机制

### Background

`entrypoints/background.ts`：

- 扩展首次安装时将 `enabled` 写入 `browser.storage.local`。
- `LOCATE` 消息调用 `parseHTMLField`，并返回模型消息的文本。
- `FILL` 消息调用 `parseDocumentField`，但仍返回“暂未实现填充功能”。
- `SET` 分支尚未实现。
- 当前没有处理 `PING` 消息；Popup 不再发送该消息。
- Background 是 Manifest V3 Service Worker；不要依赖长期驻留的内存状态。

### Popup

`entrypoints/popup/`：

- 读取并切换 `browser.storage.local.enabled`。
- 使用 shadcn/ui 默认浅色主题和卡片布局，默认宽度 360px，窄视口收缩；开启后显示文件选择框和已选附件卡片。
- 开关读取与保存期间禁用操作，失败时显示提示；通过 `browser.runtime.openOptionsPage()` 打开设置。
- 选择文件后显示文件名，仅保存在当前 Popup 内存中，关闭开关时清空；尚未接入解析与填充，不发送文件或页面消息。
- Popup 关闭后 React 内存状态会丢失；需要持久化的状态应放入扩展存储。

### Options

`entrypoints/options/`：

- 使用 shadcn/ui Sidebar 提供可折叠的左侧设置导航，当前仅包含“鉴权”入口。
- 鉴权页通过 `AuthPanel` 枚举已注册的认证面板，读取对应认证 Adapter 的凭据并显示登录状态；选择登录后渲染具体面板并注入 provider 与 `authorizeMethod`。当前只提供 OpenAI OAuth 设备码面板。
- OpenAI OAuth Adapter 负责获取设备码、通知 UI 展示、轮询授权、交换 Token 和持久化凭据；设备码面板通过 Hook 调用完整授权流程。

### Content Script

`entrypoints/content/`：

- 匹配 `http://*/*` 和 `https://*/*`。
- 加载时保存一次 `document.documentElement.outerHTML` 快照。
- 处理 `FILL_PAGE` 消息，并在首次处理时向 Background 发送 `LOCATE`。
- 尚未挂载 `App.tsx`，也未使用 `createShadowRootUi`。
- 尚未监听 `browser.storage.onChanged`，不会根据 `enabled` 动态挂载或移除 UI。
- 尚未实现把提取结果写入宿主页面字段。

以后接入 Content UI 时应使用 Shadow DOM，并保持 `cssInjectionMode: 'ui'`。扩展的 CSS、事件和 DOM 选择器不得污染宿主网页。

### LLM 服务

- LLM 配置从 `browser.storage.local.llmConfig` 读取。
- Provider 工厂支持 OpenAI、OpenAI Codex、Anthropic、Google、OpenRouter、xAI 和 OpenAI-compatible custom endpoint。
- OpenAI Codex Provider 使用 LangChain Responses API 适配 `https://chatgpt.com/backend-api/codex/responses`；Provider 会从 OAuth JWT 提取 `chatgpt_account_id`。
- Codex OAuth 使用浏览器兼容的 device-code 流程，支持打开验证页、轮询授权、交换 Token 和持久化；Options 已通过认证注册表接入登录 UI，Popup 登录 UI 与消息协议尚未接入。
- `BrowserAuthStorage` 使用带 `llmAuth:` 前缀的独立 `browser.storage.local` 条目保存序列化凭据，并提供读取、写入、删除和枚举操作。
- `ApiKeyAuth` 实现 API Key 的本地校验、按 Provider 隔离存取和清除，逻辑存储键包含 `api-key` 命名空间，避免与 OAuth 凭据冲突。
- HTML 字段识别可使用已配置的 Provider；文档解析当前仅允许 OpenAI。
- Prompt 已包含把网页和文档内容视为不可信数据的约束。
- 模型响应当前仍以原始 LangChain 消息返回，尚未使用 Zod 做结构化解析和运行时校验。

## 已知缺口与基线状态

修复对应问题后，应同步删除或更新本节：

- Popup 尚未接入 Background 和 Content Script 的填充消息协议，后续需统一 `FILL_PAGE` 及 `FILL` 的负载。
- `File[]` 是否能按预期通过扩展消息传输尚未验证；确定协议时优先采用明确、可序列化且有共享类型的 DTO。
- 页面字段识别、文件字段提取和实际 DOM 填充尚未形成完整闭环。
- Content React UI 与 `enabled` 动态开关尚未接入。
- 测试基础设施已经建立；LLM Service 测试位于 `tests/service/llm/index.test.ts`，Popup 交互测试位于 `tests/entrypoints/popup/`，共享组件测试位于 `tests/components/`。

仓库可能包含用户未提交的修改。不要覆盖、回退或格式化与当前任务无关的改动。

## 样式约定

- Tailwind CSS 通过 `wxt.config.ts` 中的 `@tailwindcss/vite` 插件启用。
- Popup、Options 和 Content Script 是三个独立构建入口，因此当前各自保留一个 `style.css`。
- 每个入口样式文件通过 `@import "tailwindcss";` 引入 Tailwind。
- 新 UI 优先使用 Tailwind utility class；仅在 utility class 不合适时增加局部 CSS。
- Content UI 接入 Shadow DOM 后，其 `rem` 单位仍可能受到宿主网页根字体大小影响；尺寸必须稳定时优先使用明确的像素任意值，如 `w-[48px]`。
- 不要为了共享少量样式破坏未来 Content Script 的 Shadow DOM 样式隔离。

## 常用命令

```bash
npm install
npm run dev
npm run dev:firefox
npm run compile
npm test
npm run test:watch
npm run build
npm run build:firefox
npm run zip
npm run zip:firefox
```

- 开发 Chrome 扩展：`npm run dev`
- TypeScript 检查：`npm run compile`
- Chrome 生产构建：`npm run build`
- 离线测试：`npm test`
- 测试监听模式：`npm run test:watch`
- 发布前打包：`npm run zip`
- 安装依赖后，`postinstall` 会执行 `wxt prepare` 并生成 `.wxt/`。
- 当前尚未定义 `test:coverage` 脚本。

## 测试规范

当前测试范围仅包括静态检查、单元测试、React 组件测试以及基于内存浏览器 API 的扩展集成测试。暂不引入 Playwright、真实浏览器 E2E 或真实 LLM 在线评测；除非任务明确要求，不要自行扩大测试范围。

### 测试技术栈与配置

- 使用 Vitest 作为测试运行器。
- 使用 WXT 官方的 `WxtVitest` 插件，使测试能够解析 WXT 自动导入、项目路径别名及 `wxt.config.ts` 中的 Vite 配置。
- 使用 `wxt/testing/fake-browser` 提供的内存浏览器实现测试 `browser.storage`、runtime message 和 tabs message；测试之间不得共享浏览器状态。
- React 组件使用 `@testing-library/react`、`@testing-library/user-event` 和 `@testing-library/jest-dom`，测试环境使用 `jsdom`。


### 测试组织与范围

- 所有测试脚本统一放在根目录 `tests/` 下，不得在 `src/` 或 `entrypoints/` 等代码路径中创建测试文件。
- 测试目录按被测源码路径镜像组织，文件命名为 `*.test.ts` 或 `*.test.tsx`；例如 `src/service/llm/index.ts` 对应 `tests/service/llm/index.test.ts`。
- 共享的测试初始化、fixture 和辅助代码也放在 `tests/` 下。
- 纯工具函数重点测试正常输入、边界输入和错误路径，例如文件到 Base64 的转换。
- Prompt 测试只断言安全边界、字段定义、关键约束和输入内容等稳定条件，不对整段 Prompt 使用大规模快照测试。
- LLM provider 测试应 mock LangChain 模型构造器，验证 provider 选择、参数传递和未知 provider 错误；普通测试不得请求真实 LLM API，也不得读取 `.env` 或 `.env.sh`。
- React 组件应从用户可观察行为进行测试，例如可访问角色、状态、点击、文件选择和回调；不要逐项断言 Tailwind class。
- Popup 和 Options 测试应覆盖存储读取、状态切换、保存及失败状态。
- Background 和 Content Script 的业务逻辑应尽量提取为可单独调用的具名函数，入口文件只负责注册监听器，以便测试消息分支和错误处理。
- 消息集成测试应覆盖 Popup、Background 和 Content Script 使用的消息类型、负载及响应是否一致，并使用 fake browser 隔离存储与监听器状态。
- 测试 fixture 不得包含真实密钥、个人文件或敏感网页内容。

### 测试执行规则

- 新增或修改纯函数、共享组件、存储逻辑或消息协议时，应同时新增或更新对应测试。
- 修复缺陷时，应尽可能先添加能够复现缺陷的回归测试。
- 测试必须确定且可离线重复执行；不要依赖真实网络、当前时间、随机模型输出或开发者本机已有的扩展存储。
- 完成测试配置和脚本后，修改 TypeScript、TSX、WXT 配置或依赖的最低验证命令为：

  ```bash
  npm run compile
  npm test
  npm run build
  ```

- Firefox 构建、扩展环境人工检查等要求仍按下方“修改与验证规则”执行；不能代替浏览器环境下的必要人工检查。

## 修改与验证规则

- 修改 TypeScript、TSX、WXT 配置或依赖后，至少运行并报告：

  ```bash
  npm run compile
  npm run build
  ```

- 测试脚本落地后，上述最低验证中追加 `npm test`。
- 修改跨浏览器入口、Manifest 或浏览器 API 时，同时运行 `npm run build:firefox`。
- 当前已知基线错误也必须如实报告；不得通过 `any`、忽略规则或删除检查来制造通过结果。
- 修改 Content Script UI 后，应在普通 HTTP/HTTPS 页面上人工检查：挂载、开关、Shadow DOM 样式隔离及控制台错误。
- 修改 Popup 或 Options 后，应分别在扩展环境中打开并检查，不能只按普通网页测试。
- 修改存储字段时，应同步检查 Background、Popup、Options 和 Content Script 的所有读写位置。
- 修改 `permissions`、`host_permissions` 或匹配范围时，应说明原因，并遵循最小权限原则。
- 不要手工修改 `.wxt/`、`.output/` 或 `node_modules/`。
- 不要读取、输出、提交或覆盖 `.env`、`.env.sh` 中的秘密信息。
- 不要无理由更换包管理器或删除 `package-lock.json`。

## 编码约定

- 保持 TypeScript `strict` 模式，不用 `any` 绕过类型检查。
- 优先使用 shadcn/ui 组件；仅在没有合适组件时考虑自己实现。
- React 使用函数组件和 Hooks。
- 遵循“当前目录结构”中定义的模块职责，不重复建立含义相同的目录。
- 从入口引用共享模块时优先使用 WXT 已配置的根路径别名，例如 `@/src/services/llm/types`；不要手工修改 `.wxt/tsconfig.json`。
- 仅导入 TypeScript 类型时使用 `import type`。
- 异步扩展 API 调用应明确处理 Promise；不等待结果时使用 `void` 表达意图。
- 浏览器扩展 API 使用 WXT 提供的 `browser` 接口。
- 入口运行时代码应放在 `defineBackground`、`defineContentScript` 等入口函数内部，避免构建时访问浏览器专属全局对象。
- 消息负载应具有明确且稳定的 `type` 字段。新增或修改消息时，应先更新共享 TypeScript 联合类型，再同步所有发送方和接收方。
- 跨扩展消息边界只传递经过验证、可序列化的数据，不直接假定 DOM 对象或复杂 Web API 对象可以传输。
- 外部输入和 LLM 输出必须在信任边界处进行运行时校验，不要只依赖 TypeScript 类型。
- 用户可见文案目前以中文为主；新增文案保持同一语言，除非已经引入国际化方案。
- 尽量保持变更小而聚焦，不顺带重构与当前任务无关的代码。

### 注释与文档

- 除 React 默认组件、WXT 入口和配置函数等框架惯用导出外，所有导出的函数、类、类型和常量都应有 JSDoc。
- 只在逻辑复杂或容易误解时添加行内注释，不重复描述代码表面行为。
- 所有代码注释和 JSDoc 使用英文。
- 行为、目录或命令发生变化时，同步更新 `AGENTS.md`；面向使用者的操作发生变化时同步更新 `README.md`。

## 生成物、安全与版本控制

以下内容不应提交：

- `node_modules/`
- `.wxt/`
- `.output/`
- 构建生成的 `*.zip`
- `.env`、`.env.sh` 和其他本地环境变量文件
- 真实 API 密钥、个人文件和测试产生的敏感数据

应提交：

- 源码、测试和配置
- `package.json` 与 `package-lock.json`
- 与行为变化对应的 README 或开发约定

不得读取、输出、提交或覆盖 `.env`、`.env.sh` 中的内容。不得无理由更换包管理器、删除锁文件或提交生成目录。
