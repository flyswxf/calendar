export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const baseRaw = process.env.KV_REST_API_URL || '';
  const token = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN;
  const base = baseRaw.replace(/^[\s"'`]+|[\s"'`]+$/g, '');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  if (!base || !token) {
    return new Response(JSON.stringify({ error: 'missing env' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const auth = `Bearer ${token}`;
  if (req.method === 'GET') {
    async function get(key) {
      const r = await fetch(`${base}/get/${encodeURIComponent(key)}`, { headers: { authorization: auth } });
      const j = await r.json();
      return j.result ? JSON.parse(j.result) : [];
    }
    const tasks = await get(`tasks:${userId}`);
    const courses = await get(`courses:${userId}`);
    const focusSessions = await get(`focus:${userId}`);
    return new Response(JSON.stringify({ tasks, courses, focusSessions }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (req.method === 'PUT') {
    if (process.env.KV_REST_API_READ_ONLY_TOKEN && !process.env.UPSTASH_REDIS_REST_TOKEN && !process.env.KV_REST_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'read-only token' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
    const body = await req.json();
    async function set(key, value) {
      return fetch(`${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, { method: 'POST', headers: { authorization: auth } });
    }
    await Promise.all([
      set(`tasks:${userId}`, JSON.stringify(body.tasks || [])),
      set(`courses:${userId}`, JSON.stringify(body.courses || [])),
      set(`focus:${userId}`, JSON.stringify(body.focusSessions || []))
    ]);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } });
}