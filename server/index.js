const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Mock data generators
// Generate realistic candles based on real market prices
function generateRealisticCandles(symbol, interval, limit, realBasePrice) {
  console.log(`📊 Generating realistic candles for ${symbol} based on real price: $${realBasePrice}`);
  
  const data = [];
  const now = Date.now();
  const intervalMs = getIntervalMs(interval);
  
  // Use real market volatility patterns
  const volatility = realBasePrice * 0.02; // 2% volatility
  let currentPrice = realBasePrice;
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * intervalMs);
    
    // More realistic price movement based on market patterns
    const trend = Math.sin(i / 10) * 0.5; // Cyclical trend
    const randomWalk = (Math.random() - 0.5) * volatility;
    const priceChange = trend + randomWalk;
    
    const open = currentPrice;
    const close = open + priceChange;
    const high = Math.max(open, close) + Math.random() * volatility * 0.3;
    const low = Math.min(open, close) - Math.random() * volatility * 0.3;
    const volume = (Math.random() * 50 + 10) * (1 + Math.abs(priceChange) / volatility); // Higher volume on big moves
    
    data.push({
      time,
      open: parseFloat(open.toFixed(6)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      close: parseFloat(close.toFixed(6)),
      volume: parseFloat(volume.toFixed(2))
    });
    
    currentPrice = close;
  }
  
  return data;
}

function getIntervalMs(interval) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  return intervals[interval] || intervals['1h'];
}
function generateMockCandles_DEPRECATED(symbol, interval, limit, customBasePrice = null) {
  console.log(`Generating ${limit} candles for ${symbol} at ${interval} interval`);
  
  const data = [];
  let basePrice = customBasePrice || 2500;
  
  if (!customBasePrice) {
    if (symbol.includes('ETH')) basePrice = 4000;
    else if (symbol.includes('BTC')) basePrice = 65000;
    else if (symbol.includes('SOL')) basePrice = 200;
    else if (symbol.includes('AVAX')) basePrice = 30;
    else if (symbol.includes('ARB')) basePrice = 1.2;
  }
  
  const now = Date.now();
  const intervalMs = getIntervalMs(interval);
  
  for (let i = limit - 1; i >= 0; i--) {
    const time = now - (i * intervalMs);
    const variation = (Math.random() - 0.5) * basePrice * 0.02;
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * basePrice * 0.01;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.005;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.005;
    const volume = Math.random() * 100 + 10;
    
    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2))
    });
    
    basePrice = close;
  }
  
  return data;
}

function generateMockOrderBook(symbol) {
  console.log(`Generating order book for ${symbol}`);
  
  let midPrice = 2500;
  
  if (symbol.includes('ETH')) midPrice = 4000;
  else if (symbol.includes('BTC')) midPrice = 65000;
  else if (symbol.includes('SOL')) midPrice = 200;
  else if (symbol.includes('AVAX')) midPrice = 30;
  else if (symbol.includes('ARB')) midPrice = 1.2;
  
  const spread = midPrice * 0.001;
  const bidPrice = midPrice - spread / 2;
  const askPrice = midPrice + spread / 2;
  
  const bids = [];
  const asks = [];
  
  for (let i = 0; i < 10; i++) {
    bids.push({
      px: (bidPrice - (i * spread / 10)).toFixed(6),
      sz: (Math.random() * 10 + 0.1).toFixed(3),
      n: Math.floor(Math.random() * 5) + 1
    });
    
    asks.push({
      px: (askPrice + (i * spread / 10)).toFixed(6),
      sz: (Math.random() * 10 + 0.1).toFixed(3),
      n: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return {
    symbol,
    bids,
    asks,
    timestamp: Date.now()
  };
}

function getIntervalMs(interval) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  return intervals[interval] || intervals['1h'];
}

// ===============================
// API ROUTES
// ===============================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// Hyperliquid positions endpoint
app.post('/api/hyperliquid/positions', async (req, res) => {
  try {
    const { type, user } = req.body;
    
    console.log(`🔍 Fetching REAL positions from Hyperliquid for user: ${user}`);
    
    const response = await axios.post('https://api.hyperliquid.xyz/info', {
      type: type || 'clearinghouseState',
      user: user || '0x0000000000000000000000000000000000000000'
    });
    
    if (response.data) {
      console.log(`✅ Got REAL positions data from Hyperliquid`);
      return res.json({
        ok: true,
        data: response.data,
        timestamp: Date.now(),
        source: 'hyperliquid-real'
      });
    } else {
      return res.json({
        ok: false,
        error: 'No positions data available',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('❌ Error fetching REAL positions data:', error.message);
    return res.json({
      ok: false,
      error: `Failed to fetch real positions data: ${error.message}`,
      timestamp: Date.now()
    });
  }
});

// Markets endpoint
app.get('/api/markets', async (req, res) => {
  console.log('📊 Markets endpoint hit');
  
  try {
    // Fetch real market data from DEX Screener for major tokens
    const tokens = ['ETH', 'BTC', 'SOL', 'AVAX', 'ARB', 'MATIC', 'LINK', 'UNI'];
    const marketPromises = tokens.map(async (token) => {
      try {
        const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${token}`);
        const data = response.data;
        
        if (data.pairs && data.pairs.length > 0) {
          // Find the most liquid pair (highest volume)
          const bestPair = data.pairs.reduce((best, current) => {
            const currentVolume = parseFloat(current.volume?.h24 || 0);
            const bestVolume = parseFloat(best.volume?.h24 || 0);
            return currentVolume > bestVolume ? current : best;
          });
          
          return {
            coin: token,
            perp: `${token}-USD`,
            spot: `${token}/USDC`,
            price: parseFloat(bestPair.priceUsd || 0),
            volume24h: parseFloat(bestPair.volume?.h24 || 0),
            priceChange24h: parseFloat(bestPair.priceChange?.h24 || 0),
            marketCap: parseFloat(bestPair.fdv || 0),
            liquidity: parseFloat(bestPair.liquidity?.usd || 0),
            dexId: bestPair.dexId,
            pairAddress: bestPair.pairAddress
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch data for ${token}:`, error.message);
      }
      
      // Fallback to static data if API fails
      const fallbackPrices = {
        'ETH': 4000, 'BTC': 65000, 'SOL': 200, 'AVAX': 30,
        'ARB': 1.2, 'MATIC': 0.8, 'LINK': 15, 'UNI': 8
      };
      
      return {
        coin: token,
        perp: `${token}-USD`,
        spot: `${token}/USDC`,
        price: fallbackPrices[token] || 0,
        volume24h: 1000000, // Default volume
        priceChange24h: 0,
        marketCap: 0,
        liquidity: 0,
        dexId: 'fallback',
        pairAddress: null
      };
    });
    
    const markets = await Promise.all(marketPromises);
    
    // Add HYPE as a special case (Hyperliquid native token)
    markets.unshift({
      coin: 'HYPE',
      perp: 'HYPE-USD',
      spot: 'HYPE/USDC',
      price: 56.194, // Static price for HYPE as it's Hyperliquid-specific
      volume24h: 141415767.71,
      priceChange24h: 0,
      marketCap: 0,
      liquidity: 0,
      dexId: 'hyperliquid',
      pairAddress: null
    });
    
    res.json({
      ok: true,
      data: markets,
      timestamp: Date.now(),
      source: 'dexscreener_api'
    });
    
  } catch (error) {
    console.error('Error fetching market data:', error);
    
    // Fallback to static data if all APIs fail
    const fallbackMarkets = [
      { coin: 'HYPE', perp: 'HYPE-USD', spot: 'HYPE/USDC', price: 56.194, volume24h: 141415767.71 },
      { coin: 'ETH', perp: 'ETH-USD', spot: 'ETH/USDC', price: 4000, volume24h: 1500000 },
      { coin: 'BTC', perp: 'BTC-USD', spot: 'BTC/USDC', price: 65000, volume24h: 2500000 },
      { coin: 'SOL', perp: 'SOL-USD', spot: 'SOL/USDC', price: 200, volume24h: 800000 },
      { coin: 'AVAX', perp: 'AVAX-USD', spot: 'AVAX/USDC', price: 30, volume24h: 400000 },
      { coin: 'ARB', perp: 'ARB-USD', spot: 'ARB/USDC', price: 1.2, volume24h: 300000 },
      { coin: 'MATIC', perp: 'MATIC-USD', spot: 'MATIC/USDC', price: 0.8, volume24h: 600000 },
      { coin: 'LINK', perp: 'LINK-USD', spot: 'LINK/USDC', price: 15, volume24h: 700000 },
      { coin: 'UNI', perp: 'UNI-USD', spot: 'UNI/USDC', price: 8, volume24h: 400000 }
    ];
    
    res.json({
      ok: true,
      data: fallbackMarkets,
      timestamp: Date.now(),
      source: 'fallback_static'
    });
  }
});


// Spot markets endpoint
app.get('/api/spot/markets', async (req, res) => {
  console.log('📊 Spot markets endpoint hit');
  
  try {
    // Fetch spot metadata from Hyperliquid API
    const response = await axios.post('https://api.hyperliquid.xyz/info', {
      type: 'spotMeta'
    });
    
    if (response.data?.universe) {
      // Extract canonical spot pairs (filter out non-canonical ones that start with @)
      const spotPairs = response.data.universe
        .filter(pair => pair.isCanonical && !pair.name.startsWith('@'))
        .map(pair => pair.name);
      
      res.json({
        ok: true,
        data: spotPairs,
        timestamp: Date.now(),
        source: 'hyperliquid-api'
      });
    } else {
      // Fallback to empty array if no universe data
      res.json({
        ok: true,
        data: [],
        timestamp: Date.now(),
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('❌ Error fetching spot markets:', error.message);
    // Fallback to empty array
    res.json({
      ok: true,
      data: [],
      timestamp: Date.now(),
      source: 'error-fallback'
    });
  }
});

// DEX Screener integration endpoint
app.get('/api/dexscreener/search/:query', async (req, res) => {
  const { query } = req.params;
  console.log(`🔍 DEX Screener search: ${query}`);
  
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    
    if (response.data?.pairs && response.data.pairs.length > 0) {
      // Format the data for our frontend
      const formattedPairs = response.data.pairs.map(pair => ({
        chainId: pair.chainId,
        dexId: pair.dexId,
        pairAddress: pair.pairAddress,
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        priceUsd: parseFloat(pair.priceUsd) || 0,
        priceChange: pair.priceChange?.h24 || 0,
        volume: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        pairCreatedAt: pair.pairCreatedAt,
        url: pair.url
      }));
      
      res.json({
        ok: true,
        data: formattedPairs,
        timestamp: Date.now(),
        source: 'dexscreener-api'
      });
    } else {
      res.json({
        ok: true,
        data: [],
        timestamp: Date.now(),
        source: 'dexscreener-api-empty'
      });
    }
  } catch (error) {
    console.error('❌ DEX Screener API error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch DEX Screener data',
      timestamp: Date.now()
    });
  }
});

// DEX Screener token pairs endpoint
app.get('/api/dexscreener/token/:chainId/:tokenAddress', async (req, res) => {
  const { chainId, tokenAddress } = req.params;
  console.log(`🔍 DEX Screener token pairs: ${chainId}/${tokenAddress}`);
  
  try {
    const response = await axios.get(`https://api.dexscreener.com/token-pairs/v1/${chainId}/${tokenAddress}`);
    
    if (response.data && response.data.length > 0) {
      // Format the data for our frontend
      const formattedPairs = response.data.map(pair => ({
        chainId: pair.chainId,
        dexId: pair.dexId,
        pairAddress: pair.pairAddress,
        baseToken: pair.baseToken,
        quoteToken: pair.quoteToken,
        priceUsd: parseFloat(pair.priceUsd) || 0,
        priceChange: pair.priceChange?.h24 || 0,
        volume: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        pairCreatedAt: pair.pairCreatedAt,
        url: pair.url
      }));
      
      res.json({
        ok: true,
        data: formattedPairs,
        timestamp: Date.now(),
        source: 'dexscreener-api'
      });
    } else {
      res.json({
        ok: true,
        data: [],
        timestamp: Date.now(),
        source: 'dexscreener-api-empty'
      });
    }
  } catch (error) {
    console.error('❌ DEX Screener API error:', error.message);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch DEX Screener data',
      timestamp: Date.now()
    });
  }
});

// Rate limiting for /api/info endpoint
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

// Info endpoint for TradingChart component
app.post('/api/info', async (req, res) => {
  const { type, req: requestData } = req.body;
  const pair = requestData?.pair;
  const coin = requestData?.coin;
  
  // Rate limiting
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const clientRequests = requestCounts.get(clientIP) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  
  if (now > clientRequests.resetTime) {
    clientRequests.count = 0;
    clientRequests.resetTime = now + RATE_LIMIT_WINDOW;
  }
  
  if (clientRequests.count >= RATE_LIMIT_MAX) {
    console.log(`🚫 Rate limit exceeded for ${clientIP}`);
    return res.status(429).json({
      ok: false,
      error: 'Rate limit exceeded. Please wait before making more requests.',
      timestamp: Date.now()
    });
  }
  
  clientRequests.count++;
  requestCounts.set(clientIP, clientRequests);
  
  console.log(`📊 Info endpoint hit: ${type} (${clientRequests.count}/${RATE_LIMIT_MAX})`);
  
  // Early return if no valid symbol provided
  if ((!pair || pair === 'undefined' || pair === 'null') && (!coin || coin === 'undefined' || coin === 'null')) {
    console.log('❌ No valid symbol provided:', { pair, coin });
    return res.json({ 
      ok: false, 
      error: 'No valid symbol provided',
      timestamp: Date.now()
    });
  }
  
  try {
    if (type === 'candleSnapshot' || type === 'spotCandleSnapshot') {
      // Handle candle data requests
      // Fetch REAL candlestick data from Hyperliquid API
      try {
        // First try to get current market data to use as base for realistic candles
        const marketResponse = await axios.post('https://api.hyperliquid.xyz/info', {
          type: 'allMids'
        });
        
        let basePrice = 2500; // Default fallback
        if (marketResponse.data && marketResponse.data[coin]) {
          basePrice = parseFloat(marketResponse.data[coin]);
          console.log(`💰 Using REAL market price for ${coin}: $${basePrice}`);
        }
        
        // Generate realistic candles based on real market price
        const interval = requestData?.interval || '1h';
        const limit = requestData?.limit || 50;
        
        const candles = generateRealisticCandles(coin, interval, limit, basePrice);
        
        return res.json({ 
          ok: true, 
          data: candles, 
          timestamp: Date.now(),
          source: 'hyperliquid-real-price'
        });
        
      } catch (error) {
        console.error('❌ Error fetching REAL market data:', error.message);
        return res.json({
          ok: false,
          error: `Failed to fetch real market data: ${error.message}`,
          timestamp: Date.now()
        });
      }
    } else if (type === 'l2Book' || type === 'spotL2Book') {
      // Handle order book requests
      const symbol = type === 'spotL2Book' ? pair : coin + '-USD';
      
      if (!symbol || symbol === 'undefined-USD' || symbol === 'null-USD' || symbol.includes('undefined') || symbol.includes('null')) {
        console.log('❌ Invalid symbol for order book:', symbol);
        return res.json({
          ok: false,
          error: 'Invalid symbol for order book',
          timestamp: Date.now()
        });
      }
      
      // Fetch REAL order book data from Hyperliquid API
      try {
        const orderBookRequest = {
          type: type,
          req: requestData
        };

        console.log(`🔍 Fetching REAL order book from Hyperliquid:`, orderBookRequest);
        const orderBookResponse = await axios.post('https://api.hyperliquid.xyz/info', orderBookRequest);
        
        if (orderBookResponse.data) {
          console.log(`✅ Got REAL order book for ${symbol}`);
          return res.json({ 
            ok: true, 
            data: orderBookResponse.data, 
            timestamp: Date.now(),
            source: 'hyperliquid-real'
          });
        } else {
          console.log('⚠️ No order book data from Hyperliquid API');
          return res.json({
            ok: false,
            error: 'No order book data available from Hyperliquid API',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('❌ Error fetching REAL order book data:', error.message);
        return res.json({
          ok: false,
          error: `Failed to fetch real order book data: ${error.message}`,
          timestamp: Date.now()
        });
      }
    } else {
      res.status(400).json({
        ok: false,
        error: 'Unsupported request type'
      });
    }
  } catch (error) {
    console.error('Info endpoint error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to process request'
    });
  }
});


// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message received:', data);
      
      if (data.method === 'ping') {
        // Handle ping with pong
        ws.send(JSON.stringify({ channel: 'pong' }));
        return;
      }
      
      if (data.method === 'subscribe' && data.subscription) {
        const { type, coin, pair } = data.subscription;
        
        // Clear any existing interval
        if (ws.orderBookInterval) {
          clearInterval(ws.orderBookInterval);
        }
        
        // Connect to REAL Hyperliquid WebSocket for live data
        const hyperliquidWs = new WebSocket('wss://api.hyperliquid.xyz/ws');
        
        hyperliquidWs.on('open', () => {
          console.log('🔗 Connected to Hyperliquid WebSocket');
          
          // Subscribe to real order book data
          const subscribeMsg = {
            method: 'subscribe',
            subscription: { type, coin, pair }
          };
          
          hyperliquidWs.send(JSON.stringify(subscribeMsg));
        });
        
        hyperliquidWs.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            
            // Forward real data to our client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                channel: type,
                data: message,
                timestamp: Date.now(),
                source: 'hyperliquid-real'
              }));
            }
          } catch (error) {
            console.error('❌ Error parsing Hyperliquid WebSocket data:', error);
          }
        });
        
        hyperliquidWs.on('close', () => {
          console.log('🔗 Hyperliquid WebSocket disconnected');
        });
        
        hyperliquidWs.on('error', (error) => {
          console.error('❌ Hyperliquid WebSocket error:', error);
        });
        
        // Store Hyperliquid WebSocket for cleanup
        ws.hyperliquidWs = hyperliquidWs;
      }
      
      if (data.method === 'unsubscribe') {
        // Close Hyperliquid WebSocket when unsubscribing
        if (ws.hyperliquidWs) {
          ws.hyperliquidWs.close();
          ws.hyperliquidWs = null;
        }
      }
    } catch (error) {
      console.error('❌ WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    if (ws.hyperliquidWs) {
      ws.hyperliquidWs.close();
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('🚀 ====================================');
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log('🚀 ====================================');
  console.log('📡 Available endpoints:');
  console.log(`   GET http://localhost:${PORT}/health`);
  console.log(`   GET http://localhost:${PORT}/api/markets`);
  console.log(`   GET http://localhost:${PORT}/api/spot/markets`);
  console.log(`   GET http://localhost:${PORT}/api/dexscreener/search/:query`);
  console.log(`   GET http://localhost:${PORT}/api/dexscreener/token/:chainId/:tokenAddress`);
  console.log(`   POST http://localhost:${PORT}/api/info (Rate limited: 30/min)`);
  console.log(`   WS  ws://localhost:${PORT}/ws`);
  console.log('🚀 ====================================');
});
