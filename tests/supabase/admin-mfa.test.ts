import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupTestUser,
  createTestAdminUser,
  type TestUser,
} from "./utils";
import { generateTotp } from "./totp";

/**
 * 管理者の二段階認証（TOTP）を、ローカルの Supabase Auth で通して確かめる。
 * admin アプリの強制（AAL2 のときだけ通す）が前提にしている Supabase 側の挙動:
 * - パスワードだけのセッションは aal1、TOTP を確認すると aal2 になる
 * - 確認済みの要素があるとき、aal1 のまま別の要素を足したり消したりはできない
 * - 作りかけ（未確認）の要素は aal1 でも消して作り直せる
 * 前提: supabase/config.toml の [auth.mfa.totp] が enroll/verify とも true
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54421";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function newClient(): SupabaseClient {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(user: TestUser) {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`サインイン失敗: ${error.message}`);
  return client;
}

async function level(client: SupabaseClient) {
  const { data } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  return data;
}

/** 設定ページと同じ流れ: enroll → 6桁コードで challenge + verify */
async function enrollAndVerify(client: SupabaseClient, name = "admin-test") {
  const { data, error } = await client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: name,
  });
  if (error || !data) throw new Error(`enroll 失敗: ${error?.message}`);
  const { error: verifyError } = await client.auth.mfa.challengeAndVerify({
    factorId: data.id,
    code: generateTotp(data.totp.secret),
  });
  if (verifyError) throw new Error(`verify 失敗: ${verifyError.message}`);
  return data;
}

describe("管理者の二段階認証（TOTP）", () => {
  let user: TestUser;

  beforeEach(async () => {
    user = await createTestAdminUser();
  });
  afterEach(async () => {
    await cleanupTestUser(user.id);
  });

  it("パスワードだけのログインは aal1。TOTP を確認すると aal2 になる", async () => {
    const client = await signIn(user);
    expect(await level(client)).toMatchObject({
      currentLevel: "aal1",
      nextLevel: "aal1",
    });

    await enrollAndVerify(client);

    expect(await level(client)).toMatchObject({
      currentLevel: "aal2",
      nextLevel: "aal2",
    });
  });

  it("enroll は QR コード（SVG）と手入力用の secret を返す", async () => {
    const client = await signIn(user);
    const { data } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "admin-test",
      issuer: "みらい議会＠田川市 管理画面",
    });
    expect(data?.totp.qr_code).toMatch(/^data:image\/svg\+xml/);
    expect(data?.totp.secret).toMatch(/^[A-Z2-7]+$/);
    expect(data?.totp.uri).toContain("otpauth://totp/");
  });

  it("設定済みの管理者が新しくログインすると aal1（次は aal2 が必要）で、確認で aal2 になる", async () => {
    const first = await signIn(user);
    const factor = await enrollAndVerify(first);

    const second = await signIn(user);
    expect(await level(second)).toMatchObject({
      currentLevel: "aal1",
      nextLevel: "aal2",
    });
    const { data: factors } = await second.auth.mfa.listFactors();
    expect(factors?.totp.map((f) => f.id)).toEqual([factor.id]);

    const { error } = await second.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: generateTotp(factor.totp.secret),
    });
    expect(error).toBeNull();
    expect((await level(second))?.currentLevel).toBe("aal2");
  });

  it("間違ったコードでは aal2 にならない", async () => {
    const first = await signIn(user);
    const factor = await enrollAndVerify(first);

    const second = await signIn(user);
    const { error } = await second.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: "000000",
    });
    expect(error?.code).toBe("mfa_verification_failed");
    expect((await level(second))?.currentLevel).toBe("aal1");
  });

  it("確認済みの要素があるとき、aal1 のままでは別の要素を足せない・消せない（パスワードだけで乗っ取れない）", async () => {
    const first = await signIn(user);
    const factor = await enrollAndVerify(first);

    const attacker = await signIn(user);
    const enroll = await attacker.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "attacker",
    });
    expect(enroll.error?.code).toBe("insufficient_aal");

    const unenroll = await attacker.auth.mfa.unenroll({ factorId: factor.id });
    expect(unenroll.error?.code).toBe("insufficient_aal");
  });

  it("作りかけ（未確認）の要素は aal1 でも消して、作り直せる", async () => {
    const client = await signIn(user);
    const first = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "admin-1",
    });
    expect(first.error).toBeNull();

    const { data: factors } = await client.auth.mfa.listFactors();
    expect(factors?.all.map((f) => f.status)).toEqual(["unverified"]);
    expect(factors?.totp).toEqual([]); // totp は確認済みだけ

    for (const f of factors?.all ?? []) {
      expect(
        (await client.auth.mfa.unenroll({ factorId: f.id })).error
      ).toBeNull();
    }
    const second = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "admin-2",
    });
    expect(second.error).toBeNull();
    expect(second.data?.id).not.toBe(first.data?.id);
  });

  it("名前が空の要素を2つ作ると衝突する（設定ページは毎回ユニークな名前を付ける）", async () => {
    const client = await signIn(user);
    await client.auth.mfa.enroll({ factorType: "totp" });
    const again = await client.auth.mfa.enroll({ factorType: "totp" });
    expect(again.error?.code).toBe("mfa_factor_name_conflict");
  });

  it("復旧: service role で要素を消すと、次のログインは設定からやり直せる", async () => {
    const first = await signIn(user);
    await enrollAndVerify(first);

    const { data: list } = await adminClient.auth.admin.mfa.listFactors({
      userId: user.id,
    });
    expect(list?.factors).toHaveLength(1);
    for (const f of list?.factors ?? []) {
      const { error } = await adminClient.auth.admin.mfa.deleteFactor({
        id: f.id,
        userId: user.id,
      });
      expect(error).toBeNull();
    }

    const again = await signIn(user);
    const { data: factors } = await again.auth.mfa.listFactors();
    expect(factors?.all).toEqual([]);
    expect(await level(again)).toMatchObject({
      currentLevel: "aal1",
      nextLevel: "aal1",
    });
    await enrollAndVerify(again, "admin-after-reset");
    expect((await level(again))?.currentLevel).toBe("aal2");
  });
});
