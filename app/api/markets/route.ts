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
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+marketIds+'&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
      {next:{revalidate:30}}
    );
    if(!r.ok)return NextResponse.json({},{status:502});
    const coins=await r.json();
    const markets=Object.fromEntries((coins||[]).map((coin:any)=>[coin.id,{
      usd:coin.current_price,
      usd_24h_change:coin.price_change_percentage_24h,
      usd_market_cap:coin.market_cap,
      image:coin.image,
      name:coin.name,
      symbol:String(coin.symbol||'').toUpperCase()
    }]));
    return NextResponse.json(markets);
  }catch{
    return NextResponse.json({},{status:502});
  }
}
