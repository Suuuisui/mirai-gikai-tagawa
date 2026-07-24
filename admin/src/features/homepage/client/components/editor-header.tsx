import { Button } from "@/components/ui/button";

/**
 * 編集セクション共通のヘッダー。
 * タイトル・未保存バッジ・「変更を破棄」「保存する」ボタンをまとめる。
 */
export function EditorHeader({
  title,
  isDirty,
  isPending,
  onReset,
  onSave,
}: {
  title: string;
  isDirty: boolean;
  isPending: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">
        {title}
        {isDirty && (
          <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            未保存の変更があります
          </span>
        )}
      </h3>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!isDirty || isPending}
          onClick={onReset}
        >
          変更を破棄
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!isDirty || isPending}
          onClick={onSave}
        >
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </div>
  );
}
