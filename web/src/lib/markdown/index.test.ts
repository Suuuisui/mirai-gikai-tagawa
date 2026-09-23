import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./index";

describe("parseMarkdown", () => {
  it("should not allow malicious iframe elements", async () => {
    const markdown = `<iframe src="https://malicious.com/evil" onload="alert('XSS')"></iframe>

https://www.youtube.com/watch?v=safe123`;

    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // 悪意のあるiframeは削除され、YouTube埋め込みだけが残ることを確認
    expect(html).not.toContain("malicious.com");
    expect(html).not.toContain("onload");
    expect(html).toContain('src="https://www.youtube.com/embed/safe123"');
  });

  it("予算の図解とことばの印が sanitize を通り抜けて描画され、図の中には印が付かない", async () => {
    const chart = JSON.stringify({
      title: "図でみる補正",
      total: {
        label: "一般会計の予算総額",
        before: 100,
        change: 5,
        after: 105,
      },
      breakdowns: [
        {
          title: "歳出",
          items: [{ label: "総務費", amount: 5, note: "基金への積立て" }],
        },
      ],
    });
    const markdown = [
      "## 解説",
      "",
      "**財政調整基金**からの繰入れで",
      "補正予算を組む。",
      "",
      "```budget-chart",
      chart,
      "```",
      "",
      "```budget-chart",
      "{ broken",
      "```",
    ].join("\n");

    const html = renderToStaticMarkup(await parseMarkdown(markdown));

    expect(html).toContain("<figure");
    expect(html).toContain("105円");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain("<strong><button");
    const figure = html.slice(
      html.indexOf("<figure"),
      html.indexOf("</figure>")
    );
    expect(figure).not.toContain("aria-haspopup");
    expect(html).toContain("<pre>");
    expect(html).toContain("{ broken");
  });
});
