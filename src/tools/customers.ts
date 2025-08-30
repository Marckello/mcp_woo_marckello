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

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_customers',
        description: 'Retrieve a list of customers from WooCommerce store with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Customers per page' },
            search: { type: 'string', description: 'Search in customer name, email, or username' },
            exclude: { type: 'array', items: { type: 'integer', minimum: 1 }, description: 'Customer IDs to exclude' },
            include: { type: 'array', items: { type: 'integer', minimum: 1 }, description: 'Customer IDs to include' },
            email: { type: 'string', format: 'email', description: 'Filter by email address' },
            role: { type: 'string', enum: ['all', 'administrator', 'editor', 'author', 'contributor', 'subscriber', 'customer', 'shop_manager'], default: 'customer', description: 'Filter by user role' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'asc', description: 'Sort order' },
            orderby: { type: 'string', enum: ['id', 'include', 'name', 'registered_date'], default: 'name', description: 'Sort by field' }
          }
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
          required: ['id']
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
            force: { type: 'boolean', default: false, description: 'Force delete (required for customers, they cannot be trashed)' },
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
            page: { type: 'integer', minimum: 1, default: 1, description: 'Page number' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Orders per page' },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'], 
              description: 'Filter by order status' 
            }
          },
          required: ['customer_id']
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
}