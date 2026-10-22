import { describe, expect, it } from "vitest";
import {
  type InterviewChatContextLoaders,
  resolveInterviewChatContext,
} from "./resolve-interview-chat-context";

type FakeBill = { name: string };
type FakeConfig = { id: string; label: string };

const BILL_ID = "11111111-2222-3333-4444-555555555555";
const OTHER_BILL_ID = "99999999-2222-3333-4444-555555555555";
const VALID_TOKEN = "valid-preview-token";

const publicBill: FakeBill = { name: "公開中の議案" };
const publicConfig: FakeConfig = { id: "cfg-public", label: "公開中の設定" };
const draftBill: FakeBill = { name: "下書きの議案" };
const privateConfig: FakeConfig = { id: "cfg-private", label: "非公開の設定" };

/**
 * 取得元ごとの呼び出しを記録する、DI 用のフェイク。
 * - 公開側は publicBill / publicConfig（引数で null にもできる）
 * - 管理側は下書きの議案・非公開の設定を返す（公開状態を問わないため）
 * - トークンは「VALID_TOKEN と BILL_ID の組み合わせ」だけ有効
 */
function createLoaders(
  options: {
    publicBill?: FakeBill | null;
    publicConfig?: FakeConfig | null;
    adminBill?: FakeBill | null;
    adminConfig?: FakeConfig | null;
  } = {}
) {
  const calls: string[] = [];
  const loaders: InterviewChatContextLoaders<FakeBill, FakeConfig> = {
    validatePreviewToken: async (billId, token) => {
      calls.push(`validate:${billId}:${token}`);
      return billId === BILL_ID && token === VALID_TOKEN;
    },
    getPublicBill: async () => {
      calls.push("public-bill");
      return options.publicBill === undefined ? publicBill : options.publicBill;
    },
    getPublicInterviewConfig: async () => {
      calls.push("public-config");
      return options.publicConfig === undefined
        ? publicConfig
        : options.publicConfig;
    },
    getAdminBill: async () => {
      calls.push("admin-bill");
      return options.adminBill === undefined ? draftBill : options.adminBill;
    },
    getAdminInterviewConfig: async () => {
      calls.push("admin-config");
      return options.adminConfig === undefined
        ? privateConfig
        : options.adminConfig;
    },
  };
  return { loaders, calls };
}

describe("resolveInterviewChatContext", () => {
  describe("通常（プレビュー用トークンなし）", () => {
    it("公開中の議案と公開中の設定を返す。管理側の取得は呼ばない", async () => {
      const { loaders, calls } = createLoaders();

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        loaders,
      });

      expect(context).toEqual({
        bill: publicBill,
        interviewConfig: publicConfig,
        isPreview: false,
      });
      expect(calls.sort()).toEqual(["public-bill", "public-config"]);
    });

    it("議案が公開されていなければ（下書き）、管理側に下書きがあっても null", async () => {
      const { loaders, calls } = createLoaders({ publicBill: null });

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        loaders,
      });

      expect(context).toBeNull();
      expect(calls).not.toContain("admin-bill");
      expect(calls).not.toContain("admin-config");
    });

    it("インタビュー設定が公開中でなければ（非公開）、管理側に設定があっても null", async () => {
      const { loaders, calls } = createLoaders({ publicConfig: null });

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        loaders,
      });

      expect(context).toBeNull();
      expect(calls).not.toContain("admin-bill");
      expect(calls).not.toContain("admin-config");
    });

    it("プレビュー用トークンの検証は行わない", async () => {
      const { loaders, calls } = createLoaders();

      await resolveInterviewChatContext({ billId: BILL_ID, loaders });

      expect(calls.some((call) => call.startsWith("validate:"))).toBe(false);
    });

    it("空文字のトークンは、トークンなしとして扱う", async () => {
      const { loaders, calls } = createLoaders({ publicBill: null });

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        previewToken: "",
        loaders,
      });

      expect(context).toBeNull();
      expect(calls.some((call) => call.startsWith("validate:"))).toBe(false);
      expect(calls).not.toContain("admin-bill");
    });
  });

  describe("プレビュー用トークンあり", () => {
    it("有効なトークンなら、公開前（下書きの議案・非公開の設定）も使える", async () => {
      const { loaders, calls } = createLoaders({
        publicBill: null,
        publicConfig: null,
      });

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        previewToken: VALID_TOKEN,
        loaders,
      });

      expect(context).toEqual({
        bill: draftBill,
        interviewConfig: privateConfig,
        isPreview: true,
      });
      expect(calls).toContain(`validate:${BILL_ID}:${VALID_TOKEN}`);
      expect(calls).not.toContain("public-bill");
      expect(calls).not.toContain("public-config");
    });

    it("有効なトークンでも、管理側で議案か設定が見つからなければ null", async () => {
      expect(
        await resolveInterviewChatContext({
          billId: BILL_ID,
          previewToken: VALID_TOKEN,
          loaders: createLoaders({ adminBill: null }).loaders,
        })
      ).toBeNull();
      expect(
        await resolveInterviewChatContext({
          billId: BILL_ID,
          previewToken: VALID_TOKEN,
          loaders: createLoaders({ adminConfig: null }).loaders,
        })
      ).toBeNull();
    });

    it("無効なトークン（存在しない・期限切れ）は、公開中のものだけを使う", async () => {
      const { loaders, calls } = createLoaders();

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        previewToken: "wrong-token",
        loaders,
      });

      // エラーにはせず、公開中のものを返す（古いプレビュー URL でも公開後は使える）
      expect(context).toEqual({
        bill: publicBill,
        interviewConfig: publicConfig,
        isPreview: false,
      });
      expect(calls).not.toContain("admin-bill");
      expect(calls).not.toContain("admin-config");
    });

    it("無効なトークンで、議案が未公開なら null（下書きは見せない）", async () => {
      const { loaders, calls } = createLoaders({ publicBill: null });

      const context = await resolveInterviewChatContext({
        billId: BILL_ID,
        previewToken: "wrong-token",
        loaders,
      });

      expect(context).toBeNull();
      expect(calls).not.toContain("admin-bill");
    });

    it("別の議案のトークンでは、その議案の下書きは使えない", async () => {
      // VALID_TOKEN は BILL_ID のトークン。OTHER_BILL_ID に対しては無効
      const { loaders, calls } = createLoaders({
        publicBill: null,
        publicConfig: null,
      });

      const context = await resolveInterviewChatContext({
        billId: OTHER_BILL_ID,
        previewToken: VALID_TOKEN,
        loaders,
      });

      expect(context).toBeNull();
      expect(calls).toContain(`validate:${OTHER_BILL_ID}:${VALID_TOKEN}`);
      expect(calls).not.toContain("admin-bill");
      expect(calls).not.toContain("admin-config");
    });
  });
});
