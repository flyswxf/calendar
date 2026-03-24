#!/bin/bash

# Vercel Build Script
# 此脚本在 Vercel 部署环境下运行（Linux），用于处理多个子应用的构建与输出合并。

echo "开始执行自定义构建脚本..."

# 1. 编译 calendar 应用
echo "构建 apps/calendar..."
npm --prefix apps/calendar run build

# 2. 准备输出目录
echo "创建输出目录结构..."
mkdir -p out/apps/calendar
mkdir -p out/apps

# 3. 复制根目录的导航页
echo "复制根目录 index.html..."
cp index.html out/index.html

# 4. 复制 calendar 的构建产物
echo "复制 calendar 构建产物..."
cp -r apps/calendar/dist/* out/apps/calendar/

# 5. 自动遍历并复制其他纯静态子应用（如 life-map, pixel-fit 等）
echo "处理其他静态子应用..."
for app_dir in apps/*; do
  app_name=$(basename "$app_dir")
  
  # 排除 calendar 及其遗留版本，因为已经单独处理过了
  if [ "$app_name" = "calendar" ] || [ "$app_name" = "calendar_legacy" ]; then
    continue
  fi
  
  # 如果该子应用目录内存在 index.html，则认为它是静态页面，直接复制过去
  if [ -f "$app_dir/index.html" ]; then
    echo "发现静态子应用: $app_name，正在复制..."
    cp -r "$app_dir" "out/apps/$app_name"
  fi
done

echo "构建与产物合并完成！"
