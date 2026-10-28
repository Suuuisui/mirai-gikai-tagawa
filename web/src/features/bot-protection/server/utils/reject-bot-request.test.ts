import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOT_BLOCKED_MESSAGE,
  BOT_CHECK_FAILED_MESSAGE,
  type BotCheck,
  rejectBotRequest,
} from "./reject-bot-request";

const human: BotCheck = async () => ({ isBot: false });
const bot: BotCheck = async () => ({ isBot: true });

describe("rejectBotRequest", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("人と判定されたとき", () => {
    it("断るレスポンスを作らず null を返す（続きの処理に進んでよい）", async () => {
      await expect(rejectBotRequest({ check: human })).resolves.toBeNull();
    });

    it("isBot が返ってこなくても人として通す（BotID は人のとき isBot を省くことがある）", async () => {
      await expect(
        rejectBotRequest({ check: async () => ({}) })
      ).resolves.toBeNull();
    });

    it("ログを出さない", async () => {
      await rejectBotRequest({ check: human });
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("ボットと判定されたとき", () => {
    it("403 と日本語の文言を、文言だけの本文で返す（useChat・useObject がそのまま画面に出す）", async () => {
      const res = await rejectBotRequest({ check: bot });

      expect(res).not.toBeNull();
      expect(res?.status).toBe(403);
      expect(res?.headers.get("Content-Type")).toBe(
        "text/plain; charset=utf-8"
      );
      expect(await res?.text()).toBe(BOT_BLOCKED_MESSAGE);
    });

    it("format: json なら { error: 文言 } の JSON で返す（完了 API のクライアントは error を読む）", async () => {
      const res = await rejectBotRequest({ check: bot, format: "json" });

      expect(res?.status).toBe(403);
      expect(res?.headers.get("Content-Type")).toBe("application/json");
      expect(await res?.json()).toEqual({ error: BOT_BLOCKED_MESSAGE });
    });

    it("判定は 1 回だけ行う", async () => {
      const check = vi.fn(bot);
      await rejectBotRequest({ check });
      expect(check).toHaveBeenCalledTimes(1);
    });

    it("文言は利用者が次にすることを含む", () => {
      expect(BOT_BLOCKED_MESSAGE).toContain("再読み込み");
    });
  });

  describe("判定そのものに失敗したとき", () => {
    const failing: BotCheck = async () => {
      throw new Error(
        "The 'x-vercel-oidc-token' header is missing from the request."
      );
    };

    it("通さずに 503 を返す（ボットでないと確かめられないので止める）", async () => {
      const res = await rejectBotRequest({ check: failing });

      expect(res?.status).toBe(503);
      expect(await res?.text()).toBe(BOT_CHECK_FAILED_MESSAGE);
    });

    it("format: json でも 503 を { error: 文言 } で返す", async () => {
      const res = await rejectBotRequest({ check: failing, format: "json" });

      expect(res?.status).toBe(503);
      expect(await res?.json()).toEqual({ error: BOT_CHECK_FAILED_MESSAGE });
    });

    it("原因はサーバーのログにだけ残し、利用者への本文には出さない", async () => {
      const res = await rejectBotRequest({ check: failing });

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(await res?.text()).not.toContain("oidc");
    });

    it("Error でない値が投げられても 503 にする", async () => {
      const res = await rejectBotRequest({
        check: async () => {
          throw "timeout";
        },
      });

      expect(res?.status).toBe(503);
    });
  });
});
