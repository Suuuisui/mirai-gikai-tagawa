import { describe, expect, it } from "vitest";
import {
  type AdminRouteInput,
  AUTH_CALLBACK_PATH,
  decideAdminRoute,
  getMfaStepPath,
  getPostLoginPath,
} from "./route-gate";

/** 二段階認証が済んだ管理者（強制あり）を基準に、項目ごとに上書きして使う */
function input(overrides: Partial<AdminRouteInput> = {}): AdminRouteInput {
  return {
    pathname: "/bills",
    isAuthenticated: true,
    isAdmin: true,
    mfaRequired: true,
    currentLevel: "aal2",
    hasVerifiedTotpFactor: true,
    ...overrides,
  };
}

const NEXT = { type: "next" } as const;
const redirect = (pathname: string, error?: "unauthorized") =>
  error
    ? ({ type: "redirect", pathname, error } as const)
    : ({ type: "redirect", pathname } as const);

/** 管理画面（保護されたページ・Server Action の POST 先・内部 API）の代表的なパス */
const PROTECTED_PATHS = [
  "/",
  "/bills",
  "/bills/new",
  "/bills/0000/edit",
  "/homepage",
  "/admins",
  "/api/topic-analysis/run",
  "/api/batch/moderation-scoring",
  "/api/interview-config/generate",
];

describe("getMfaStepPath / getPostLoginPath", () => {
  it("手順に対応するページを返す", () => {
    expect(getMfaStepPath("enroll")).toBe("/mfa/setup");
    expect(getMfaStepPath("verify")).toBe("/mfa/verify");
  });

  it("ログイン後の行き先: 済んでいれば管理画面、途中なら二段階認証のページ", () => {
    expect(getPostLoginPath("none")).toBe("/bills");
    expect(getPostLoginPath("enroll")).toBe("/mfa/setup");
    expect(getPostLoginPath("verify")).toBe("/mfa/verify");
  });
});

describe("decideAdminRoute: 未ログイン", () => {
  const anonymous = { isAuthenticated: false, isAdmin: false };

  it("ログインページはそのまま見せる", () => {
    expect(
      decideAdminRoute(input({ ...anonymous, pathname: "/login" }))
    ).toEqual(NEXT);
  });

  it("OAuth コールバックはそのまま通す", () => {
    expect(
      decideAdminRoute(input({ ...anonymous, pathname: AUTH_CALLBACK_PATH }))
    ).toEqual(NEXT);
  });

  it("保護されたパスと二段階認証のページはログインへ", () => {
    for (const pathname of [...PROTECTED_PATHS, "/mfa/setup", "/mfa/verify"]) {
      expect(decideAdminRoute(input({ ...anonymous, pathname }))).toEqual(
        redirect("/login")
      );
    }
  });
});

describe("decideAdminRoute: ログイン済みだが管理者ではない", () => {
  const notAdmin = { isAdmin: false, currentLevel: "aal1" };

  it("ログインページは見せる（別のアカウントで入り直せる）", () => {
    expect(
      decideAdminRoute(input({ ...notAdmin, pathname: "/login" }))
    ).toEqual(NEXT);
  });

  it("AAL2 でも、保護されたパスと二段階認証のページは権限なしでログインへ", () => {
    for (const currentLevel of ["aal1", "aal2"]) {
      for (const pathname of [
        ...PROTECTED_PATHS,
        "/mfa/setup",
        "/mfa/verify",
      ]) {
        expect(
          decideAdminRoute(input({ isAdmin: false, currentLevel, pathname }))
        ).toEqual(redirect("/login", "unauthorized"));
      }
    }
  });

  it("OAuth コールバックは Route Handler が処理する", () => {
    expect(
      decideAdminRoute(input({ ...notAdmin, pathname: AUTH_CALLBACK_PATH }))
    ).toEqual(NEXT);
  });
});

describe("decideAdminRoute: 管理者・二段階認証が済んでいる（aal2）", () => {
  it("保護されたパスはそのまま通す", () => {
    for (const pathname of PROTECTED_PATHS) {
      expect(decideAdminRoute(input({ pathname }))).toEqual(NEXT);
    }
  });

  it("ログインページ・二段階認証のページを開いたら管理画面へ", () => {
    for (const pathname of ["/login", "/mfa/setup", "/mfa/verify"]) {
      expect(decideAdminRoute(input({ pathname }))).toEqual(redirect("/bills"));
    }
  });
});

describe("decideAdminRoute: 管理者・aal1・確認済みの要素なし（初めてのログイン）", () => {
  const firstLogin = { currentLevel: "aal1", hasVerifiedTotpFactor: false };

  it("保護されたパスは設定ページへ", () => {
    for (const pathname of PROTECTED_PATHS) {
      expect(decideAdminRoute(input({ ...firstLogin, pathname }))).toEqual(
        redirect("/mfa/setup")
      );
    }
  });

  it("設定ページはそのまま見せる", () => {
    expect(
      decideAdminRoute(input({ ...firstLogin, pathname: "/mfa/setup" }))
    ).toEqual(NEXT);
  });

  it("確認ページを開いたら設定ページへ（確認する要素がまだ無い）", () => {
    expect(
      decideAdminRoute(input({ ...firstLogin, pathname: "/mfa/verify" }))
    ).toEqual(redirect("/mfa/setup"));
  });

  it("ログインページを開いたら設定ページへ", () => {
    expect(
      decideAdminRoute(input({ ...firstLogin, pathname: "/login" }))
    ).toEqual(redirect("/mfa/setup"));
  });
});

describe("decideAdminRoute: 管理者・aal1・確認済みの要素あり（2 回目以降のログイン）", () => {
  const returning = { currentLevel: "aal1", hasVerifiedTotpFactor: true };

  it("保護されたパスは確認ページへ", () => {
    for (const pathname of PROTECTED_PATHS) {
      expect(decideAdminRoute(input({ ...returning, pathname }))).toEqual(
        redirect("/mfa/verify")
      );
    }
  });

  it("確認ページはそのまま見せる", () => {
    expect(
      decideAdminRoute(input({ ...returning, pathname: "/mfa/verify" }))
    ).toEqual(NEXT);
  });

  it("設定ページを開いたら確認ページへ（確認済みの要素があるのに新しい要素は作らせない）", () => {
    expect(
      decideAdminRoute(input({ ...returning, pathname: "/mfa/setup" }))
    ).toEqual(redirect("/mfa/verify"));
  });

  it("ログインページを開いたら確認ページへ", () => {
    expect(
      decideAdminRoute(input({ ...returning, pathname: "/login" }))
    ).toEqual(redirect("/mfa/verify"));
  });
});

describe("decideAdminRoute: AAL が取れなかった管理者（閉じる側に倒す）", () => {
  it("level が null でも保護されたパスは通さない", () => {
    expect(
      decideAdminRoute(
        input({ currentLevel: null, hasVerifiedTotpFactor: true })
      )
    ).toEqual(redirect("/mfa/verify"));
    expect(
      decideAdminRoute(
        input({ currentLevel: null, hasVerifiedTotpFactor: false })
      )
    ).toEqual(redirect("/mfa/setup"));
  });
});

describe("decideAdminRoute: 緊急スイッチで強制をやめているとき", () => {
  it("aal1 の管理者でも保護されたパスを通す", () => {
    for (const hasVerifiedTotpFactor of [true, false]) {
      for (const pathname of PROTECTED_PATHS) {
        expect(
          decideAdminRoute(
            input({
              mfaRequired: false,
              currentLevel: "aal1",
              hasVerifiedTotpFactor,
              pathname,
            })
          )
        ).toEqual(NEXT);
      }
    }
  });

  it("二段階認証のページとログインページは管理画面へ戻す", () => {
    for (const pathname of ["/login", "/mfa/setup", "/mfa/verify"]) {
      expect(
        decideAdminRoute(
          input({ mfaRequired: false, currentLevel: "aal1", pathname })
        )
      ).toEqual(redirect("/bills"));
    }
  });

  it("管理者でない人・未ログインの人は、スイッチに関係なく通さない", () => {
    expect(
      decideAdminRoute(
        input({ mfaRequired: false, isAdmin: false, pathname: "/bills" })
      )
    ).toEqual(redirect("/login", "unauthorized"));
    expect(
      decideAdminRoute(
        input({
          mfaRequired: false,
          isAuthenticated: false,
          isAdmin: false,
          pathname: "/bills",
        })
      )
    ).toEqual(redirect("/login"));
  });
});

describe("decideAdminRoute: パスの正規化", () => {
  it("末尾にスラッシュが付いても同じに扱う", () => {
    expect(
      decideAdminRoute(
        input({
          currentLevel: "aal1",
          hasVerifiedTotpFactor: true,
          pathname: "/mfa/verify/",
        })
      )
    ).toEqual(NEXT);
    expect(
      decideAdminRoute(
        input({ isAuthenticated: false, isAdmin: false, pathname: "/login/" })
      )
    ).toEqual(NEXT);
  });

  it("二段階認証のページに似たパスは、二段階認証のページとして扱わない（保護されたパス扱い）", () => {
    for (const pathname of [
      "/mfa",
      "/mfa/",
      "/mfa/verify/extra",
      "/mfa/setup2",
      "/mfa/Verify",
      "/login/extra",
      "/api/auth/callback/extra",
    ]) {
      expect(
        decideAdminRoute(
          input({
            currentLevel: "aal1",
            hasVerifiedTotpFactor: true,
            pathname,
          })
        )
      ).toEqual(redirect("/mfa/verify"));
    }
  });
});
