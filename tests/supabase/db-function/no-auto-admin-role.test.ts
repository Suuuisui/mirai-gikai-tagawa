import { afterEach, describe, expect, it } from "vitest";
import { adminClient, cleanupTestUser, getAnonClient } from "../utils";

/**
 * 上流から入っていた「@team-mir.ai の Google ログインは自動で admin」の仕組みは
 * 20261022010000 で取り除いた。ユーザーを作っても admin ロールが付かないこと、
 * 関数が残っていないことを確かめる
 */
describe("ユーザー作成時に admin ロールを自動で付けない", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const id of createdUserIds) {
      await cleanupTestUser(id);
    }
    createdUserIds.length = 0;
  });

  it("team-mir.ai + Google ログインのユーザーにも admin ロールは付かない", async () => {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: `test-google-${Date.now()}@team-mir.ai`,
      email_confirm: true,
      app_metadata: { provider: "google", providers: ["google"] },
    });
    if (error) throw new Error(`ユーザー作成失敗: ${error.message}`);
    createdUserIds.push(data.user.id);

    const { data: fetched, error: fetchError } =
      await adminClient.auth.admin.getUserById(data.user.id);
    expect(fetchError).toBeNull();
    expect(fetched.user?.app_metadata?.roles).toBeUndefined();
  });

  it("apply_admin_role_if_eligible は service_role からも公開キーからも呼べない（削除済み）", async () => {
    const targetUserId = "00000000-0000-0000-0000-000000000000";

    const { error: adminError } = await adminClient.rpc(
      // biome-ignore lint/suspicious/noExplicitAny: 削除済みの関数を呼ぶため型定義に無い
      "apply_admin_role_if_eligible" as any,
      { target_user_id: targetUserId }
    );
    expect(adminError).not.toBeNull();

    const { error: anonError } = await getAnonClient().rpc(
      // biome-ignore lint/suspicious/noExplicitAny: 削除済みの関数を呼ぶため型定義に無い
      "apply_admin_role_if_eligible" as any,
      { target_user_id: targetUserId }
    );
    expect(anonError).not.toBeNull();
  });
});
