import type { QuestionOutlinePoint } from "@mirai-gikai/shared/council/types";

interface OutlinePointsProps {
  points: QuestionOutlinePoint[];
  /** 見出し（質問事項）の下に添える小さめの表示 */
  muted?: boolean;
}

/** 通告書の要旨（(1)(2)… と、その下の ・ で並ぶ細目） */
export function OutlinePoints({ points, muted = false }: OutlinePointsProps) {
  return (
    <ul
      className={
        muted
          ? "flex list-none flex-col gap-1 pl-0 text-[13px] text-mirai-text-secondary"
          : "flex list-none flex-col gap-1 pl-3"
      }
    >
      {points.map((point, pointIndex) => (
        <li key={`${pointIndex}-${point.text}`} className="flex gap-1.5">
          <span className="shrink-0 tabular-nums">({pointIndex + 1})</span>
          <div>
            <span>{point.text}</span>
            {point.subPoints.length > 0 && (
              <ul className="mt-0.5 flex list-none flex-col gap-0.5 pl-3 text-mirai-text-muted">
                {point.subPoints.map((sub, subIndex) => (
                  <li key={`${subIndex}-${sub}`}>・{sub}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
