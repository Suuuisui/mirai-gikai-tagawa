"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";
import { getErrorMessage } from "@/lib/utils/get-error-message";
import { isCompleteTotpCode } from "../../shared/utils/mfa-error-message";
import {
  startTotpEnrollment,
  type TotpEnrollment,
  verifyEnrollment,
} from "../lib/mfa-client";
import { TotpCodeField } from "./totp-code-field";

/** 認証アプリの初回設定: QR を読み取り、表示された6桁を入力して確認する */
export function MfaSetupForm() {
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  // 開発時の二重実行などで要素を2つ作らないための目印
  const startedRef = useRef(false);

  const start = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    setCode("");
    try {
      setEnrollment(await startTotpEnrollment());
    } catch (err) {
      setEnrollment(null);
      setError(getErrorMessage(err, "設定を始められませんでした。"));
    } finally {
      setIsStarting(false);
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!enrollment || !isCompleteTotpCode(code)) return;
    setIsVerifying(true);
    setError(null);
    try {
      await verifyEnrollment(enrollment.factorId, code);
      window.location.assign(routes.bills());
    } catch (err) {
      setError(getErrorMessage(err, "確認に失敗しました。"));
      setCode("");
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <ol className="space-y-6 text-sm">
        <li className="space-y-2">
          <p className="font-medium">1. 認証アプリを用意する</p>
          <p className="text-muted-foreground">
            スマホに「Google Authenticator」や「Microsoft
            Authenticator」などの認証アプリを入れてください（アプリストアで無料）。すでに入っていれば、そのまま使えます。
          </p>
        </li>

        <li className="space-y-3">
          <p className="font-medium">2. QRコードを読み取る</p>
          <p className="text-muted-foreground">
            アプリの「＋」から「QRコードをスキャン」を選び、下のQRコードを読み取ります。
          </p>
          <div className="flex justify-center">
            <div className="flex h-48 w-48 items-center justify-center rounded-md border bg-white p-2">
              {isStarting && (
                <span className="text-xs text-muted-foreground">準備中...</span>
              )}
              {!isStarting && enrollment && (
                // biome-ignore lint/performance/noImgElement: Supabase が返す data URI の SVG をそのまま表示する
                <img
                  src={enrollment.qrCode}
                  alt="認証アプリで読み取るQRコード"
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
          {enrollment && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                QRコードを読み取れないとき
              </summary>
              <p className="mt-2">
                アプリで「セットアップキーを入力」を選び、次のキーを入力してください（種類は「時間ベース」）。
              </p>
              <code className="mt-1 block break-all rounded bg-gray-100 p-2 font-mono text-sm text-gray-900 select-all">
                {enrollment.secret}
              </code>
            </details>
          )}
        </li>

        <li>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Label htmlFor="totp-code" className="font-medium">
              3. 表示された6桁の数字を入力する
            </Label>
            <TotpCodeField
              id="totp-code"
              value={code}
              onChange={setCode}
              disabled={!enrollment || isVerifying}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={!enrollment || isVerifying || !isCompleteTotpCode(code)}
            >
              {isVerifying ? "確認中..." : "設定を完了する"}
            </Button>
          </form>
        </li>
      </ol>

      {error && (
        <div
          role="alert"
          className="space-y-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
        >
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void start()}
            disabled={isStarting || isVerifying}
          >
            <RefreshCw className="h-3 w-3" />
            QRコードを作り直す
          </Button>
        </div>
      )}
    </div>
  );
}
