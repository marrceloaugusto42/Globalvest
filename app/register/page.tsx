'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {getSupabase} from '../../lib/supabase';

export default function RegisterPage(){
  const sb=getSupabase();
  const router=useRouter();
  const [firstName,setFirstName]=useState('');
  const [country,setCountry]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function submit(e:React.FormEvent){
    e.preventDefault();setError('');
    const address=email.trim().toLowerCase();
    if(!firstName.trim()||!country.trim()||!address||password.length<8){setError('Enter your first name, country, valid email, and a password with at least 8 characters.');return}
    setBusy(true);
    try{
      const created=await sb.auth.signUp({email:address,password,options:{data:{full_name:firstName.trim(),first_name:firstName.trim(),country:country.trim()}}});
      if(created.error)throw created.error;
      let verificationType:'signup'|'email'='signup';
      if(created.data.session){
        await sb.auth.signOut();
        const sent=await sb.auth.signInWithOtp({email:address,options:{shouldCreateUser:false}});
        if(sent.error)throw sent.error;
        verificationType='email';
      }
      try{localStorage.setItem('globalvest-signup-verification-type',verificationType)}catch{}
      router.push('/verify?email='+encodeURIComponent(address));
    }catch(err:any){setError(err?.message||'Registration failed. Please try again.')}
    finally{setBusy(false)}
  }
  return <main className="authPage"><section className="authCard"><a className="authBrand" href="/"><span>G</span><b>Globalvest</b></a><div className="authEyebrow">CREATE YOUR ACCOUNT</div><h1>Join Globalvest</h1><p className="authIntro">Set up your account to access your global investment dashboard.</p><form onSubmit={submit}><label htmlFor="firstName">First name</label><input id="firstName" autoComplete="given-name" placeholder="Enter your first name" value={firstName} onChange={e=>setFirstName(e.target.value)} required/><label htmlFor="country">Country</label><input id="country" autoComplete="country-name" placeholder="Enter your country" value={country} onChange={e=>setCountry(e.target.value)} required/><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/><label htmlFor="password">Password</label><div className="authPasswordField"><input id="password" type={showPassword?'text':'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?'Hide':'Show'}</button></div><small className="authHint">Use at least 8 characters. You can show or hide your password while typing.</small>{error&&<div className="authError" role="alert">{error}</div>}<button className="primary full authSubmit" type="submit" disabled={busy}>{busy?'Creating account…':'Create account'}</button></form><p className="authSwitch">Already registered? <a href="/login">Log in</a></p><a className="authBack" href="/">← Back to Globalvest</a></section></main>
}