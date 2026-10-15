/**
 * `seed:csv` は対象テーブルを全消去してから入れ直す（interview_sessions・chats などの
 * 市民の回答も消える）。本番など localhost 以外の DB に誤って流さないための安全装置。
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export const ALLOW_REMOTE_FLAG = "SEED_CSV_ALLOW_REMOTE";

/** URL が localhost（および *.localhost）を指すか。解釈できない値はローカル扱いにしない */
export function isLocalSupabaseUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const { hostname } = new URL(rawUrl);
    return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

/**
 * 実行してよければ null、止めるべきならその理由を返す。
 * localhost 以外は SEED_CSV_ALLOW_REMOTE=1 を明示したときだけ許可する。
 */
export function checkSeedTarget(
  rawUrl: string | undefined,
  env: Record<string, string | undefined>
): string | null {
  if (!rawUrl) return "SUPABASE_URL が未設定です";
  if (isLocalSupabaseUrl(rawUrl)) return null;
  if (env[ALLOW_REMOTE_FLAG] === "1") return null;
  let host = rawUrl;
  try {
    host = new URL(rawUrl).hostname;
  } catch {}
  return `接続先 ${host} は localhost ではありません。seed:csv は全テーブルを消去して入れ直すため、本番では使えません（会期の追加・更新は scripts/upsert-sessions.mjs を使う）。どうしても実行する場合は ${ALLOW_REMOTE_FLAG}=1 を付けてください`;
}
