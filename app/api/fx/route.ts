import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = String(searchParams.get('currency') || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: 'A valid currency code is required.' }, { status: 400 });
  }
  if (currency === 'USD') {
    return NextResponse.json({ currency, rate: 1, source: 'USD base rate' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (!response.ok) throw new Error('Exchange-rate provider returned an error.');
    const data = await response.json();
    const rate = Number(data?.rates?.[currency]);
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: 'A rate is not available for this currency.' }, { status: 404 });
    }
    return NextResponse.json({ currency, rate, source: 'exchange-rate provider', updatedAt: data?.time_last_update_utc || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Exchange rates are temporarily unavailable.' }, { status: 503 });
  }
}
