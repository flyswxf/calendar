# Bug: 侧边栏图标 hover 提示被右侧面板遮挡

## 描述
当光标悬浮在侧边栏图标上时，会显示 `data-tooltip` 提示文字（如"手机日历"）。点击图标打开右侧面板后，提示文字被面板遮挡，并且会残留黑色边框（tooltip 的深色背景），非常难看。

## 根因
- tooltip 使用 `.sidebar-nav-item::after` 和 `::before` 伪元素，定位在图标右侧 `left: calc(100% + 10px)`
- 侧边栏面板 `(.sidebar-panel)` 使用 `position: absolute` 并带有 `box-shadow` 和 `border`
- `.sidebar-nav` 和面板在同一个 flex 容器中，tooltip 的 z-index 低于面板，导致被面板部分遮挡
- tooltip 的深色背景在面板边缘处露出，形成"黑边"

## 修复方案
1. 给 `.sidebar-nav` 设置高于面板的 `z-index`，使 tooltip 始终显示在面板上方
2. 当任意面板打开时（`.sidebar-dock` 内有 `.sidebar-panel-container.open`），隐藏 tooltip，避免与面板内容冲突
