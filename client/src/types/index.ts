// Type definitions for HyperDash
export interface Market {
  coin: string;
  perp: string;
  spot: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap: number;
  liquidity: number;
  dexId: string;
  pairAddress: string | null;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100
  reason: string;
  timestamp: number;
  indicator: string;
}

export interface PortfolioPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'VOLUME_SPIKE' | 'INDICATOR_SIGNAL';
  value: number;
  triggered: boolean;
  createdAt: number;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe: string;
}

export interface MarketAnalysis {
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  strength: number;
  support: number;
  resistance: number;
  indicators: TechnicalIndicator[];
  signals: TradingSignal[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  preferences: {
    theme: 'dark' | 'light';
    defaultTimeframe: string;
    alertsEnabled: boolean;
    soundEnabled: boolean;
  };
  portfolio: PortfolioPosition[];
  alerts: Alert[];
}

export interface Domain {
  name: string;
  type: 'PERP' | 'SPOT';
  active: boolean;
  markets: Market[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  timestamp: number;
  source: string;
  error?: string;
}

export interface WebSocketMessage {
  channel: string;
  data: any;
  timestamp: number;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
  active: boolean;
}
