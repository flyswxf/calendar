# 模块依赖关系说明

本项目将原始 `script.js` 拆分为多个 ES 模块，位于 `src/modules/` 目录下。模块间通过清晰的导出/导入接口进行协作，保证功能完整与可维护性。

## 目录结构

- `src/main.js` 项目入口，负责初始化与模块装配
- `src/modules/utils/time.js` 时间/格式化工具函数与常量
- `src/modules/storage/index.js` 本地状态与 `localStorage` 持久化
- `src/modules/dom/domRefs.js` DOM 引用集中管理器
- `src/modules/modals/modals.js` 通用模态框打开/关闭与交互
- `src/modules/calendar/calendar.js` 日历渲染、周导航、事件详情
- `src/modules/courses/modal.js` 课程添加弹窗与保存逻辑
- `src/modules/tasks/tasks.js` 待办渲染/添加/删除/切换与每日清理
- `src/modules/timer/timer.js` 专注计时器，记录会话并联动待办
- `tests/` 浏览器端基础单元测试

## 依赖关系

- `main.js`
  - 依赖：`domRefs`、`storage`、`calendar`、`courses/modal`、`tasks`、`timer`
  - 作用：初始化 DOM、加载数据、渲染日历与任务、绑定交互

- `calendar/calendar.js`
  - 依赖：`utils/time`、`storage`、`modals/modals`
  - 导出：`renderCalendar(dom)`、`bindWeekNav(dom)`、`alignTimeColumn(dom)`、`getViewDate()` 等
  - 作用：渲染时间列、周头、课程与专注会话、事件详情弹窗

- `courses/modal.js`
  - 依赖：`modals/modals`、`utils/time`、`storage`、`calendar`
  - 导出：`bindCourseModal(dom)`
  - 作用：打开课程添加弹窗、校验并保存课程、刷新日历

- `tasks/tasks.js`
  - 依赖：`storage`、`timer`
  - 导出：`renderTasks(dom)`、`bindTaskInputs(dom)`、`cleanupCompletedTasks(dom)`、`scheduleNextCleanup(dom)`、`checkInitialCleanup(dom)`
  - 作用：任务 CRUD、启动专注、每日自动清理与遗留标记

- `timer/timer.js`
  - 依赖：`utils/time`、`storage`、`tasks`、`calendar`
  - 导出：`initTimer(dom)`、`openTimerForTask(dom,index)`、`stopTimerFromExit(dom)`
  - 作用：倒计时/正计时、暂停/恢复/完成、记录会话并刷新 UI

- `modals/modals.js`
  - 依赖：DOM 原生 API
  - 导出：`openModal(el)`、`closeModal(el)`、`bindCloseModalButtons(el)`、`bindModalBackdropClose(el)`

- `dom/domRefs.js`
  - 依赖：DOM 原生 API
  - 导出：`queryDOM()` 返回页面所需元素引用集合

- `storage/index.js`
  - 依赖：`localStorage`
  - 导出：`tasks/courses/focusSessions`、`load*`、`save*`、`set*`、更新方法

- `utils/time.js`
  - 依赖：无
  - 导出：时间常量、`pad`、`fmtHM`、`parseHM`、`clamp`、`formatHMS` 等工具

## 初始化流程

1. `main.js` 执行，收集 DOM 并加载 `storage` 数据
2. 渲染日历与绑定周导航；对齐时间列
3. 绑定课程弹窗，渲染与绑定待办输入，启动每日清理计划
4. 初始化计时器交互，提供从任务启动专注功能

## 测试

- 访问 `tests/index.html` 运行基础单元测试
- 覆盖：`utils`、`storage`、`timer` 关键行为

## 风格与约定

- 所有模块使用 ES6 `export`/`import`
- 每个文件 < 500 行，具备 JSDoc 注释（后续增强）
- 保持原有功能与命名一致，尽可能避免行为漂移