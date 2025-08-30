# MCP WooCommerce Server - Real Protocol Implementation

## 🚀 Project Overview
**Complete MCP (Model Context Protocol) server for WooCommerce integration with native protocol support**

- **Name**: mcp-woocommerce-server
- **Goal**: True MCP protocol implementation for WooCommerce automation with n8n
- **Features**: 37+ WooCommerce tools via native MCP protocol with bidirectional communication

## 🎯 URLs & Endpoints

### Production URLs
- **GitHub**: https://github.com/Marckello/mcp_woo_marckello
- **Demo Server**: https://3000-i0pmg1zszswkdqf58h7ot-6532622b.e2b.dev

### MCP Protocol Endpoints
- **WebSocket MCP**: `ws://hostname:3000/mcp-ws` (for n8n MCP node)
- **Server-Sent Events**: `GET /mcp-sse` (HTTP streaming) 
- **HTTP JSON-RPC**: `POST /mcp` (fallback endpoint)
- **Health Check**: `GET /health`
- **Store Info**: `GET /info`
- **N8n Webhook**: `POST /webhook/n8n`

## 🏗️ MCP Protocol Architecture

### Native MCP Implementation
- **MCPTransport** (`src/transport/mcp-transport.ts`): WebSocket & SSE transport layers
- **MCPProtocolHandler** (`src/protocol/mcp-handler.ts`): JSON-RPC 2.0 message handling
- **Session Management**: UUID-based session tracking with capabilities
- **Bidirectional Communication**: Real-time MCP protocol compliance

### MCP Protocol Features
- **Protocol Version**: MCP 2024-11-05
- **JSON-RPC 2.0**: Full compliance with MCP specification
- **Multiple Transports**: WebSocket, SSE, HTTP support
- **Tool Discovery**: Dynamic tool listing and execution
- **Resource Management**: Store info and settings via MCP resources

## 🔧 Data Architecture

### WooCommerce Integration
- **37+ MCP Tools**: Complete WooCommerce API coverage
- **Product Tools**: Create, read, update, delete, batch operations
- **Order Tools**: Order management, notes, status updates
- **Customer Tools**: Customer CRUD operations and management
- **Authentication**: OAuth 1.0a with consumer key/secret

### Storage & Services
- **WooCommerce REST API**: v1, v2, v3 support
- **Session Storage**: In-memory session management
- **Logging**: Winston-based structured logging
- **Validation**: Joi schema validation for all inputs

## 👨‍💻 User Guide

### For n8n Users
1. **Add MCP Node**: Use n8n's MCP integration node
2. **WebSocket URL**: `ws://your-server:3000/mcp-ws`
3. **Protocol**: Select "MCP 2024-11-05"
4. **Tools Available**: 37+ WooCommerce automation tools
5. **Authentication**: Configure WooCommerce credentials in server .env

### For Direct API Usage
```javascript
// Initialize MCP connection
POST /mcp
{
  "jsonrpc": "2.0",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "clientInfo": {"name": "my-client", "version": "1.0.0"},
    "capabilities": {"tools": {}}
  },
  "id": 1
}

// List available tools
POST /mcp
{
  "jsonrpc": "2.0", 
  "method": "tools/list",
  "id": 2
}

// Execute WooCommerce tool
POST /mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call", 
  "params": {
    "name": "wc_get_products",
    "arguments": {"per_page": 10}
  },
  "id": 3
}
```

## 🚀 Deployment

### Current Status
- **Platform**: E2B Sandbox (Development)
- **Status**: ✅ Active - MCP Protocol Real Implementation Complete
- **Tech Stack**: Node.js + TypeScript + Hono + WebSocket + MCP SDK
- **Process Manager**: PM2 with ecosystem.config.cjs

### EasyPanel Deployment
1. **Repository**: Use GitHub repo `mcp_woo_marckello`
2. **Docker**: Multi-stage build with production optimization
3. **Environment**: Copy `.env.easypanel` template
4. **Port**: 3000 (HTTP + WebSocket)
5. **Health**: `/health` endpoint for monitoring

### Local Development
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Test MCP protocol
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "initialize", "id": 1}'
```

## 🔑 Environment Variables

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# WooCommerce API
WOOCOMMERCE_SITE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret
WOOCOMMERCE_API_VERSION=3

# Security & Logging  
ENABLE_CORS=true
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🎯 Implementation Status

### ✅ Completed Features
- **Native MCP Protocol**: Complete JSON-RPC 2.0 implementation
- **Multiple Transports**: WebSocket, SSE, HTTP support
- **37+ WooCommerce Tools**: Full API coverage via MCP
- **Session Management**: UUID-based session tracking  
- **Production Ready**: PM2, logging, error handling
- **GitHub Integration**: Source control with deployment ready
- **Docker Support**: Multi-stage production builds

### 📋 Ready for Next Steps
1. **EasyPanel Deployment**: Repository ready for container deployment
2. **N8n Integration**: Native MCP WebSocket connection support
3. **Real Credentials**: Update .env with actual WooCommerce API keys
4. **Production Scaling**: PM2 cluster mode and load balancing

### 🔄 Integration Flow
```
n8n MCP Node → WebSocket → MCP Transport → Protocol Handler → WooCommerce Tools → API Response → MCP Response → n8n
```

**Last Updated**: August 30, 2025 - MCP Protocol Real Implementation Complete