import { describe, expect, it } from "vitest";
import {
  hasVerifiedTotpFactor,
  isAal2,
  isMfaSatisfied,
  parseMfaRequired,
  resolveMfaStep,
  selectUnverifiedTotpFactors,
  selectVerifiedTotpFactors,
} from "./mfa";

const verifiedTotp = {
  id: "f-verified",
  factor_type: "totp",
  status: "verified",
};
const unverifiedTotp = {
  id: "f-unverified",
  factor_type: "totp",
  status: "unverified",
};
const verifiedPhone = {
  id: "f-phone",
  factor_type: "phone",
  status: "verified",
};

describe("parseMfaRequired（ADMIN_MFA_REQUIRED の読み方）", () => {
  it("未設定なら強制する", () => {
    expect(parseMfaRequired(undefined)).toBe(true);
    expect(parseMfaRequired(null)).toBe(true);
  });

  it('"false" のときだけ強制をやめる', () => {
    expect(parseMfaRequired("false")).toBe(false);
  });

  it("大文字小文字と前後の空白は無視する（緊急時の打ち間違いで外れないのを防ぐ）", () => {
    expect(parseMfaRequired("False")).toBe(false);
    expect(parseMfaRequired("FALSE")).toBe(false);
    expect(parseMfaRequired("  false \n")).toBe(false);
  });

  it("false 以外の値はすべて強制する（0・off・no・空文字・true など）", () => {
    for (const value of ["", " ", "true", "0", "off", "no", "disabled", "f"]) {
      expect(parseMfaRequired(value)).toBe(true);
    }
  });
});

describe("isAal2", () => {
  it("aal2 だけが true", () => {
    expect(isAal2("aal2")).toBe(true);
    expect(isAal2("aal1")).toBe(false);
    expect(isAal2(null)).toBe(false);
    expect(isAal2(undefined)).toBe(false);
    expect(isAal2("AAL2")).toBe(false);
    expect(isAal2("")).toBe(false);
  });
});

describe("isMfaSatisfied", () => {
  it("強制していないときは AAL に関係なく満たす", () => {
    for (const currentLevel of ["aal1", "aal2", null, undefined, "unknown"]) {
      expect(isMfaSatisfied({ mfaRequired: false, currentLevel })).toBe(true);
    }
  });

  it("強制しているときは aal2 だけが満たす", () => {
    expect(isMfaSatisfied({ mfaRequired: true, currentLevel: "aal2" })).toBe(
      true
    );
    expect(isMfaSatisfied({ mfaRequired: true, currentLevel: "aal1" })).toBe(
      false
    );
  });

  it("強制しているとき、AAL が取れない・不明な値なら満たさない（閉じる側に倒す）", () => {
    expect(isMfaSatisfied({ mfaRequired: true, currentLevel: null })).toBe(
      false
    );
    expect(isMfaSatisfied({ mfaRequired: true, currentLevel: undefined })).toBe(
      false
    );
    expect(isMfaSatisfied({ mfaRequired: true, currentLevel: "aal3" })).toBe(
      false
    );
  });
});

describe("TOTP 要素の絞り込み", () => {
  const factors = [verifiedTotp, unverifiedTotp, verifiedPhone];

  it("selectVerifiedTotpFactors は確認済みの TOTP だけ返す（phone は除く）", () => {
    expect(selectVerifiedTotpFactors(factors)).toEqual([verifiedTotp]);
  });

  it("selectUnverifiedTotpFactors は未確認の TOTP だけ返す", () => {
    expect(selectUnverifiedTotpFactors(factors)).toEqual([unverifiedTotp]);
  });

  it("null・undefined・空配列でも落ちない", () => {
    expect(selectVerifiedTotpFactors(null)).toEqual([]);
    expect(selectVerifiedTotpFactors(undefined)).toEqual([]);
    expect(selectUnverifiedTotpFactors([])).toEqual([]);
  });

  it("hasVerifiedTotpFactor は確認済みの TOTP があるときだけ true", () => {
    expect(hasVerifiedTotpFactor(factors)).toBe(true);
    expect(hasVerifiedTotpFactor([unverifiedTotp])).toBe(false);
    expect(hasVerifiedTotpFactor([verifiedPhone])).toBe(false);
    expect(hasVerifiedTotpFactor([])).toBe(false);
    expect(hasVerifiedTotpFactor(undefined)).toBe(false);
  });
});

describe("resolveMfaStep（次の手順）", () => {
  it("aal2 なら none", () => {
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: "aal2",
        hasVerifiedTotpFactor: true,
      })
    ).toBe("none");
  });

  it("aal1 で確認済みの要素があれば verify（6 桁コードの入力）", () => {
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: "aal1",
        hasVerifiedTotpFactor: true,
      })
    ).toBe("verify");
  });

  it("aal1 で確認済みの要素が無ければ enroll（認証アプリの設定）", () => {
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: "aal1",
        hasVerifiedTotpFactor: false,
      })
    ).toBe("enroll");
  });

  it("AAL が取れないときも要素の有無で振り分ける（通しはしない）", () => {
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: null,
        hasVerifiedTotpFactor: true,
      })
    ).toBe("verify");
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: undefined,
        hasVerifiedTotpFactor: false,
      })
    ).toBe("enroll");
  });

  it("強制していないときは常に none", () => {
    for (const currentLevel of ["aal1", "aal2", null]) {
      for (const hasFactor of [true, false]) {
        expect(
          resolveMfaStep({
            mfaRequired: false,
            currentLevel,
            hasVerifiedTotpFactor: hasFactor,
          })
        ).toBe("none");
      }
    }
  });

  it("aal2 だが確認済みの要素が無い（要素を消された直後のセッション）は通す。要素の削除は他のセッションを aal1 に落とす仕組みに任せる", () => {
    expect(
      resolveMfaStep({
        mfaRequired: true,
        currentLevel: "aal2",
        hasVerifiedTotpFactor: false,
      })
    ).toBe("none");
  });
});
