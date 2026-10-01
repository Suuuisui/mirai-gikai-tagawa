"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AgeRow, MaleFemaleTotal } from "../../shared/data/turnout-data";
import {
  type AgeTurnout,
  ageLabel,
  formatPeople,
  formatPercent,
  formatPointDiff,
  pointDiff,
  summarizeAges,
} from "../../shared/utils/turnout";

/** 性別の選択（"total" は男女あわせた全体） */
type SexFilter = keyof MaleFemaleTotal;

const SEX_OPTIONS: readonly { value: SexFilter; label: string }[] = [
  { value: "total", label: "全体" },
  { value: "female", label: "女性" },
  { value: "male", label: "男性" },
];

const SEX_PREFIX: Record<SexFilter, string> = {
  total: "",
  female: "女性の",
  male: "男性の",
};

/** はじめに表示する年齢。投票率が低い若い世代の例として20歳にしている */
const DEFAULT_AGE = 20;

const FIELD_LABEL_CLASS = "text-xs font-bold text-mirai-text-secondary";

/** 年齢を選ぶ欄 */
function AgeSelect({
  ages,
  value,
  onChange,
}: {
  ages: readonly AgeTurnout[];
  value: number;
  onChange: (age: number) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className={FIELD_LABEL_CLASS}>
        年齢
      </span>
      <Select
        value={String(value)}
        onValueChange={(next) => onChange(Number(next))}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-10 w-32 border-mirai-border bg-white text-sm text-mirai-text"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {ages.map((row) => (
            <SelectItem key={row.age} value={String(row.age)}>
              {ageLabel(row.age)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** 性別を選ぶボタンの組。選んでいるボタンは aria-pressed で伝える */
function SexToggle({
  value,
  onChange,
}: {
  value: SexFilter;
  onChange: (sex: SexFilter) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className={FIELD_LABEL_CLASS}>
        性別
      </span>
      <div role="group" aria-labelledby={labelId} className="flex gap-1.5">
        {SEX_OPTIONS.map((option) => {
          const isActive = option.value === value;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={cn(
                "h-10 px-4 text-[13px]",
                !isActive &&
                  "border-mirai-border font-medium text-mirai-text-secondary"
              )}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

interface ExplorerResultProps {
  selected: AgeTurnout;
  /** 比べる選挙の同じ年齢の行（無ければ比較の文を出さない） */
  sameAgeBefore: AgeTurnout | undefined;
  sex: SexFilter;
  currentLabel: string;
  previousLabel: string;
  overallRate: number;
}

/** 選んだ年齢・性別の投票率と、比べる選挙の同じ年齢との差。変わるたびに読み上げる */
function ExplorerResult({
  selected,
  sameAgeBefore,
  sex,
  currentLabel,
  previousLabel,
  overallRate,
}: ExplorerResultProps) {
  const selectedRate = selected.rate[sex];
  const who = `${ageLabel(selected.age)}の${SEX_PREFIX[sex]}有権者`;
  return (
    <div aria-live="polite" className="flex flex-col gap-2">
      <p className="text-sm text-mirai-text-secondary">
        {currentLabel}で、{who}のうち投票した人は
      </p>
      <p className="text-5xl font-bold leading-none text-mirai-text">
        {formatPercent(selectedRate)}
      </p>
      <p className="text-sm leading-relaxed text-mirai-text">
        {formatPeople(selected.electorate[sex])}のうち
        {formatPeople(selected.voters[sex])}が投票しました。
        <span className="whitespace-nowrap text-mirai-text-muted">
          （市全体は{formatPercent(overallRate)}）
        </span>
      </p>
      {sameAgeBefore && (
        <p className="text-xs leading-relaxed text-mirai-text-muted">
          {/* 令和5年4月と令和8年7月は約3年あいている（比較する選挙を替えたら直す） */}
          {`${previousLabel}では、同じ${ageLabel(sameAgeBefore.age)}の${SEX_PREFIX[sex]}投票率は${formatPercent(sameAgeBefore.rate[sex])}でした（${formatPointDiff(pointDiff(selectedRate, sameAgeBefore.rate[sex]))}）。約3年前の同じ年齢の人と比べたもので、同じ人の変化ではありません。`}
        </p>
      )}
    </div>
  );
}

interface AgeTurnoutExplorerProps {
  /** 主に見せる選挙（令和8年7月の市長選挙）の年齢別の行（資料の転記のまま） */
  current: readonly AgeRow[];
  /** 比べる選挙（令和5年4月の市議会議員選挙）の年齢別の行 */
  previous: readonly AgeRow[];
  currentLabel: string;
  previousLabel: string;
  /** 市全体の投票率（current の選挙） */
  overallRate: number;
}

/**
 * 年齢（と性別）を選ぶと、同じ年齢の人がどれくらい投票したかを出す。
 * 集計はここで行い、ページから渡すデータは転記した行だけにする（RSC の転送量を抑える）
 */
export function AgeTurnoutExplorer({
  current,
  previous,
  currentLabel,
  previousLabel,
  overallRate,
}: AgeTurnoutExplorerProps) {
  const [age, setAge] = useState(DEFAULT_AGE);
  const [sex, setSex] = useState<SexFilter>("total");
  const currentAges = useMemo(() => summarizeAges(current), [current]);
  const previousAges = useMemo(() => summarizeAges(previous), [previous]);

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-mirai-border-muted bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <AgeSelect ages={currentAges} value={age} onChange={setAge} />
        <SexToggle value={sex} onChange={setSex} />
      </div>
      <ExplorerResult
        selected={currentAges.find((row) => row.age === age) ?? currentAges[0]}
        sameAgeBefore={previousAges.find((row) => row.age === age)}
        sex={sex}
        currentLabel={currentLabel}
        previousLabel={previousLabel}
        overallRate={overallRate}
      />
    </div>
  );
}
