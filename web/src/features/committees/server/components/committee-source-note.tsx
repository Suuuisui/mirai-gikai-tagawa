import "server-only";
import { Info } from "lucide-react";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";

/**
 * 委員会の記録の一覧と、委員会ごとのページの末尾に置く出典・注意書き。
 * 見出し・要約・要点がAIを使った整理であることと、出典の説明ページへの導線を示す
 */
export function CommitteeSourceNote() {
  return (
    <div className="flex gap-2 rounded-lg bg-mirai-surface px-4 py-3.5 text-xs leading-relaxed text-mirai-text-note">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex flex-col gap-1.5">
        <p>
          各ページの見出し・要約・要点は、それぞれの記録に示した資料（公式の会議録、
          公式YouTube中継の文字起こし、情報開示請求で入手した文書）をもとに、
          運営者がAIを活用して整理したものです。中継の文字起こしには聞き取りの
          誤りが含まれることがあります。正確な内容は原本・中継映像をご確認ください。
        </p>
        <TextLink href={routes.sources()} className="text-xs">
          出典の種類と読み方について
        </TextLink>
      </div>
    </div>
  );
}
