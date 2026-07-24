import { ExternalLink } from "lucide-react";
import { FeaturedBillsEditor } from "@/features/homepage/client/components/featured-bills-editor";
import { FeaturedTagsEditor } from "@/features/homepage/client/components/featured-tags-editor";
import { loadHomepageData } from "@/features/homepage/server/loaders/load-homepage-data";

export default async function HomepageEditPage() {
  const data = await loadHomepageData();

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold">トップページ編集</h1>
        <p className="text-sm text-gray-600">
          公開サイトのトップページに「どの議案・どのタグを、どの順番で出すか」をここで設定します。保存するとすぐに公開サイトへ反映されます。
        </p>
        {data.webUrl && (
          <a
            href={data.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            公開サイトのトップページを見る
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      {/* セクション1: 注目の議案 */}
      <section className="mb-10 rounded-lg border bg-white p-6">
        <div className="mb-4 space-y-2">
          <h2 className="text-lg font-semibold">🔥 注目の議案</h2>
          <p className="text-sm text-gray-600">
            トップページの一番上に大きく表示されるセクションです。ここに入れた議案が、設定した順番でそのまま並びます（1が最上位）。
          </p>
        </div>
        <FeaturedBillsEditor
          key={data.featuredBills.map((bill) => bill.id).join(",")}
          featuredBills={data.featuredBills}
          candidateBills={data.candidateBills}
        />
      </section>

      {/* セクション2: タグ別セクション */}
      <section className="rounded-lg border bg-white p-6">
        <div className="mb-4 space-y-2">
          <h2 className="text-lg font-semibold">🏷️ タグ別セクション</h2>
          <p className="text-sm text-gray-600">
            「注目の議案」の下に、タグごとの議案セクションが並びます。ここで設定できるのは「どのタグを・どの順番で出すか」です。
          </p>
          <ul className="list-disc space-y-1 rounded-md bg-blue-50 p-3 pl-8 text-xs text-blue-900">
            <li>
              各タグ枠に出る議案3件は<strong>自動選定</strong>
              です（興味度スコアが高い順。下のプレビューで確認できます）
            </li>
            <li>
              特定の議案を必ずトップページに出したい場合は、上の「注目の議案」に追加してください（注目に入れた議案はタグ枠から自動で除外され、重複表示されません）
            </li>
            <li>
              直近90日以内に話題性の高い議案（否決など）が出たタグは、設定順に関わらず一時的に上位へ自動昇格します
            </li>
          </ul>
        </div>
        <FeaturedTagsEditor
          key={data.featuredTagSections.map((section) => section.id).join(",")}
          sections={data.featuredTagSections}
          hiddenTags={data.hiddenTags}
        />
      </section>
    </div>
  );
}
