-- 上流（政党チームみらい）から入っていた「@team-mir.ai の Google ログインのユーザーは
-- 自動で admin にする」仕組みを取り除く（20260427100000 で追加されたもの）。
-- 田川市版は有志団体「田川市政ラボ」が運営し、管理者は admin 画面から招待する。
-- 本番の Supabase は Google ログインが無効なので今は動かないが、将来 Google ログインを
-- 有効にした時点で、他団体のアカウントに管理権限が自動で付くのを防ぐ（2026-10-22 のセキュリティ点検）。
drop trigger if exists on_auth_user_created_set_admin_role on auth.users;
drop function if exists public.handle_google_workspace_admin_role();
drop function if exists public.apply_admin_role_if_eligible(uuid);
