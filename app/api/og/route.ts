import { ImageResponse } from "next/og";
import { createElement as h } from "react";

export const runtime = "edge";

export async function GET() {
  const logo = h(
    "div",
    {
      style: {
        width: 62,
        height: 62,
        borderRadius: 17,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0ecb81",
        color: "#071b15",
        fontSize: 39,
        fontWeight: 900,
      },
    },
    "G"
  );

  const brand = h(
    "div",
    { style: { display: "flex", flexDirection: "column" } },
    h("span", { style: { fontSize: 30, fontWeight: 800, letterSpacing: -0.5 } }, "GLOBALVEST"),
    h("span", { style: { fontSize: 15, color: "#a9d8c4", letterSpacing: 4, marginTop: 4 } }, "CAPITAL")
  );

  const header = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 18 } },
    logo,
    brand
  );

  const headline = h(
    "div",
    { style: { display: "flex", flexDirection: "column", maxWidth: 900 } },
    h(
      "div",
      { style: { fontSize: 19, color: "#72e2b5", fontWeight: 700, letterSpacing: 4, marginBottom: 20 } },
      "GLOBAL INVESTING, SIMPLIFIED"
    ),
    h("div", { style: { fontSize: 66, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2 } }, "Your goals."),
    h(
      "div",
      { style: { fontSize: 66, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2, color: "#0ecb81" } },
      "A global perspective."
    ),
    h(
      "div",
      { style: { fontSize: 23, lineHeight: 1.5, color: "#d0e5dc", marginTop: 22 } },
      "Explore opportunities and follow your portfolio in one place."
    )
  );

  const footer = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #376454",
        paddingTop: 20,
      },
    },
    h("span", { style: { fontSize: 17, color: "#c4dfd3" } }, "Globalvest Capital"),
    h("span", { style: { fontSize: 16, color: "#72e2b5" } }, "GLOBAL FINANCIAL ACCESS")
  );

  const image = h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        background: "linear-gradient(135deg, #071b15 0%, #102d23 58%, #0b6b4f 100%)",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      },
    },
    header,
    headline,
    footer
  );

  return new ImageResponse(image, {
    width: 1200,
    height: 630,
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
