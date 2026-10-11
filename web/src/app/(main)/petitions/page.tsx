import type { Metadata } from "next";
import { PetitionListPage } from "@/features/petitions/server/components/petition-list-page";
import {
  getAllPetitions,
  getPetitionLinkContext,
  getPetitionMeetingMatches,
} from "@/features/petitions/server/loaders/get-petitions";
import { routes } from "@/lib/routes";
import { PAGE_COPY } from "@/lib/seo/page-copy";
import { buildPageShareMetadata } from "@/lib/seo/share-metadata";

// ISR: 議員・委員会記録のリンク解決はキャッシュ済みデータを使う
export const revalidate = 3600;

export const metadata: Metadata = {
  title: PAGE_COPY.petitions.title,
  description: PAGE_COPY.petitions.description,
  alternates: {
    canonical: routes.petitions(),
  },
  ...buildPageShareMetadata({
    ...PAGE_COPY.petitions,
    path: routes.petitions(),
  }),
};

export default async function PetitionsPage() {
  const [context, meetingMatches] = await Promise.all([
    getPetitionLinkContext(),
    getPetitionMeetingMatches(),
  ]);
  return (
    <PetitionListPage
      records={getAllPetitions()}
      context={context}
      meetingMatches={meetingMatches}
    />
  );
}
