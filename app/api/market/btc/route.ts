import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const endpoints = [
    "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=56",
    "https://api1.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=56",
    "https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=15m&limit=56",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) continue;
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows, {
          headers: { "Cache-Control": "no-store, max-age=0" },
        });
      }
    } catch {
      // Try the next public market-data endpoint.
    }
  }

  return NextResponse.json(
    { error: "Live BTC market data is temporarily unavailable." },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
