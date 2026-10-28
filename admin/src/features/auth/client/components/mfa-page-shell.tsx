import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "./logout-button";

type Props = {
  title: string;
  description: string;
  /** ログイン中のメールアドレス（別のアカウントで入っていないか気づけるように） */
  email?: string | null;
  children: ReactNode;
};

/** 二段階認証のページ共通の枠。どちらのページにもログアウトを置く */
export function MfaPageShell({ title, description, email, children }: Props) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-900">
            <ShieldCheck className="h-6 w-6" />
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </div>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
          {email && (
            <p className="text-center text-xs text-muted-foreground break-all">
              ログイン中: {email}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          <div className="flex justify-center border-t pt-4">
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
