import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requested = String(searchParams.get('currencies') || searchParams.get('currency') || 'USD')
    .toUpperCase().split(',').map((code) => code.trim()).filter(Boolean);
  if (!requested.length || requested.some((code) => !/^[A-Z]{3}$/.test(code))) {
    return NextResponse.json({ error: 'Valid three-letter currency codes are required.' }, { status: 400 });
  }
  if (requested.every((code) => code === 'USD' || code === 'USDT')) {
    const rates = Object.fromEntries(requested.map((code) => [code, 1]));
    return NextResponse.json({ rates, rate: rates[requested[0]], currency: requested[0], source: 'USD base rate' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (!response.ok) throw new Error('Exchange-rate provider returned an error.');
    const data = await response.json();
    const rates: Record<string, number> = { USD: 1, USDT: 1 };
    for (const code of requested) {
      if (code === 'USD' || code === 'USDT') continue;
      const rate = Number(data?.rates?.[code]);
      if (!Number.isFinite(rate) || rate <= 0) {
        return NextResponse.json({ error: 'A current exchange rate is unavailable for ' + code + '.' }, { status: 404 });
      }
      rates[code] = rate;
    }
    return NextResponse.json({ rates, rate: rates[requested[0]], currency: requested[0], source: 'exchange-rate provider', updatedAt: data?.time_last_update_utc || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Exchange rates are temporarily unavailable.' }, { status: 503 });
  }
}
