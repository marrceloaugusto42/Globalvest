'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Trade = { id: string; time: string; side: 'BUY' | 'SELL'; price: number; amount: number; fee: number; pnl?: number };
type BotState = {
  active: boolean; symbol: string; lower: number; upper: number; stopLoss: number; takeProfit: number; grids: number; investment: number;
  initialCapital: number; quoteBalance: number; baseQty: number; avgEntry: number; realized: number;
  fees: number; trades: Trade[]; nextBuy: number; nextSell: number; lastPrice: number; status: string;
};
const KEY = 'globalvest-grid-bot-demo-v1';
const FEE = 0.02;
const SYMBOLS: Record<string, { id: string; label: string }> = {
  BTCUSDT: { id: 'bitcoin', label: 'BTC / USDT' },
  ETHUSDT: { id: 'ethereum', label: 'ETH / USDT' },
  SOLUSDT: { id: 'solana', label: 'SOL / USDT' },
};
const money = (n: number) => '$' + (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const priceFmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 6 : 2 });
const blank = (): BotState => ({ active: false, symbol: 'BTCUSDT', lower: 0, upper: 0, stopLoss: 0, takeProfit: 0, grids: 20, investment: 100, initialCapital: 0, quoteBalance: 0, baseQty: 0, avgEntry: 0, realized: 0, fees: 0, trades: [], nextBuy: 0, nextSell: 0, lastPrice: 0, status: 'Ready to configure' });

export default function TradingBot() {
  const [bot, setBot] = useState<BotState>(blank);
  const botRef = useRef(bot);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const initialized = useRef(false);
  const update = useCallback((next: BotState | ((old: BotState) => BotState)) => {
    setBot(old => {
      const value = typeof next === 'function' ? next(old) : next;
      botRef.current = value;
      try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
      return value;
    });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BotState;
        if (parsed && SYMBOLS[parsed.symbol] && Array.isArray(parsed.trades)) {
          parsed.active = false;
          parsed.status = parsed.trades.length ? 'Paused after page reload — resume when ready' : 'Ready to configure';
          botRef.current = parsed;
          setBot(parsed);
        }
      }
    } catch {}
    initialized.current = true;
  }, []);

  const refreshPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/markets', { cache: 'no-store' });
      if (!response.ok) throw new Error('market feed unavailable');
      const data = await response.json();
      const next: Record<string, number> = {
        BTCUSDT: Number(data?.bitcoin?.usd),
        ETHUSDT: Number(data?.ethereum?.usd),
        SOLUSDT: Number(data?.solana?.usd),
      };
      Object.keys(next).forEach(k => { if (!Number.isFinite(next[k]) || next[k] <= 0) delete next[k]; });
      setPrices(prev => ({ ...prev, ...next }));
      setLoading(false);
      const current = botRef.current;
      const live = next[current.symbol];
      if (!live) return;
      if (!current.lower || !current.upper) {
        const configured = { ...current, lower: Number((live * 0.95).toFixed(6)), upper: Number((live * 1.05).toFixed(6)), lastPrice: live };
        update(configured);
        return;
      }
      update(current => {
        const b = { ...current, lastPrice: live };
        if (!b.active) return b;
        const exitReason = b.stopLoss > 0 && live <= b.stopLoss ? 'Stop-loss triggered' : b.takeProfit > 0 && live >= b.takeProfit ? 'Take-profit triggered' : '';
        if (exitReason) {
          if (b.baseQty > 0) {
            const quantity = b.baseQty;
            const gross = quantity * live;
            const cyclePnl = gross - FEE - quantity * b.avgEntry;
            b.quoteBalance += gross - FEE;
            b.realized += cyclePnl;
            b.fees += FEE;
            b.trades = [{ id: crypto.randomUUID(), time: new Date().toISOString(), side: 'SELL', price: live, amount: quantity, fee: FEE, pnl: cyclePnl }, ...b.trades].slice(0, 100);
            b.baseQty = 0;
          }
          b.active = false;
          b.status = exitReason + ' · bot stopped';
          return b;
        }
        if (live < b.lower || live > b.upper) {
          b.status = 'Paused: price is outside your grid range';
          return b;
        }
        b.status = 'Running · watching grid levels';
        const step = (b.upper - b.lower) / Math.max(2, b.grids);
        if (b.baseQty <= 0 && live <= b.nextBuy && b.quoteBalance > FEE + 0.01) {
          const orderValue = Math.min(b.investment / b.grids, b.quoteBalance - FEE);
          if (orderValue > FEE) {
            const quantity = orderValue / live;
            b.quoteBalance -= orderValue + FEE;
            b.baseQty = quantity;
            b.avgEntry = live;
            b.fees += FEE;
            b.nextSell = Math.min(b.upper, live + step);
            b.nextBuy = Math.max(b.lower, live - step);
            b.trades = [{ id: crypto.randomUUID(), time: new Date().toISOString(), side: 'BUY', price: live, amount: quantity, fee: FEE }, ...b.trades].slice(0, 100);
            b.status = 'Buy filled in demo mode';
          }
        } else if (b.baseQty > 0 && live >= b.nextSell) {
          const quantity = b.baseQty;
          const gross = quantity * live;
          const pnl = gross - FEE - quantity * b.avgEntry;
          b.quoteBalance += gross - FEE;
          b.baseQty = 0;
          b.realized += pnl;
          b.fees += FEE;
          b.nextBuy = Math.max(b.lower, live - step);
          b.nextSell = Math.min(b.upper, live + step);
          b.trades = [{ id: crypto.randomUUID(), time: new Date().toISOString(), side: 'SELL', price: live, amount: quantity, fee: FEE, pnl }, ...b.trades].slice(0, 100);
          b.status = pnl >= 0 ? 'Sell filled · grid cycle complete' : 'Sell filled · this cycle closed at a loss';
        }
        return b;
      });
    } catch {
      setLoading(false);
      setNotice('Live market prices are temporarily unavailable. The bot will not place demo orders without a fresh price.');
    }
  }, [update]);

  useEffect(() => {
    refreshPrices();
    const timer = window.setInterval(refreshPrices, 15000);
    return () => window.clearInterval(timer);
  }, [refreshPrices]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const selectedPrice = prices[bot.symbol] || bot.lastPrice;
  const pnl = bot.quoteBalance + bot.baseQty * selectedPrice - bot.initialCapital;
  const changeConfig = (field: 'symbol' | 'lower' | 'upper' | 'stopLoss' | 'takeProfit' | 'grids' | 'investment', value: string) => {
    if (bot.active) { setNotice('Stop the bot before changing its settings.'); return; }
    update({ ...bot, [field]: field === 'symbol' ? value : Number(value) });
  };
  const start = () => {
    const p = prices[bot.symbol] || bot.lastPrice;
    if (!p) return setNotice('Waiting for live market price. Try again in a moment.');
    if (!(bot.lower > 0 && bot.upper > bot.lower && bot.grids >= 2 && bot.grids <= 100 && bot.investment >= 10)) {
      return setNotice('Set a valid price range, 2–100 grids, and at least $10 demo capital.');
    }
    if (bot.stopLoss > 0 && bot.stopLoss >= bot.lower) return setNotice('Stop-loss must be below the lower grid price.');
    if (bot.takeProfit > 0 && bot.takeProfit <= bot.upper) return setNotice('Take-profit must be above the upper grid price.');
    if (p < bot.lower || p > bot.upper) return setNotice('The current price is outside your grid range. Adjust the range to include the current price.');
    const step = (bot.upper - bot.lower) / bot.grids;
    update({ ...bot, active: true, initialCapital: bot.investment, quoteBalance: bot.investment, baseQty: 0, avgEntry: 0, realized: 0, fees: 0, trades: [], lastPrice: p, nextBuy: Math.max(bot.lower, p - step), nextSell: Math.min(bot.upper, p + step), status: 'Running · waiting for first grid trigger' });
    setNotice('Demo bot started. No real funds or exchange orders are used.');
  };
  const stop = () => update({ ...botRef.current, active: false, status: 'Stopped · demo assets remain in this simulator' });
  const reset = () => {
    if (botRef.current.active) return setNotice('Stop the bot before resetting its demo session.');
    const fresh = { ...blank(), symbol: bot.symbol, lower: bot.lower, upper: bot.upper, stopLoss: bot.stopLoss, takeProfit: bot.takeProfit, grids: bot.grids, investment: bot.investment, lastPrice: selectedPrice, status: 'Demo session reset' };
    update(fresh);
  };

  return <div className="tradingBotPage">
    <div className="botPageHeading"><div><div className="botEyebrow">AUTOMATED STRATEGY</div><h2>Trading Bot</h2><p>Grid strategy · Buy lower, sell higher · Spot-style demo simulation</p></div><span className={'botStatus '+(bot.active ? 'isRunning' : '')}><i />{bot.active ? 'BOT RUNNING' : 'BOT OFF'}</span></div>
    <div className="botDemoNotice"><b>Demo trading only</b><span>This version uses live reference prices to simulate trades. It does not connect to an exchange or move real money, and it pauses when this page is closed or reloaded.</span></div>
    {notice && <div className="botNotice">{notice}</div>}
    <div className="botMetricGrid">
      <div className="botMetric"><span>Current market price</span><strong>{selectedPrice ? money(selectedPrice) : loading ? 'Loading…' : 'Unavailable'}</strong><small>{bot.symbol.replace('USDT', '/USDT')} · live reference</small></div>
      <div className="botMetric"><span>Demo total P&amp;L</span><strong className={pnl >= 0 ? 'botPositive' : 'botNegative'}>{pnl >= 0 ? '+' : ''}{money(pnl)}</strong><small>Includes simulated trading fees</small></div>
      <div className="botMetric"><span>Simulated fees</span><strong>{money(bot.fees)}</strong><small>$0.02 per filled buy or sell</small></div>
      <div className="botMetric"><span>Completed orders</span><strong>{bot.trades.length}</strong><small>Recent fills shown below</small></div>
    </div>
    <div className="botWorkspace">
      <section className="botCard botSetup"><div className="botCardTitle"><div><h3>Configure grid bot</h3><p>Choose your market and risk limits.</p></div><span className="botTag">SPOT GRID</span></div>
        <label>Trading pair<select value={bot.symbol} disabled={bot.active} onChange={e => changeConfig('symbol', e.target.value)}>{Object.entries(SYMBOLS).map(([symbol, item]) => <option key={symbol} value={symbol}>{item.label}</option>)}</select></label>
        <div className="botInputPair"><label>Lower price (USDT)<input type="number" min="0" value={bot.lower || ''} disabled={bot.active} placeholder="Auto from market price" onChange={e => changeConfig('lower', e.target.value)} /></label><label>Upper price (USDT)<input type="number" min="0" value={bot.upper || ''} disabled={bot.active} placeholder="Auto from market price" onChange={e => changeConfig('upper', e.target.value)} /></label></div>
        <div className="botInputPair"><label>Grid levels<input type="number" min="2" max="100" value={bot.grids} disabled={bot.active} onChange={e => changeConfig('grids', e.target.value)} /></label><label>Demo capital (USD)<input type="number" min="10" step="1" value={bot.investment} disabled={bot.active} onChange={e => changeConfig('investment', e.target.value)} /></label></div>
        <div className="botInputPair"><label>Stop-loss price · optional<input type="number" min="0" value={bot.stopLoss || ''} disabled={bot.active} placeholder="Disabled" onChange={e => changeConfig('stopLoss', e.target.value)} /></label><label>Take-profit price · optional<input type="number" min="0" value={bot.takeProfit || ''} disabled={bot.active} placeholder="Disabled" onChange={e => changeConfig('takeProfit', e.target.value)} /></label></div>
        <div className="botRiskBox"><b>Risk controls & fees</b><span>• Spot-style simulation only; no leverage.</span><span>• Fixed $0.02 fee is deducted from the demo balance for each simulated order.</span><span>• Stop-loss and take-profit can stop the bot automatically.</span><span>• The bot pauses new orders when price leaves your selected range.</span><span>• Grid trading can lose money; profits are not guaranteed.</span></div>
        <div className="botMainActions">{bot.active ? <button className="botStop" onClick={stop}>Stop bot</button> : <button className="botStart" onClick={start}>Start demo bot</button>}<button className="botReset" onClick={reset} disabled={bot.active}>Reset</button></div>
        <div className="botNextLevels"><span>Next buy trigger <b>{bot.nextBuy ? money(bot.nextBuy) : '—'}</b></span><span>Next sell trigger <b>{bot.nextSell ? money(bot.nextSell) : '—'}</b></span></div>
      </section>
      <section className="botCard botActivity"><div className="botCardTitle"><div><h3>Bot performance</h3><p>{bot.status}</p></div><span className="botPulse">{bot.active ? '● Monitoring' : '○ Idle'}</span></div>
        <div className="botBalanceRows"><div><span>Demo quote balance</span><b>{money(bot.quoteBalance)}</b></div><div><span>Asset held</span><b>{bot.baseQty.toLocaleString('en-US', { maximumFractionDigits: 8 })} {bot.symbol.replace('USDT', '')}</b></div><div><span>Average entry</span><b>{bot.avgEntry ? money(bot.avgEntry) : '—'}</b></div><div><span>Realized grid P&amp;L</span><b className={bot.realized >= 0 ? 'botPositive' : 'botNegative'}>{bot.realized >= 0 ? '+' : ''}{money(bot.realized)}</b></div></div>
        <div className="botTradesHead"><h3>Order history</h3><span>{bot.trades.length} fills</span></div>
        {bot.trades.length ? <div className="botTradeList">{bot.trades.slice(0, 12).map(t => <div className="botTradeRow" key={t.id}><span className={'botSide '+(t.side === 'BUY' ? 'buy' : 'sell')}>{t.side}</span><div><b>{money(t.price)}</b><small>{new Date(t.time).toLocaleString()}</small></div><div className="botTradeAmount"><b>{t.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}</b><small>Fee {money(t.fee)}{t.pnl !== undefined ? ' · P&L '+(t.pnl >= 0 ? '+' : '')+money(t.pnl) : ''}</small></div></div>)}</div> : <div className="botEmpty"><div>⇄</div><b>No orders yet</b><span>Start the demo bot. It will wait for the live market price to cross a grid trigger.</span></div>}
    </section></div>
    <p className="botFinePrint">Market data is indicative and may be delayed. A grid strategy does not guarantee profit. The $0.02 fee shown here is a demo accounting rule, not a live platform charge. Real trading requires secure exchange API integration, user authorization, and backend execution.</p>
  </div>;
}
