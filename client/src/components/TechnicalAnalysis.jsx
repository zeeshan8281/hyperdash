import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, Zap } from 'lucide-react';

const TechnicalAnalysis = ({ candleData }) => {
  const [indicators, setIndicators] = useState({});
  const [signals, setSignals] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (candleData && candleData.length > 0) {
      calculateIndicators();
      generateSignals();
      performAnalysis();
    }
  }, [candleData]);

  const calculateIndicators = () => {
    const prices = candleData.map(c => c.close);
    const highs = candleData.map(c => c.high);
    const lows = candleData.map(c => c.low);
    const volumes = candleData.map(c => c.volume);

    // RSI Calculation
    const rsi = calculateRSI(prices, 14);
    
    // MACD Calculation
    const macd = calculateMACD(prices);
    
    // Bollinger Bands
    const bb = calculateBollingerBands(prices, 20, 2);
    
    // Moving Averages
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);

    setIndicators({
      rsi: rsi[rsi.length - 1],
      macd: macd,
      bollingerBands: bb,
      sma20: sma20[sma20.length - 1],
      sma50: sma50[sma50.length - 1],
      ema12: ema12[ema12.length - 1],
      ema26: ema26[ema26.length - 1],
      currentPrice: prices[prices.length - 1]
    });
  };

  const calculateRSI = (prices, period = 14) => {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGains = [];
    const avgLosses = [];
    
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      
      avgGains.push(avgGain);
      avgLosses.push(avgLoss);
    }
    
    const rsi = avgGains.map((gain, i) => {
      const rs = gain / avgLosses[i];
      return 100 - (100 / (1 + rs));
    });
    
    return rsi;
  };

  const calculateMACD = (prices) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    
    return {
      macd: macdLine[macdLine.length - 1],
      signal: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1]
    };
  };

  const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
    const sma = calculateSMA(prices, period);
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (stdDev * standardDeviation),
        middle: mean,
        lower: mean - (stdDev * standardDeviation)
      });
    }
    
    return bands[bands.length - 1];
  };

  const calculateSMA = (prices, period) => {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  };

  const calculateEMA = (prices, period) => {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];
    
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }
    
    return ema;
  };

  const generateSignals = () => {
    const newSignals = [];
    
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        newSignals.push({
          type: 'BUY',
          strength: 85,
          reason: 'RSI Oversold',
          indicator: 'RSI',
          timestamp: Date.now()
        });
      } else if (indicators.rsi > 70) {
        newSignals.push({
          type: 'SELL',
          strength: 80,
          reason: 'RSI Overbought',
          indicator: 'RSI',
          timestamp: Date.now()
        });
      }
    }
    
    if (indicators.macd && indicators.macd.macd > indicators.macd.signal) {
      newSignals.push({
        type: 'BUY',
        strength: 70,
        reason: 'MACD Bullish Crossover',
        indicator: 'MACD',
        timestamp: Date.now()
      });
    }
    
    if (indicators.sma20 && indicators.sma50 && indicators.sma20 > indicators.sma50) {
      newSignals.push({
        type: 'BUY',
        strength: 60,
        reason: 'Golden Cross (SMA 20 > SMA 50)',
        indicator: 'Moving Average',
        timestamp: Date.now()
      });
    }
    
    setSignals(newSignals);
  };

  const performAnalysis = () => {
    if (!indicators.currentPrice) return;
    
    let trend = 'SIDEWAYS';
    let strength = 50;
    
    // Determine trend
    if (indicators.sma20 > indicators.sma50 && indicators.currentPrice > indicators.sma20) {
      trend = 'BULLISH';
      strength = 75;
    } else if (indicators.sma20 < indicators.sma50 && indicators.currentPrice < indicators.sma20) {
      trend = 'BEARISH';
      strength = 75;
    }
    
    // Calculate support and resistance
    const recentHighs = candleData.slice(-20).map(c => c.high);
    const recentLows = candleData.slice(-20).map(c => c.low);
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);
    
    setAnalysis({
      trend,
      strength,
      support,
      resistance,
      confidence: Math.min(95, strength + (signals.length * 5))
    });
  };

  const getSignalColor = (type) => {
    switch (type) {
      case 'BUY': return '#10b981';
      case 'SELL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'BULLISH': return '#10b981';
      case 'BEARISH': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="technical-analysis">
      <div className="analysis-header">
        <h3>Technical Analysis</h3>
        {analysis && (
          <div className="market-overview">
            <div className={`trend-indicator ${analysis.trend.toLowerCase()}`}>
              <span className="trend-label">{analysis.trend}</span>
              <span className="strength">Strength: {analysis.strength}%</span>
            </div>
            <div className="support-resistance">
              <span>Support: ${analysis.support.toFixed(2)}</span>
              <span>Resistance: ${analysis.resistance.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="indicators-grid">
        <div className="indicator-card">
          <div className="indicator-header">
            <Activity size={16} />
            <span>RSI (14)</span>
          </div>
          <div className="indicator-value">
            <span className={indicators.rsi > 70 ? 'overbought' : indicators.rsi < 30 ? 'oversold' : 'normal'}>
              {indicators.rsi?.toFixed(2) || '--'}
            </span>
            <div className="rsi-bar">
              <div 
                className="rsi-fill" 
                style={{ width: `${indicators.rsi || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="indicator-card">
          <div className="indicator-header">
            <BarChart3 size={16} />
            <span>MACD</span>
          </div>
          <div className="indicator-value">
            <span>MACD: {indicators.macd?.macd?.toFixed(4) || '--'}</span>
            <span>Signal: {indicators.macd?.signal?.toFixed(4) || '--'}</span>
            <span className={indicators.macd?.histogram > 0 ? 'positive' : 'negative'}>
              Hist: {indicators.macd?.histogram?.toFixed(4) || '--'}
            </span>
          </div>
        </div>

        <div className="indicator-card">
          <div className="indicator-header">
            <TrendingUp size={16} />
            <span>Moving Averages</span>
          </div>
          <div className="indicator-value">
            <span>SMA 20: ${indicators.sma20?.toFixed(2) || '--'}</span>
            <span>SMA 50: ${indicators.sma50?.toFixed(2) || '--'}</span>
            <span>EMA 12: ${indicators.ema12?.toFixed(2) || '--'}</span>
          </div>
        </div>

        <div className="indicator-card">
          <div className="indicator-header">
            <Zap size={16} />
            <span>Bollinger Bands</span>
          </div>
          <div className="indicator-value">
            <span>Upper: ${indicators.bollingerBands?.upper?.toFixed(2) || '--'}</span>
            <span>Middle: ${indicators.bollingerBands?.middle?.toFixed(2) || '--'}</span>
            <span>Lower: ${indicators.bollingerBands?.lower?.toFixed(2) || '--'}</span>
          </div>
        </div>
      </div>

      <div className="signals-section">
        <h4>Trading Signals</h4>
        <div className="signals-list">
          {signals.length > 0 ? signals.map((signal, index) => (
            <div key={index} className="signal-item">
              <div 
                className="signal-type" 
                style={{ backgroundColor: getSignalColor(signal.type) }}
              >
                {signal.type}
              </div>
              <div className="signal-details">
                <span className="signal-reason">{signal.reason}</span>
                <span className="signal-indicator">{signal.indicator}</span>
                <span className="signal-strength">Strength: {signal.strength}%</span>
              </div>
            </div>
          )) : (
            <div className="no-signals">No active signals</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysis;
