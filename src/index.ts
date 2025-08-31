#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { WooCommerceService } from './services/woocommerce.js';
import { Logger } from './utils/logger.js';
import { ValidationUtils } from './utils/validation.js';
import { MCPServerConfig } from './types/mcp.js';
import { ProductTools } from './tools/products.js';
import { OrderTools } from './tools/orders.js';
import { CustomerTools } from './tools/customers.js';
import { AnalyticsTools } from './tools/analytics.js';
import { CouponTools } from './tools/coupons.js';
import { MCPTransport } from './transport/mcp-transport.js';
import { MCPProtocolHandler } from './protocol/mcp-handler.js';
import { N8nCompatibility } from './n8n/compatibility.js';

// Load environment variables
dotenv.config();

class WooCommerceMCPServer {
  private server: Server;
  private wooCommerce!: WooCommerceService;
  private logger: Logger;
  private productTools!: ProductTools;
  private orderTools!: OrderTools;
  private customerTools!: CustomerTools;
  private analyticsTools!: AnalyticsTools;
  private couponTools!: CouponTools;
  private config: MCPServerConfig;
  private expressApp?: express.Application;
  private httpServer?: any;
  private mcpTransport?: MCPTransport;
  private mcpProtocol?: MCPProtocolHandler;
  private n8nCompatibility?: N8nCompatibility;

  constructor() {
    this.logger = Logger.getInstance();
    this.config = this.loadConfiguration();
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.initializeServices();
    this.setupHandlers();
  }

  private loadConfiguration(): MCPServerConfig {
    const config: MCPServerConfig = {
      name: 'mcp-woocommerce-server',
      version: '1.0.0',
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0',
      woocommerce: {
        siteUrl: process.env.WOOCOMMERCE_SITE_URL || '',
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
        version: process.env.WOOCOMMERCE_API_VERSION || '3',
        timeout: parseInt(process.env.WOOCOMMERCE_TIMEOUT || '30000')
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        file: process.env.LOG_FILE || undefined
      },
      security: {
        enableCors: process.env.ENABLE_CORS !== 'false',
        rateLimiting: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
          max: parseInt(process.env.RATE_LIMIT_MAX || '100') // limit each IP to 100 requests per windowMs
        }
      }
    };

    // Validate WooCommerce configuration
    const validation = ValidationUtils.validateConfig(config.woocommerce);
    if (validation.error) {
      throw new Error(`Configuration validation failed: ${validation.error}`);
    }

    return config;
  }

  private initializeServices(): void {
    try {
      // Initialize WooCommerce service
      this.wooCommerce = new WooCommerceService(this.config.woocommerce);
      
      // Initialize tool handlers
      this.productTools = new ProductTools(this.wooCommerce, this.logger);
      this.orderTools = new OrderTools(this.wooCommerce, this.logger);
      this.customerTools = new CustomerTools(this.wooCommerce, this.logger);
      this.analyticsTools = new AnalyticsTools(this.wooCommerce, this.logger);
      this.couponTools = new CouponTools(this.wooCommerce, this.logger);
      this.n8nCompatibility = new N8nCompatibility(this.logger);
      
      // Initialize MCP Protocol components
      this.mcpProtocol = new MCPProtocolHandler(
        this.productTools,
        this.orderTools, 
        this.customerTools,
        this.analyticsTools,
        this.couponTools,
        this.logger
      );
      
      this.mcpTransport = new MCPTransport(this.mcpProtocol, this.logger);

      this.logger.info('Services initialized successfully', {
        siteUrl: this.config.woocommerce.siteUrl,
        version: this.config.woocommerce.version
      });
    } catch (error) {
      this.logger.error('Failed to initialize services', { error });
      throw error;
    }
  }

  private async executeToolInternal(name: string, args: any): Promise<any> {
    // Internal tool execution method for N8N compatibility - COUPON TOOLS FIRST
    if (name === 'wc_get_coupons' || name === 'wc_get_coupon' || 
        name === 'wc_get_coupon_by_code' || name === 'wc_get_coupon_usage_stats' ||
        name === 'wc_get_top_coupons_usage' || name === 'wc_create_coupon' ||
        name === 'wc_update_coupon' || name === 'wc_delete_coupon') {
      return await this.couponTools.handleTool(name, args);
    } 
    // CUSTOMER TOOLS (including wc_get_top_customers)
    else if (name.startsWith('wc_') && name.includes('customer')) {
      return await this.customerTools.handleTool(name, args);
    }
    // ANALYTICS TOOLS (excluding customer-specific tools)
    else if (name.startsWith('wc_get_sales') || name.startsWith('wc_get_daily') || 
        name.startsWith('wc_get_monthly') || name.startsWith('wc_get_yearly') || 
        name.startsWith('wc_get_top_sellers') || name.startsWith('wc_get_revenue') || 
        name.startsWith('wc_get_tax') || name.startsWith('wc_get_refund') || 
        name.startsWith('wc_get_product_sales') || name.includes('_analytics') ||
        (name.includes('_stats') && !name.includes('coupon'))) {
      return await this.analyticsTools.handleTool(name, args);
    } 
    // PRODUCT TOOLS
    else if (name.startsWith('wc_') && (name.includes('product') || name === 'wc_batch_products')) {
      return await this.productTools.handleTool(name, args);
    } 
    // ORDER TOOLS
    else if (name.startsWith('wc_') && name.includes('order')) {
      return await this.orderTools.handleTool(name, args);
    }
    
    throw new Error(`Unknown tool: ${name}`);
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const allTools = [
        ...this.productTools.getTools(),
        ...this.orderTools.getTools(),
        ...this.customerTools.getTools(),
        ...this.analyticsTools.getTools(),
        ...this.couponTools.getTools()
      ];

      this.logger.debug(`Listed ${allTools.length} available tools`);
      
      return {
        tools: allTools
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info(`Tool call received: ${name}`, { arguments: args });

      try {
        let result;

        // Route to appropriate tool handler - COUPON TOOLS FIRST (highest priority for specific coupon tools)  
        if (name === 'wc_get_coupons' || name === 'wc_get_coupon' || 
            name === 'wc_get_coupon_by_code' || name === 'wc_get_coupon_usage_stats' ||
            name === 'wc_get_top_coupons_usage' || name === 'wc_create_coupon' ||
            name === 'wc_update_coupon' || name === 'wc_delete_coupon') {
          result = await this.couponTools.handleTool(name, args || {});
        } else if (name.startsWith('wc_get_sales') || name.startsWith('wc_get_daily') || 
            name.startsWith('wc_get_monthly') || name.startsWith('wc_get_yearly') || 
            name.startsWith('wc_get_top') || name.startsWith('wc_get_revenue') || 
            name.startsWith('wc_get_tax') || name.startsWith('wc_get_refund') || 
            name.startsWith('wc_get_product_sales') || name.includes('_analytics') ||
            name.includes('_stats')) {
          result = await this.analyticsTools.handleTool(name, args || {});
        } else if (name.startsWith('wc_') && (name.includes('product') || name === 'wc_batch_products')) {
          result = await this.productTools.handleTool(name, args || {});
        } else if (name.startsWith('wc_') && name.includes('order')) {
          result = await this.orderTools.handleTool(name, args || {});
        } else if (name.startsWith('wc_') && name.includes('customer')) {
          result = await this.customerTools.handleTool(name, args || {});
        } else {
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }

        this.logger.info(`Tool call completed: ${name}`, { 
          success: !result.isError,
          error: result.isError
        });

        return {
          content: result.content
        };
      } catch (error) {
        this.logger.error(`Tool call failed: ${name}`, { 
          error: error instanceof Error ? error.message : error,
          arguments: args 
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = [
        {
          uri: 'woocommerce://store/info',
          name: 'Store Information',
          description: 'General store information and system status',
          mimeType: 'application/json'
        },
        {
          uri: 'woocommerce://store/settings',
          name: 'Store Settings',
          description: 'WooCommerce store configuration and settings',
          mimeType: 'application/json'
        },
        {
          uri: 'woocommerce://reports/sales',
          name: 'Sales Reports',
          description: 'Sales analytics and reporting data',
          mimeType: 'application/json'
        },
        {
          uri: 'woocommerce://system/status',
          name: 'System Status',
          description: 'WooCommerce system status and diagnostics',
          mimeType: 'application/json'
        }
      ];

      this.logger.debug(`Listed ${resources.length} available resources`);
      
      return {
        resources
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      this.logger.info(`Resource read requested: ${uri}`);

      try {
        let data;
        let description = '';

        switch (uri) {
          case 'woocommerce://store/info':
            data = await this.getStoreInfo();
            description = 'General store information';
            break;
          case 'woocommerce://store/settings':
            data = await this.wooCommerce.getSettings();
            description = 'Store settings and configuration';
            break;
          case 'woocommerce://reports/sales':
            data = await this.wooCommerce.getSalesReport();
            description = 'Sales reports and analytics';
            break;
          case 'woocommerce://system/status':
            data = await this.wooCommerce.getSystemStatus();
            description = 'System status and diagnostics';
            break;
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
        }

        this.logger.info(`Resource read completed: ${uri}`);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                success: true,
                data,
                description,
                timestamp: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        this.logger.error(`Resource read failed: ${uri}`, { 
          error: error instanceof Error ? error.message : error 
        });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Resource read failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  private async getStoreInfo(): Promise<any> {
    try {
      // Fetch basic store information
      const [settings, systemStatus] = await Promise.all([
        this.wooCommerce.getSettings().catch(() => null),
        this.wooCommerce.getSystemStatus().catch(() => null)
      ]);

      // Get some sample data for overview
      const [products, orders, customers] = await Promise.all([
        this.wooCommerce.getProducts({ per_page: 1 }).catch(() => []),
        this.wooCommerce.getOrders({ per_page: 1 }).catch(() => []),
        this.wooCommerce.getCustomers({ per_page: 1 }).catch(() => [])
      ]);

      return {
        store_url: this.config.woocommerce.siteUrl,
        api_version: this.config.woocommerce.version,
        system_status: systemStatus ? 'available' : 'limited',
        settings_available: !!settings,
        endpoints_accessible: {
          products: products.length > 0 || products === null,
          orders: orders.length > 0 || orders === null,
          customers: customers.length > 0 || customers === null
        },
        server_info: {
          name: this.config.name,
          version: this.config.version,
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch store info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private setupExpressServer(): void {
    if (!this.config.port) {
      return; // Skip HTTP server if no port configured
    }

    this.expressApp = express();

    // Security middleware
    this.expressApp.use(helmet());
    
    if (this.config.security?.enableCors) {
      this.expressApp.use(cors());
    }

    // Logging middleware
    this.expressApp.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          this.logger.info(message.trim());
        }
      }
    }));

    // JSON parsing
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.expressApp.get('/health', async (req, res) => {
      try {
        const health = await this.wooCommerce.healthCheck();
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          woocommerce: health,
          server: {
            name: this.config.name,
            version: this.config.version,
            uptime: process.uptime()
          }
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Info endpoint
    this.expressApp.get('/info', async (req, res) => {
      try {
        const info = await this.getStoreInfo();
        res.json(info);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // MCP Server-Sent Events endpoint for streaming
    this.expressApp.get('/mcp-sse', (req, res) => {
      if (!this.mcpTransport) {
        return res.status(500).json({ error: 'MCP Transport not initialized' });
      }
      
      const sessionId = this.mcpTransport.handleSSEConnection(req, res);
      this.logger.info('SSE connection established', { sessionId });
      return sessionId;
    });
    
    // MCP JSON-RPC HTTP endpoint (fallback for simple requests)
    this.expressApp.post('/mcp', async (req, res) => {
      try {
        const { method, params, id } = req.body;
        
        this.logger.info('MCP HTTP request received', { method, params, id });
        
        if (!this.mcpProtocol) {
          throw new Error('MCP Protocol handler not initialized');
        }
        
        // Create a simple HTTP response handler
        const responseHandler = (response: any) => {
          if (response) {
            res.json({
              jsonrpc: '2.0',
              id,
              result: response.result || response,
              error: response.error
            });
          }
        };
        
        // Handle the message through MCP Protocol
        await this.mcpProtocol.handleMessage('http-session', {
          jsonrpc: '2.0',
          method,
          params,
          id
        }, responseHandler);
        
        return; // Ensure function returns
        
      } catch (error) {
        this.logger.error('MCP HTTP request error', { error });
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error'
          }
        });
      }
    });

    // N8n webhook endpoint
    this.expressApp.post('/webhook/n8n', (req, res) => {
      this.logger.info('N8n webhook received', { 
        headers: req.headers,
        body: req.body 
      });
      
      res.json({
        success: true,
        message: 'Webhook received',
        timestamp: new Date().toISOString(),
        data: req.body
      });
    });

    // N8n MCP Tools endpoint with compatibility layer
    this.expressApp.get('/n8n/tools', (req, res) => {
      try {
        const allTools = [
          ...this.productTools.getTools(),
          ...this.orderTools.getTools(),
          ...this.customerTools.getTools(),
          ...this.analyticsTools.getTools(),
          ...this.couponTools.getTools()
        ];

        const n8nCompatibleTools = this.n8nCompatibility!.getN8nCompatibleTools(allTools);
        
        res.json({
          success: true,
          tools: n8nCompatibleTools,
          count: n8nCompatibleTools.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        this.logger.error('N8n tools endpoint error', { error });
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // N8n Tool Execution endpoint with compatibility layer
    this.expressApp.post('/n8n/execute', async (req, res): Promise<void> => {
      try {
        const { toolName, input } = req.body;
        
        if (!toolName) {
          res.status(400).json({
            success: false,
            error: 'Tool name is required'
          });
          return;
        }

        // Execute tool with N8N compatibility layer
        const result = await this.n8nCompatibility!.processToolExecution(
          toolName,
          input || {},
          async (name: string, args: any) => {
            return await this.executeToolInternal(name, args);
          }
        );

        res.json(result);
      } catch (error) {
        this.logger.error('N8n execute endpoint error', { error, body: req.body });
        res.status(500).json(
          this.n8nCompatibility!.createErrorResponse(error instanceof Error ? error : 'Unknown execution error')
        );
      }
    });

    // 404 handler
    this.expressApp.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: {
          'GET /health': 'Server health check',
          'GET /info': 'Store information',
          'GET /mcp-sse': 'MCP Server-Sent Events streaming',
          'POST /mcp': 'MCP HTTP JSON-RPC endpoint',
          'WebSocket /mcp-ws': 'Native MCP WebSocket protocol',
          'POST /webhook/n8n': 'N8n webhook endpoint'
        }
      });
    });

    // Error handler
    this.expressApp.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Express error', { error: error.message, stack: error.stack });
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    });
  }

  async start(): Promise<void> {
    try {
      // Skip health check if using demo credentials
      const consumerKey = this.config.woocommerce.consumerKey;
      if (consumerKey && !consumerKey.includes('demo') && !consumerKey.includes('test') && !consumerKey.includes('your_')) {
        await this.wooCommerce.healthCheck();
        this.logger.info('WooCommerce connection test successful');
      } else {
        this.logger.info('Running in demo mode - skipping WooCommerce health check');
      }

      // Setup Express server for HTTP endpoints (health checks, webhooks)
      this.setupExpressServer();

      // Start HTTP server with WebSocket support if configured
      if (this.expressApp && this.config.port && this.config.host) {
        // Create HTTP server instance for WebSocket integration
        this.httpServer = createServer(this.expressApp);
        
        // Initialize WebSocket server for native MCP protocol
        if (this.mcpTransport) {
          this.mcpTransport.initializeWebSocketServer(this.httpServer);
        }
        
        this.httpServer.listen(this.config.port, this.config.host, () => {
          this.logger.info(`🚀 MCP WooCommerce Server started`, {
            host: this.config.host,
            port: this.config.port,
            endpoints: {
              'Health Check': `http://${this.config.host}:${this.config.port}/health`,
              'Store Info': `http://${this.config.host}:${this.config.port}/info`,
              'MCP WebSocket': `ws://${this.config.host}:${this.config.port}/mcp-ws`,
              'MCP Server-Sent Events': `http://${this.config.host}:${this.config.port}/mcp-sse`,
              'MCP HTTP': `http://${this.config.host}:${this.config.port}/mcp`,
              'N8n Webhook': `http://${this.config.host}:${this.config.port}/webhook/n8n`
            },
            protocol: 'Native MCP Protocol with WebSocket & SSE support'
          });
        });
      }

      // Start MCP server on stdio
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('MCP WooCommerce Server started successfully', {
        name: this.config.name,
        version: this.config.version,
        woocommerce_url: this.config.woocommerce.siteUrl
      });

    } catch (error) {
      this.logger.error('Failed to start MCP server', { error });
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      // Close HTTP server
      if (this.httpServer) {
        this.httpServer.close();
      }
      
      // Close MCP Transport
      if (this.mcpTransport) {
        await this.mcpTransport.close();
      }
      
      // Close MCP SDK server
      await this.server.close();
      
      this.logger.info('MCP WooCommerce Server stopped gracefully');
    } catch (error) {
      this.logger.error('Error stopping MCP server', { error });
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  const server = new WooCommerceMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}