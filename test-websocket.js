const WebSocket = require('ws');

// Test WebSocket connection to our server
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  console.log('✅ Connected to our WebSocket server');
  
  // Subscribe to ETH order book
  ws.send(JSON.stringify({
    method: 'subscribe',
    subscription: { type: 'l2Book', coin: 'ETH' }
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📨 Received message:', JSON.stringify(message, null, 2));
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep the script running for 10 seconds
setTimeout(() => {
  ws.close();
  process.exit(0);
}, 10000);
