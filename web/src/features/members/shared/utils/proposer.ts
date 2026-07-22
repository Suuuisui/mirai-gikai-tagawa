/** 議案の提出者区分。市の公開データでは個人名までは特定できないため区分で扱う */
export type ProposerType = "mayor" | "member" | "committee";

export const PROPOSER_TYPES: readonly ProposerType[] = [
  "mayor",
  "member",
  "committee",
];

export const PROPOSER_LABELS: Record<ProposerType, string> = {
  mayor: "市長提出",
  member: "議員提出",
  committee: "委員会提出",
};

export const PROPOSER_DESCRIPTIONS: Record<ProposerType, string> = {
  mayor:
    "市長（執行部）が議会に提出した議案です。予算・条例の制定改廃・人事同意など、市政運営に関わる議案の多くが含まれます。",
  member:
    "議員が提出した議案（意見書・決議など）です。説明資料PDFが公開されている議案には、提出者・賛成者（連署議員）の氏名を議案ページに掲載しています。",
  committee:
    "議会の委員会が提出した議案です。委員会での調査・審査を踏まえた意見書や決議などが含まれます。説明資料PDFが公開されている議案には、提出者・賛成者の氏名を議案ページに掲載しています。",
};

export function isProposerType(value: string): value is ProposerType {
  return (PROPOSER_TYPES as readonly string[]).includes(value);
}

const LABEL_TO_TYPE: Record<string, ProposerType> = {
  市長提出: "mayor",
  議員提出: "member",
  委員会提出: "committee",
};

/**
 * 議案の提出者区分を判定する。
 *
 * 議案本文（bill_contents.content）はシード生成時（build-csv.ts）に必ず
 * 「- **提出者**: 市長提出」の形式の行を含むため、まず本文から判定する。
 * 本文が無い場合のフォールバックとして、議案番号ラベル
 * （「議員提出議案第N号」「委員会提出議案第N号」）の接頭辞でも判定する。
 * どちらでも判定できない場合は null（表示側でセクション非表示にする）
 */
export function getProposerType(bill: {
  name: string;
  content?: string | null;
}): ProposerType | null {
  const match = bill.content?.match(
    /\*\*提出者\*\*[:：]\s*(市長提出|議員提出|委員会提出)/
  );
  if (match) {
    return LABEL_TO_TYPE[match[1]] ?? null;
  }
  if (bill.name.startsWith("議員提出議案")) {
    return "member";
  }
  if (bill.name.startsWith("委員会提出議案")) {
    return "committee";
  }
  return null;
}
