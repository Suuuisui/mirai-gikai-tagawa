import { cookies } from "next/headers";
import type { DifficultyLevelEnum } from "../../shared/types";

/**
 * 現在の難易度設定を取得
 * Server Componentsから呼び出される読み取り専用の関数
 *
 * Note: 田川市版では hard 用の bill_contents を用意していないため、
 * 常に "normal" を返す。トグル公開時に保存された Cookie
 * （bill_difficulty_level=hard）が残っているブラウザで、
 * bill_contents!inner 結合により全議案が空表示になる不具合を防ぐ。
 * hard コンテンツを整備して難易度トグルを再有効化する際は、
 * Cookie から取得する実装（git履歴参照）に戻すこと。
 *
 * cookies() の呼び出しは、この関数を経由するページ（sitemap.xml 含む）の
 * 動的レンダリング特性を従来どおり維持するために残している。
 * 外すとビルド時プリレンダリングに変わり、DB接続のないCI環境で
 * next build が失敗する。
 */
export async function getDifficultyLevel(): Promise<DifficultyLevelEnum> {
  await cookies();
  return "normal";
}
