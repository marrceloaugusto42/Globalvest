import { NextResponse } from 'next/server';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] as string);

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { sent: false, reason: 'Email delivery is not configured yet.' },
      { status: 503 },
    );
  }

  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mbmmdxqbwrjcnklbmogr.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_sQfBJtUT3TWDonu3Eo77KQ_MSVbq0uz';

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!authResponse.ok) return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });

  const user = await authResponse.json();
  const email = typeof user.email === 'string' ? user.email : '';
  if (!email) return NextResponse.json({ error: 'Account email not found.' }, { status: 400 });

  let suppliedName = '';
  try {
    const body = await request.json();
    suppliedName = typeof body?.firstName === 'string' ? body.firstName.trim().slice(0, 100) : '';
  } catch {
    // A missing name is fine; use a friendly generic greeting.
  }
  const firstName = escapeHtml(suppliedName || 'there');
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://globalvestcapital.site').replace(/\/$/, '');
  const supportEmail = process.env.SUPPORT_EMAIL || from.match(/<([^>]+)>/)?.[1] || from;
  const safeSupportEmail = escapeHtml(supportEmail);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f3f7f5;font-family:Arial,Helvetica,sans-serif;color:#172a22">
  <div style="display:none;max-height:0;overflow:hidden">Welcome to Globalvest Capital.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7f5;padding:28px 12px"><tr><td align="center">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #e1ebe5;border-radius:18px;overflow:hidden">
  <tr><td style="padding:28px 32px;background:#0b6b4f;background-image:linear-gradient(120deg,#075c43,#0b7657);color:#fff;font-size:23px;font-weight:800"><span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;border-radius:9px;background:#0dbb91;margin-right:8px">G</span>Globalvest <span style="font-weight:500;color:#c9f7df">Capital</span><div style="padding-top:10px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#c9f7df">A clearer view of your financial journey</div></td></tr>
  <tr><td style="padding:36px 32px 28px"><p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#0b7657">Welcome aboard</p>
  <h1 style="margin:0 0 16px;font-size:29px;line-height:1.25;color:#172a22">Welcome, ${firstName}.</h1>
  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#43564c">Your Globalvest Capital account has been created. You can now sign in to view your dashboard, manage your profile, explore available products, and follow your account activity.</p>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#617268">Please review all investment terms, fees, risks, and withdrawal conditions before making an investment. Investment returns are not guaranteed.</p>
  <table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#0b7657" style="border-radius:10px"><a href="${appUrl}" style="display:inline-block;padding:14px 22px;color:#fff;text-decoration:none;font-size:15px;font-weight:700">Open your account</a></td></tr></table>
  <div style="margin-top:26px;padding:16px 18px;background:#f0faf5;border:1px solid #d7f0e2;border-radius:12px"><p style="margin:0 0 5px;font-size:13px;font-weight:800;color:#0b6b4f">Your security matters</p><p style="margin:0;font-size:13px;line-height:1.6;color:#43564c">We will never ask you to email us your password or one-time security code.</p></div>
  <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#43564c">Kind regards,<br><strong>The Globalvest Capital Team</strong></p></td></tr>
  <tr><td style="padding:20px 32px;background:#f8fbf9;border-top:1px solid #e6eee9;font-size:11px;line-height:1.7;color:#84948b">Need help? Contact <a href="mailto:${safeSupportEmail}" style="color:#0b7657">${safeSupportEmail}</a>.<br>© ${new Date().getFullYear()} Globalvest Capital. All rights reserved.</td></tr>
  </table><p style="margin:14px 0 0;font-size:11px;color:#84948b">If you did not create this account, please contact support.</p>
  </td></tr></table></body></html>`;

  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Welcome to Globalvest Capital',
      html,
      text: `Welcome, ${suppliedName || 'there'}. Your Globalvest Capital account has been created. Sign in at ${appUrl}. Investment returns are not guaranteed.`,
    }),
    cache: 'no-store',
  });
  const resultBody = await result.json().catch(() => ({}));
  if (!result.ok) {
    console.error('Resend welcome email failed:', result.status, resultBody);
    return NextResponse.json({ sent: false, reason: 'Email provider rejected the message.' }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
