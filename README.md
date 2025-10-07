# 开发者网站导航 · HeroUI v2.8.5

将原始 HTML 导航站重构为 Node.js + React 应用，使用 HeroUI v2.8.5 与 Tailwind CSS 实现玻璃拟态风格、分类筛选、搜索与收藏等功能。

原项目（静态版）：https://github.com/user4yz/generic-static-website/tree/cosine/feature/glassmorphismnavigation

## 技术栈

- React 18 + Vite
- @heroui/react 2.8.5（基于 Tailwind）
- Tailwind CSS（darkMode: class）
- Font Awesome（CDN）
- canvas-confetti（收藏时彩带反馈）

## 本地开发

```bash
npm i
npm run dev
```

打开控制台输出的本地地址进行预览（默认 http://localhost:5173）。

## 生产构建

```bash
npm run build
npm run preview
```

构建产物位于 `dist/`，可直接部署到任意静态资源平台（Vercel、Netlify、Cloudflare Pages 等）。

## 主要功能

- 分类导航（支持“全部”和具体分类）
- 关键词搜索（标题/描述/分类）
- 收藏/取消收藏（localStorage 持久化）
- 复制链接、一键新开
- 深色模式切换（自动跟随系统，可手动覆盖）
- 玻璃拟态卡片 + 背景光斑 + Bing 每日壁纸（失败自动回退）

## 代码入口

- `index.html`：应用 HTML 入口（包含 Font Awesome CDN 与预设深色切换）
- `src/main.jsx`：应用启动与 HeroUIProvider 包裹
- `src/App.jsx`：页面与交互主逻辑
- `src/data.js`：导航数据（可按需扩展）
- `tailwind.config.js`：Tailwind 与 HeroUI 配置
- `src/index.css`：Tailwind 指令与玻璃拟态增强样式

## 主题与本地存储键

- 主题键名：`nav_theme`（light/dark）
- 收藏键名：`nav_favorites`（Set 序列化为数组）
- 分类键名：`nav_category`
- 仅看收藏键名：`nav_fav_only`

## 部署建议

- 将 `dist/` 上传至任意静态托管平台（Vercel/Netlify/CF Pages）
- 也可作为子目录挂载在任意 Node.js 服务之上（仅作为静态资源提供）

