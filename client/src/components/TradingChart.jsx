// client/src/components/TradingChart.jsx
import { useEffect, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, BookOpen } from 'lucide-react';

export default function TradingChart({ selectedMarket, onWsStatusChange }) {
  const [candleData, setCandleData] = useState([]);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const dataFetchRef = useRef(null);
  const wsConnectionRef = useRef(null);

  // Simple market type detection
  const isSpot = selectedMarket && selectedMarket.includes('/');
  const coin = selectedMarket ? (isSpot ? selectedMarket.split('/')[0] : selectedMarket.split('-')[0]) : 'ETH';

  // Simple data fetching function
  const fetchCandleData = async () => {
    if (!selectedMarket) return;
    
    setLoading(true);
    try {
      const payload = isSpot
        ? { type: 'spotCandleSnapshot', req: { pair: selectedMarket, interval: timeframe } }
        : { type: 'candleSnapshot', req: { coin, interval: timeframe } };

      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data?.ok && data?.data && Array.isArray(data.data)) {
        const candles = data.data.map(c => {
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
          return {
            time: Number(c.time || c.t || Date.now()),
            open: Number(c.open || c.o || 0),
            high: Number(c.high || c.h || 0),
            low: Number(c.low || c.l || 0),
            close: Number(c.close || c.c || 0),
            volume: Number(c.volume || c.v || 0)
          };
        }).filter(c => c.time && c.close > 0);

        if (candles.length > 0) {
          candles.sort((a, b) => a.time - b.time);
          setCandleData(candles.slice(-100)); // Keep only last 100 candles
        }
      }
    } catch (error) {
      console.error('Error fetching candle data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Single useEffect for data fetching
  useEffect(() => {
    if (!selectedMarket) {
      setCandleData([]);
      return;
    }

    // Clear any existing timeout
    if (dataFetchRef.current) {
      clearTimeout(dataFetchRef.current);
    }

    // Debounce the fetch
    dataFetchRef.current = setTimeout(() => {
      fetchCandleData();
    }, 300);

    return () => {
      if (dataFetchRef.current) {
        clearTimeout(dataFetchRef.current);
      }
    };
  }, [selectedMarket, timeframe]);

  // Simple WebSocket connection - only when market is selected
  useEffect(() => {
    if (!selectedMarket) {
      // Close connection if no market selected
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (wsConnectionRef.current) {
        clearTimeout(wsConnectionRef.current);
        wsConnectionRef.current = null;
      }
      setWsConnected(false);
      onWsStatusChange?.(false);
      return;
    }

    // Clear any existing connection timeout
    if (wsConnectionRef.current) {
      clearTimeout(wsConnectionRef.current);
    }

    // Debounce WebSocket connection to prevent storm
    wsConnectionRef.current = setTimeout(() => {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

    const subscription = isSpot
      ? { type: 'spotL2Book', pair: selectedMarket }
      : { type: 'l2Book', coin };

    ws.onopen = () => {
      setWsConnected(true);
      onWsStatusChange?.(true);
      // Only subscribe when connection is open
      ws.send(JSON.stringify({ method: 'subscribe', subscription }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        
        if (msg.channel === 'l2Book' || msg.channel === 'spotL2Book') {
          // Handle nested data structure from Hyperliquid
          const orderBookData = msg.data?.data || msg.data;
          
          if (orderBookData && orderBookData.levels) {
            const [bids = [], asks = []] = orderBookData.levels;
            
            setOrderBook({
              bids: bids.slice(0, 10).map(level => ({ 
                price: Number(level.px), 
                size: Number(level.sz) 
              })),
              asks: asks.slice(0, 10).map(level => ({ 
                price: Number(level.px), 
                size: Number(level.sz) 
              }))
            });
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setWsConnected(false);
      onWsStatusChange?.(false);
    };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        onWsStatusChange?.(false);
      };
    }, 500); // 500ms debounce

    return () => {
      if (wsConnectionRef.current) {
        clearTimeout(wsConnectionRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedMarket]);

  // Utility functions
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0.00';
    return Number(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCurrentPrice = () => {
    if (!candleData || candleData.length === 0) return 0;
    return candleData[candleData.length - 1]?.close || 0;
  };

  const getPriceChange = () => {
    if (!candleData || candleData.length < 2) return { change: 0, percent: 0 };
    const current = candleData[candleData.length - 1]?.close || 0;
    const previous = candleData[candleData.length - 2]?.close || 0;
    const change = current - previous;
    const percent = previous > 0 ? (change / previous) * 100 : 0;
    return { change, percent };
  };

  const currentPrice = getCurrentPrice();
  const { change, percent } = getPriceChange();

  return (
    <div className="trading-chart-container">
      {/* Chart Header */}
      <div className="chart-header-enhanced">
        <div className="price-section">
          <div className="current-price">
            <div className="market-name">{selectedMarket || 'Select Market'}</div>
            <div className="price-value">${formatPrice(currentPrice)}</div>
            <div className={`price-change ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>${formatPrice(Math.abs(change))} ({percent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <div className="timeframe-selector">
            {['1h', '4h', '1d'].map(tf => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="status-indicator">
            <div className={`status-dot ${wsConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{wsConnected ? 'Live' : 'Connecting...'}</span>
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
          ) : candleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={formatTime}
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <YAxis 
                  domain={['dataMin', 'dataMax']}
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  formatter={(value) => [`$${formatPrice(value)}`, 'Price']}
                  labelFormatter={(time) => formatTime(time)}
                />
                <Line 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder">
              <Activity size={48} />
              <span>No chart data available</span>
            </div>
          )}
        </div>

        {/* Order Book */}
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
            
            <div className="asks-section">
              {orderBook.asks.length > 0 ? (
                orderBook.asks.slice(0, 5).map((ask, i) => (
                  <div key={i} className="orderbook-row ask">
                    <span className="price">${formatPrice(ask.price)}</span>
                    <span className="size">{formatPrice(ask.size)}</span>
                    <span className="total">{formatPrice(ask.price * ask.size)}</span>
                  </div>
                ))
              ) : (
                <div className="orderbook-row ask">
                  <span className="price">No asks data</span>
                  <span className="size">-</span>
                  <span className="total">-</span>
                </div>
              )}
            </div>
            
            <div className="spread-indicator">
              <span className="spread-value">
                Spread: ${formatPrice((orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0))}
              </span>
            </div>
            
            <div className="bids-section">
              {orderBook.bids.length > 0 ? (
                orderBook.bids.slice(0, 5).map((bid, i) => (
                  <div key={i} className="orderbook-row bid">
                    <span className="price">${formatPrice(bid.price)}</span>
                    <span className="size">{formatPrice(bid.size)}</span>
                    <span className="total">{formatPrice(bid.price * bid.size)}</span>
                  </div>
                ))
              ) : (
                <div className="orderbook-row bid">
                  <span className="price">No bids data</span>
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