# Calendar 样式模块说明

本目录用于管理 `apps/calendar` 的全局与组件样式，目标是按“页面骨架样式”和“功能组件样式”分层，方便后续维护与扩展。

## 目录结构

- `base.css`：基础重置与通用全局样式。
- `layout.css`：页面整体布局、顶部操作区、侧边栏壳层（dock/nav/panel 容器）。
- `calendar.css`：周视图日历网格、时间轴、课程事件块。
- `course-reminder.css`：课程提醒面板样式（历史保留模块）。
- `modals.css`：弹窗与遮罩层样式。
- `timer.css`：专注计时器样式。
- `responsive.css`：跨模块公共断点适配（仅保留通用响应式规则）。
- `components/`：侧边栏子组件样式目录。
  - `sidebar-course-reminder.css`：手机日历导出子组件。
  - `sidebar-deadline.css`：作业截止录入子组件。
  - `sidebar-task.css`：待办任务子组件。

## 新增组件样式规范

1. 侧边栏内的新功能组件，优先在 `components/` 下新增独立文件，命名建议为 `sidebar-<component>.css`。
2. 每个组件样式文件第一行必须是“一行注释”，明确该文件负责的组件与功能范围。
3. `layout.css` 只保留容器与结构层样式，不再放具体业务子组件（如 deadline/task/reminder）的细节样式。
4. 响应式规则遵循“就近归属”：
   - 组件专属断点写在对应组件 CSS 内；
   - 多模块共享断点写在 `responsive.css`。
5. 新增样式文件后，记得在 `src/main.tsx` 中补充导入顺序，建议放在 `layout.css` 之后、功能模块样式之前。

## 推荐维护流程

1. 先确认 className 归属组件，再决定放到 `layout.css`、功能模块或 `components/`。
2. 避免在多个文件重复定义同一选择器，迁移后同步清理旧文件中的重复规则。
3. 修改后执行 lint 与 build，确认样式模块拆分未影响构建和类型检查。
