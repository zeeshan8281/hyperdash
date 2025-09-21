// client/src/App.jsx
import { useEffect, useState } from 'react';
import TradingChart from './components/TradingChart';
import ErrorBoundary from './components/ErrorBoundary';
import PortfolioTracker from './components/PortfolioTracker';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import AlertsSystem from './components/AlertsSystem';
import './App.css';
import './components/TradingChart.css';
import './components/ErrorBoundary.css';
import './components/PortfolioTracker.css';
import './components/TechnicalAnalysis.css';
import './components/AlertsSystem.css';

export default function App() {
  const [marketsData, setMarketsData] = useState([]);
  const [spotPairs, setSpotPairs] = useState([]);
  const [dexScreenerData, setDexScreenerData] = useState([]);
  const [marketType, setMarketType] = useState('perp');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [useRealData, setUseRealData] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  useEffect(() => {
    // Fetch perps (coins) with perp/spot symbols from allMids
    fetch('/api/markets')
      .then(r => r.json())
      .then(d => {
        if (d?.ok && Array.isArray(d.data)) {
          const cleaned = d.data.filter(m => m?.coin && !m.coin.startsWith('@'));
          setMarketsData(cleaned);
        } else {
          setMarketsData([]);
        }
      })
      .catch(() => setMarketsData([]));

    // Fetch canonical spot pairs (e.g., HYPE/USDC)
    fetch('/api/spot/markets')
      .then(r => r.json())
      .then(d => {
        if (d?.ok && Array.isArray(d.data)) setSpotPairs(d.data);
        else setSpotPairs([]);
      })
      .catch(() => setSpotPairs([]));
  }, []);

  // Keep selected market in sync with market type and list
  useEffect(() => {
    const perpList = marketsData.map(m => m.perp).filter(Boolean);
    const spotList = spotPairs.length ? spotPairs : marketsData.map(m => m.spot).filter(Boolean);
    const list = marketType === 'perp' ? perpList : spotList;

    // Only auto-select if user hasn't selected anything yet AND we have markets
    // if (list.length && !selectedMarket) setSelectedMarket(list[0]);
    if (list.length && selectedMarket && !list.includes(selectedMarket)) setSelectedMarket(list[0]);
  }, [marketsData, spotPairs, marketType]);

  // Fetch DEX Screener data for selected market
  useEffect(() => {
    if (selectedMarket && useRealData) {
      const query = selectedMarket.split('/')[0] || selectedMarket.split('-')[0];
      fetch(`/api/dexscreener/search/${query}`)
        .then(r => r.json())
        .then(d => {
          if (d?.ok && Array.isArray(d.data) && d.data.length > 0) {
            setDexScreenerData(d.data);
            // Use real data from DEX Screener
            const realData = d.data[0];
            setCurrentPrice(realData.priceUsd || 0);
            setPriceChange(realData.priceChange || 0);
            setPriceChangePercent(realData.priceChange || 0);
            setVolume24h(realData.volume || 0);
          }
        })
        .catch(() => setDexScreenerData([]));
    }
  }, [selectedMarket, useRealData]);

  // Update market stats when market changes (fallback to mock data)
  useEffect(() => {
    if (selectedMarket && marketsData.length > 0 && !useRealData) {
      const market = marketsData.find(m => 
        m.perp === selectedMarket || m.spot === selectedMarket
      );
      if (market) {
        setCurrentPrice(market.price || 0);
        setPriceChange((Math.random() - 0.5) * market.price * 0.1);
        setPriceChangePercent((Math.random() - 0.5) * 5);
        setVolume24h(market.volume24h || 0);
      }
    }
  }, [selectedMarket, marketsData, useRealData]);

  const options = (marketType === 'perp')
    ? marketsData.map(m => m.perp).filter(Boolean)
    : (spotPairs.length ? spotPairs : marketsData.map(m => m.spot).filter(Boolean));

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPrice = (price) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="app">
      {/* Simple Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <span className="logo-text">HyperDash</span>
          </div>
          
          <div className="market-controls">
            <div className="market-type-toggle">
              <button
                className={`market-type-btn ${marketType === 'perp' ? 'active' : ''}`}
                onClick={() => setMarketType('perp')}
              >
                Perp
              </button>
              <button
                className={`market-type-btn ${marketType === 'spot' ? 'active' : ''}`}
                onClick={() => setMarketType('spot')}
              >
                Spot
              </button>
            </div>
            <div className="market-selector">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="market-dropdown"
              >
                {options.map((market, index) => (
                  <option key={`market-${index}-${market}`} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>
            <div className="data-source-toggle">
              <button
                className={`data-source-btn ${useRealData ? 'active' : ''}`}
                onClick={() => setUseRealData(!useRealData)}
                title={useRealData ? 'Using DEX Screener real data' : 'Using mock data'}
              >
                {useRealData ? '🌐 Real' : '🎭 Mock'}
              </button>
            </div>
          </div>

          <div className={`status-indicator ${connectionStatus}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Market Overview */}
      <div className="market-overview">
        <div className="market-info">
          <div className="market-pair">
            <span className="pair-name">{selectedMarket}</span>
            <span className={`market-type ${marketType}`}>{marketType.toUpperCase()}</span>
          </div>
          <div className="market-stats">
            <div className="stat">
              <span className="stat-label">Price</span>
              <span className="stat-value">${formatPrice(currentPrice)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">24h Change</span>
              <span className={`stat-value ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">{formatNumber(volume24h)} USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          📈 Chart
        </button>
        <button 
          className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          💼 Portfolio
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          🔍 Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🔔 Alerts
        </button>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'chart' && (
          <div className="chart-section">
            <ErrorBoundary>
              <TradingChart 
                selectedMarket={selectedMarket} 
                onWsStatusChange={(ok) => setConnectionStatus(ok ? 'connected' : 'connecting')} 
              />
            </ErrorBoundary>
          </div>
        )}
        
        {activeTab === 'portfolio' && (
          <div className="portfolio-section">
            <ErrorBoundary>
              <PortfolioTracker 
                selectedMarket={selectedMarket}
                currentPrice={currentPrice}
              />
            </ErrorBoundary>
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="analysis-section">
            <ErrorBoundary>
              <TechnicalAnalysis 
                selectedMarket={selectedMarket}
                currentPrice={currentPrice}
              />
            </ErrorBoundary>
          </div>
        )}
        
        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <ErrorBoundary>
              <AlertsSystem 
                selectedMarket={selectedMarket}
                currentPrice={currentPrice}
              />
            </ErrorBoundary>
          </div>
        )}
      </main>
    </div>
  );
}