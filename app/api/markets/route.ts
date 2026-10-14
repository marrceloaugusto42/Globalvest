import {NextResponse} from 'next/server';

export async function GET(){
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,ripple&vs_currencies=usd&include_24hr_change=true',{next:{revalidate:10}});
    if(!r.ok)return NextResponse.json({},{status:502});
    return NextResponse.json(await r.json());
  }catch{
    return NextResponse.json({},{status:502});
  }
}