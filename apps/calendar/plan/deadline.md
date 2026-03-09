toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: search_codebase
            
status: success
          
query: 日历中事件如何建模与渲染，尤其课程和任务事件来源、时间字段、类型字段
          

        
            
toolName: search_codebase
            
status: success
          
query: Task、Course、FocusSession 类型定义及是否已有截止时间字段、是否有任务事件映射到日历
          

        
            
toolName: search_codebase
            
status: success
          
query: 项目里是否已有图片上传、OCR、文件解析、作业截止日期相关功能或依赖
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
非常适合做，而且你这个场景我建议用**“双通道采集 + 统一截止事件生成”**，能覆盖你说的两种现实情况（超星PPT可访问 / 只能拍照）。

**先说结论**
- 最实用方案不是强依赖“全自动爬超星”，而是：
- **通道A（半自动）**：你登录后提供超星章节链接 + 一键抓取页面中的课件文本/PPT末页文字。
- **通道B（高可用）**：手机拍照上传，OCR提取作业信息。
- 两条通道都输出成统一结构：`作业标题 + 截止时间 + 课程 + 置信度`，然后自动在日历里生成 `deadline event`。

---

**为什么这么设计**
- 超星页面需要登录，且常见“7天登录状态、扫码登录、验证码/失效二维码”等机制，后台直连抓取稳定性差。
- 纯自动抓取会受账号态、反爬、页面结构变化影响，维护成本高。
- 拍照是你真实高频输入方式，OCR反而是最稳入口。
- 你当前日历已具备事件渲染基础（课程 `course`、专注 `focus`），扩一个 `deadline` 类型最自然：[DayColumn.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/Calendar/DayColumn.tsx#L1-L80), [EventBlock.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/Calendar/EventBlock.tsx#L5-L34)

---

**推荐的3层实现方案**

- **L1（马上可用，优先做）**
  - 新增“作业识别入口”：`上传图片 -> OCR -> 解析截止时间 -> 预览确认 -> 保存`
  - 保存后自动创建：
    - 任务（task）
    - 日历截止事件（deadline）
  - 你只需拍一张最后一页，基本能跑通。

- **L2（半自动接入超星）**
  - 输入超星章节URL后，提供“浏览器内提取”按钮：
    - 在你已登录的同浏览器上下文中读取页面可见文本（而不是服务端爬虫）
    - 提取“作业/截止/提交方式”等关键词
  - 这层本质是“你登录态下的页面辅助提取”，合规和稳定性都更好。

- **L3（增强自动化）**
  - 做“课程结束后自动触发采集提醒”：
    - 下课后弹窗：`是否添加本节作业？`
    - 选“是”后可直接拍照或粘贴超星链接
  - 加规则引擎：若未识别到具体时间，按课程默认策略补全（如“下周上课前23:59”）。

---

**你项目里怎么落地最顺**
基于你现有结构，我建议这样扩展：

- **数据模型扩展（关键）**
  - 现有 `Task` 没有截止时间字段：[types/index.ts](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/types/index.ts#L1-L27)
  - 建议新增：
    - `Task.dueAt?: string`（ISO）
    - `Task.courseId?: string`
    - `Task.source?: 'manual' | 'photo_ocr' | 'chaoxing'`
    - `Task.confidence?: number`
  - 或新增 `DeadlineEvent` 独立表（更清晰）。

- **日历渲染**
  - 在 [DayColumn.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/Calendar/DayColumn.tsx#L1-L80) 增加 `deadline` 渲染分支。
  - 在 [EventBlock.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/Calendar/EventBlock.tsx#L5-L34) 增加 `type: 'deadline'` 样式和点击详情。

- **存储同步**
  - 你的数据由 StorageContext 统一管：[StorageContext.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/context/StorageContext.tsx#L9-L131)
  - deadline/task 扩展字段会自动走本地+远端同步链路，改动成本低。

- **提醒复用**
  - 你已有课程提醒面板和 ICS 导出逻辑：[CourseReminderPanel.tsx](file:///d:/HuaweiMoveData/Users/fengl/Desktop/code/todo_list/apps/calendar/src/components/Calendar/CourseReminderPanel.tsx#L236-L272)
  - 可复用为“deadline前X小时提醒 + 导出deadline到ICS”。

---

**识别规则（核心算法）**
- 从 OCR / 页面文本中提取：
  - 作业关键词：`作业|任务|练习|实验|报告|提交`
  - 截止时间模式：`今晚|明晚|下周X|YYYY-MM-DD HH:mm|周X前`
- 时间补全策略：
  - 识别到日期无时分 -> 默认 `23:59`
  - 识别到“下次课前” -> 用该课程下次上课时间减 10 分钟
  - 完全无时间 -> 标记“待确认”，给你一个快捷确认弹窗
- 每条结果带置信度，低置信度必须人工确认再入库。

---

**隐私与可行性建议**
- 不建议你把超星账号密码交给后端脚本。
- 优先“本地浏览器已登录态提取 + 本地OCR处理”。
- 图片和文本优先本地处理，只有你确认后再入任务/日历。

---

**建议你现在就走的版本（最省事）**
- 第1版只做两步：
  - 拍照上传 -> OCR -> 生成 deadline event
  - 手动粘贴超星页面文本 -> 解析 deadline
- 先不做超星自动登录抓取。
- 这样两周内就能高可用，而且跟你习惯（拍照）高度一致。

如果你同意，我下一步就按这个“第1版”直接帮你实现：  
`拍照识别入口 + 任务截止字段 + 日历deadline事件 + 截止提醒`。