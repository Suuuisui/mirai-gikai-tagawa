"use client";

import { AlertCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { isCompleteTotpCode } from "../../shared/utils/mfa-error-message";
import { verifyLoginCode } from "../lib/mfa-client";
import { TotpCodeField } from "./totp-code-field";

/** ログインのあと、認証アプリの6桁コードを入力して二段階認証を完了する */
export function MfaVerifyForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isCompleteTotpCode(code)) return;
    setIsLoading(true);
    setError(null);
    try {
      await verifyLoginCode(code);
      // Cookie が aal2 に更新されたので、画面のキャッシュごと入れ替わるよう丸ごと移動する
      window.location.assign(routes.bills());
    } catch (err) {
      setError(getErrorMessage(err, "確認に失敗しました。"));
      setCode("");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="totp-code">6桁のコード</Label>
        <TotpCodeField
          id="totp-code"
          value={code}
          onChange={setCode}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          スマホの認証アプリ（Google Authenticator や Microsoft Authenticator
          など）を開き、「みらい議会＠田川市
          管理画面」に表示されている数字を入力してください。
          30秒ごとに変わります。
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start space-x-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !isCompleteTotpCode(code)}
      >
        {isLoading ? "確認中..." : "確認する"}
      </Button>
    </form>
  );
}
