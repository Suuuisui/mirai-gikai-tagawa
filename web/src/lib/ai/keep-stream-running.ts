import { after } from "next/server";

/** streamText の結果のうち、このヘルパーが使う部分 */
type ConsumableStreamResult = {
  consumeStream(options?: {
    onError?: (error: unknown) => void;
  }): PromiseLike<void>;
};

/**
 * streamText の結果を、クライアントが接続を切っても最後まで読み進めさせる。
 *
 * AI SDK のストリームは、読み手の速さに合わせて進む（バックプレッシャー）。
 * 利用者がブラウザを閉じるなどして応答の受け取りをやめると、ストリームが途中で止まり、
 * `onFinish`（利用額の記録・会話の保存）が呼ばれないまま終わってしまう。
 * 記録されない利用は 1 日・1 人・月の費用上限に数えられないため、接続を切るだけで
 * 上限をすり抜けられた。
 *
 * このヘルパーは応答を返す前に呼ぶ。別の読み手が最後まで読み続けるので、
 * 応答側が切断されても生成は最後まで進み、`onFinish` が必ず実行される。
 * 応答側（`toUIMessageStreamResponse()` など）は、これまでどおり別に作ってよい。
 *
 * - 呼び出し側は結果を待たなくてよい（待つと応答の返却が最後まで遅れる）
 * - 本番（Vercel）では `after()` に渡して、応答が終わったあとも関数が
 *   終了しないようにする。リクエストの外（テストなど）では `after()` が使えないので、
 *   その場合は読み進めるだけにする
 *
 * @returns 読み進めが終わると解決される Promise（途中のエラーでは reject しない）
 */
export function keepStreamRunning(
  result: ConsumableStreamResult
): Promise<void> {
  const consumption = Promise.resolve(
    result.consumeStream({
      onError: (error) => {
        console.error("[keepStreamRunning] stream ended with an error:", error);
      },
    })
  );

  try {
    after(consumption);
  } catch {
    // リクエストの外では after() が使えない。読み進めはすでに始まっている
  }

  return consumption;
}
