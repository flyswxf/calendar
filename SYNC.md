# 多端同步与环境验证说明

## 环境变量配置（Vercel）
- 必填变量：
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
- 值来源：Upstash for Redis 控制台的 REST URL 与读写令牌（不要使用只读令牌）。
- 连接upstash会自动将这些变量添加到环境变量中
- 也可以手动添加, 在setting-environment variable中通过上传import.env

## 环境验证
- 打开 `https://flyswxf.dpdns.org/api/data?userId=test123`
  - 正常：返回 `{"tasks":[],"courses":[],"focusSessions":[]}` 或已有数据
  - `missing env`：变量未配置或未生效 → 检查变量并重新部署
  - `WRONGPASS invalid or missing auth token`：令牌错误或使用了只读令牌 → 使用读写令牌（`KV_REST_API_TOKEN`/`UPSTASH_REDIS_REST_TOKEN`）
  - `read-only token`（403）：当前仅配置了只读令牌 → 添加读写令牌

## 多端同步使用
- 绑定用户 ID：访问 `https://flyswxf.dpdns.org/?uid=<任意字符串>`，如 [`?uid=test123`](https://flyswxf.dpdns.org/?uid=test123)
- 在所有设备使用同一个 `uid` 链接，即共享数据空间。
- 操作示例：
  - 设备 A 添加待办/课程，页面会写入云端；刷新后仍可见。
  - 设备 B 打开同样链接并刷新，即可看到相同数据。
- 首次设备建议使用隐身模式或清空该站点的 `localStorage`，确保从云端拉取。
