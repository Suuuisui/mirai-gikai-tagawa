import { buildOfficialMinutesIndex } from "../utils/official-minutes";
import {
  OFFICIAL_MINUTES,
  OFFICIAL_MINUTES_CODE,
} from "./official-minutes-data";

/**
 * 会議録検索システムに公開されている本会議の会議録の索引（生成データから作る）。
 * データは毎朝の自動更新（tagawa:scrape-minutes-index）で作り直される
 */
export const officialMinutesIndex = buildOfficialMinutesIndex(
  OFFICIAL_MINUTES,
  OFFICIAL_MINUTES_CODE
);
