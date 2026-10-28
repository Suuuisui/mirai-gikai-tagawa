"use client";

import { Input } from "@/components/ui/input";
import { normalizeTotpCode } from "../../shared/utils/mfa-error-message";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

/** 認証アプリの6桁コード入力（スマホでは数字キーボード、パスワード管理アプリの自動入力にも対応） */
export function TotpCodeField({ id, value, onChange, disabled }: Props) {
  return (
    <Input
      id={id}
      name="totp-code"
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={12}
      placeholder="123456"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(normalizeTotpCode(e.target.value))}
      className="text-center text-2xl tracking-[0.4em] h-12 font-mono"
      aria-label="認証アプリの6桁のコード"
    />
  );
}
