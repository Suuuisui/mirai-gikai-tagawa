import type {
  AgeRow,
  ElectionDayProgressPoint,
  MaleFemaleTotal,
  PrecinctRow,
} from "../data/turnout-data";

function maleFemale(male: number, female: number): MaleFemaleTotal {
  return { male, female, total: male + female };
}

function add(a: MaleFemaleTotal, b: MaleFemaleTotal): MaleFemaleTotal {
  return maleFemale(a.male + b.male, a.female + b.female);
}

const ZERO = maleFemale(0, 0);

/** 割合（%）を小数第 digits 位で四捨五入する（資料の投票率と同じ計算） */
function ratioPercent(part: number, whole: number, digits: number): number {
  if (whole <= 0) return 0;
  return roundTo((part / whole) * 100, digits);
}

/**
 * 投票率（%）。資料と同じく「投票者数 ÷ 当日有権者数 × 100」を小数第2位で四捨五入する
 */
export function turnoutRate(voters: number, electorate: number): number {
  return ratioPercent(voters, electorate, 2);
}

/** 割合（%）を小数第1位で丸める（投票者に占める期日前投票の割合など） */
export function sharePercent(part: number, whole: number): number {
  return ratioPercent(part, whole, 1);
}

function rates(
  voters: MaleFemaleTotal,
  electorate: MaleFemaleTotal
): MaleFemaleTotal {
  return {
    male: turnoutRate(voters.male, electorate.male),
    female: turnoutRate(voters.female, electorate.female),
    total: turnoutRate(voters.total, electorate.total),
  };
}

/** 投票区1つ分（または全体）の集計 */
export interface TurnoutBreakdown {
  /** 選挙当日の有権者数 */
  electorate: MaleFemaleTotal;
  /** 当日、投票所で投票した人 */
  electionDay: MaleFemaleTotal;
  /** 期日前投票をした人 */
  early: MaleFemaleTotal;
  /** 不在者投票をした人 */
  absentee: MaleFemaleTotal;
  /** 投票した人（当日＋期日前＋不在者） */
  voters: MaleFemaleTotal;
  /** 投票しなかった人 */
  abstained: MaleFemaleTotal;
  /** 投票率（%） */
  rate: MaleFemaleTotal;
  /** 投票した人のうち期日前投票をした人の割合（%、小数第1位） */
  earlyShare: number;
}

export interface PrecinctTurnout extends TurnoutBreakdown {
  precinct: number;
}

function breakdown(parts: {
  electorate: MaleFemaleTotal;
  electionDay: MaleFemaleTotal;
  early: MaleFemaleTotal;
  absentee: MaleFemaleTotal;
}): TurnoutBreakdown {
  const voters = add(add(parts.electionDay, parts.early), parts.absentee);
  return {
    ...parts,
    voters,
    abstained: maleFemale(
      parts.electorate.male - voters.male,
      parts.electorate.female - voters.female
    ),
    rate: rates(voters, parts.electorate),
    earlyShare: sharePercent(parts.early.total, voters.total),
  };
}

export function summarizePrecinct(row: PrecinctRow): PrecinctTurnout {
  const [
    precinct,
    electorateMale,
    electorateFemale,
    electionDayMale,
    electionDayFemale,
    earlyMale,
    earlyFemale,
    absenteeMale,
    absenteeFemale,
  ] = row;
  return {
    precinct,
    ...breakdown({
      electorate: maleFemale(electorateMale, electorateFemale),
      electionDay: maleFemale(electionDayMale, electionDayFemale),
      early: maleFemale(earlyMale, earlyFemale),
      absentee: maleFemale(absenteeMale, absenteeFemale),
    }),
  };
}

/** 選挙1回分の投票区の行を、投票区ごとと全体に集計する */
export function summarizeElection(rows: readonly PrecinctRow[]): {
  precincts: PrecinctTurnout[];
  total: TurnoutBreakdown;
} {
  const precincts = rows.map(summarizePrecinct);
  const sum = (key: "electorate" | "electionDay" | "early" | "absentee") =>
    precincts.reduce((acc, p) => add(acc, p[key]), ZERO);
  return {
    precincts,
    total: breakdown({
      electorate: sum("electorate"),
      electionDay: sum("electionDay"),
      early: sum("early"),
      absentee: sum("absentee"),
    }),
  };
}

/** 有権者・投票した人・投票率の組（年齢1歳分や年代の帯1つ分） */
export interface TurnoutFigures {
  electorate: MaleFemaleTotal;
  voters: MaleFemaleTotal;
  /** 投票率（%） */
  rate: MaleFemaleTotal;
}

function figures(
  electorate: MaleFemaleTotal,
  voters: MaleFemaleTotal
): TurnoutFigures {
  return { electorate, voters, rate: rates(voters, electorate) };
}

/** 年齢1歳分の投票状況 */
export interface AgeTurnout extends TurnoutFigures {
  /** 18 は資料の「19未満」（18歳）、80 は「80以上」 */
  age: number;
}

export function summarizeAges(ages: readonly AgeRow[]): AgeTurnout[] {
  return ages.map(
    ([age, electorateMale, electorateFemale, votersMale, votersFemale]) => ({
      age,
      ...figures(
        maleFemale(electorateMale, electorateFemale),
        maleFemale(votersMale, votersFemale)
      ),
    })
  );
}

/** 資料で「80以上」とまとめられている行の年齢（この年齢から上は1歳ごとの人数が無い） */
const OPEN_ENDED_AGE = 80;

/** 年齢の表示（80 は「80歳以上」） */
export function ageLabel(age: number): string {
  return age >= OPEN_ENDED_AGE ? "80歳以上" : `${age}歳`;
}

/** 1歳ぶんの行だけを残す（「80歳以上」のまとめた行を除く。人数を年齢どうしで比べるとき用） */
export function singleYearAges(
  ages: readonly AgeTurnout[]
): readonly AgeTurnout[] {
  return ages.filter((row) => row.age < OPEN_ENDED_AGE);
}

export interface AgeBand {
  label: string;
  from: number;
  /** null は上限なし（80歳以上など） */
  to: number | null;
}

/** 資料の小計と同じ5歳刻み（18・19歳と80歳以上はそのまま） */
const AGE_BANDS: readonly AgeBand[] = [
  { label: "18・19歳", from: 18, to: 19 },
  { label: "20〜24歳", from: 20, to: 24 },
  { label: "25〜29歳", from: 25, to: 29 },
  { label: "30〜34歳", from: 30, to: 34 },
  { label: "35〜39歳", from: 35, to: 39 },
  { label: "40〜44歳", from: 40, to: 44 },
  { label: "45〜49歳", from: 45, to: 49 },
  { label: "50〜54歳", from: 50, to: 54 },
  { label: "55〜59歳", from: 55, to: 59 },
  { label: "60〜64歳", from: 60, to: 64 },
  { label: "65〜69歳", from: 65, to: 69 },
  { label: "70〜74歳", from: 70, to: 74 },
  { label: "75〜79歳", from: 75, to: 79 },
  { label: "80歳以上", from: OPEN_ENDED_AGE, to: null },
];

/** 有権者の構成と投票した人の構成を比べるための大きな区切り（若い順） */
const BROAD_AGE_BANDS: readonly AgeBand[] = [
  { label: "18〜39歳", from: 18, to: 39 },
  { label: "40〜64歳", from: 40, to: 64 },
  { label: "65歳以上", from: 65, to: null },
];

function inBand(age: number, band: AgeBand): boolean {
  return age >= band.from && (band.to === null || age <= band.to);
}

export function turnoutByAgeBand(
  ages: readonly AgeTurnout[],
  bands: readonly AgeBand[] = AGE_BANDS
): (TurnoutFigures & { band: AgeBand })[] {
  return bands.map((band) => {
    const rows = ages.filter((row) => inBand(row.age, band));
    return {
      band,
      ...figures(
        rows.reduce((acc, row) => add(acc, row.electorate), ZERO),
        rows.reduce((acc, row) => add(acc, row.voters), ZERO)
      ),
    };
  });
}

/** 全年齢の男女計を合計する */
export function sumTotal(
  ages: readonly AgeTurnout[],
  key: "electorate" | "voters"
): number {
  return ages.reduce((n, row) => n + row[key].total, 0);
}

/** 年代ごとに「有権者に占める割合」と「投票した人に占める割合」（%、小数第1位）を並べる */
export function ageComposition(
  ages: readonly AgeTurnout[],
  bands: readonly AgeBand[] = BROAD_AGE_BANDS
): {
  band: AgeBand;
  electorateShare: number;
  votersShare: number;
  rate: number;
}[] {
  const electorateTotal = sumTotal(ages, "electorate");
  const votersTotal = sumTotal(ages, "voters");
  return turnoutByAgeBand(ages, bands).map((row) => ({
    band: row.band,
    electorateShare: sharePercent(row.electorate.total, electorateTotal),
    votersShare: sharePercent(row.voters.total, votersTotal),
    rate: row.rate.total,
  }));
}

/** 年代1つ分の票の数（人数は男女計） */
export interface AgeBandVotes {
  band: AgeBand;
  electorate: number;
  /** 投票した人の数（1人1票なので、そのまま票の数） */
  voters: number;
  /** 投票しなかった人の数 */
  abstained: number;
  /** 投票した人全体に占める割合（%、小数第1位） */
  votersShare: number;
}

/** 5歳ごとの票の数（投票した人の数）と、投票した人全体に占める割合 */
export function votesByAgeBand(
  ages: readonly AgeTurnout[],
  bands: readonly AgeBand[] = AGE_BANDS
): AgeBandVotes[] {
  const votersTotal = sumTotal(ages, "voters");
  return turnoutByAgeBand(ages, bands).map((row) => ({
    band: row.band,
    electorate: row.electorate.total,
    voters: row.voters.total,
    abstained: row.electorate.total - row.voters.total,
    votersShare: sharePercent(row.voters.total, votersTotal),
  }));
}

/** 1歳ごとに見た票の最少・最多と、その開きを有権者の数と投票率に分けた倍率 */
export interface SingleAgeVoteGap {
  fewest: AgeTurnout;
  most: AgeTurnout;
  /** 票の数（投票した人の数）の倍率 */
  votesTimes: number;
  /** 有権者の数の倍率 */
  electorateTimes: number;
  /** 投票率の倍率（画面に出す小数第1位の値どうし） */
  rateTimes: number;
}

/**
 * 1歳ごとに見て票が最も少ない年齢と最も多い年齢を選び、票の数の開きを
 * 有権者の数の違いと投票率の違いに分ける（票の数 ＝ 有権者の数 × 投票率）。
 * 「80歳以上」は何歳分もまとめた行なので比べる対象から外す
 */
export function singleAgeVoteGap(
  ages: readonly AgeTurnout[]
): SingleAgeVoteGap {
  const { min: fewest, max: most } = extremesBy(
    singleYearAges(ages),
    (row) => row.voters.total
  );
  return {
    fewest,
    most,
    votesTimes: timesOf(most.voters.total, fewest.voters.total),
    electorateTimes: timesOf(most.electorate.total, fewest.electorate.total),
    rateTimes: timesOf(roundTo(most.rate.total), roundTo(fewest.rate.total)),
  };
}

/**
 * 2つの選挙の5歳ごとの投票率を帯ごとに並べ、差（ポイント、表示値どうし）を付ける。
 * 帯の区切りは同じなので添字で対応させる
 */
export function compareAgeBands(
  currentAges: readonly AgeTurnout[],
  previousAges: readonly AgeTurnout[]
) {
  const previous = turnoutByAgeBand(previousAges);
  return turnoutByAgeBand(currentAges).map((current, i) => ({
    band: current.band,
    current,
    previous: previous[i],
    diff: pointDiff(current.rate.total, previous[i].rate.total),
  }));
}

/** グラフの目盛りの上限。値の最大を step 刻みで切り上げる（41.9 → 50） */
export function axisMax(values: readonly number[], step = 10): number {
  return Math.ceil(Math.max(0, ...values) / step) * step;
}

/** 値が最小・最大の要素（同じ値なら先に出たもの） */
export function extremesBy<T>(
  items: readonly T[],
  value: (item: T) => number
): { min: T; max: T } {
  if (items.length === 0) {
    throw new Error("extremesBy: 空の配列です");
  }
  let min = items[0];
  let max = items[0];
  for (const item of items) {
    if (value(item) < value(min)) min = item;
    if (value(item) > value(max)) max = item;
  }
  return { min, max };
}

/** 女性の投票率が男性を上回った年齢の数 */
export function countAgesWomenAhead(ages: readonly AgeTurnout[]): number {
  return ages.filter((row) => row.rate.female > row.rate.male).length;
}

/**
 * 当日の指定時刻より後に投票した人の数。
 * 速報の時刻ごとの累計と、結了時の当日投票者数の差で求める
 */
export function electionDayVotersAfter(
  progress: readonly ElectionDayProgressPoint[],
  time: string,
  finalElectionDayVoters: number
): number {
  const point = progress.find((p) => p.time === time);
  if (!point) {
    throw new Error(`electionDayVotersAfter: ${time} の速報値がありません`);
  }
  return finalElectionDayVoters - point.voters;
}

/** 「10:00」→「10時」、「19:30」→「19時30分」 */
export function formatClockTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return minute === 0 ? `${hour}時` : `${hour}時${minute}分`;
}

/** 「07:00」「20:00」→「7時から20時まで」 */
export function formatTimeRange(from: string, to: string): string {
  return `${formatClockTime(from)}から${formatClockTime(to)}まで`;
}

const integerFormat = new Intl.NumberFormat("ja-JP");

export function formatCount(value: number): string {
  return integerFormat.format(value);
}

/** 「20,817人」のように表示する */
export function formatPeople(value: number): string {
  return `${formatCount(value)}人`;
}

/** 票の数を「2,588票」のように表示する（投票した人の数。1人1票） */
export function formatVotes(value: number): string {
  return `${formatCount(value)}票`;
}

/**
 * 小数第 digits 位で四捨五入する。掛け算の2進数の誤差（1.005 × 100 = 100.49999…）で
 * 切り捨てにならないよう、いったん小数第8位までに丸めてから四捨五入する
 */
export function roundTo(value: number, digits = 1): number {
  const scale = 10 ** digits;
  return Math.round(Number((value * scale).toFixed(8))) / scale;
}

/**
 * 「58.1%」のように表示する（digits は小数の桁数）。
 * toFixed は2進数で丸めるため 50.05 が "50.0" になる。先に roundTo で四捨五入して、
 * pointDiff（同じ roundTo を使う）と表示が食い違わないようにする。
 * 元の値は資料と同じ小数第2位の投票率なので、1桁表示は「第2位→第1位」の2段階の丸めになる
 */
export function formatPercent(value: number, digits = 1): string {
  return `${roundTo(value, digits).toFixed(digits)}%`;
}

/**
 * 2つの割合の差（ポイント、小数第1位）。画面に出す丸めた値どうしの差にして、
 * 「66.7%と63.5%の差が+3.1」のような表示の食い違いを防ぐ
 */
export function pointDiff(a: number, b: number): number {
  return roundTo(roundTo(a) - roundTo(b));
}

/**
 * a が b の何倍か（小数第1位で四捨五入）。b が0以下なら0。
 * 割合どうしを比べるときは、画面に出す丸めた値を渡して表示と食い違わないようにする
 */
export function timesOf(a: number, b: number): number {
  if (b <= 0) return 0;
  return roundTo(a / b);
}

/** 倍率を「6.2倍」の形で表示する */
export function formatTimes(value: number): string {
  return `${roundTo(value).toFixed(1)}倍`;
}

/** ポイント差を「+1.2ポイント」「−3.4ポイント」の形で表示する */
export function formatPointDiff(value: number): string {
  const rounded = roundTo(value);
  let sign = "±";
  if (rounded > 0) sign = "+";
  if (rounded < 0) sign = "−";
  return `${sign}${Math.abs(rounded).toFixed(1)}ポイント`;
}
