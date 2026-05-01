# 🗺️ Life Map — 生活地图

基于地理位置的生活记录应用，以地图为画布，将旅行足迹、日常发现以可视化形式记录下来。用户可以在地图上探索、标记地点、创建包含多媒体内容的记忆卡片，并规划出行路线。

## 功能概览

- **地图浏览**: 基于 Leaflet.js + OpenStreetMap 的交互式地图，支持缩放、平移
- **地点搜索**: 集成 Nominatim API，支持关键词搜索地点并自动定位
- **点击拾取**: 直接点击地图任意位置进行标记
- **记忆卡片**: 为标记的地点创建包含标题、封面图、详细记录的卡片
- **路线管理**: 创建和管理路线，串联多个地点形成出行规划
- **里程碑庆祝**: 特定操作触发庆祝动画效果
- **云端同步**: 通过 Supabase 实现数据跨设备同步（可选）
- **本地存储**: 基于 IndexedDB 的离线数据持久化，支持存储图片等二进制数据

## 技术栈

- **核心语言**: Vanilla JavaScript (ES6 Modules)
- **结构与样式**: HTML5 + CSS3 (CSS Variables, Flexbox, Grid)
- **地图引擎**: Leaflet.js
- **地图数据源**: OpenStreetMap
- **地理编码**: Nominatim API (OSM)
- **本地存储**: IndexedDB
- **云端服务**: Supabase（认证 + 数据库，可选）
- **构建工具**: Vite
- **庆祝特效**: canvas-confetti

## 🛠️ 如何运行

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后访问终端输出的本地地址（通常为 http://localhost:5173），支持热更新。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── scripts/
│   ├── config/
│   │   └── supabase.js         # Supabase 环境变量配置
│   ├── modules/
│   │   ├── map.js              # Leaflet 地图封装
│   │   ├── search.js           # Nominatim 地点搜索服务
│   │   ├── ui.js               # UI 交互管理
│   │   ├── storage.js          # IndexedDB 本地存储 + 云端同步
│   │   ├── route.js            # 路线编辑与管理
│   │   ├── celebration.js      # 庆祝动画效果
│   │   └── supabaseAuth.js     # Supabase 认证逻辑
│   ├── utils/
│   │   └── debounce.js         # 防抖工具函数
│   ├── app.js                  # 应用入口与初始化
│   ├── dashboard.js            # 仪表盘页面
│   ├── detail.js               # 详情页面
│   └── landing.js              # 落地页
├── styles/
│   ├── common.css              # 公共样式
│   ├── main.css                # 主样式入口
│   ├── landing.css             # 落地页样式
│   ├── dashboard.css           # 仪表盘样式
│   ├── detail.css              # 详情页样式
│   └── celebration.css         # 庆祝动画样式
├── App.tsx                     # React 入口（页面路由壳）
└── main.tsx                    # 应用挂载入口
```

## 环境变量

如需启用 Supabase 云端同步，在项目根目录创建 `.env` 文件：

```
VITE_LIFE_MAP_SUPABASE_URL=your_supabase_url
VITE_LIFE_MAP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

未配置时应用使用纯本地 IndexedDB 存储，功能不受影响。
