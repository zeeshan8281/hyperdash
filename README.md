# Hyperdash MVP

A minimal Hyperliquid analytics MVP with live market data streaming.

## Features

- **Server**: Node.js Express server with WebSocket support for Hyperliquid testnet or mock data
- **Client**: React + Vite frontend with live ticker display
- **Real-time**: Server-Sent Events (SSE) for live market data streaming
- **Mock Mode**: Works without external dependencies for development

## Quick Start

### 1. Start the Server (Terminal 1)
```bash
cd server
npm install  # if not already done
node index.js
```

The server will start on `http://localhost:3000` and run in mock mode by default.

### 2. Start the Client (Terminal 2)
```bash
cd client
npm install  # if not already done
npm run dev
```

The client will start on `http://localhost:5173` and automatically proxy API calls to the server.

### 3. View the Application
Open `http://localhost:5173` in your browser to see:
- Live market data feed (mock data updating every ~900ms)
- Market metadata (ETH, BTC, SOL)
- Real-time ticker and trade events

## Configuration

### Mock Mode (Default)
The server runs in mock mode by default, generating fake market data for ETH, BTC, and SOL.

### Hyperliquid Testnet Mode
To connect to Hyperliquid testnet:

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Edit `.env` and set:
```
HYPER_WS=wss://api.hyperliquid-testnet.xyz/ws
HYPER_INFO=https://api.hyperliquid-testnet.xyz/info
```

3. Restart the server

## API Endpoints

- `GET /stream` - Server-Sent Events stream of market data
- `GET /api/markets` - Market metadata (mock or proxied from Hyperliquid)

## Project Structure

```
hyperdash/
├── server/
│   ├── index.js          # Express server with WebSocket/SSE
│   ├── .env.example      # Environment configuration
│   └── package.json      # Server dependencies
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── LiveTicker.jsx  # SSE consumer component
│   │   ├── App.jsx       # Main React app
│   │   └── main.jsx      # React entry point
│   ├── vite.config.js    # Vite config with proxy
│   └── package.json      # Client dependencies
└── README.md
```

## Next Steps

The application is ready for these enhancements:

1. **Charts**: Add candlestick charts using Chart.js or lightweight-charts
2. **Real Hyperliquid**: Implement proper subscription handling per Hyperliquid docs
3. **Positions**: Add read-only positions endpoint using Hyperliquid SDK
4. **Production**: Replace in-memory bus with Redis pub/sub
5. **Authentication**: Add wallet-connect flows for authenticated features

## Notes

- Uses in-memory event bus for simplicity (not production-ready)
- Mock data generates realistic price movements for ETH, BTC, SOL
- SSE connection automatically reconnects on client side
- CORS enabled for development
