import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = 'https://cclyccbzupmdlthvxayp.supabase.co';
const publishableKey = 'sb_publishable_bzr8MMjZ8-DXegs8MEpkvQ_Jgk5dd4F';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization') || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) return NextResponse.json({ error: 'Please sign in again before submitting a withdrawal.' }, { status: 401 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    if (!serviceKey) return NextResponse.json({ error: 'Secure withdrawal processing is not configured. Please contact support.' }, { status: 503 });

    const authClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: 'Your session is invalid or expired. Please sign in again.' }, { status: 401 });
    const userId = authData.user.id;

    const body = await request.json();
    const amount = Number(body.amount);
    const currency = String(body.currency || '').toUpperCase();
    const method = String(body.method || '');
    const reference = String(body.reference || '');
    if (!Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency) || !['bank', 'crypto'].includes(method) || !/^WDR-[A-Z0-9-]{8,32}$/.test(reference)) {
      return NextResponse.json({ error: 'Enter valid withdrawal details.' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const [{ data: profile, error: profileError }, { data: wallets, error: walletError }] = await Promise.all([
      admin.from('profiles').select('kyc_status').eq('id', userId).maybeSingle(),
      admin.from('wallets').select('currency,available_balance').eq('user_id', userId),
    ]);
    if (profileError || walletError) return NextResponse.json({ error: 'Could not verify your account and wallet balances. Please try again.' }, { status: 503 });
    if (profile?.kyc_status !== 'verified') return NextResponse.json({ error: 'Please verify your identity before making a withdrawal.' }, { status: 403 });

    const ratesResponse = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (!ratesResponse.ok) return NextResponse.json({ error: 'Live exchange rates are unavailable. Please try again shortly.' }, { status: 503 });
    const rateData = await ratesResponse.json();
    let totalUsd = 0;
    for (const wallet of wallets || []) {
      const code = String(wallet.currency || '').toUpperCase();
      const rate = code === 'USD' || code === 'USDT' ? 1 : Number(rateData?.rates?.[code]);
      if (!Number.isFinite(rate) || rate <= 0) return NextResponse.json({ error: 'We could not verify the current USD value of your ' + code + ' wallet. Please try again later.' }, { status: 503 });
      totalUsd += Number(wallet.available_balance || 0) / rate;
    }
    if (totalUsd < 10000) return NextResponse.json({ error: 'Minimum amount to withdraw is from $10,000 up. Your combined account value must be at least $10,000 USD equivalent, regardless of currency.' }, { status: 403 });

    const wallet = (wallets || []).find((item) => String(item.currency).toUpperCase() === currency);
    if (!wallet || Number(wallet.available_balance || 0) < amount) return NextResponse.json({ error: 'Insufficient available balance in the selected wallet.' }, { status: 400 });

    if (method === 'bank' && (!body.country || !body.bank_currency || !body.bank_name || !String(body.account_name || '').trim() || !String(body.account_number || '').trim())) {
      return NextResponse.json({ error: 'Complete all bank account details before submitting.' }, { status: 400 });
    }
    if (method === 'crypto' && (!body.network || !String(body.wallet_address || '').trim())) {
      return NextResponse.json({ error: 'Select a network and enter your wallet address.' }, { status: 400 });
    }
    const fee = method === 'crypto' ? ({ TRC20: 1, ERC20: 5, BEP20: 0.5, Polygon: 0.2, Solana: 0.1 } as Record<string, number>)[String(body.network)] : 0;
    if (fee === undefined || amount <= fee) return NextResponse.json({ error: 'The withdrawal amount must be greater than the estimated network fee.' }, { status: 400 });
    const destination = method === 'bank'
      ? String(body.bank_name) + ' · ' + String(body.account_name).trim() + ' · ' + String(body.account_number).trim()
      : String(body.network) + ' · ' + String(body.wallet_address).trim();
    const { data, error } = await admin.from('withdrawal_requests').insert({
      user_id: userId, amount, currency, method, destination, reference, fee, net_amount: amount - fee,
      country: method === 'bank' ? String(body.country) : null,
      bank_currency: method === 'bank' ? String(body.bank_currency) : null,
      bank_name: method === 'bank' ? String(body.bank_name) : null,
      account_name: method === 'bank' ? String(body.account_name).trim() : null,
      account_number: method === 'bank' ? String(body.account_number).trim() : null,
      network: method === 'crypto' ? String(body.network) : null,
      wallet_address: method === 'crypto' ? String(body.wallet_address).trim() : null,
      status: 'pending',
    }).select('id,reference,status').single();
    if (error) return NextResponse.json({ error: 'Withdrawal request failed: ' + error.message }, { status: 400 });
    return NextResponse.json({ ok: true, request: data, accountValueUsd: totalUsd });
  } catch {
    return NextResponse.json({ error: 'Withdrawal request could not be processed. Please try again.' }, { status: 500 });
  }
}
