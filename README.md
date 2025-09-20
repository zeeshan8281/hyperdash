# 🚀 HyperDash - Real-Time Trading Analytics Platform

A full-stack trading analytics application that integrates with Hyperliquid and DEX Screener APIs to provide real-time market data, interactive charts, and live order book updates.

![HyperDash](https://img.shields.io/badge/HyperDash-Trading%20Analytics-blue?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-010101?style=for-the-badge&logo=socket.io)

## ✨ Features

### 🎯 **Core Functionality**
- **Real-Time Market Data**: Live price updates and trading volumes
- **Interactive Charts**: Candlestick charts with multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- **Live Order Books**: Real-time bid/ask spreads and market depth
- **WebSocket Integration**: Low-latency data streaming
- **Multi-Market Support**: Perpetual and Spot trading pairs

### 🔌 **API Integrations**
- **Hyperliquid API**: Official integration for spot and perpetual markets
- **DEX Screener API**: Real market data from multiple DEXs
- **Rate Limiting**: 30 requests/minute per IP to prevent spam
- **Error Handling**: Graceful fallbacks and comprehensive error management

### 🎨 **User Interface**
- **Dark Theme**: Professional trading interface design
- **Responsive Design**: Works on desktop and mobile devices
- **Data Source Toggle**: Switch between mock and real market data
- **Live Status Indicators**: Connection status and data freshness
- **Clean Navigation**: Intuitive market selection and controls

## 🏗️ Architecture

### **Frontend (React)**
```
client/
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Global styles and theme
│   ├── components/
│   │   ├── TradingChart.jsx # Chart component with WebSocket
│   │   ├── TradingChart.css # Chart-specific styles
│   │   ├── ErrorBoundary.jsx # Error handling component
│   │   └── ErrorBoundary.css # Error boundary styles
│   ├── main.jsx             # Application entry point
│   └── index.css            # Base styles
├── package.json             # Frontend dependencies
└── vite.config.js          # Vite configuration with proxy
```

### **Backend (Node.js)**
```
server/
├── index.js                 # Main server file
├── package.json             # Backend dependencies
└── .env.example            # Environment variables template
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/zeeshan8281/hyperdash.git
   cd hyperdash
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Start the application**
   ```bash
   # Terminal 1: Start the server (port 3000)
   cd server
   npm start
   
   # Terminal 2: Start the client (port 5173)
   cd client
   npm run dev
   ```

4. **Access the application**
   - Open [http://localhost:5173](http://localhost:5173) in your browser
   - The server will be running on [http://localhost:3000](http://localhost:3000)

## 📡 API Endpoints

### **REST Endpoints**
- `GET /health` - Health check and uptime monitoring
- `GET /api/markets` - Mock market data for Hyperliquid pairs
- `GET /api/spot/markets` - Real Hyperliquid spot trading pairs
- `GET /api/dexscreener/search/:query` - Search DEX Screener for trading pairs
- `GET /api/dexscreener/token/:chainId/:tokenAddress` - Get token-specific pairs
- `POST /api/info` - Unified endpoint for candles and order books (rate limited)

### **WebSocket Endpoint**
- `WS /ws` - Real-time order book updates and market data

## 🎛️ Usage

### **Market Selection**
1. **Toggle Market Type**: Switch between "Perp" (Perpetual) and "Spot" markets
2. **Select Trading Pair**: Choose from available markets in the dropdown
3. **Data Source**: Toggle between "🎭 Mock" and "🌐 Real" data sources

### **Chart Interaction**
- **Timeframes**: Switch between 1m, 5m, 15m, 1h, 4h, 1d intervals
- **Real-Time Updates**: Charts update automatically via WebSocket
- **Order Book**: Live bid/ask spreads with market depth

### **Data Sources**
- **Mock Data**: Generated data for testing and development
- **Real Data**: Live data from DEX Screener API for actual market conditions

## 🔧 Configuration

### **Environment Variables**
Create a `.env` file in the `server/` directory:
```env
PORT=3000
NODE_ENV=development
```

### **Rate Limiting**
- Default: 30 requests per minute per IP
- Configurable in `server/index.js`
- Prevents API abuse and ensures fair usage

## 🛠️ Development

### **Project Structure**
```
hyperdash/
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Node.js backend
│   ├── index.js          # Main server file
│   ├── package.json      # Backend dependencies
│   └── .env.example      # Environment template
├── .gitignore            # Git ignore rules
└── README.md            # This file
```

### **Available Scripts**
```bash
# Server
cd server
npm start          # Start production server
npm run dev        # Start development server

# Client  
cd client
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## 🌐 API Integrations

### **Hyperliquid API**
- **Spot Markets**: Real trading pairs from Hyperliquid
- **Market Data**: Current prices and trading information
- **Asset Contexts**: Detailed market metadata

### **DEX Screener API**
- **Multi-DEX Data**: Aggregated data from multiple exchanges
- **Real Prices**: Live USD prices and trading volumes
- **Market Cap**: Token market capitalization data
- **Liquidity**: Market liquidity and depth information

## 🔒 Security & Performance

### **Security Features**
- **Rate Limiting**: Prevents API abuse
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Sanitized user inputs
- **Error Handling**: Comprehensive error management

### **Performance Optimizations**
- **WebSocket Connections**: Low-latency real-time updates
- **Request Optimization**: Reduced API calls and efficient data flow
- **Caching**: Intelligent data caching strategies
- **Compression**: Optimized data transfer

## 📊 Monitoring

### **Health Checks**
- **Server Status**: `/health` endpoint for uptime monitoring
- **Connection Status**: Real-time WebSocket connection indicators
- **Rate Limit Tracking**: Request count monitoring per IP

### **Logging**
- **Request Logging**: All API requests logged with timestamps
- **Error Logging**: Comprehensive error tracking and debugging
- **WebSocket Events**: Connection and message logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hyperliquid** for providing the trading API
- **DEX Screener** for comprehensive market data
- **React** and **Node.js** communities for excellent documentation
- **Vite** for fast development experience

## 📞 Support

If you have any questions or need help:

1. Check the [Issues](https://github.com/zeeshan8281/hyperdash/issues) page
2. Create a new issue if your problem isn't already reported
3. Join the discussion in the [Discussions](https://github.com/zeeshan8281/hyperdash/discussions) section

---

**Built with ❤️ by [Zeeshan](https://github.com/zeeshan8281)**

*Happy Trading! 📈*