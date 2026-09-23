import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface MemberLinkProps {
  /** 議員ページのキー（姓）。null なら文字だけを出す */
  memberKey: string | null;
  className?: string;
  children: React.ReactNode;
}

/**
 * 議員名の表示。議員ページがある（memberKey が決まっている）ときだけリンクにする。
 * 歴代議員など名簿に無い人物や、同姓の別人にはリンクしない判断は呼び出し側で行う
 */
export function MemberLink({
  memberKey,
  className,
  children,
}: MemberLinkProps) {
  if (!memberKey) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link
      href={routes.memberDetail(memberKey) as Route}
      className={cn("font-bold text-primary hover:underline", className)}
    >
      {children}
    </Link>
  );
}
