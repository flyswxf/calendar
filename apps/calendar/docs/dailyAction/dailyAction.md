toolName: apply_patch
            
status: failed
          
          

        
            
toolName: edit_file_update
            
status: success
          
            
filePath: d:\HuaweiMoveData\Users\fengl\Desktop\code\todo_list\apps\calendar\plan\plan.md
          
changes: 
          

        
            
toolName: GetDiagnostics
            
status: success
          
          
**已继续完成**
- 已按你的要求继续推进，并把本轮新进展同步到计划文件：新增了“B 策略开关与守门条件”与“lint/build 校验通过”两条进展，位置在 [plan.md:L90-L106](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/plan/plan.md#L90-L106)。
- `deadline.md` 已删除，当前计划目录只保留 `plan.md`（已核对）。
- 代码状态已验证：`npm run lint`、`npm run build` 均通过。

**当日事件追踪模块实现说明（功能→实现方法→位置）**
- 1) **手动补录当日事件**
  - 方法：输入事件名 + 开始时分 + 时长桶，点击添加后做“当天边界裁剪”再写入存储。
  - 位置：UI 在 [ManualEntryCard.tsx:L16-L46](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/Cards/ManualEntryCard.tsx#L16-L46)，逻辑在 [useDailyActionPanel.ts:L243-L264](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L243-L264)，裁剪函数在 [dailyActionShared.ts:L115-L126](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/dailyActionShared.ts#L115-L126)。
- 2) **按当日日历自动入账**
  - 方法：周期检查课程，若“当前时间已超过课程结束时间”则自动生成 `auto_calendar` 事件，并用 `autoCourseKey` 去重。
  - 位置：主逻辑在 [useDailyActionPanel.ts:L71-L108](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L71-L108)。
- 3) **时间分配图表（同名聚合）**
  - 方法：按事件名聚合 `durationMin`，生成 conic-gradient 饼图和图例比例。
  - 位置：聚合与渐变计算在 [useDailyActionPanel.ts:L215-L241](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L215-L241)，展示在 [SummaryCard.tsx:L15-L37](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/Cards/SummaryCard.tsx#L15-L37)。
- 4) **历史名称建议**
  - 方法：遍历历史事件按频次排序，取前 12 个写入 datalist，所有输入框可复用。
  - 位置：建议生成在 [useDailyActionPanel.ts:L116-L123](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L116-L123)，注入在 [DailyActionPanel.tsx:L60-L62](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/DailyActionPanel.tsx#L60-L62)。
- 5) **开始/结束追踪 + 结束时间可调**
  - 方法：开始时立即持久化 session 到 localStorage；结束时按转盘时分回填，若早于开始则自动 +5 分钟保护，再落库为 `timer` 事件。
  - 位置：UI 在 [RunningSessionCard.tsx:L17-L50](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/Cards/RunningSessionCard.tsx#L17-L50)，恢复/持久化在 [useDailyActionPanel.ts:L50-L69](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L50-L69)，开始/结束在 [useDailyActionPanel.ts:L266-L303](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L266-L303)。
- 6) **模糊录入（三候选 + 习惯适配）**
  - 方法：A 方案（语义默认值+历史均值）始终可用；B 补全版（中位数/P25/P75/近期权重/冷启动阈值）已实现但受守门条件控制，不会立即全量接管。
  - 位置：A 候选在 [useDailyActionPanel.ts:L129-L179](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L129-L179)，B 候选在 [useDailyActionPanel.ts:L181-L203](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L181-L203) 与 [dailyActionShared.ts:L281-L324](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/dailyActionShared.ts#L281-L324)，最终策略切换在 [useDailyActionPanel.ts:L204-L209](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L204-L209)，新增事件在 [useDailyActionPanel.ts:L305-L326](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L305-L326)。
- 7) **删除事件**
  - 方法：按 id 过滤删除，若当前在编辑该条则同步退出编辑态。
  - 位置：逻辑在 [useDailyActionPanel.ts:L328-L333](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L328-L333)，按钮在 [EventListCard.tsx:L69-L72](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/Cards/EventListCard.tsx#L69-L72)。

**B 方案“先实现不立刻应用”的当前机制**
- 统计能力已补全：`buildNameStatsV2`（均值/近期均值/中位数/P25/P75）见 [dailyActionShared.ts:L177-L224](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/dailyActionShared.ts#L177-L224)。
- 数据充足性判定已实现：`assessBReadiness` 见 [dailyActionShared.ts:L226-L279](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/dailyActionShared.ts#L226-L279)。
- 主流程守门：只有 `dailyActionFuzzyStrategy=b_prepared` 且 `bReadiness.ready=true` 才走 B，否则继续 legacy，见 [useDailyActionPanel.ts:L43-L44](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L43-L44) 和 [useDailyActionPanel.ts:L204-L209](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/DailyAction/useDailyActionPanel.ts#L204-L209)。

**数据量是否足够的脚本**
- 脚本位置：[check-daily-action-data.mjs](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/scripts/check-daily-action-data.mjs)
- 入口命令在 [package.json:L6-L12](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/package.json#L6-L12)
- 用法：
  - `npm run check:daily-action-data -- <json文件路径> [--key dailyActionEvents]`
- 核心判定逻辑在 [check-daily-action-data.mjs:L30-L60](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/scripts/check-daily-action-data.mjs#L30-L60)（总样本、类型数、稳定事件、近7天样本四项打分）。