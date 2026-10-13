'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {getSupabase} from '../../lib/supabase';

export default function LoginPage(){
  const sb=getSupabase();const router=useRouter();
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function submit(e:React.FormEvent){e.preventDefault();setError('');setBusy(true);try{const result=await sb.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(result.error)throw result.error;router.replace('/')}catch(err:any){const msg=String(err?.message||'Login failed. Please try again.');setError(/invalid login credentials|email not confirmed/i.test(msg)?'Email or password is incorrect, or the email has not been verified. If this is a migrated account, register using the same email address first.':msg)}finally{setBusy(false)}}
  return <main className="authPage"><section className="authCard"><a className="authBrand" href="/"><span>G</span><b>Globalvest</b></a><div className="authEyebrow">WELCOME BACK</div><h1>Log in to Globalvest</h1><p className="authIntro">Access your portfolio, wallets and investment activity.</p><form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/><label htmlFor="password">Password</label><div className="authPasswordField"><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?'Hide':'Show'}</button></div>{error&&<div className="authError" role="alert">{error}</div>}<button className="primary full authSubmit" type="submit" disabled={busy}>{busy?'Logging in…':'Log in'}</button></form><p className="authSwitch">New to Globalvest? <a href="/register">Create an account</a></p><a className="authBack" href="/">← Back to Globalvest</a></section></main>
}