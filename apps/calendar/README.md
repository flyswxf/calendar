# 📅 Calendar — 学习日历 & 待办

基于 React + TypeScript 的学习效率工具，集成课程管理、任务清单、截止日期提醒、每日行动记录和番茄钟计时等功能。

## 功能概览

- **周视图日历**: 以周为单位展示课程和事件，支持按时间轴浏览
- **课程管理**: 手动添加或通过 Word 文档批量导入课程表
- **课程提醒**: 当天课程提醒面板
- **任务清单**: 创建和管理待办任务
- **截止日期捕获**: 智能解析截止日期信息
- **每日行动记录**: 记录每日活动并生成摘要统计
- **番茄钟计时**: 内置计时器，支持从任务直接发起专注
- **云端同步**: 通过 Supabase 实现数据多端同步

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **云端服务**: Supabase（认证 + 数据库）
- **文档解析**: Mammoth（用于 .docx 文件解析）

## 🛠️ 如何运行

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后访问 http://localhost:5173 ，支持热更新。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 代码检查

```bash
npm run lint
```

### 每日行动数据检查

```bash
npm run check:daily-action-data
```

## 项目结构

```
src/
├── components/
│   ├── Auth/             # Supabase 认证组件
│   ├── Calendar/         # 日历视图、课程管理、导入器
│   ├── DailyAction/      # 每日行动面板及卡片组件
│   ├── Deadline/         # 截止日期捕获
│   ├── Icon/             # 图标组件
│   ├── Modals/           # 弹窗组件
│   ├── Tasks/            # 任务列表
│   └── Timer/            # 番茄钟计时覆盖层
├── context/              # React Context（存储、计时器）
├── hooks/                # 自定义 Hooks
├── styles/               # 样式文件
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数（时间、解析、Supabase 客户端）
```

## 环境变量

如需启用 Supabase 云端同步，在项目根目录创建 `.env` 文件：

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

未配置时应用仍可正常使用本地存储模式。
