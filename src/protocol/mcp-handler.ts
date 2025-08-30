import { MCPMessage } from '../transport/mcp-transport.js';
import { ProductTools } from '../tools/products.js';
import { OrderTools } from '../tools/orders.js';
import { CustomerTools } from '../tools/customers.js';
import { AnalyticsTools } from '../tools/analytics.js';
import { Logger } from '../utils/logger.js';

export class MCPProtocolHandler {
  private productTools: ProductTools;
  private orderTools: OrderTools;
  private customerTools: CustomerTools;
  private analyticsTools: AnalyticsTools;
  private logger: Logger;

  constructor(
    productTools: ProductTools,
    orderTools: OrderTools,
    customerTools: CustomerTools,
    analyticsTools: AnalyticsTools,
    logger: Logger
  ) {
    this.productTools = productTools;
    this.orderTools = orderTools;
    this.customerTools = customerTools;
    this.analyticsTools = analyticsTools;
    this.logger = logger;
  }

  async handleMessage(
    sessionId: string, 
    message: MCPMessage, 
    respond: (response: MCPMessage | null) => void
  ) {
    try {
      this.logger.info('Processing MCP message', { 
        sessionId, 
        method: message.method,
        id: message.id 
      });

      let response: MCPMessage | null = null;

      switch (message.method) {
        case 'initialize':
          response = await this.handleInitialize(sessionId, message);
          break;

        case 'initialized':
          response = await this.handleInitialized(sessionId, message);
          break;

        case 'tools/list':
          response = await this.handleToolsList(sessionId, message);
          break;

        case 'tools/call':
          response = await this.handleToolsCall(sessionId, message);
          break;

        case 'resources/list':
          response = await this.handleResourcesList(sessionId, message);
          break;

        case 'resources/read':
          response = await this.handleResourcesRead(sessionId, message);
          break;

        case 'ping':
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {}
          };
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: message.id || 0,
            error: {
              code: -32601,
              message: `Method not found: ${message.method}`
            }
          };
      }

      respond(response);

    } catch (error) {
      this.logger.error('Message handling error', { sessionId, error });
      respond({
        jsonrpc: '2.0',
        id: message.id || 0,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      });
    }
  }

  private async handleInitialize(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
    const { clientInfo, capabilities } = message.params || {};
    
    this.logger.info('MCP Client initializing', { 
      sessionId, 
      clientInfo, 
      capabilities 
    });

    this.logger.info('Client capabilities received', { sessionId, capabilities });

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          logging: {},
          prompts: {}
        },
        serverInfo: {
          name: 'mcp-woocommerce-server',
          version: '1.0.0',
          description: 'WooCommerce MCP Server with 37+ tools for complete e-commerce automation'
        }
      }
    };
  }

  private async handleInitialized(sessionId: string, message: MCPMessage): Promise<MCPMessage | null> {
    this.logger.info('MCP Client initialized', { sessionId });
    
    this.logger.info('MCP Protocol initialized', { sessionId });
    return null; // No direct response needed
  }

  private async handleToolsList(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
    this.logger.info('Listing MCP tools', { sessionId });

    const allTools = [
      ...this.productTools.getToolDefinitions(),
      ...this.orderTools.getToolDefinitions(),
      ...this.customerTools.getToolDefinitions(),
      ...this.analyticsTools.getToolDefinitions()
    ];

    this.logger.info(`Returning ${allTools.length} tools`, { sessionId });

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: allTools
      }
    };
  }

  private async handleToolsCall(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
    const { name, arguments: args } = message.params || {};
    
    this.logger.info('Executing tool', { sessionId, toolName: name, args });

    try {
      let result;

      // Route to appropriate tool handler based on tool name
      if (name?.startsWith('wc_get_products') || name?.startsWith('wc_create_product') || 
          name?.startsWith('wc_update_product') || name?.startsWith('wc_delete_product') || 
          name?.startsWith('wc_batch_products')) {
        result = await this.productTools.callTool(name, args);
      } else if (name?.startsWith('wc_get_order') || name?.startsWith('wc_create_order') || 
                 name?.startsWith('wc_update_order') || name?.startsWith('wc_delete_order') || 
                 name?.startsWith('wc_add_order')) {
        result = await this.orderTools.callTool(name, args);
      } else if (name?.startsWith('wc_get_customer') || name?.startsWith('wc_create_customer') || 
                 name?.startsWith('wc_update_customer') || name?.startsWith('wc_delete_customer') || 
                 name?.startsWith('wc_batch_customer') || name?.startsWith('wc_get_top_customers') ||
                 name?.startsWith('wc_get_promotions')) {
        result = await this.customerTools.callTool(name, args);
      } else if (name?.startsWith('wc_get_sales') || name?.startsWith('wc_get_daily') || 
                 name?.startsWith('wc_get_monthly') || name?.startsWith('wc_get_yearly') || 
                 name?.startsWith('wc_get_top_sellers') || name?.startsWith('wc_get_revenue') || 
                 name?.startsWith('wc_get_coupon') || name?.startsWith('wc_get_tax') || 
                 name?.startsWith('wc_get_refund') || name?.startsWith('wc_get_product_sales')) {
        result = await this.analyticsTools.callTool(name, args);
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: false
        }
      };

    } catch (error) {
      this.logger.error('Tool execution error', { sessionId, toolName: name, error });
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ],
          isError: true
        }
      };
    }
  }

  private async handleResourcesList(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        resources: [
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
          }
        ]
      }
    };
  }

  private async handleResourcesRead(sessionId: string, message: MCPMessage): Promise<MCPMessage> {
    const { uri } = message.params || {};
    
    try {
      let content;
      
      switch (uri) {
        case 'woocommerce://store/info':
          const storeInfo = await this.getStoreInfo();
          content = JSON.stringify(storeInfo, null, 2);
          break;
          
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: content
            }
          ]
        }
      };

    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : 'Resource read error'
        }
      };
    }
  }

  private async getStoreInfo(): Promise<any> {
    try {
      return {
        store_url: process.env.WOOCOMMERCE_SITE_URL,
        api_version: process.env.WOOCOMMERCE_API_VERSION || 'v3',
        server_info: {
          name: 'mcp-woocommerce-server',
          version: '1.0.0',
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version
        },
        status: 'MCP Protocol Ready'
      };
    } catch (error) {
      throw new Error(`Failed to fetch store info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}