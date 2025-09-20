// client/src/components/TradingChart.jsx
import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BookOpen, BarChart3 } from 'lucide-react';

export default function TradingChart({ selectedMarket, onWsStatusChange }) {
  const [candleData, setCandleData] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('line'); // 'line' or 'candle'
  const [loading, setLoading] = useState(true);
  const isSpot = !!selectedMarket && selectedMarket.includes('/');
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  const marketToCoin = (mkt) => {
    if (!mkt) return 'ETH';
    if (mkt.includes('/')) return mkt.split('/')[0]; // spot base
    const [coin] = mkt.split('-');
    return coin;
  };

  // Fetch candlestick data via /api/info (Perp: candleSnapshot, Spot: spotCandleSnapshot)
  useEffect(() => {
    if (!selectedMarket) return;
    const coin = marketToCoin(selectedMarket);

    const fetchCandles = async () => {
      setLoading(true);
      try {
        const payload = isSpot
          ? { type: 'spotCandleSnapshot', req: { pair: selectedMarket, interval: timeframe } }
          : { type: 'candleSnapshot', req: { coin, interval: timeframe } };

        const resp = await fetch('/api/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();

        if (json?.ok && json?.data) {
          const raw = json.data;
          // Normalize into [{time, open, high, low, close, volume}]
          let candles = [];
          if (Array.isArray(raw)) {
            candles = raw.map(c => {
              if (Array.isArray(c)) {
                const [t, o, h, l, cl, v] = c;
                return {
                  time: Number(t) || Date.now(),
                  open: Number(o) || 0,
                  high: Number(h) || 0,
                  low: Number(l) || 0,
                  close: Number(cl) || 0,
                  volume: Number(v) || 0
                };
              }
              if (c && typeof c === 'object') {
                return {
                  time: Number(c.t || c.time || Date.now()),
                  open: Number(c.o || c.open || 0),
                  high: Number(c.h || c.high || 0),
                  low: Number(c.l || c.low || 0),
                  close: Number(c.c || c.close || 0),
                  volume: Number(c.v || c.volume || 0)
                };
              }
              return null;
            }).filter(Boolean);
          } else if (raw && Array.isArray(raw?.candles)) {
            candles = raw.candles.map(c => ({
              time: Number(c.t || c.time || Date.now()),
              open: Number(c.o || c.open || 0),
              high: Number(c.h || c.high || 0),
              low: Number(c.l || c.low || 0),
              close: Number(c.c || c.close || 0),
              volume: Number(c.v || c.volume || 0)
            }));
          }

          if (candles.length) {
            candles.sort((a, b) => a.time - b.time);
            setCandleData(candles.slice(-200));
          } else {
            setCandleData([]);
          }
        } else {
          setCandleData([]);
        }
      } catch (e) {
        setCandleData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCandles();
    const interval = setInterval(fetchCandles, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, [selectedMarket, timeframe]);

  // Realtime Order Book via WebSocket (Perp: l2Book, Spot: spotL2Book)
  useEffect(() => {
    if (!selectedMarket) return;

    // Close previous connection if any
    try { if (wsRef.current) wsRef.current.close(); } catch {}

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const coin = marketToCoin(selectedMarket);
    const subscription = isSpot
      ? { type: 'spotL2Book', pair: selectedMarket }
      : { type: 'l2Book', coin };

    let connectionTimeout;
    let heartbeatInterval;

    ws.onopen = () => {
      setWsConnected(true);
      onWsStatusChange?.(true);
      ws.send(JSON.stringify({ method: 'subscribe', subscription }));
      
      // Clear connection timeout
      if (connectionTimeout) clearTimeout(connectionTimeout);
      
      // Set up heartbeat
      heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.channel === 'subscriptionResponse' || msg.channel === 'pong') return;

        // Handle PERP l2Book
        if (!isSpot && msg.channel === 'l2Book' && msg.data) {
          // Only process if the coin matches current selection
          if (msg.data.coin && msg.data.coin !== coin) return;
          const raw = msg.data;
          let bids = [];
          let asks = [];
          if (Array.isArray(raw.levels)) {
            const [b = [], a = []] = raw.levels;
            bids = b; asks = a;
          } else {
            bids = Array.isArray(raw.bids) ? raw.bids : [];
            asks = Array.isArray(raw.asks) ? raw.asks : [];
          }
          setOrderBook({ bids, asks, timestamp: raw.time || Date.now() });
        }

        // Handle SPOT l2Book
        if (isSpot && (msg.channel === 'spotL2Book' || msg.channel === 'l2Book') && msg.data) {
          // Only process if the pair (or fallback) matches current selection
          if (msg.data.pair && msg.data.pair !== selectedMarket) return;
          const raw = msg.data;
          let bids = [];
          let asks = [];
          if (Array.isArray(raw.levels)) {
            const [b = [], a = []] = raw.levels;
            bids = b; asks = a;
          } else {
            bids = Array.isArray(raw.bids) ? raw.bids : [];
            asks = Array.isArray(raw.asks) ? raw.asks : [];
          }
          setOrderBook({ bids, asks, timestamp: raw.time || Date.now() });
        }
      } catch (err) {
        // ignore parsing errors
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      onWsStatusChange?.(false);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };

    ws.onerror = () => {
      setWsConnected(false);
      onWsStatusChange?.(false);
    };

    // Connection timeout
    connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close();
        setWsConnected(false);
        onWsStatusChange?.(false);
      }
    }, 5000);

    return () => {
      if (connectionTimeout) clearTimeout(connectionTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: 'unsubscribe', subscription }));
        }
        ws.close();
      } catch {}
    };
  }, [selectedMarket]);

  // Fallback order book fetch only when WebSocket fails
  useEffect(() => {
    if (!selectedMarket || wsConnected) return;
    
    const coin = marketToCoin(selectedMarket);
    let timeoutId;

    const fetchOrderBookFallback = async () => {
      try {
        const payload = isSpot
           ? { type: 'spotL2Book', req: { pair: selectedMarket } }
           : { type: 'l2Book', req: { coin } };

        const resp = await fetch('/api/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await resp.json();
        if (json?.ok && json?.data) {
          const raw = json.data;
          let bids = [];
          let asks = [];

          if (Array.isArray(raw?.bids) && Array.isArray(raw?.asks)) {
            bids = raw.bids;
            asks = raw.asks;
          } else if (Array.isArray(raw?.levels)) {
            const [b = [], a = []] = raw.levels;
            bids = b;
            asks = a;
          }
          setOrderBook({ bids: Array.isArray(bids) ? bids : [], asks: Array.isArray(asks) ? asks : [], timestamp: Date.now() });
        }
      } catch (e) {
        console.log('Order book fallback failed:', e);
      }
    };

    // Only fetch once as fallback, then rely on WebSocket
    timeoutId = setTimeout(fetchOrderBookFallback, 2000);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedMarket, wsConnected]);

  const formatTime = (timestamp) => {
    try {
      if (!timestamp || typeof timestamp !== 'number') return '--:--';
      return new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  const formatPrice = (price) => {
    try {
      if (price === null || price === undefined || isNaN(price)) return '0.00';
      const numPrice = typeof price === 'string' ? parseFloat(price) : price;
      if (isNaN(numPrice)) return '0.00';
      return numPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
    } catch (error) {
      return '0.00';
    }
  };

  const getCurrentPrice = () => {
    try {
      if (!candleData || candleData.length === 0) return 0;
      const lastCandle = candleData[candleData.length - 1];
      return lastCandle?.close || 0;
    } catch (error) {
      return 0;
    }
  };

  const getPriceChange = () => {
    try {
      if (!candleData || candleData.length < 2) return { change: 0, percent: 0 };
      const current = candleData[candleData.length - 1]?.close || 0;
      const previous = candleData[candleData.length - 2]?.close || 0;
      if (previous === 0) return { change: 0, percent: 0 };
      const change = current - previous;
      const percent = (change / previous) * 100;
      return { 
        change: isNaN(change) ? 0 : change, 
        percent: isNaN(percent) ? 0 : percent 
      };
    } catch (error) {
      return { change: 0, percent: 0 };
    }
  };

  const priceChange = getPriceChange();
  const isPositive = priceChange.change >= 0;

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' }
  ];

  const calcTotals = (levels) => {
    let cum = 0;
    return levels.map(l => {
      const sz = parseFloat(l?.sz || 0);
      const px = parseFloat(l?.px || 0);
      cum += isNaN(sz) ? 0 : sz;
      return { ...l, _sz: sz, _px: px, _cum: cum };
    });
  };

  const topBid = orderBook?.bids?.[0];
  const topAsk = orderBook?.asks?.[0];
  const spreadAbs = topAsk && topBid ? (parseFloat(topAsk.px) - parseFloat(topBid.px)) : 0;
  const midPx = topAsk && topBid ? (parseFloat(topAsk.px) + parseFloat(topBid.px)) / 2 : null;
  const spreadPct = midPx ? (spreadAbs / midPx) * 100 : 0;

  const asksWithTotals = calcTotals((orderBook?.asks || []).slice(0, 10));
  const bidsWithTotals = calcTotals((orderBook?.bids || []).slice(0, 10));
  const maxSideSz = Math.max(
    ...asksWithTotals.map(l => l._sz || 0),
    ...bidsWithTotals.map(l => l._sz || 0),
    1
  );

  const depthBar = (sz) => {
    const pct = Math.min(100, Math.max(0, (sz / maxSideSz) * 100));
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: pct + '%', background: 'rgba(255,255,255,0.06)' }} />
      </div>
    );
  };

  const fmt = (n, d=2) => {
    const x = Number(n);
    if (!isFinite(x)) return '0';
    return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  return (
    <div className="trading-chart-container">
      {/* Chart Header */}
      <div className="chart-header-enhanced">
        <div className="price-section">
          <div className="current-price">
            <span className="price-value">${formatPrice(getCurrentPrice())}</span>
            <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>
                {isPositive ? '+' : ''}{priceChange.change.toFixed(2)} 
                ({isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="market-info">
            <span className="market-name">{selectedMarket}</span>
            <div className="market-stats">
              <span className="stat">
                <Activity size={14} />
                Vol: ${(Math.random() * 1000).toFixed(1)}M
              </span>
            </div>
          </div>
        </div>

        <div className="chart-controls">
          {/* Timeframe Selector */}
          <div className="timeframe-selector">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                className={`timeframe-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="chart-type-selector">
            <button
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
              title="Line Chart"
            >
              <Activity size={16} />
            </button>
            <button
              className={`chart-type-btn ${chartType === 'candle' ? 'active' : ''}`}
              onClick={() => setChartType('candle')}
              title="Candlestick Chart"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="chart-main-area">
        <div className="price-chart-section">
          {loading ? (
            <div className="chart-loading">
              <div className="loading-spinner"></div>
              <span>Loading chart data...</span>
            </div>
          ) : candleData.length === 0 ? (
            <div className="chart-loading">
              <span>No chart data</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={candleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="#a0a0a0"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    stroke="#a0a0a0"
                    fontSize={12}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(value)}
                    formatter={(value) => [`$${formatPrice(value)}`, 'Price']}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              ) : (
                <ComposedChart data={candleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTime}
                    stroke="#a0a0a0"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                    stroke="#a0a0a0"
                    fontSize={12}
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatTime(value)}
                    formatter={(value, name) => [`$${formatPrice(value)}`, name.toUpperCase()]}
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                  />
                  <Bar dataKey="volume" fill="rgba(59, 130, 246, 0.3)" />
                  <Line type="monotone" dataKey="close" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Book Section with depth bars and cumulative */}
        <div className="orderbook-section">
          <div className="orderbook-header">
            <BookOpen size={16} />
            <span>Order Book</span>
          </div>

          <div className="orderbook-content">
            <div className="orderbook-headers">
              <span>Price</span>
              <span>Size</span>
              <span>Total</span>
            </div>

            {/* Asks (Sell Orders) */}
            <div className="asks-section">
              {asksWithTotals.length > 0 ? asksWithTotals.slice(0, 10).reverse().map((ask, i) => (
                <div key={`ask-${i}-${ask._px}-${ask._sz}`} className="orderbook-row ask">
                  <span className="price">${fmt(ask._px, 4)}</span>
                  <span className="size">{fmt(ask._sz, 3)}</span>
                  <span className="total">{fmt(ask._cum, 3)}</span>
                  {depthBar(ask._sz)}
                </div>
              )) : (
                <div className="orderbook-row ask">
                  <span className="price">No data</span>
                  <span className="size">-</span>
                  <span className="total">-</span>
                </div>
              )}
            </div>

            {/* Spread */}
            <div className="spread-indicator">
              <span className="spread-value">
                Spread: ${fmt(spreadAbs, 4)} {midPx ? `(${fmt(spreadPct, 3)}%)` : ''}
              </span>
            </div>

            {/* Bids (Buy Orders) */}
            <div className="bids-section">
              {bidsWithTotals.length > 0 ? bidsWithTotals.slice(0, 10).map((bid, i) => (
                <div key={`bid-${i}-${bid._px}-${bid._sz}`} className="orderbook-row bid">
                  <span className="price">${fmt(bid._px, 4)}</span>
                  <span className="size">{fmt(bid._sz, 3)}</span>
                  <span className="total">{fmt(bid._cum, 3)}</span>
                  {depthBar(bid._sz)}
                </div>
              )) : (
                <div className="orderbook-row bid">
                  <span className="price">No data</span>
                  <span className="size">-</span>
                  <span className="total">-</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
