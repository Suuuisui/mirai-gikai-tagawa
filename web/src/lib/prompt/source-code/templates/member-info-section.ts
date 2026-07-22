/**
 * 議員別の賛否・提出者情報セクションを構築する。
 *
 * memberVotes・sponsors がともに空ならセクションごと省略する（空の見出しだけ
 * が残るとモデルが不自然に振る舞うのを避けるため。市長提出議案や賛否が割れ
 * なかった議案では両方とも空になる想定）。
 */
export function buildMemberVotesAndSponsorsSection(
  memberVotes: string,
  sponsors: string
): string {
  const trimmedVotes = memberVotes.trim();
  const trimmedSponsors = sponsors.trim();
  if (!trimmedVotes && !trimmedSponsors) return "";

  const sections: string[] = [];
  if (trimmedVotes) {
    sections.push(`### 議員別の賛否\n${trimmedVotes}`);
  }
  if (trimmedSponsors) {
    sections.push(`### 提出者・賛成者（連署議員）\n${trimmedSponsors}`);
  }

  return `
## 議員別の賛否・提出者情報

${sections.join("\n\n")}

### 取り扱い上の注意（必ず守ること）
- 賛成・反対の数や投票行動、提出者であることを理由に、議員個人や会派を評価・批判する表現はしないでください
- 「〇〇議員は正しい／誤った判断をした」のような主観的な評価を行わないでください
- 事実として淡々と伝え、その事実をどう評価するかの判断は利用者に委ねてください
`;
}
