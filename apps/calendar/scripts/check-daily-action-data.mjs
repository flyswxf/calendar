import fs from 'node:fs';
import path from 'node:path';

function normalizeActionName(name) {
  return String(name ?? '').trim().replace(/\s+/g, '');
}

function parseArgs(argv) {
  const result = { filePath: '', key: 'dailyActionEvents' };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--key') {
      result.key = argv[i + 1] || 'dailyActionEvents';
      i += 1;
      continue;
    }
    if (!result.filePath) {
      result.filePath = token;
    }
  }
  return result;
}

function collectEvents(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload[key])) return payload[key];
  return [];
}

function assessReadiness(events, now, thresholds) {
  const recentMs = thresholds.recentWindowDays * 24 * 60 * 60 * 1000;
  const nameCounts = new Map();
  let recentEvents = 0;
  for (const event of events) {
    const name = normalizeActionName(event?.name);
    if (!name) continue;
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    const ts = new Date(event?.startAt || '').getTime();
    if (!Number.isNaN(ts) && now.getTime() - ts <= recentMs) {
      recentEvents += 1;
    }
  }
  const totalEvents = events.length;
  const distinctNames = nameCounts.size;
  const qualifiedNames = [...nameCounts.values()].filter((count) => count >= thresholds.minPerNameEvents).length;
  const rules = [
    { ok: totalEvents >= thresholds.minTotalEvents, text: `总样本 ${totalEvents}/${thresholds.minTotalEvents}` },
    { ok: distinctNames >= thresholds.minDistinctNames, text: `事件类型 ${distinctNames}/${thresholds.minDistinctNames}` },
    { ok: qualifiedNames >= thresholds.minQualifiedNames, text: `稳定事件 ${qualifiedNames}/${thresholds.minQualifiedNames}` },
    { ok: recentEvents >= thresholds.minRecentEvents, text: `近期样本 ${recentEvents}/${thresholds.minRecentEvents}` }
  ];
  const score = rules.filter((rule) => rule.ok).length;
  return {
    ready: score >= 4,
    score,
    requiredScore: 4,
    metrics: { totalEvents, distinctNames, qualifiedNames, recentEvents },
    rules
  };
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.filePath) {
    console.error('用法: npm run check:daily-action-data -- <json文件路径> [--key dailyActionEvents]');
    process.exit(1);
  }
  const absolutePath = path.resolve(process.cwd(), args.filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`文件不存在: ${absolutePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(absolutePath, 'utf-8');
  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    console.error(`JSON解析失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  const events = collectEvents(payload, args.key);
  const thresholds = {
    minTotalEvents: 40,
    minDistinctNames: 6,
    minQualifiedNames: 3,
    minRecentEvents: 12,
    minPerNameEvents: 5,
    recentWindowDays: 7
  };
  const report = assessReadiness(events, new Date(), thresholds);
  console.log('DailyAction 数据充足性检查');
  console.log(`文件: ${absolutePath}`);
  console.log(`数据键: ${args.key}`);
  console.log(`结果: ${report.ready ? '可切换到B默认策略' : '暂不建议切换B默认策略'}`);
  console.log(`评分: ${report.score}/${report.requiredScore}`);
  console.log(`指标: 总样本=${report.metrics.totalEvents}, 事件类型=${report.metrics.distinctNames}, 稳定事件=${report.metrics.qualifiedNames}, 近期样本=${report.metrics.recentEvents}`);
  for (const rule of report.rules) {
    console.log(`- ${rule.ok ? 'PASS' : 'FAIL'}: ${rule.text}`);
  }
  process.exit(report.ready ? 0 : 2);
}

main();
