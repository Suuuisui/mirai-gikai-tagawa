import type { Database } from "@mirai-gikai/supabase";

type Bill = Database["public"]["Tables"]["bills"]["Row"];

/** 提出時の議案説明資料PDFへのリンク（田川市公式サイト掲載分） */
export interface ExplanationMaterialUrl {
  label: string;
  url: string;
}

/**
 * bills.explanation_material_urls（jsonbカラム）の値を検証して
 * ExplanationMaterialUrl[] に変換する。
 * 想定形式（{label, url}の配列）でない値・空配列は空配列を返す
 */
export function parseExplanationMaterialUrls(
  value: Bill["explanation_material_urls"]
): ExplanationMaterialUrl[] {
  if (!Array.isArray(value)) return [];
  const result: ExplanationMaterialUrl[] = [];
  for (const item of value) {
    if (
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item) &&
      typeof item.label === "string" &&
      typeof item.url === "string" &&
      item.label !== "" &&
      item.url !== ""
    ) {
      result.push({ label: item.label, url: item.url });
    }
  }
  return result;
}
