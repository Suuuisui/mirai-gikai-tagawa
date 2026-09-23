import { SectionHeading } from "@/components/ui/section-heading";
import { TextLink } from "@/components/ui/text-link";
import { routes } from "@/lib/routes";
import { selectPetitionsForSession } from "../../shared/utils/petition-display";
import {
  getAllPetitions,
  getPetitionLinkContext,
} from "../loaders/get-petitions";
import { PetitionCard } from "./petition-card";

interface SessionPetitionsSectionProps {
  session: { start_date: string; end_date: string };
}

/** 会期まとめページに載せる「この会期の請願・陳情」（上程または結果が出たもの） */
export async function SessionPetitionsSection({
  session,
}: SessionPetitionsSectionProps) {
  const records = selectPetitionsForSession(getAllPetitions(), session);
  if (records.length === 0) return null;
  const context = await getPetitionLinkContext();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <SectionHeading>この会期の請願・陳情</SectionHeading>
        <p className="text-xs font-medium text-mirai-text-muted">
          会期中に出されたもの、または結果が出たものです
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {records.map((record) => (
          <PetitionCard
            key={record.id}
            record={record}
            context={context}
            compact
          />
        ))}
      </div>
      <TextLink href={routes.petitions()}>請願・陳情の一覧を見る</TextLink>
    </section>
  );
}
