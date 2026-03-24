import { useMemo, useState } from 'react';
import { useStorage } from '../../context/useStorage';

export function SupabaseAuthCard() {
  const { isSupabaseConfigured, authEmail, authLoading, sendLoginCode, signOut, syncNow } = useStorage();
  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return emailInput.trim().length > 0 && !submitting;
  }, [emailInput, submitting]);

  const handleSend = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const result = await sendLoginCode(emailInput);
    setStatus(result.message);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    setSubmitting(true);
    await signOut();
    setStatus('已退出登录');
    setSubmitting(false);
  };

  const handleSyncNow = async () => {
    setSubmitting(true);
    await syncNow();
    setStatus('已执行一次手动同步');
    setSubmitting(false);
  };

  if (!isSupabaseConfigured) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
        <strong>云同步未启用</strong>
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          请配置 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY
        </span>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260 }}>
        <strong>云同步</strong>
        <span style={{ fontSize: 12, opacity: 0.75 }}>正在检查登录状态...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 280 }}>
      <strong>Supabase 云同步</strong>
      {authEmail ? (
        <>
          <span style={{ fontSize: 12, opacity: 0.85 }}>当前账号：{authEmail}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSyncNow} disabled={submitting}>立即同步</button>
            <button type="button" onClick={handleSignOut} disabled={submitting}>退出登录</button>
          </div>
        </>
      ) : (
        <>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="输入你的邮箱，发送登录链接"
          />
          <button type="button" onClick={handleSend} disabled={!canSubmit}>
            发送登录邮件
          </button>
        </>
      )}
      {status && <span style={{ fontSize: 12, opacity: 0.75 }}>{status}</span>}
    </div>
  );
}
