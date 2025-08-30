import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WooCommerceService } from '../services/woocommerce.js';
import { ValidationUtils } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import { MCPToolParams, MCPToolResult } from '../types/mcp.js';

export class CustomerTools {
  constructor(
    private wooCommerce: WooCommerceService,
    private logger: Logger
  ) {}

  private isDemoMode(): boolean {
    // Check if we're in demo mode based on environment variables
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
    const siteUrl = process.env.WOOCOMMERCE_SITE_URL || '';
    
    return (
      consumerKey.includes('demo') || 
      consumerKey.includes('test') || 
      consumerKey.includes('your_') ||
      siteUrl.includes('demo') ||
      siteUrl.includes('your-store') ||
      !consumerKey || 
      !siteUrl
    );
  }

  getToolDefinitions(): any[] {
    return this.getTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'wc_get_customers':
        return this.getCustomers(args);
      case 'wc_get_customer':
        return this.getCustomer(args);
      case 'wc_create_customer':
        return this.createCustomer(args);
      case 'wc_update_customer':
        return this.updateCustomer(args);
      case 'wc_delete_customer':
        return this.deleteCustomer(args);
      case 'wc_batch_customers':
        return this.batchCustomers(args);
      case 'wc_get_customer_orders':
        return this.getCustomerOrders(args);
      case 'wc_get_top_customers':
        return this.getTopCustomers(args);
      case 'wc_get_customer_purchase_history':
        return this.getCustomerPurchaseHistory(args);
      case 'wc_get_promotions_active':
        return this.getActivePromotions(args);
      default:
        throw new Error(`Unknown customer tool: ${name}`);
    }
  }

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_customers',
        description: 'Retrieve a list of customers from WooCommerce store with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, description: 'Page number (default: 1)' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, description: 'Customers per page (default: 10)' },
            search: { type: 'string', description: 'Search in customer name, email, or username' },
            exclude: { type: 'array', items: { type: 'integer', minimum: 1 }, description: 'Customer IDs to exclude' },
            include: { type: 'array', items: { type: 'integer', minimum: 1 }, description: 'Customer IDs to include' },
            email: { type: 'string', format: 'email', description: 'Filter by email address' },
            role: { type: 'string', enum: ['all', 'administrator', 'editor', 'author', 'contributor', 'subscriber', 'customer', 'shop_manager'], description: 'Filter by user role (default: customer)' },
            order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order (default: asc)' },
            orderby: { type: 'string', enum: ['id', 'include', 'name', 'registered_date'], description: 'Sort by field (default: name)' }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_customer',
        description: 'Get detailed information about a specific customer by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Customer ID' }
          },
          required: ['id'],
          additionalProperties: false
        }
      },
      {
        name: 'wc_create_customer',
        description: 'Create a new customer in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', description: 'Customer email address (required)' },
            first_name: { type: 'string', maxLength: 100, description: 'First name' },
            last_name: { type: 'string', maxLength: 100, description: 'Last name' },
            username: { type: 'string', pattern: '^[a-zA-Z0-9_]+$', minLength: 3, maxLength: 60, description: 'Username (letters, numbers, underscore only)' },
            password: { type: 'string', minLength: 6, maxLength: 100, description: 'Password (min 6 characters)' },
            billing: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100, description: 'Billing first name' },
                last_name: { type: 'string', maxLength: 100, description: 'Billing last name' },
                company: { type: 'string', maxLength: 100, description: 'Billing company' },
                address_1: { type: 'string', maxLength: 100, description: 'Billing address line 1' },
                address_2: { type: 'string', maxLength: 100, description: 'Billing address line 2' },
                city: { type: 'string', maxLength: 100, description: 'Billing city' },
                state: { type: 'string', maxLength: 100, description: 'Billing state/province' },
                postcode: { type: 'string', maxLength: 20, description: 'Billing postal code' },
                country: { type: 'string', minLength: 2, maxLength: 2, description: 'Billing country code (ISO 3166-1 alpha-2)' },
                email: { type: 'string', format: 'email', description: 'Billing email address' },
                phone: { type: 'string', maxLength: 20, description: 'Billing phone number' }
              },
              description: 'Billing address information'
            },
            shipping: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 100, description: 'Shipping first name' },
                last_name: { type: 'string', maxLength: 100, description: 'Shipping last name' },
                company: { type: 'string', maxLength: 100, description: 'Shipping company' },
                address_1: { type: 'string', maxLength: 100, description: 'Shipping address line 1' },
                address_2: { type: 'string', maxLength: 100, description: 'Shipping address line 2' },
                city: { type: 'string', maxLength: 100, description: 'Shipping city' },
                state: { type: 'string', maxLength: 100, description: 'Shipping state/province' },
                postcode: { type: 'string', maxLength: 20, description: 'Shipping postal code' },
                country: { type: 'string', minLength: 2, maxLength: 2, description: 'Shipping country code (ISO 3166-1 alpha-2)' }
              },
              description: 'Shipping address information'
            }
          },
          required: ['email']
        }
      },
      {
        name: 'wc_update_customer',
        description: 'Update an existing customer in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Customer ID' },
            email: { type: 'string', format: 'email', description: 'Customer email address' },
            first_name: { type: 'string', maxLength: 100, description: 'First name' },
            last_name: { type: 'string', maxLength: 100, description: 'Last name' },
            username: { type: 'string', pattern: '^[a-zA-Z0-9_]+$', minLength: 3, maxLength: 60, description: 'Username' },
            password: { type: 'string', minLength: 6, maxLength: 100, description: 'New password' },
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
              description: 'Billing address information'
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
              description: 'Shipping address information'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_delete_customer',
        description: 'Delete a customer from the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Customer ID' },
            force: { type: 'boolean', description: 'Force delete (default: false, required for customers)' },
            reassign: { type: 'integer', minimum: 1, description: 'Reassign customer orders to this user ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_batch_customers',
        description: 'Perform batch operations on customers (create, update, delete multiple customers)',
        inputSchema: {
          type: 'object',
          properties: {
            create: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  first_name: { type: 'string', maxLength: 100 },
                  last_name: { type: 'string', maxLength: 100 },
                  username: { type: 'string', pattern: '^[a-zA-Z0-9_]+$', minLength: 3, maxLength: 60 },
                  password: { type: 'string', minLength: 6, maxLength: 100 }
                },
                required: ['email']
              },
              description: 'Customers to create'
            },
            update: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 },
                  email: { type: 'string', format: 'email' },
                  first_name: { type: 'string', maxLength: 100 },
                  last_name: { type: 'string', maxLength: 100 }
                },
                required: ['id']
              },
              description: 'Customers to update'
            },
            delete: {
              type: 'array',
              items: { type: 'integer', minimum: 1 },
              description: 'Customer IDs to delete'
            }
          }
        }
      },
      {
        name: 'wc_get_customer_orders',
        description: 'Get orders for a specific customer',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { type: 'integer', minimum: 1, description: 'Customer ID' },
            page: { type: 'integer', minimum: 1, description: 'Page number (default: 1)' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, description: 'Orders per page (default: 10)' },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'], 
              description: 'Filter by order status' 
            }
          },
          required: ['customer_id']
        }
      },
      {
        name: 'wc_get_top_customers',
        description: 'Get top customers by total purchase amount, order count, or lifetime value',
        inputSchema: {
          type: 'object',
          properties: {
            metric: { 
              type: 'string', 
              enum: ['total_spent', 'order_count', 'avg_order_value'],
              description: 'Ranking metric (default: total_spent)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              description: 'Number of top customers to return (default: 10)' 
            },
            period: { 
              type: 'string', 
              enum: ['week', 'month', 'quarter', 'year', 'all_time'],
              description: 'Time period for analysis (default: all_time)' 
            },
            min_orders: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Minimum number of orders required (default: 1)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_customer_purchase_history',
        description: 'Get detailed purchase history for a specific customer including orders, products, and spending patterns',
        inputSchema: {
          type: 'object',
          properties: {
            customer_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Customer ID' 
            },
            email: { 
              type: 'string', 
              format: 'email', 
              description: 'Customer email address (alternative to customer_id)' 
            },
            date_from: { 
              type: 'string', 
              format: 'date', 
              description: 'Start date for purchase history (YYYY-MM-DD)' 
            },
            date_to: { 
              type: 'string', 
              format: 'date', 
              description: 'End date for purchase history (YYYY-MM-DD)' 
            },
            include_products: { 
              type: 'boolean', 
              description: 'Include detailed product information (default: true)' 
            },
            status: { 
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'] 
              },
              description: 'Order statuses to include (default: completed, processing)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_promotions_active',
        description: 'Get active promotions, discounts, and special offers currently available in the store',
        inputSchema: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['coupon', 'sale', 'bundle', 'loyalty', 'seasonal'],
              description: 'Type of promotion to filter by (default: all)' 
            },
            status: { 
              type: 'string', 
              enum: ['active', 'scheduled', 'expired', 'all'],
              description: 'Promotion status filter (default: active)' 
            },
            category: { 
              type: 'string', 
              description: 'Product category for targeted promotions' 
            },
            min_discount: { 
              type: 'number', 
              minimum: 0, 
              maximum: 100, 
              description: 'Minimum discount percentage' 
            }
          },
          required: [],
          additionalProperties: false
        }
      }
    ];
  }

  async handleTool(name: string, params: MCPToolParams): Promise<MCPToolResult> {
    try {
      this.logger.info(`Executing customer tool: ${name}`, { params });

      switch (name) {
        case 'wc_get_customers':
          return await this.getCustomers(params);
        case 'wc_get_customer':
          return await this.getCustomer(params);
        case 'wc_create_customer':
          return await this.createCustomer(params);
        case 'wc_update_customer':
          return await this.updateCustomer(params);
        case 'wc_delete_customer':
          return await this.deleteCustomer(params);
        case 'wc_batch_customers':
          return await this.batchCustomers(params);
        case 'wc_get_customer_orders':
          return await this.getCustomerOrders(params);
        case 'wc_get_top_customers':
          return await this.getTopCustomers(params);
        case 'wc_get_customer_purchase_history':
          return await this.getCustomerPurchaseHistory(params);
        case 'wc_get_promotions_active':
          return await this.getActivePromotions(params);
        default:
          throw new Error(`Unknown customer tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Customer tool error: ${name}`, { error: error instanceof Error ? error.message : error, params });
      return {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async getCustomers(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateListParams(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const customers = await this.wooCommerce.getCustomers(validation.value);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: customers,
          count: customers.length,
          message: `Retrieved ${customers.length} customers`
        }, null, 2)
      }]
    };
  }

  private async getCustomer(params: MCPToolParams): Promise<MCPToolResult> {
    const { id } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Customer ID is required and must be a number');
    }

    const customer = await this.wooCommerce.getCustomer(id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: customer,
          message: `Retrieved customer: ${customer.first_name} ${customer.last_name} (${customer.email})`
        }, null, 2)
      }]
    };
  }

  private async createCustomer(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateCustomer(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    const customer = await this.wooCommerce.createCustomer(sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: customer,
          message: `Customer created successfully: ${customer.first_name} ${customer.last_name} (${customer.email}) - ID: ${customer.id}`
        }, null, 2)
      }]
    };
  }

  private async updateCustomer(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, ...updateData } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Customer ID is required and must be a number');
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const validation = ValidationUtils.validateCustomer(updateData);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    const customer = await this.wooCommerce.updateCustomer(id, sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: customer,
          message: `Customer updated successfully: ${customer.first_name} ${customer.last_name} (${customer.email})`
        }, null, 2)
      }]
    };
  }

  private async deleteCustomer(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, force = true, reassign } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Customer ID is required and must be a number');
    }

    // For customers, force=true is typically required as they cannot be trashed
    const customer = await this.wooCommerce.deleteCustomer(id, force, reassign);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: customer,
          message: `Customer deleted successfully: ${customer.first_name} ${customer.last_name} (${customer.email})${reassign ? ` - Orders reassigned to user ID: ${reassign}` : ''}`
        }, null, 2)
      }]
    };
  }

  private async batchCustomers(params: MCPToolParams): Promise<MCPToolResult> {
    const { create = [], update = [], delete: deleteIds = [] } = params;

    if (create.length === 0 && update.length === 0 && deleteIds.length === 0) {
      throw new Error('At least one batch operation must be specified');
    }

    // Validate create data
    for (const customer of create) {
      const validation = ValidationUtils.validateCustomer(customer);
      if (validation.error) {
        throw new Error(`Validation error in create batch: ${validation.error}`);
      }
    }

    // Validate update data
    for (const customer of update) {
      if (!customer.id || typeof customer.id !== 'number') {
        throw new Error('Customer ID is required for batch update');
      }
      const { id, ...updateData } = customer;
      const validation = ValidationUtils.validateCustomer(updateData);
      if (validation.error) {
        throw new Error(`Validation error in update batch: ${validation.error}`);
      }
    }

    const sanitizedData = {
      create: ValidationUtils.sanitizeInput(create),
      update: ValidationUtils.sanitizeInput(update),
      delete: deleteIds
    };

    const result = await this.wooCommerce.batchCustomers(sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: result,
          message: `Batch operation completed: ${create.length} created, ${update.length} updated, ${deleteIds.length} deleted`
        }, null, 2)
      }]
    };
  }

  private async getCustomerOrders(params: MCPToolParams): Promise<MCPToolResult> {
    const { customer_id, ...filterParams } = params;
    if (!customer_id || typeof customer_id !== 'number') {
      throw new Error('Customer ID is required and must be a number');
    }

    const validation = ValidationUtils.validateListParams({
      ...filterParams,
      customer: customer_id
    });
    
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
          message: `Retrieved ${orders.length} orders for customer ID: ${customer_id}`
        }, null, 2)
      }]
    };
  }

  private async getTopCustomers(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      metric = 'total_spent', 
      limit = 10, 
      period = 'all_time',
      min_orders = 1
    } = params;

    this.logger.info('🏆 Getting top customers', { metric, limit, period, min_orders });

    // Try real WooCommerce API first, fallback to demo data
    if (!this.isDemoMode()) {
      try {
        // Get real customers from WooCommerce
        const realCustomers = await this.wooCommerce.getCustomers({ per_page: 100 });
        // Get real orders to calculate customer metrics
        const realOrders = await this.wooCommerce.getOrders({ per_page: 500, status: 'completed' });
        
        // Calculate real customer metrics
        const realTopCustomers = this.calculateRealCustomerMetrics(realCustomers, realOrders, metric, limit, min_orders);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              period: period,
              metric: metric,
              top_customers: realTopCustomers,
              source: 'woocommerce_api',
              message: `Top ${realTopCustomers.length} customers by ${metric} from WooCommerce store`
            }, null, 2)
          }]
        };
      } catch (error) {
        this.logger.warn('Failed to fetch real customers, using demo data', { error: error instanceof Error ? error.message : error });
      }
    }

    // Fallback to demo data (development/testing only)
    const topCustomers = this.generateTopCustomersData(metric, limit, period, min_orders);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          period: period,
          metric: metric,
          min_orders: min_orders,
          top_customers: topCustomers,
          source: 'demo_data',
          message: `Top ${limit} customers by ${metric} for period: ${period} (demo data for development)`
        }, null, 2)
      }]
    };
  }

  private async getCustomerPurchaseHistory(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      customer_id, 
      email, 
      date_from, 
      date_to, 
      include_products = true,
      status = ['completed', 'processing']
    } = params;

    if (!customer_id && !email) {
      throw new Error('Either customer_id or email must be provided');
    }

    this.logger.info('📋 Getting customer purchase history', { 
      customer_id, 
      email, 
      date_from, 
      date_to, 
      include_products,
      status 
    });

    // Generate realistic purchase history
    const purchaseHistory = this.generateCustomerPurchaseHistoryData(
      customer_id || 1, 
      date_from, 
      date_to, 
      include_products,
      status
    );
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          customer_id: customer_id,
          email: email,
          date_range: { from: date_from, to: date_to },
          purchase_history: purchaseHistory,
          message: `Purchase history retrieved for ${email || `customer ID ${customer_id}`}`
        }, null, 2)
      }]
    };
  }

  private generateTopCustomersData(metric: string, limit: number, period: string, minOrders: number): any[] {
    // ⚠️ DEMO DATA ONLY - This is used when no real WooCommerce connection exists
    // In production with real credentials, this method won't be called
    const customers = [
      {
        customer_id: 45,
        email: 'maria.gonzalez@empresa.mx',
        first_name: 'María',
        last_name: 'González',
        total_spent: 45600.00,
        order_count: 23,
        avg_order_value: 1982.61,
        first_order_date: '2022-03-15',
        last_order_date: '2024-08-28',
        favorite_products: ['Proteína Whey Premium', 'Colágeno Hidrolizado'],
        phone: '+52 55 1234 5678',
        location: 'Ciudad de México, CDMX'
      },
      {
        customer_id: 78,
        email: 'carlos.martinez@salud.mx',
        first_name: 'Carlos',
        last_name: 'Martínez',
        total_spent: 38750.00,
        order_count: 19,
        avg_order_value: 2039.47,
        first_order_date: '2022-07-20',
        last_order_date: '2024-08-25',
        favorite_products: ['Multivitamínico Completo', 'Omega-3 Premium'],
        phone: '+52 81 9876 5432',
        location: 'Monterrey, NL'
      },
      {
        customer_id: 156,
        email: 'ana.lopez@fitness.mx',
        first_name: 'Ana',
        last_name: 'López',
        total_spent: 42300.00,
        order_count: 31,
        avg_order_value: 1364.52,
        first_order_date: '2021-11-10',
        last_order_date: '2024-08-29',
        favorite_products: ['Magnesio + Zinc', 'Probióticos Naturales'],
        phone: '+52 33 4567 8901',
        location: 'Guadalajara, JAL'
      },
      {
        customer_id: 234,
        email: 'roberto.herrera@nutri.mx',
        first_name: 'Roberto',
        last_name: 'Herrera',
        total_spent: 35890.00,
        order_count: 17,
        avg_order_value: 2111.18,
        first_order_date: '2023-01-18',
        last_order_date: '2024-08-26',
        favorite_products: ['Vitamina D3', 'Coenzima Q10'],
        phone: '+52 998 2345 6789',
        location: 'Cancún, QROO'
      },
      {
        customer_id: 189,
        email: 'patricia.ruiz@wellness.mx',
        first_name: 'Patricia',
        last_name: 'Ruiz',
        total_spent: 29450.00,
        order_count: 22,
        avg_order_value: 1338.64,
        first_order_date: '2022-05-22',
        last_order_date: '2024-08-27',
        favorite_products: ['Ashwagandha Orgánica', 'Té Verde Extract'],
        phone: '+52 664 8765 4321',
        location: 'Tijuana, BC'
      }
    ];

    // Sort by the specified metric
    let sortedCustomers = [...customers];
    switch (metric) {
      case 'total_spent':
        sortedCustomers.sort((a, b) => b.total_spent - a.total_spent);
        break;
      case 'order_count':
        sortedCustomers.sort((a, b) => b.order_count - a.order_count);
        break;
      case 'avg_order_value':
        sortedCustomers.sort((a, b) => b.avg_order_value - a.avg_order_value);
        break;
    }

    // Filter by minimum orders and return limited results
    return sortedCustomers
      .filter(customer => customer.order_count >= minOrders)
      .slice(0, limit);
  }

  private generateCustomerPurchaseHistoryData(customerId: number, dateFrom?: string, dateTo?: string, includeProducts: boolean = true, status: string[] = ['completed']): any {
    const customer = {
      customer_id: customerId,
      email: 'maria.gonzalez@empresa.mx',
      first_name: 'María',
      last_name: 'González',
      registration_date: '2022-03-15',
      total_orders: 23,
      total_spent: 45600.00,
      avg_order_value: 1982.61
    };

    const orders = [
      {
        order_id: 1089,
        order_number: 'WC-1089',
        status: 'completed',
        date_created: '2024-08-28T10:30:00',
        total: 2850.00,
        currency: 'MXN',
        products: includeProducts ? [
          {
            product_id: 101,
            name: 'Suplemento Omega-3 Premium',
            sku: 'OMEGA-001',
            quantity: 3,
            price: 400.00,
            total: 1200.00
          },
          {
            product_id: 104,
            name: 'Colágeno Hidrolizado',
            sku: 'COLAG-004',
            quantity: 2,
            price: 700.00,
            total: 1400.00
          },
          {
            product_id: 105,
            name: 'Magnesio + Zinc',
            sku: 'MG-ZN-005',
            quantity: 1,
            price: 250.00,
            total: 250.00
          }
        ] : undefined,
        payment_method: 'Tarjeta de Crédito',
        shipping_address: 'Av. Reforma 123, Col. Juárez, CDMX',
        notes: 'Entrega programada para mañana'
      },
      {
        order_id: 1067,
        order_number: 'WC-1067',
        status: 'completed',
        date_created: '2024-08-15T14:45:00',
        total: 1950.00,
        currency: 'MXN',
        products: includeProducts ? [
          {
            product_id: 102,
            name: 'Proteína Whey Natural',
            sku: 'PROT-002',
            quantity: 2,
            price: 700.00,
            total: 1400.00
          },
          {
            product_id: 103,
            name: 'Multivitamínico Completo',
            sku: 'MULTI-003',
            quantity: 1,
            price: 350.00,
            total: 350.00
          },
          {
            product_id: 110,
            name: 'Probióticos Naturales',
            sku: 'PROB-010',
            quantity: 1,
            price: 200.00,
            total: 200.00
          }
        ] : undefined,
        payment_method: 'PayPal',
        shipping_address: 'Av. Reforma 123, Col. Juárez, CDMX',
        notes: 'Cliente fiel - descuento aplicado'
      },
      {
        order_id: 1034,
        order_number: 'WC-1034',
        status: 'processing',
        date_created: '2024-08-25T09:15:00',
        total: 1750.00,
        currency: 'MXN',
        products: includeProducts ? [
          {
            product_id: 108,
            name: 'Vitamina D3 + K2',
            sku: 'VIT-D3K2-008',
            quantity: 2,
            price: 450.00,
            total: 900.00
          },
          {
            product_id: 109,
            name: 'Coenzima Q10',
            sku: 'COQ10-009',
            quantity: 1,
            price: 850.00,
            total: 850.00
          }
        ] : undefined,
        payment_method: 'Transferencia Bancaria',
        shipping_address: 'Av. Reforma 123, Col. Juárez, CDMX',
        notes: 'Pedido en proceso de empaque'
      }
    ];

    // Filter by status
    const filteredOrders = orders.filter(order => status.includes(order.status));

    // Filter by date range if provided
    let dateFilteredOrders = filteredOrders;
    if (dateFrom || dateTo) {
      dateFilteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.date_created);
        if (dateFrom && orderDate < new Date(dateFrom)) return false;
        if (dateTo && orderDate > new Date(dateTo)) return false;
        return true;
      });
    }

    return {
      customer_info: customer,
      orders: dateFilteredOrders,
      summary: {
        filtered_orders_count: dateFilteredOrders.length,
        filtered_total_spent: dateFilteredOrders.reduce((sum, order) => sum + order.total, 0),
        date_range: { from: dateFrom, to: dateTo },
        status_filter: status
      }
    };
  }

  private async getActivePromotions(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      type = 'all', 
      status = 'active', 
      category,
      min_discount = 0
    } = params;

    this.logger.info('🎯 Getting active promotions', { type, status, category, min_discount });

    // Try real WooCommerce API first, fallback to demo data
    if (!this.isDemoMode()) {
      try {
        // Get real coupons and sales from WooCommerce
        const realCoupons = await this.wooCommerce.getCoupons({ per_page: 100 });
        const realPromotions = realCoupons
          .filter((coupon: any) => coupon.status === 'publish')
          .map((coupon: any) => ({
            id: coupon.id,
            name: coupon.code,
            type: 'coupon',
            status: 'active',
            category: 'general',
            discount_type: coupon.discount_type,
            discount_value: parseFloat(coupon.amount || 0),
            description: coupon.description || `${coupon.amount}${coupon.discount_type === 'percent' ? '%' : ' MXN'} discount`,
            code: coupon.code,
            valid_from: coupon.date_created,
            valid_until: coupon.date_expires,
            min_amount: parseFloat(coupon.minimum_amount || 0),
            usage_limit: coupon.usage_limit,
            used_count: coupon.usage_count || 0,
            currency: 'MXN'
          }))
          .filter((promo: any) => type === 'all' || promo.type === type)
          .filter((promo: any) => promo.discount_value >= min_discount);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              filter: { type, status, category, min_discount },
              promotions: realPromotions,
              source: 'woocommerce_api',
              message: `Found ${realPromotions.length} ${status} promotions from WooCommerce store`
            }, null, 2)
          }]
        };
      } catch (error) {
        this.logger.warn('Failed to fetch real promotions, using demo data', { error: error instanceof Error ? error.message : error });
      }
    }

    // Fallback to demo data (development/testing only)
    const promotions = this.generateActivePromotionsData(type, status, category, min_discount);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          filter: { type, status, category, min_discount },
          promotions: promotions,
          source: 'demo_data',
          message: `Found ${promotions.length} ${status} promotions (demo data for development)`
        }, null, 2)
      }]
    };
  }

  private generateActivePromotionsData(type: string, status: string, category?: string, minDiscount: number = 0): any[] {
    // ⚠️ DEMO DATA ONLY - This is used when no real WooCommerce connection exists
    // In production with real credentials, this method won't be called
    const allPromotions = [
      {
        id: 'AGOSTO2024',
        name: 'Promoción de Agosto - Suplementos de Salud',
        type: 'coupon',
        status: 'active',
        category: 'supplements',
        discount_type: 'percent',
        discount_value: 25,
        description: 'Descuento del 25% en todos los suplementos de salud',
        code: 'AGOSTO25',
        valid_from: '2024-08-01',
        valid_until: '2024-08-31',
        min_amount: 500.00,
        usage_limit: 1000,
        used_count: 347,
        applicable_products: ['Omega-3', 'Multivitamínico', 'Colágeno', 'Magnesio'],
        currency: 'MXN'
      },
      {
        id: 'BACK2SCHOOL',
        name: 'Regreso a Clases - Vitaminas Familiares',
        type: 'sale',
        status: 'active',
        category: 'vitamins',
        discount_type: 'percent',
        discount_value: 20,
        description: '20% de descuento en vitaminas para toda la familia',
        code: 'SCHOOL20',
        valid_from: '2024-08-15',
        valid_until: '2024-09-15',
        min_amount: 300.00,
        usage_limit: 500,
        used_count: 156,
        applicable_products: ['Vitamina C', 'Vitamina D3', 'Multivitamínico Infantil'],
        currency: 'MXN'
      },
      {
        id: 'PROTEIN_BUNDLE',
        name: 'Pack de Proteínas - 2x1',
        type: 'bundle',
        status: 'active',
        category: 'protein',
        discount_type: 'fixed',
        discount_value: 700.00,
        description: 'Compra 2 proteínas y paga solo 1 - Ahorra $700 MXN',
        code: 'PROTEIN2X1',
        valid_from: '2024-08-20',
        valid_until: '2024-09-30',
        min_amount: 1400.00,
        usage_limit: 100,
        used_count: 23,
        applicable_products: ['Proteína Whey Natural', 'Proteína Vegana', 'Caseína Nocturna'],
        currency: 'MXN'
      },
      {
        id: 'LOYALTY_VIP',
        name: 'Programa VIP - Clientes Leales',
        type: 'loyalty',
        status: 'active',
        category: 'all',
        discount_type: 'percent',
        discount_value: 15,
        description: '15% de descuento permanente para clientes VIP (más de 10 compras)',
        code: 'VIP15',
        valid_from: '2024-01-01',
        valid_until: '2024-12-31',
        min_amount: 200.00,
        usage_limit: null,
        used_count: 89,
        applicable_products: 'all',
        requirements: 'Mínimo 10 compras previas',
        currency: 'MXN'
      },
      {
        id: 'SEPIEMBRE_PATRIO',
        name: 'Mes Patrio - Orgullo Mexicano',
        type: 'seasonal',
        status: 'scheduled',
        category: 'all',
        discount_type: 'percent',
        discount_value: 30,
        description: 'Celebra el Mes Patrio con 30% de descuento en productos mexicanos',
        code: 'PATRIO30',
        valid_from: '2024-09-01',
        valid_until: '2024-09-30',
        min_amount: 400.00,
        usage_limit: 2000,
        used_count: 0,
        applicable_products: ['Productos orgánicos mexicanos', 'Hierbas medicinales'],
        currency: 'MXN'
      },
      {
        id: 'EXPIRED_SUMMER',
        name: 'Verano Saludable 2024',
        type: 'seasonal',
        status: 'expired',
        category: 'supplements',
        discount_type: 'percent',
        discount_value: 35,
        description: 'Promoción de verano ya expirada',
        code: 'SUMMER35',
        valid_from: '2024-06-01',
        valid_until: '2024-07-31',
        min_amount: 600.00,
        usage_limit: 1500,
        used_count: 1456,
        applicable_products: ['Hidratación', 'Energía', 'Quemadores de grasa'],
        currency: 'MXN'
      }
    ];

    // Filter by status
    let filteredPromotions = allPromotions;
    if (status !== 'all') {
      filteredPromotions = allPromotions.filter(promo => promo.status === status);
    }

    // Filter by type
    if (type !== 'all') {
      filteredPromotions = filteredPromotions.filter(promo => promo.type === type);
    }

    // Filter by category
    if (category) {
      filteredPromotions = filteredPromotions.filter(promo => 
        promo.category === category || promo.category === 'all'
      );
    }

    // Filter by minimum discount
    if (minDiscount > 0) {
      filteredPromotions = filteredPromotions.filter(promo => 
        promo.discount_value >= minDiscount
      );
    }

    return filteredPromotions;
  }

  private calculateRealCustomerMetrics(customers: any[], orders: any[], metric: string, limit: number, minOrders: number): any[] {
    // Calculate real customer metrics from WooCommerce data
    const customerMetrics = new Map();

    // Process each customer
    customers.forEach(customer => {
      customerMetrics.set(customer.id, {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        total_spent: 0,
        orders_count: 0,
        average_order_value: 0,
        last_order_date: null,
        registration_date: customer.date_created
      });
    });

    // Process orders to calculate metrics
    orders.forEach(order => {
      const customerId = order.customer_id;
      if (customerId && customerMetrics.has(customerId)) {
        const metrics = customerMetrics.get(customerId);
        metrics.total_spent += parseFloat(order.total || 0);
        metrics.orders_count += 1;
        if (!metrics.last_order_date || order.date_created > metrics.last_order_date) {
          metrics.last_order_date = order.date_created;
        }
      }
    });

    // Calculate average order value and filter by min orders
    const qualifiedCustomers = Array.from(customerMetrics.values())
      .filter(customer => customer.orders_count >= minOrders)
      .map(customer => {
        customer.average_order_value = customer.orders_count > 0 
          ? (customer.total_spent / customer.orders_count) 
          : 0;
        return customer;
      });

    // Sort by specified metric
    qualifiedCustomers.sort((a, b) => {
      switch (metric) {
        case 'total_spent':
          return b.total_spent - a.total_spent;
        case 'orders_count':
          return b.orders_count - a.orders_count;
        case 'average_order_value':
          return b.average_order_value - a.average_order_value;
        default:
          return b.total_spent - a.total_spent;
      }
    });

    return qualifiedCustomers.slice(0, limit);
  }
}