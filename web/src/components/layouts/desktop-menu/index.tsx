import { DesktopMenuLogo } from "./logo";
import { DesktopMenuRubyToggle } from "./ruby-toggle";
import { DesktopMenuSidebar } from "./sidebar";

/**
 * デスクトップメニュー (画面幅1400px以上で表示)
 *
 * 構成:
 * - ロゴ: 画面左上
 * - ルビ切り替え: 画面右上
 * - サイドバー: 画面左下
 *
 * 難易度切り替え（説明をもっと詳しく）は、田川市版では hard 難易度の
 * 議案本文を用意していないため一時的に非表示にしている。
 * hard 版コンテンツを用意した際に DesktopMenuDifficultyToggle を復活させること。
 */
export async function DesktopMenu() {
  return (
    <div className="hidden pcl:block">
      <DesktopMenuLogo />
      <DesktopMenuRubyToggle />
      <DesktopMenuSidebar />
    </div>
  );
}
