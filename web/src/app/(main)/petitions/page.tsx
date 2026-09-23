import type { Metadata } from "next";
import { PetitionListPage } from "@/features/petitions/server/components/petition-list-page";
import {
  getAllPetitions,
  getPetitionLinkContext,
} from "@/features/petitions/server/loaders/get-petitions";
import { routes } from "@/lib/routes";

// ISR: 議員・委員会記録のリンク解決はキャッシュ済みデータを使う
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "田川市議会 請願・陳情（市民からの要望）の審査結果",
  description:
    "田川市議会に出された請願・陳情の一覧です。付託された委員会、採択・不採択などの審査結果、紹介議員、原文PDFへのリンクを平成23年5月以降の分からまとめています。",
  alternates: {
    canonical: routes.petitions(),
  },
};

export default async function PetitionsPage() {
  const context = await getPetitionLinkContext();
  return <PetitionListPage records={getAllPetitions()} context={context} />;
}
