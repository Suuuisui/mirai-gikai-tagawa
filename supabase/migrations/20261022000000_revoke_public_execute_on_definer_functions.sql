-- SECURITY DEFINER の関数は関数の所有者の権限で動き、RLS を通らずに表を書き換えられる。
-- Supabase の既定では public スキーマの関数に anon / authenticated の EXECUTE が付くため、
-- 公開キー（ブラウザに出ている publishable key）や匿名ログインのユーザーからも
-- POST /rest/v1/rpc/<関数名> で呼べてしまう（2026-10-22 の点検で set_active_diet_session が
-- 公開キーだけで実行できることを確認した）。
-- アプリ・スクリプトはどちらも service_role（createAdminClient / SUPABASE_SECRET_KEY）で
-- 呼んでいるので、service_role だけに実行を許す。

-- 「アクティブな会期」を1件だけ true にする（admin の会期管理・scripts/upsert-sessions.mjs が使う）
revoke execute on function public.set_active_diet_session(uuid) from public, anon, authenticated;
grant execute on function public.set_active_diet_session(uuid) to service_role;

-- 指定ユーザーに admin ロールを付ける（auth.users の INSERT トリガーから呼ばれる。
-- トリガー関数は SECURITY DEFINER で所有者として呼ぶので、ここでの取り消しの影響を受けない）
revoke execute on function public.apply_admin_role_if_eligible(uuid) from public, anon, authenticated;
grant execute on function public.apply_admin_role_if_eligible(uuid) to service_role;
