# Local-Nav 项目概览

## 1. 项目类型与用途
- **定位**：单页应用（SPA）形式的开发者导航站点，将分类导航、搜索、收藏等功能统一呈现。
- **目标用户**：需要快速定位常用开发工具、框架、托管服务等资源的前端/全栈开发者。
- **核心价值**：在响应式 UI 中提供可筛选的资源卡片、收藏持久化（localStorage）以及视觉反馈（玻璃拟态、彩带特效、动态背景）。

## 2. 技术栈
### 编程语言与框架
- **语言**：JavaScript（ESM 模块规范）
- **前端框架**：React 18
- **构建工具**：Vite 5（`@vitejs/plugin-react`）

### UI 与样式
- **组件库**：@heroui/react 2.8.5（Tailwind 生态组件）
- **样式方案**：Tailwind CSS 3（`darkMode: "class"`），配合自定义 CSS 增强玻璃拟态效果
- **图标库**：Font Awesome（通过 CDN 注入）

### 功能依赖
- **动画/反馈**：canvas-confetti（收藏动作彩带）
- **浏览器特性**：灵活使用 localStorage、`window.matchMedia` 与 DOM API

## 3. 项目结构
```
├── index.html                # 应用入口 HTML，注入 Font Awesome & 主题预设脚本
├── package.json              # npm 包定义、脚本与依赖
├── postcss.config.js         # PostCSS/Tailwind 管线
├── tailwind.config.js        # Tailwind + HeroUI 配置
├── vite.config.js            # Vite 构建配置
├── src/
│   ├── main.jsx              # React 渲染入口，挂载 HeroUIProvider
│   ├── App.jsx               # 页面主体与交互逻辑（状态、UI、效果）
│   ├── data.js               # 导航分类与条目数据源
│   └── index.css             # Tailwind 指令与自定义样式
└── README.md                 # 官方使用说明与功能描述
```
- `node_modules/`、`package-lock.json` 为依赖产物/锁定文件。

## 4. 主要功能模块
- **导航卡片栅格**：`App.jsx` 中基于 HeroUI 的 `Card` 列表，使用 `data.js` 驱动；支持鼠标倾斜（tilt）效果与悬浮卡片详情。
- **分类筛选**：HeroUI `Chip` 组件构成的分类条（`chips` 状态），支持“全部 + 按分类”切换并持久化至 `localStorage`。
- **关键词搜索**：HeroUI `Input` 设置 `query` 状态，实时在标题/描述/分类名称中模糊匹配。
- **收藏中心**：自定义 `useLocalStorageSet` 钩子维护收藏条目（集合语义）；收藏按钮触发 canvas-confetti 并 toast 提示。
- **主题切换**：按钮切换 `light/dark`，通过 `document.documentElement.classList` 控制 Tailwind 暗色模式，并存储选择。
- **动态背景与鼠标光效**：Bing 壁纸拉取 + 多层级后备图片；`mousemove` 监听页面设置 `radial-gradient` 光效。
- **滚动反馈**：滚动监听计算进度条宽度、头部样式、返回顶部火箭按钮显示。
- **Toast 系统**：简单的消息条通过状态计时器控制显隐。

## 5. 构建与运行
项目使用 pnpm 管理依赖（`packageManager: "pnpm@10.18.1"`）。若需要 npm/yarn，可自行转换。

| 操作 | 命令 |
| --- | --- |
| 安装依赖 | `pnpm install` |
| 本地开发 | `pnpm dev`（默认端口 5173） |
| 生产构建 | `pnpm build`，产物位于 `dist/` |
| 构建预览 | `pnpm preview --port 4173` |
| 测试 | `pnpm test`（当前仅占位，返回成功） |

> 在使用 pnpm 前需执行 `corepack enable` 以启用 pnpm 版本管理。

## 6. 配置文件说明
- **`package.json`**：定义项目元信息、脚本及依赖。`test` 脚本为占位输出，尚未配置自动化测试。
- **`vite.config.js`**：使用 `@vitejs/plugin-react`，保持默认 Vite 行为，适用于快速开发与 HMR。
- **`tailwind.config.js`**：扩展自定义颜色、阴影，并引入 HeroUI 预设；扫描内容覆盖 `src/` 与 HeroUI 主题包。
- **`postcss.config.js`**：启用 `tailwindcss` 与 `autoprefixer` 插件，处理 CSS。
- **`index.html`**：静态入口模版，负责加载 Font Awesome CDN、预设暗色主题脚本及 Vite entry；body 使用渐变背景。
- **`src/index.css`**：整合 Tailwind 指令与玻璃拟态、光效、卡片倾斜等自定义样式（含关键帧动画）。
- **`README.md`**：提供官方技术栈说明、命令示例、功能概要及 localStorage 键名。

## 7. 架构特点与设计模式
- **数据驱动的 UI 架构**：导航数据集中于 `data.js`，渲染逻辑遍历数据生成卡片，便于后续扩展类别或条目。
- **自定义 Hook 管理持久化状态**：`useLocalStorageSet` 组合 React state 与 localStorage，提供 `Set` 语义的收藏集合更新。
- **副作用集中管理**：`useEffect` 针对主题同步、滚动监听、背景预加载、鼠标光效、toast 生命周期等分别处理，提升维护性。
- **派生数据缓存**：通过 `useMemo` 计算分类芯片与筛选结果，避免不必要的重复计算。
- **轻量交互增强**：结合 HeroUI 组件、Tailwind 样式和 DOM API（渐变背景、滚动进度、confetti），实现视觉层面的差异化体验。
- **无服务端依赖**：完全前端静态部署，可直接发布至任意静态托管平台（Vercel、Netlify、Cloudflare Pages 等）。

---
如需进一步扩展，可考虑：
- 引入自动化测试（如 Vitest、React Testing Library）。
- 抽象复杂的副作用（背景加载、滚动监听）为自定义 Hook 以增强模块化。
- 提供多语言支持或远程数据源 API 以提升可维护性。
