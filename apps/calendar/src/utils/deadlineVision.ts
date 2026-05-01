export type VisionProvider = 'google' | 'openrouter';

export interface VisionRequestConfig {
  provider: VisionProvider;
  apiKey: string;
  model?: string;
}

export interface VisionDeadlineDraft {
  title: string;
  dueAt?: string;
  courseName?: string;
  description?: string;
  confidence?: number;
  rawText?: string;
}

const PROMPT = `你是一名中文课堂作业识别助手。请从图片中提取作业截止信息，只能输出一个 JSON 对象，不要输出 markdown，不要输出解释文字。
JSON结构如下：
{
  "title": "作业标题，若无法判断则写未命名作业",
  "dueAt": "ISO时间字符串，例如 2026-03-10T23:59:00+08:00，无法判断可为空字符串",
  "courseName": "课程名，无法判断可为空字符串",
  "description": "简要要求",
  "confidence": 0到1之间的小数,
  "rawText": "图片中与作业有关的关键原文"
}
如果图片没有作业内容，title请写未命名作业，dueAt留空，confidence给0.2。`;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/, '')
    .replace(/```$/, '')
    .trim();
}

function pickJsonText(raw: string): string {
  const cleaned = stripCodeFence(raw);
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return cleaned;
  return cleaned.slice(first, last + 1);
}

function normalizeDueAt(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function parseDraft(text: string): VisionDeadlineDraft {
  const jsonText = pickJsonText(text);
  const parsed = JSON.parse(jsonText) as Partial<VisionDeadlineDraft>;
  const title = (parsed.title || '').trim() || '未命名作业';
  return {
    title,
    dueAt: normalizeDueAt(parsed.dueAt),
    courseName: parsed.courseName?.trim() || undefined,
    description: parsed.description?.trim() || undefined,
    confidence:
      typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : undefined,
    rawText: parsed.rawText?.trim() || undefined,
  };
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      const comma = value.indexOf(',');
      if (comma === -1) {
        reject(new Error('图片数据格式无效'));
        return;
      }
      resolve(value.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function callGoogle(file: File, apiKey: string, model: string): Promise<string> {
  const base64 = await fileToBase64(file);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            {
              inline_data: {
                mime_type: file.type || 'image/jpeg',
                data: base64,
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    }),
  });
  if (!response.ok) throw new Error(`Google API 调用失败: ${response.status}`);
  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  if (!text.trim()) throw new Error('Google API 未返回可解析内容');
  return text;
}

async function callOpenRouter(file: File, apiKey: string, model: string): Promise<string> {
  const base64 = await fileToBase64(file);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: `data:${file.type || 'image/jpeg'};base64,${base64}`,
              },
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenRouter API 调用失败: ${response.status}`);
  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content || '';
  if (!text.trim()) throw new Error('OpenRouter 未返回可解析内容');
  return text;
}

export async function extractDeadlineFromImageByModel(
  file: File,
  config: VisionRequestConfig,
): Promise<VisionDeadlineDraft> {
  if (!config.apiKey.trim()) throw new Error('请先填写模型 API Key');
  const model =
    config.model?.trim() || (config.provider === 'google' ? 'gemini-2.5-flash' : 'openrouter/free');
  const raw =
    config.provider === 'google'
      ? await callGoogle(file, config.apiKey.trim(), model)
      : await callOpenRouter(file, config.apiKey.trim(), model);
  return parseDraft(raw);
}
