import {NextResponse} from 'next/server';

const marketIds = [
  'bitcoin','ethereum','tether','solana','ripple',
  'dogecoin','shiba-inu','pepe','dogwifcoin','bonk','floki',
  'official-trump','pudgy-penguins','spx6900','fartcoin','pump-fun',
  'book-of-meme','dogelon-mars','mog-coin'
].join(',');

export async function GET(){
  try{
    const r=await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids='+marketIds+'&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
      {next:{revalidate:30}}
    );
    if(!r.ok)return NextResponse.json({},{status:502});
    return NextResponse.json(await r.json());
  }catch{
    return NextResponse.json({},{status:502});
  }
}
