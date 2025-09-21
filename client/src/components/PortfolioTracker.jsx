import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';

const PortfolioTracker = ({ selectedMarket, currentPrice }) => {
  const [positions, setPositions] = useState([]);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [performance, setPerformance] = useState({
    dailyReturn: 0,
    weeklyReturn: 0,
    monthlyReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  });

  // Mock portfolio data - in real app, this would come from API
  useEffect(() => {
    const mockPositions = [
      {
        id: '1',
        symbol: 'ETH-USD',
        side: 'LONG',
        size: 2.5,
        entryPrice: 4200,
        currentPrice: currentPrice || 4491,
        pnl: (currentPrice - 4200) * 2.5,
        pnlPercent: ((currentPrice - 4200) / 4200) * 100,
        timestamp: Date.now() - 86400000 // 1 day ago
      },
      {
        id: '2',
        symbol: 'BTC-USD',
        side: 'SHORT',
        size: 0.1,
        entryPrice: 120000,
        currentPrice: 116088,
        pnl: (120000 - 116088) * 0.1,
        pnlPercent: ((120000 - 116088) / 120000) * 100,
        timestamp: Date.now() - 172800000 // 2 days ago
      }
    ];

    setPositions(mockPositions);
    
    // Calculate totals
    const totalPnlValue = mockPositions.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalValueValue = mockPositions.reduce((sum, pos) => sum + (pos.currentPrice * pos.size), 0);
    
    setTotalPnl(totalPnlValue);
    setTotalValue(totalValueValue);
    
    // Mock performance metrics
    setPerformance({
      dailyReturn: 2.3,
      weeklyReturn: 8.7,
      monthlyReturn: 15.2,
      sharpeRatio: 1.8,
      maxDrawdown: -5.2
    });
  }, [currentPrice]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="portfolio-tracker">
      <div className="portfolio-header">
        <h3>Portfolio Overview</h3>
        <div className="portfolio-summary">
          <div className="summary-item">
            <span className="label">Total Value</span>
            <span className="value">{formatCurrency(totalValue)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total P&L</span>
            <span className={`value ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totalPnl)} ({formatPercent((totalPnl / totalValue) * 100)})
            </span>
          </div>
        </div>
      </div>

      <div className="performance-metrics">
        <h4>Performance Metrics</h4>
        <div className="metrics-grid">
          <div className="metric">
            <TrendingUp size={16} />
            <span>Daily Return</span>
            <span className={performance.dailyReturn >= 0 ? 'positive' : 'negative'}>
              {formatPercent(performance.dailyReturn)}
            </span>
          </div>
          <div className="metric">
            <BarChart3 size={16} />
            <span>Weekly Return</span>
            <span className={performance.weeklyReturn >= 0 ? 'positive' : 'negative'}>
              {formatPercent(performance.weeklyReturn)}
            </span>
          </div>
          <div className="metric">
            <DollarSign size={16} />
            <span>Sharpe Ratio</span>
            <span>{performance.sharpeRatio.toFixed(2)}</span>
          </div>
          <div className="metric">
            <AlertTriangle size={16} />
            <span>Max Drawdown</span>
            <span className="negative">{formatPercent(performance.maxDrawdown)}</span>
          </div>
        </div>
      </div>

      <div className="positions-section">
        <h4>Open Positions</h4>
        <div className="positions-table">
          <div className="table-header">
            <span>Symbol</span>
            <span>Side</span>
            <span>Size</span>
            <span>Entry Price</span>
            <span>Current Price</span>
            <span>P&L</span>
            <span>P&L %</span>
          </div>
          {positions.map(position => (
            <div key={position.id} className="position-row">
              <span className="symbol">{position.symbol}</span>
              <span className={`side ${position.side.toLowerCase()}`}>
                {position.side}
              </span>
              <span>{position.size}</span>
              <span>{formatCurrency(position.entryPrice)}</span>
              <span>{formatCurrency(position.currentPrice)}</span>
              <span className={position.pnl >= 0 ? 'positive' : 'negative'}>
                {formatCurrency(position.pnl)}
              </span>
              <span className={position.pnlPercent >= 0 ? 'positive' : 'negative'}>
                {formatPercent(position.pnlPercent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioTracker;
