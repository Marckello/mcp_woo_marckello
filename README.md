# MCP WooCommerce Server - Real Protocol Implementation

## 🚀 Project Overview
**Complete MCP (Model Context Protocol) server for WooCommerce integration with native protocol support**

- **Name**: mcp-woocommerce-server
- **Goal**: True MCP protocol implementation for WooCommerce automation with n8n
- **Features**: 40+ WooCommerce tools via native MCP protocol with Mexican market support (MXN currency), customer analytics, and real API integration

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
- **Smart Date Detection**: Intelligent date parsing with timezone context
- **Mexico Timezone**: Native UTC-6 (America/Mexico_City) support

## 🔧 Data Architecture

### WooCommerce Integration
- **40+ MCP Tools**: Complete WooCommerce API coverage with customer & promotion analytics
- **Product Tools**: Create, read, update, delete, batch operations
- **Order Tools**: Order management, notes, status updates  
- **Customer Tools**: Customer CRUD operations, top customers analysis, purchase history
- **Analytics Tools**: 12 comprehensive sales analytics with smart date detection
- **Promotion Tools**: Active promotions, discounts, and special offers management
- **Mexican Market**: Native MXN (Pesos Mexicanos) currency support
- **Real API Integration**: Direct connection to live WooCommerce stores
- **Authentication**: OAuth 1.0a with consumer key/secret
- **Timezone Aware**: All date queries use Mexico City timezone (UTC-6)

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
4. **Tools Available**: 40+ WooCommerce automation tools including customer analytics
5. **Authentication**: Configure WooCommerce credentials in server .env

### Smart Date Detection Features
- **Natural Language**: Use "28 de agosto" or "August 28" for date queries
- **Context Aware**: Automatically detects if date is past/future based on current time
- **n8n Integration**: Use `{{ $now }}` variable for current date context
- **Mexico Timezone**: All calculations in UTC-6 (America/Mexico_City)

**Example Analytics Queries:**
```javascript
// Get sales for August 28 (automatically detects correct year)
{
  "name": "wc_get_daily_sales",
  "arguments": {
    "period": "28 de agosto",
    "context_date": "{{ $now }}"  // n8n current datetime
  }
}

// Get top customers by total spending
{
  "name": "wc_get_top_customers",
  "arguments": {
    "metric": "total_spent",
    "limit": 5
  }
}

// Get active promotions and discounts
{
  "name": "wc_get_promotions_active",
  "arguments": {
    "status": "active",
    "type": "coupon"
  }
}

// Get customer purchase history
{
  "name": "wc_get_customer_purchase_history",
  "arguments": {
    "customer_id": 45,
    "include_products": true
  }
}
```

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

# WooCommerce API (Real Store Configuration)
WOOCOMMERCE_SITE_URL=https://www.adaptohealmx.com
WOOCOMMERCE_CONSUMER_KEY=ck_34d17724245f34dbbcd7b0f05b943c89755eeb
WOOCOMMERCE_CONSUMER_SECRET=cs_118d871a343de8dbcab864c85e81b40453f05458
WOOCOMMERCE_API_VERSION=3

# Security & Logging  
ENABLE_CORS=true
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🏪 WooCommerce API Setup

### Required API Permissions
For real WooCommerce integration, ensure your API key has proper permissions:

1. **WordPress Admin** → **WooCommerce** → **Settings** → **Advanced** → **REST API**
2. **Create API Key** or **Edit existing key**
3. **Permissions**: Set to **"Read/Write"** or minimum **"Read"** for analytics
4. **User**: Select admin user with WooCommerce access
5. **Generate/Update** and copy credentials to `.env` file

### Currency Configuration
- **Default Currency**: Mexican Pesos (MXN) 
- **Market Focus**: Mexican e-commerce market
- **Realistic Values**: All demo data scaled for Mexican market
- **Real Integration**: Connects to live WooCommerce for accurate MXN data

## 🎯 Implementation Status

### ✅ Completed Features
- **Native MCP Protocol**: Complete JSON-RPC 2.0 implementation
- **Multiple Transports**: WebSocket, SSE, HTTP support
- **40+ WooCommerce Tools**: Full API coverage via MCP with customer analytics
- **Smart Analytics**: 12 analytics tools with intelligent date detection
- **Mexican Market Support**: MXN currency, realistic pricing, Mexico timezone
- **Real API Integration**: Direct connection to live WooCommerce stores
- **Mexico Timezone**: Native UTC-6 support with n8n {{ $now }} integration
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

**Last Updated**: August 30, 2025 - v1.3.0 Customer Analytics & Promotions Complete

### 🆕 v1.3.0 New Features
- **Customer Analytics**: `wc_get_top_customers` - Identify top customers by spending, orders, or average value
- **Purchase History**: `wc_get_customer_purchase_history` - Detailed customer purchase patterns and history
- **Promotions Management**: `wc_get_promotions_active` - Active discounts, coupons, and special offers
- **Enhanced Routing**: Smart tool routing for customer vs analytics tools
- **Mexican Market Data**: Realistic customer profiles with Mexico addresses and phone numbers
- **Schema Optimization**: All schemas optimized for n8n compatibility (no default values)