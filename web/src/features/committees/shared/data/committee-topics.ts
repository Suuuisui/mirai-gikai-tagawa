/**
 * 委員会の会議を「暮らしのどの話か」で分類するトピック【田川市専用】
 *
 * 委員会名（総務文教・厚生・建設経済…）は所管の区分であって、市民が
 * 知りたい「何の話か」とは一致しない。同じ暮らしのテーマが複数の委員会に
 * またがることも多いため、会議ごとに横断のトピックを持たせて入口にする。
 *
 * idはDBの committee_meetings.topics に入る値。ラベルを変えてもidは変えない
 * こと（既存データの付け直しが必要になる）
 */

/** トピックの識別子 */
export type CommitteeTopicId =
  | "money"
  | "welfare"
  | "education"
  | "waste"
  | "transport"
  | "city"
  | "health"
  | "industry"
  | "safety"
  | "cityhall"
  | "assembly"
  | "investigation";

export interface CommitteeTopic {
  id: CommitteeTopicId;
  /** 一覧のバッジやフィルタに出る短い名前 */
  label: string;
  /** トピック選択時に出す一行説明 */
  description: string;
}

/** 表示順（暮らしに近いものから、議会内部の話は後ろ） */
export const COMMITTEE_TOPICS: CommitteeTopic[] = [
  {
    id: "money",
    label: "お金の使い道",
    description: "予算・決算・税金・補助金など、市のお金に関する審査です。",
  },
  {
    id: "welfare",
    label: "福祉・子育て",
    description: "高齢者・介護・障害福祉・保育・子育て支援に関する議論です。",
  },
  {
    id: "education",
    label: "学校・教育",
    description:
      "小中学校・給食・いじめ対策・公民館・図書館など教育に関する議論です。",
  },
  {
    id: "waste",
    label: "ごみ・環境",
    description:
      "ごみの収集や処理施設、環境対策に関する議論です。田川市では収集業務の委託が長く論点になっています。",
  },
  {
    id: "transport",
    label: "交通・道路",
    description:
      "コミュニティバス・平成筑豊鉄道・道路の整備など、移動に関する議論です。",
  },
  {
    id: "city",
    label: "まちづくり・住まい",
    description:
      "新庁舎・市営住宅・公園・空き家・跡地の活用など、まちの姿に関する議論です。",
  },
  {
    id: "health",
    label: "医療・健康",
    description: "市立病院の経営や国民健康保険、健康づくりに関する議論です。",
  },
  {
    id: "industry",
    label: "産業・仕事",
    description: "農業・商工業・観光・企業誘致など、仕事と産業の議論です。",
  },
  {
    id: "safety",
    label: "防災・安全",
    description: "消防・災害対応・防犯など、安全を守る取り組みの議論です。",
  },
  {
    id: "cityhall",
    label: "市役所の仕事",
    description:
      "職員体制・組織の見直し・デジタル化など、市役所の運営に関する議論です。",
  },
  {
    id: "assembly",
    label: "議会のしくみ",
    description:
      "会期や議席、委員会の構成、議員定数など、議会の運営そのものに関する議論です。",
  },
  {
    id: "investigation",
    label: "疑惑の調査",
    description:
      "百条委員会や政治倫理条例に基づく調査など、市政・議員をめぐる問題の検証です。",
  },
];

const TOPIC_MAP = new Map(COMMITTEE_TOPICS.map((topic) => [topic.id, topic]));

/** idがトピックとして定義済みかを判定する（DBの値の検証用） */
export function isCommitteeTopicId(value: string): value is CommitteeTopicId {
  return TOPIC_MAP.has(value as CommitteeTopicId);
}

/** id列からトピック定義を引く。未定義のidは黙って捨てる */
export function resolveTopics(ids: readonly string[]): CommitteeTopic[] {
  const resolved: CommitteeTopic[] = [];
  for (const id of ids) {
    const topic = TOPIC_MAP.get(id as CommitteeTopicId);
    if (topic && !resolved.includes(topic)) {
      resolved.push(topic);
    }
  }
  return resolved;
}

/**
 * 会議一覧からトピックごとの件数を数え、COMMITTEE_TOPICS の順で返す。
 * 1件も無いトピックは省く（入口として出しても行き止まりになるため）
 */
export function countMeetingsByTopic(
  meetings: readonly { topics: string[] }[]
): Array<{ topic: CommitteeTopic; count: number }> {
  const counts = new Map<CommitteeTopicId, number>();
  for (const meeting of meetings) {
    // 1会議に同じトピックが重複して入っていても1件として数える
    for (const id of new Set(meeting.topics)) {
      if (isCommitteeTopicId(id)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
  }
  return COMMITTEE_TOPICS.filter((topic) => counts.has(topic.id)).map(
    (topic) => ({ topic, count: counts.get(topic.id) ?? 0 })
  );
}
