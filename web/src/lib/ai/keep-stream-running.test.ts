import { streamText } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStreamMock } from "@/test-utils/mock-language-model";
import { keepStreamRunning } from "./keep-stream-running";

/** onFinish が呼ばれたら解決される Promise を作る */
function createFinishSignal() {
  let resolve!: () => void;
  const finished = new Promise<void>((r) => {
    resolve = r;
  });
  return { finished, onFinish: () => resolve() };
}

/** 一定時間のあいだ、Promise が解決されないことを確かめる */
async function staysPending(promise: Promise<void>, ms = 100) {
  const settled = await Promise.race([
    promise.then(() => true),
    new Promise<boolean>((r) => setTimeout(() => r(false), ms)),
  ]);
  return !settled;
}

describe("keepStreamRunning", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("応答の受け取りを途中でやめても（接続を切っても）、onFinish が最後まで呼ばれる", async () => {
    const { finished, onFinish } = createFinishSignal();
    const result = streamText({
      model: createStreamMock(["一つ目、", "二つ目、", "三つ目。"]),
      prompt: "テスト",
      onFinish,
    });

    void keepStreamRunning(result);
    const response = result.toUIMessageStreamResponse();

    // 最初のかたまりだけ読んで、利用者が接続を切った状況を再現する
    const reader = response.body?.getReader();
    await reader?.read();
    await reader?.cancel();

    await expect(
      Promise.race([
        finished.then(() => "finished"),
        new Promise((r) => setTimeout(() => r("timeout"), 3_000)),
      ])
    ).resolves.toBe("finished");
  });

  it("応答を一度も読まずに捨てても、onFinish が呼ばれる", async () => {
    const { finished, onFinish } = createFinishSignal();
    const result = streamText({
      model: createStreamMock(["テスト応答"]),
      prompt: "テスト",
      onFinish,
    });

    void keepStreamRunning(result);
    const response = result.toUIMessageStreamResponse();
    await response.body?.cancel();

    await expect(
      Promise.race([
        finished.then(() => "finished"),
        new Promise((r) => setTimeout(() => r("timeout"), 3_000)),
      ])
    ).resolves.toBe("finished");
  });

  it("最後まで普通に読んだ場合は、応答の内容が欠けず onFinish も 1 回だけ呼ばれる", async () => {
    const onFinish = vi.fn();
    const result = streamText({
      model: createStreamMock(["こんにちは、", "世界。"]),
      prompt: "テスト",
      onFinish,
    });

    const consumption = keepStreamRunning(result);
    const response = result.toUIMessageStreamResponse();
    const body = await response.text();
    await consumption;

    expect(body).toContain("こんにちは、");
    expect(body).toContain("世界。");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("読み進めが終わると、返した Promise が解決される", async () => {
    const result = streamText({
      model: createStreamMock(["応答"]),
      prompt: "テスト",
    });

    const consumption = keepStreamRunning(result);
    result.toUIMessageStreamResponse();

    await expect(consumption).resolves.toBeUndefined();
  });

  it("モデルの呼び出しが失敗しても、例外を外に出さない", async () => {
    const result = streamText({
      model: new MockLanguageModelV3({
        doStream: async () => {
          throw new Error("provider error");
        },
      }),
      prompt: "テスト",
      onError: () => undefined,
    });

    const consumption = keepStreamRunning(result);
    result.toUIMessageStreamResponse();

    await expect(consumption).resolves.toBeUndefined();
  });

  it("リクエストの外（after() が使えない場所）で呼んでも例外にならない", () => {
    const result = streamText({
      model: createStreamMock(["応答"]),
      prompt: "テスト",
    });

    expect(() => keepStreamRunning(result)).not.toThrow();
  });
});

// 前提の確認用: 読み進めを任せなければ、切断時に onFinish は呼ばれない。
// このヘルパーが必要な理由そのものなので、AI SDK の挙動が変わって
// この前提が崩れたら（= ヘルパーが不要になったら）気づけるようにしておく
describe("keepStreamRunning が必要な理由（AI SDK の挙動の確認）", () => {
  it("keepStreamRunning を呼ばないと、応答を途中でやめたとき onFinish は呼ばれない", async () => {
    const { finished, onFinish } = createFinishSignal();
    const result = streamText({
      model: createStreamMock(["一つ目、", "二つ目、", "三つ目。"]),
      prompt: "テスト",
      onFinish,
    });

    const response = result.toUIMessageStreamResponse();
    const reader = response.body?.getReader();
    await reader?.read();
    await reader?.cancel();

    expect(await staysPending(finished)).toBe(true);
  });
});
