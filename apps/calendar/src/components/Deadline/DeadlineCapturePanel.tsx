/**
 * 作业截止事件管理面板
 * 支持多模态模型识别图片 / 超星文本 / 手动录入
 * 保存后自动生成 DeadlineEvent + 对应待办任务
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStorage } from '../../context/StorageContext';
import { DeadlineEvent, DeadlineSource, Task } from '../../types';
import { escapeICS, pad } from '../../utils/time';
import { parseDeadlineDraft } from '../../utils/deadlineParser';
import { extractDeadlineFromImageByModel, VisionProvider } from '../../utils/deadlineVision';
import styles from './DeadlineCapturePanel.module.css';

/** ISO → datetime-local input 可用的字符串 */
function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 构建待办事项文本 */
function buildTaskText(title: string, dueAt: string): string {
  const d = new Date(dueAt);
  return `[DDL ${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}] ${title}`;
}

const sourceOptions: { value: DeadlineSource; label: string }[] = [
  { value: 'photo_ocr', label: '课堂拍照(模型识别)' },
  { value: 'chaoxing_text', label: '超星文本' },
  { value: 'manual', label: '手动录入' },
];

/** Date → 用于 ICS 导出的 UTC 时间串 */
function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export const DeadlineCapturePanel: React.FC = () => {
  const { deadlineEvents, setDeadlineEvents, setTasks } = useStorage();
  const notifiedRef = useRef<Set<string>>(
    new Set<string>(JSON.parse(localStorage.getItem('deadlineNotifiedIds') || '[]')),
  );

  // ---- 表单状态 ----
  const [inputMode, setInputMode] = useState<DeadlineSource>('photo_ocr');
  const [rawText, setRawText] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [visionProvider, setVisionProvider] = useState<VisionProvider>(
    () => (localStorage.getItem('deadlineVisionProvider') as VisionProvider) || 'google',
  );
  const [visionApiKey, setVisionApiKey] = useState(() => {
    if (localStorage.getItem('deadlineVisionApiKey'))
      return localStorage.getItem('deadlineVisionApiKey') || '';
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_API_KEY)
      return import.meta.env.VITE_GOOGLE_API_KEY as string;
    return '';
  });
  const [title, setTitle] = useState('');
  const [courseName, setCourseName] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');
  const [confidence, setConfidence] = useState(0.9);
  const [message, setMessage] = useState('');

  const upcomingCount = useMemo(
    () => deadlineEvents.filter((e) => !e.completed && new Date(e.dueAt).getTime() >= Date.now()).length,
    [deadlineEvents],
  );

  // 持久化模型参数
  useEffect(() => {
    localStorage.setItem('deadlineVisionProvider', visionProvider);
  }, [visionProvider]);
  useEffect(() => {
    localStorage.setItem('deadlineVisionApiKey', visionApiKey);
  }, [visionApiKey]);

  // 截止前 1 小时系统通知提醒
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const candidate = deadlineEvents.find((e) => {
        if (e.completed || notifiedRef.current.has(e.id)) return false;
        const due = new Date(e.dueAt).getTime();
        return due > now && due - now <= oneHour;
      });
      if (!candidate) return;
      notifiedRef.current.add(candidate.id);
      localStorage.setItem('deadlineNotifiedIds', JSON.stringify([...notifiedRef.current]));
      new Notification(`作业即将截止：${candidate.title}`, {
        body: `截止时间 ${new Date(candidate.dueAt).toLocaleString()}${candidate.courseName ? ` ｜ ${candidate.courseName}` : ''}`,
      });
    }, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [deadlineEvents]);

  /** 解析文本 → 填充表单 */
  const applyDraftFromText = (text: string, source: DeadlineSource) => {
    const draft = parseDeadlineDraft(text, source);
    if (!draft) {
      setMessage('未能识别到明确的截止时间，请手动补充。');
      if (!title) setTitle('未命名作业');
      if (!dueAt) setDueAt(toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000).toISOString()));
      return;
    }
    setTitle(draft.title);
    setCourseName(draft.courseName || '');
    setDueAt(toLocalInputValue(draft.dueAt));
    setDescription(draft.description || '');
    setConfidence(draft.confidence);
    setMessage('已自动提取候选截止信息，请确认后保存。');
  };

  const handleAnalyzeText = () => {
    if (!rawText.trim()) {
      setMessage('请先输入或粘贴作业文本。');
      return;
    }
    applyDraftFromText(rawText, inputMode);
  };

  /** 上传图片 → 多模态模型识别 */
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsOcrLoading(true);
    setMessage('正在调用多模态模型识别图片，请稍候...');
    try {
      const draft = await extractDeadlineFromImageByModel(file, {
        provider: visionProvider,
        apiKey: visionApiKey,
      });
      setTitle(draft.title);
      setCourseName(draft.courseName || '');
      setDueAt(
        draft.dueAt
          ? toLocalInputValue(draft.dueAt)
          : toLocalInputValue(new Date(Date.now() + 24 * 3600 * 1000).toISOString()),
      );
      setDescription(draft.description || '');
      setConfidence(draft.confidence ?? 0.85);
      setRawText(draft.rawText || '');
      setMessage('模型识别完成，请检查字段后保存。');
    } catch (error) {
      setMessage('模型识别失败，请检查 API Key 或网络。');
      console.error(error);
    } finally {
      setIsOcrLoading(false);
      event.target.value = '';
    }
  };

  /** 保存截止事件 + 同步创建待办任务 */
  const handleSave = () => {
    if (!title.trim() || !dueAt) {
      setMessage('请至少填写作业标题与截止时间。');
      return;
    }
    const dueDate = new Date(dueAt);
    if (Number.isNaN(dueDate.getTime())) {
      setMessage('截止时间格式无效。');
      return;
    }

    const eventItem: DeadlineEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      dueAt: dueDate.toISOString(),
      courseName: courseName.trim() || undefined,
      description: description.trim() || undefined,
      source: inputMode,
      confidence,
      createdAt: Date.now(),
      completed: false,
    };
    const taskItem: Task = {
      id: crypto.randomUUID(),
      text: buildTaskText(eventItem.title, eventItem.dueAt),
      completed: false,
      createdAt: Date.now(),
      isLegacy: false,
    };

    setDeadlineEvents((prev) =>
      [...prev, eventItem].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    );
    setTasks((prev) => [...prev, taskItem]);
    setMessage('已创建截止事件，并同步新增待办任务。');
    setTitle('');
    setCourseName('');
    setDueAt('');
    setDescription('');
    setRawText('');
    setConfidence(0.9);
  };

  /** 请求浏览器通知权限 */
  const handleRequestNotify = async () => {
    if (!('Notification' in window)) {
      setMessage('当前浏览器不支持系统通知。');
      return;
    }
    const permission = await Notification.requestPermission();
    setMessage(permission === 'granted' ? '已开启截止提醒通知。' : '未授予通知权限，无法弹出截止提醒。');
  };

  /** 导出截止事件为 ICS 文件 */
  const handleExportIcs = () => {
    const futureEvents = deadlineEvents.filter((e) => !e.completed);
    if (!futureEvents.length) {
      setMessage('暂无可导出的截止事件。');
      return;
    }
    const body = futureEvents
      .map((e) =>
        [
          'BEGIN:VEVENT',
          `UID:${e.id}@todo-list`,
          `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
          `DTSTART:${toIcsDate(e.dueAt)}`,
          `DTEND:${toIcsDate(new Date(new Date(e.dueAt).getTime() + 30 * 60 * 1000).toISOString())}`,
          `SUMMARY:${escapeICS(`作业截止｜${e.title}`)}`,
          `DESCRIPTION:${escapeICS(e.description || '')}`,
          'END:VEVENT',
        ].join('\r\n'),
      )
      .join('\r\n');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//todo_list//deadline//CN',
      body,
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deadlines-${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage('已导出截止事件到 ICS 文件。');
  };

  return (
    <div className={styles.panel}>
      {/* 标题行 */}
      <div className={styles.headerRow}>
        <div className={styles.headerTitle}>
          <h3>作业截止管理</h3>
          <p>支持多模态识图、超星文本和手动录入，保存后自动生成 deadline event。</p>
        </div>
        <span className={styles.countBadge}>待完成 {upcomingCount}</span>
      </div>

      {/* 数据来源 + 图片上传 + 解析按钮 */}
      <div className={styles.modeRow}>
        <label className={styles.inline}>
          数据来源
          <select
            value={inputMode}
            onChange={(e) => setInputMode(e.target.value as DeadlineSource)}
            className={`${styles.select} input-base`}
          >
            {sourceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.uploadBtn}>
          上传作业图片
          <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
        </label>
        <button className={styles.actionBtn} onClick={handleAnalyzeText} disabled={isOcrLoading}>
          解析文本
        </button>
      </div>

      {/* 模型通道 + API Key */}
      <div className={styles.modeRow}>
        <label className={styles.field}>
          模型通道
          <select
            className={`${styles.select} input-base`}
            value={visionProvider}
            onChange={(e) => setVisionProvider(e.target.value as VisionProvider)}
          >
            <option value="google">Google Gemini</option>
            <option value="openrouter">OpenRouter 免费模型</option>
          </select>
        </label>
        <label className={styles.field}>
          API Key
          <input
            type="password"
            className={`${styles.input} input-base`}
            value={visionApiKey}
            onChange={(e) => setVisionApiKey(e.target.value)}
            placeholder={visionProvider === 'google' ? '填入 Google API Key' : '填入 OpenRouter API Key'}
          />
        </label>
      </div>

      {/* 文本输入区 */}
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className={styles.textarea}
        placeholder="粘贴超星作业文本，或上传图片后由模型返回关键原文。"
      />

      {/* 表单：标题/课程/截止时间 */}
      <div className={styles.formGrid}>
        <label className={styles.field}>
          作业标题{' '}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${styles.input} input-base`}
          />
        </label>
        <label className={styles.field}>
          所属课程{' '}
          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className={`${styles.input} input-base`}
          />
        </label>
        <label className={styles.field}>
          截止时间{' '}
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className={`${styles.input} input-base`}
          />
        </label>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.textarea}
        placeholder="补充说明（如提交平台、文件要求等）"
      />

      {/* 操作按钮 */}
      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={isOcrLoading}>
          保存截止事件
        </button>
        <button className={styles.saveBtn} onClick={handleRequestNotify}>
          开启提醒
        </button>
        <button className={styles.saveBtn} onClick={handleExportIcs}>
          导出ICS
        </button>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  );
};
