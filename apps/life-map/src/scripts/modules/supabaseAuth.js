import { createClient } from '@supabase/supabase-js';
import {
    LIFE_MAP_SUPABASE_URL,
    LIFE_MAP_SUPABASE_ANON_KEY
} from '../config/supabase.js';

const supabaseEnabled = Boolean(LIFE_MAP_SUPABASE_URL && LIFE_MAP_SUPABASE_ANON_KEY);

const supabase = supabaseEnabled
    ? createClient(LIFE_MAP_SUPABASE_URL, LIFE_MAP_SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null;

function normalizeEmail(value) {
    return (value || '').trim().toLowerCase();
}

export function isSupabaseEnabled() {
    return supabaseEnabled;
}

export function getSupabaseClient() {
    return supabase;
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user ?? null;
}

export async function ensureOwnerSession() {
    if (!supabase) return null;
    const user = await getCurrentUser();
    if (user?.email) {
        return user;
    }

    const defaultEmail = normalizeEmail(localStorage.getItem('life_map_login_email') || '');
    const inputEmail = window.prompt('请输入登录邮箱（将发送魔法链接）', defaultEmail);
    const email = normalizeEmail(inputEmail || '');
    if (!email) return null;

    const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo }
    });

    if (error) {
        alert(`发送登录邮件失败：${error.message}`);
        return null;
    }

    localStorage.setItem('life_map_login_email', email);
    alert('登录邮件已发送，请在邮箱中点击登录链接后返回当前页面。');
    return null;
}
