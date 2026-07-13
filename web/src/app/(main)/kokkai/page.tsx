import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layouts/container";
import { DietSessionArchiveList } from "@/features/bills/server/components/diet-session-archive-list";
import { getDietSessionArchive } from "@/features/bills/server/loaders/get-diet-session-archive";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "田川市議会 会期一覧 | みらい議会＠田川市",
  description:
    "田川市議会の全ての会期を一覧で確認できます。会期を選ぶと、その会期に提出された議案の一覧を見ることができます。",
};

export default async function DietSessionArchivePage() {
  const items = await getDietSessionArchive();

  return (
    <div className="bg-mirai-surface-muted">
      {/* ヒーロー画像 */}
      <div className="relative w-full h-[285px]">
        <Image
          src="/img/archive-hero-7f3d06.png"
          alt="田川市議会 会期一覧"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
      </div>

      <Container className="py-8">
        <div className="flex flex-col gap-8">
          {/* ヘッダー */}
          <div className="flex flex-col gap-1">
            <h1>
              <Image
                src="/icons/archive-typography.svg"
                alt="Archive"
                width={156}
                height={36}
                priority
              />
            </h1>
            <p className="text-sm font-bold text-primary-accent">
              田川市議会の全ての会期
            </p>
          </div>

          <DietSessionArchiveList items={items} />
        </div>
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <nav className="flex items-center gap-2 text-[15px]">
          <Link href={routes.home()} className="text-black">
            TOP
          </Link>
          <ChevronRight className="h-5 w-5 text-black" />
          <span className="text-black">会期一覧</span>
        </nav>
      </Container>
    </div>
  );
}
