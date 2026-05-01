# My Personal Space

## 项目简介

这是一个个人效率工具合集，采用 Monorepo 结构组织，包含多个独立子应用。所有子应用通过根目录的主页进行导航。

## 子应用概览

| 应用 | 路径 | 技术栈 | 状态 |
|------|------|--------|------|
| [Calendar](./apps/calendar) | `apps/calendar` | React + TypeScript + Vite | 开发中 |
| [Life Map](./apps/life-map) | `apps/life-map` | Vanilla JS + Leaflet.js + Vite | 开发中 |

### 📅 Calendar — 学习日历 & 待办

日历周视图、课程管理、任务清单、截止日期提醒、每日行动记录、番茄钟计时。支持通过 Supabase 进行云端数据同步。详见 [apps/calendar/README.md](./apps/calendar/README.md)。

### 🗺️ Life Map — 生活地图

基于地理位置的生活记录应用，用户可以在地图上标记地点、搜索位置、创建记忆卡片（支持多媒体），并管理出行路线。详见 [apps/life-map/README.md](./apps/life-map/README.md)。

## 如何运行

各子应用独立开发和构建，请进入对应目录操作。例如：

```bash
# 开发 calendar 应用
cd apps/calendar
npm install
npm run dev

# 开发 life-map 应用
cd apps/life-map
npm install
npm run dev
```

### 生产构建（Vercel 部署）

项目通过根目录的 `build.sh` 脚本完成整体构建，Vercel 会自动执行该脚本：

```bash
bash build.sh
```

构建产物输出到 `out/` 目录，根目录的 `index.html` 作为主页导航入口。

## 项目结构

```
calendar/
├── index.html            # 主页导航入口
├── build.sh              # Vercel 构建脚本
├── vercel.json           # Vercel 部署配置
├── apps/
│   ├── calendar/         # 学习日历 & 待办 (React + TS)
│   └── life-map/         # 生活地图 (Vanilla JS)
└── data/                 # 静态资源数据
```

## 已知问题

- **多端同步**: Calendar 应用支持 Supabase 云端同步，Life Map 同步支持进行中。
- **专注模式逻辑**: Calendar 中任务标记为"完成"后仍可点击"开始专注"，需要修复。
- **代码拆分**: 部分文件体积过大，需要进一步模块化拆分。
