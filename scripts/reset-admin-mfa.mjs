/**
 * 管理者の二段階認証（TOTP）の要素をすべて消す。認証アプリ（スマホ）をなくした・
 * 機種変更で移せなかったときの復旧用。
 *
 * 消したあと、その管理者は次にパスワードでログインすると「二段階認証の設定」
 * ページに進むので、新しい認証アプリで設定し直せる。
 *
 * 安全のため、app_metadata.roles に admin を持つユーザーにしか使えない。
 * 実行には service role（SUPABASE_SECRET_KEY）が要るので、持ち主本人が手元で実行する。
 *
 * 注意:
 * - すでに発行済みのログイン（アクセストークン）は最長 1 時間ほど有効のまま残る。
 *   第三者に入られた疑いがあるときは、パスワードも変更し、Supabase ダッシュボードの
 *   Authentication > Users から該当ユーザーを「Sign out」すること
 * - 管理画面に入れなくなった原因が二段階認証のページの不具合なら、これではなく
 *   Vercel の環境変数 ADMIN_MFA_REQUIRED=false（再デプロイが要る）で一時的に外せる
 *
 * 使い方:
 *   # 何が消えるか確認するだけ（消さない）
 *   DRY_RUN=1 npx dotenv-cli -e <envファイル> -- node scripts/reset-admin-mfa.mjs admin@example.com
 *   # 消す
 *   npx dotenv-cli -e <envファイル> -- node scripts/reset-admin-mfa.mjs admin@example.com
 *
 * envファイルには SUPABASE_URL（または NEXT_PUBLIC_SUPABASE_URL）と
 * SUPABASE_SECRET_KEY が要る（本番は旧 service_role JWT を使う）
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SECRET_KEY が未設定です");
  process.exit(1);
}
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("usage: node scripts/reset-admin-mfa.mjs <管理者のメールアドレス>");
  process.exit(1);
}
const dryRun = Boolean(process.env.DRY_RUN);

const supabase = createClient(url, key, { auth: { persistSession: false } });

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** メールアドレスからユーザーを探す（admin API にメールでの検索が無いので全件を順に見る） */
async function findUserByEmail(target) {
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) fail(`ユーザー一覧の取得に失敗: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
}

const user = await findUserByEmail(email);
if (!user) fail(`ユーザーが見つかりません: ${email}`);

const roles = user.app_metadata?.roles ?? [];
if (!roles.includes("admin")) {
  fail(`${email} は管理者（roles に admin）ではないので、何もしません`);
}

const { data, error } = await supabase.auth.admin.mfa.listFactors({
  userId: user.id,
});
if (error) fail(`要素の取得に失敗: ${error.message}`);
const factors = data.factors ?? [];

console.log(`${email}（${user.id}）の二段階認証の要素: ${factors.length} 件`);
for (const f of factors) {
  console.log(`  - ${f.factor_type} / ${f.status} / ${f.friendly_name || "(名前なし)"} / ${f.id}`);
}

if (factors.length === 0) {
  console.log("消すものはありません");
  process.exit(0);
}
if (dryRun) {
  console.log("DRY_RUN のため消しません");
  process.exit(0);
}

for (const f of factors) {
  const { error: deleteError } = await supabase.auth.admin.mfa.deleteFactor({
    id: f.id,
    userId: user.id,
  });
  if (deleteError) fail(`要素 ${f.id} の削除に失敗: ${deleteError.message}`);
  console.log(`削除しました: ${f.id}`);
}
console.log(
  "完了。次にパスワードでログインすると、二段階認証の設定ページが開きます"
);
