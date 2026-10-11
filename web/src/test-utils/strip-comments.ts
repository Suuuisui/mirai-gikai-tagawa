/**
 * 文字列リテラル（二重引用符・一重引用符・バッククォート）か、ブロックコメントか、行コメントにあたる部分。
 * 文字列リテラルを先に見つけるので、文字列の中の「//」（URL など）はコメントとして扱わない
 */
const STRING_OR_COMMENT =
  /("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

/**
 * ソースコードの文字列から、コメントを取り除く（文字列リテラルはそのまま残す）。
 * ソースを文字列のまま検査するテスト（page.tsx に書かれている呼び出しの確認など）で、
 * コメントに書かれた同じ文字に反応しないために使う。
 * 簡易な字句処理なので、正規表現リテラルや、テンプレートリテラルの中の入れ子までは扱わない
 */
export function stripComments(source: string): string {
  return source.replace(
    STRING_OR_COMMENT,
    (_match, stringLiteral: string | undefined) => stringLiteral ?? ""
  );
}
