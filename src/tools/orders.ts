import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WooCommerceService } from '../services/woocommerce.js';
import { ValidationUtils } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import { MCPToolParams, MCPToolResult } from '../types/mcp.js';

export class OrderTools {
  constructor(
    private wooCommerce: WooCommerceService,
    private logger: Logger
  ) {}

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_orders',
        description: 'Retrieve a list of orders from WooCommerce store with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Orders per page' },
            search: { type: 'string', description: 'Search in order number, customer name, or email' },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash'], 
              description: 'Filter by order status' 
            },
            customer: { type: 'integer', minimum: 1, description: 'Filter by customer ID' },
            product: { type: 'integer', minimum: 1, description: 'Filter by product ID' },
            after: { type: 'string', format: 'date-time', description: 'Orders created after this date' },
            before: { type: 'string', format: 'date-time', description: 'Orders created before this date' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
            orderby: { type: 'string', enum: ['date', 'id', 'title', 'slug', 'modified'], default: 'date', description: 'Sort by field' }
          }
        }
      },
      {
        name: 'wc_get_order',
        description: 'Get detailed information about a specific order by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Order ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_create_order',
        description: 'Create a new order in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'], 
              default: 'pending',
              description: 'Order status' 
            },
            currency: { type: 'string', minLength: 3, maxLength: 3, default: 'USD', description: 'Currency code (ISO 4217)' },
            customer_id: { type: 'integer', minimum: 0, default: 0, description: 'Customer ID (0 for guest)' },
            billing: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100, description: 'First name' },
                last_name: { type: 'string', maxLength: 100, description: 'Last name' },
                company: { type: 'string', maxLength: 100, description: 'Company name' },
                address_1: { type: 'string', maxLength: 100, description: 'Address line 1' },
                address_2: { type: 'string', maxLength: 100, description: 'Address line 2' },
                city: { type: 'string', maxLength: 100, description: 'City' },
                state: { type: 'string', maxLength: 100, description: 'State/Province' },
                postcode: { type: 'string', maxLength: 20, description: 'Postal code' },
                country: { type: 'string', minLength: 2, maxLength: 2, description: 'Country code (ISO 3166-1 alpha-2)' },
                email: { type: 'string', format: 'email', description: 'Email address' },
                phone: { type: 'string', maxLength: 20, description: 'Phone number' }
              },
              description: 'Billing address'
            },
            shipping: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100, description: 'First name' },
                last_name: { type: 'string', maxLength: 100, description: 'Last name' },
                company: { type: 'string', maxLength: 100, description: 'Company name' },
                address_1: { type: 'string', maxLength: 100, description: 'Address line 1' },
                address_2: { type: 'string', maxLength: 100, description: 'Address line 2' },
                city: { type: 'string', maxLength: 100, description: 'City' },
                state: { type: 'string', maxLength: 100, description: 'State/Province' },
                postcode: { type: 'string', maxLength: 20, description: 'Postal code' },
                country: { type: 'string', minLength: 2, maxLength: 2, description: 'Country code (ISO 3166-1 alpha-2)' }
              },
              description: 'Shipping address'
            },
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_id: { type: 'integer', minimum: 1, description: 'Product ID' },
                  quantity: { type: 'integer', minimum: 1, description: 'Quantity' },
                  variation_id: { type: 'integer', minimum: 0, default: 0, description: 'Variation ID (for variable products)' },
                  meta_data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string', description: 'Meta key' },
                        value: { description: 'Meta value' }
                      },
                      required: ['key', 'value']
                    },
                    description: 'Line item meta data'
                  }
                },
                required: ['product_id', 'quantity']
              },
              minItems: 1,
              description: 'Order line items'
            },
            shipping_lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  method_id: { type: 'string', description: 'Shipping method ID' },
                  method_title: { type: 'string', description: 'Shipping method title' },
                  total: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Shipping total' }
                },
                required: ['method_id', 'method_title', 'total']
              },
              description: 'Shipping lines'
            },
            coupon_lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', description: 'Coupon code' }
                },
                required: ['code']
              },
              description: 'Coupon lines'
            },
            customer_note: { type: 'string', maxLength: 1000, description: 'Customer note' },
            payment_method: { type: 'string', maxLength: 100, description: 'Payment method ID' },
            payment_method_title: { type: 'string', maxLength: 100, description: 'Payment method title' },
            transaction_id: { type: 'string', maxLength: 200, description: 'Transaction ID' },
            set_paid: { type: 'boolean', default: false, description: 'Set order as paid' }
          },
          required: ['line_items']
        }
      },
      {
        name: 'wc_update_order',
        description: 'Update an existing order in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Order ID' },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'],
              description: 'Order status' 
            },
            customer_note: { type: 'string', maxLength: 1000, description: 'Customer note' },
            billing: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100 },
                last_name: { type: 'string', maxLength: 100 },
                company: { type: 'string', maxLength: 100 },
                address_1: { type: 'string', maxLength: 100 },
                address_2: { type: 'string', maxLength: 100 },
                city: { type: 'string', maxLength: 100 },
                state: { type: 'string', maxLength: 100 },
                postcode: { type: 'string', maxLength: 20 },
                country: { type: 'string', minLength: 2, maxLength: 2 },
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', maxLength: 20 }
              },
              description: 'Billing address'
            },
            shipping: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100 },
                last_name: { type: 'string', maxLength: 100 },
                company: { type: 'string', maxLength: 100 },
                address_1: { type: 'string', maxLength: 100 },
                address_2: { type: 'string', maxLength: 100 },
                city: { type: 'string', maxLength: 100 },
                state: { type: 'string', maxLength: 100 },
                postcode: { type: 'string', maxLength: 20 },
                country: { type: 'string', minLength: 2, maxLength: 2 }
              },
              description: 'Shipping address'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_delete_order',
        description: 'Delete an order from the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Order ID' },
            force: { type: 'boolean', default: false, description: 'Force delete (bypass trash)' }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_get_order_notes',
        description: 'Get notes for a specific order',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'integer', minimum: 1, description: 'Order ID' },
            type: { type: 'string', enum: ['any', 'customer', 'internal'], default: 'any', description: 'Note type filter' }
          },
          required: ['order_id']
        }
      },
      {
        name: 'wc_add_order_note',
        description: 'Add a note to an order',
        inputSchema: {
          type: 'object',
          properties: {
            order_id: { type: 'integer', minimum: 1, description: 'Order ID' },
            note: { type: 'string', minLength: 1, maxLength: 1000, description: 'Note content' },
            customer_note: { type: 'boolean', default: false, description: 'Whether the note is visible to customer' },
            added_by_user: { type: 'boolean', default: true, description: 'Whether the note was added by a user' }
          },
          required: ['order_id', 'note']
        }
      }
    ];
  }

  async handleTool(name: string, params: MCPToolParams): Promise<MCPToolResult> {
    try {
      this.logger.info(`Executing order tool: ${name}`, { params });

      switch (name) {
        case 'wc_get_orders':
          return await this.getOrders(params);
        case 'wc_get_order':
          return await this.getOrder(params);
        case 'wc_create_order':
          return await this.createOrder(params);
        case 'wc_update_order':
          return await this.updateOrder(params);
        case 'wc_delete_order':
          return await this.deleteOrder(params);
        case 'wc_get_order_notes':
          return await this.getOrderNotes(params);
        case 'wc_add_order_note':
          return await this.addOrderNote(params);
        default:
          throw new Error(`Unknown order tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Order tool error: ${name}`, { error: error instanceof Error ? error.message : error, params });
      return {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async getOrders(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateListParams(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const orders = await this.wooCommerce.getOrders(validation.value);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: orders,
          count: orders.length,
          message: `Retrieved ${orders.length} orders`
        }, null, 2)
      }]
    };
  }

  private async getOrder(params: MCPToolParams): Promise<MCPToolResult> {
    const { id } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Order ID is required and must be a number');
    }

    const order = await this.wooCommerce.getOrder(id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: order,
          message: `Retrieved order #${order.number || order.id} (${order.status})`
        }, null, 2)
      }]
    };
  }

  private async createOrder(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateOrder(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    const order = await this.wooCommerce.createOrder(sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: order,
          message: `Order created successfully #${order.number || order.id} (${order.status}) - Total: ${order.currency} ${order.total}`
        }, null, 2)
      }]
    };
  }

  private async updateOrder(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, ...updateData } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Order ID is required and must be a number');
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const sanitizedData = ValidationUtils.sanitizeInput(updateData);
    const order = await this.wooCommerce.updateOrder(id, sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: order,
          message: `Order updated successfully #${order.number || order.id} (${order.status})`
        }, null, 2)
      }]
    };
  }

  private async deleteOrder(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, force = false } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Order ID is required and must be a number');
    }

    const order = await this.wooCommerce.deleteOrder(id, force);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: order,
          message: `Order ${force ? 'permanently deleted' : 'moved to trash'} #${order.number || order.id}`
        }, null, 2)
      }]
    };
  }

  private async getOrderNotes(params: MCPToolParams): Promise<MCPToolResult> {
    const { order_id } = params;
    if (!order_id || typeof order_id !== 'number') {
      throw new Error('Order ID is required and must be a number');
    }

    const notes = await this.wooCommerce.getOrderNotes(order_id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: notes,
          count: notes.length,
          message: `Retrieved ${notes.length} notes for order #${order_id}`
        }, null, 2)
      }]
    };
  }

  private async addOrderNote(params: MCPToolParams): Promise<MCPToolResult> {
    const { order_id, note, customer_note = false } = params;
    
    if (!order_id || typeof order_id !== 'number') {
      throw new Error('Order ID is required and must be a number');
    }
    
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      throw new Error('Note content is required and must be a non-empty string');
    }

    const noteData = {
      note: ValidationUtils.sanitizeInput(note.trim()),
      customer_note
    };

    const result = await this.wooCommerce.createOrderNote(order_id, noteData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: result,
          message: `Note added to order #${order_id} ${customer_note ? '(visible to customer)' : '(internal only)'}`
        }, null, 2)
      }]
    };
  }
}