// next.config.ts（web / admin 共通）の images.remotePatterns に入れる、
// 自分の Supabase プロジェクトの画像だけを許可する設定を作る。
//
// next.config.ts は Next.js が単体で読み込むため、他のファイルと同じ TypeScript の
// ESM ではなく、どの Node でもそのまま読める CommonJS（.cjs）で書いている。
// web と admin で同じコードを重複させないよう、共通パッケージに置いて相対パスで読み込む。

/** Supabase のホスティング版（https://<プロジェクト ID>.supabase.co）のホスト名 */
const HOSTED_SUPABASE_HOSTNAME = /^[a-z0-9-]+\.supabase\.co$/i;

/** 議案のサムネイル画像を置いている Storage の公開バケットのパス */
const BILL_THUMBNAILS_PATHNAME = "/storage/v1/object/public/bill-thumbnails/**";

/**
 * NEXT_PUBLIC_SUPABASE_URL から、ホスティング版 Supabase のホスト名を取り出す。
 * 未設定・URL として読めない・ホスティング版（*.supabase.co）でない場合
 * （ローカルの 127.0.0.1 など）は null。
 *
 * @param {string | null | undefined} supabaseUrl
 * @returns {string | null}
 */
function getHostedSupabaseHostname(supabaseUrl) {
  if (!supabaseUrl) {
    return null;
  }

  let hostname;
  try {
    hostname = new URL(supabaseUrl).hostname;
  } catch {
    return null;
  }

  return HOSTED_SUPABASE_HOSTNAME.test(hostname) ? hostname.toLowerCase() : null;
}

/**
 * images.remotePatterns に追加する、自分の Supabase プロジェクトの画像だけを許可する設定。
 *
 * 以前は `*.supabase.co` をすべて許可していたため、他人の Supabase プロジェクトの画像まで
 * `/_next/image` 経由で最適化（取得・変換・キャッシュ）させられた。ビルド時に環境変数から
 * 読んだ自分のプロジェクトのホスト名だけを許可する。
 * ホスティング版でない場合（環境変数なし・ローカル）は空配列で、ローカル用の固定の設定
 * （127.0.0.1）だけが使われる。
 *
 * @param {string | null | undefined} supabaseUrl
 * @returns {Array<{ protocol: "https"; hostname: string; port: string; pathname: string }>}
 */
function buildSupabaseImageRemotePatterns(supabaseUrl) {
  const hostname = getHostedSupabaseHostname(supabaseUrl);
  if (!hostname) {
    return [];
  }

  return [
    {
      protocol: "https",
      hostname,
      // 443（https の既定ポート）だけを許可する
      port: "",
      pathname: BILL_THUMBNAILS_PATHNAME,
    },
  ];
}

module.exports = {
  getHostedSupabaseHostname,
  buildSupabaseImageRemotePatterns,
};
