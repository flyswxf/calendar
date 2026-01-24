# Pixel Fit 开发计划书

## 1. 项目概述
Pixel Fit 是一个以像素风格为核心的虚拟穿搭预览应用。用户上传真实衣物照片，系统（模拟）转化为像素风格，并允许用户在虚拟模特上进行试穿搭配。

## 2. 技术架构

### 2.1 技术栈
- **核心**: 原生 HTML5, CSS3, JavaScript (ES6+)
- **样式**: 自定义 CSS (利用 `image-rendering: pixelated` 实现像素化效果)
- **存储**: `localStorage` (临时保存用户上传的衣物数据)
- **模拟后端**: 前端 Mock 接口，模拟 AI 处理延迟和返回结果

### 2.2 目录结构
```
apps/pixel-fit/
├── index.html          # 入口页面
├── src/
│   ├── styles/
│   │   ├── main.css    # 全局布局
│   │   └── pixel.css   # 像素风格组件
│   ├── scripts/
│   │   ├── app.js      # 主逻辑
│   │   ├── api.js      # 模拟 AI 接口
│   │   └── editor.js   # 换装编辑器逻辑
│   └── assets/
│       ├── base-char.png  # 基础模特底图
│       └── icons/
```

## 3. 功能模块详细设计

### 3.1 上传与处理模块 (Uploader)
- **UI**: 像素风格的“拖拽上传”区域。
- **逻辑**:
  1. 用户选择图片。
  2. 前端压缩图片（预览用）。
  3. 调用 `mockProcessImage(file)` 接口。
  4. 显示“正在像素化...”进度条。
  5. 返回生成的像素图（现阶段可用 Canvas 简单的马赛克算法或直接返回原图的像素化 CSS 版本）。

### 3.2 换装编辑器 (Fitting Room)
- **画布设计**:
  - 底层: 模特身体 (Body Layer)
  - 中层: 下装 (Bottom Layer)
  - 上层: 上装 (Top Layer)
  - 顶层: 配饰/鞋子 (Accessory Layer)
- **交互**:
  - 点击右侧衣柜中的缩略图，自动应用到对应图层。
  - 支持图层显隐切换。

### 3.3 衣柜管理 (Wardrobe)
- 展示用户所有已上传并处理过的衣物。
- 数据结构示例:
  ```json
  {
    "id": "item_001",
    "type": "top",
    "originalUrl": "blob:...",
    "pixelUrl": "blob:...",
    "createdAt": 1705843200000
  }
  ```

## 4. 开发阶段规划

### Phase 1: 基础 UI 与 换装原型 (Current)
- [ ] 搭建编辑器布局（左侧模特，右侧衣柜/上传）。
- [ ] 实现基础模特显示。
- [ ] 实现简单的图层叠加逻辑。

### Phase 2: 上传与模拟 AI
- [ ] 实现文件上传控件。
- [ ] 实现前端简单的“像素化”滤镜（Canvas处理）。
- [ ] 存入本地衣柜列表。

### Phase 3: 完善与优化
- [ ] 移动端适配。
- [ ] 更多模特姿势或肤色选择。
