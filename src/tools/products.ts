import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WooCommerceService } from '../services/woocommerce.js';
import { ValidationUtils } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import { MCPToolParams, MCPToolResult, ToolCategory } from '../types/mcp.js';

export class ProductTools {
  constructor(
    private wooCommerce: WooCommerceService,
    private logger: Logger
  ) {}

  getToolDefinitions(): any[] {
    return this.getTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'wc_get_products':
        return this.getProducts(args);
      case 'wc_get_product':
        return this.getProduct(args);
      case 'wc_create_product':
        return this.createProduct(args);
      case 'wc_update_product':
        return this.updateProduct(args);
      case 'wc_delete_product':
        return this.deleteProduct(args);
      default:
        throw new Error(`Unknown product tool: ${name}`);
    }
  }

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_products',
        description: 'Retrieve a list of products from WooCommerce store with filtering and pagination options',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1, description: 'Page number for pagination' },
            per_page: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Number of products per page' },
            search: { type: 'string', description: 'Search term for product names and descriptions' },
            category: { type: 'string', description: 'Filter by category slug' },
            tag: { type: 'string', description: 'Filter by tag slug' },
            status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'], description: 'Filter by product status' },
            type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], description: 'Filter by product type' },
            featured: { type: 'boolean', description: 'Filter by featured products' },
            on_sale: { type: 'boolean', description: 'Filter by products on sale' },
            min_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Minimum price filter' },
            max_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Maximum price filter' },
            stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'], description: 'Filter by stock status' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' },
            orderby: { type: 'string', enum: ['date', 'id', 'title', 'slug', 'modified', 'menu_order', 'price', 'popularity', 'rating'], default: 'date', description: 'Sort field' }
          }
        }
      },
      {
        name: 'wc_get_product',
        description: 'Get detailed information about a specific product by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Product ID' }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_create_product',
        description: 'Create a new product in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 255, description: 'Product name' },
            type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], default: 'simple', description: 'Product type' },
            status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'], default: 'publish', description: 'Product status' },
            featured: { type: 'boolean', default: false, description: 'Featured product flag' },
            catalog_visibility: { type: 'string', enum: ['visible', 'catalog', 'search', 'hidden'], default: 'visible', description: 'Catalog visibility' },
            description: { type: 'string', maxLength: 65535, description: 'Product description (HTML allowed)' },
            short_description: { type: 'string', maxLength: 1000, description: 'Short product description' },
            sku: { type: 'string', maxLength: 100, description: 'Stock Keeping Unit' },
            regular_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Regular price' },
            sale_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Sale price' },
            manage_stock: { type: 'boolean', default: false, description: 'Enable stock management' },
            stock_quantity: { type: 'integer', minimum: 0, description: 'Stock quantity' },
            stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'], default: 'instock', description: 'Stock status' },
            backorders: { type: 'string', enum: ['no', 'notify', 'yes'], default: 'no', description: 'Backorder setting' },
            sold_individually: { type: 'boolean', default: false, description: 'Sold individually flag' },
            weight: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Product weight' },
            virtual: { type: 'boolean', default: false, description: 'Virtual product flag' },
            downloadable: { type: 'boolean', default: false, description: 'Downloadable product flag' },
            tax_status: { type: 'string', enum: ['taxable', 'shipping', 'none'], default: 'taxable', description: 'Tax status' },
            tax_class: { type: 'string', description: 'Tax class' },
            reviews_allowed: { type: 'boolean', default: true, description: 'Allow reviews' },
            purchase_note: { type: 'string', maxLength: 1000, description: 'Purchase note' },
            categories: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 }
                },
                required: ['id']
              },
              description: 'Product categories' 
            },
            tags: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 }
                },
                required: ['id']
              },
              description: 'Product tags' 
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  src: { type: 'string', format: 'uri' },
                  name: { type: 'string' },
                  alt: { type: 'string' },
                  position: { type: 'integer', minimum: 0 }
                },
                required: ['src']
              },
              description: 'Product images'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'wc_update_product',
        description: 'Update an existing product in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Product ID' },
            name: { type: 'string', minLength: 1, maxLength: 255, description: 'Product name' },
            type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], description: 'Product type' },
            status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'], description: 'Product status' },
            featured: { type: 'boolean', description: 'Featured product flag' },
            catalog_visibility: { type: 'string', enum: ['visible', 'catalog', 'search', 'hidden'], description: 'Catalog visibility' },
            description: { type: 'string', maxLength: 65535, description: 'Product description (HTML allowed)' },
            short_description: { type: 'string', maxLength: 1000, description: 'Short product description' },
            sku: { type: 'string', maxLength: 100, description: 'Stock Keeping Unit' },
            regular_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Regular price' },
            sale_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$', description: 'Sale price' },
            manage_stock: { type: 'boolean', description: 'Enable stock management' },
            stock_quantity: { type: 'integer', minimum: 0, description: 'Stock quantity' },
            stock_status: { type: 'string', enum: ['instock', 'outofstock', 'onbackorder'], description: 'Stock status' },
            backorders: { type: 'string', enum: ['no', 'notify', 'yes'], description: 'Backorder setting' },
            sold_individually: { type: 'boolean', description: 'Sold individually flag' },
            weight: { type: 'string', pattern: '^\\d+(\\.\\d+)?$', description: 'Product weight' },
            virtual: { type: 'boolean', description: 'Virtual product flag' },
            downloadable: { type: 'boolean', description: 'Downloadable product flag' },
            tax_status: { type: 'string', enum: ['taxable', 'shipping', 'none'], description: 'Tax status' },
            tax_class: { type: 'string', description: 'Tax class' },
            reviews_allowed: { type: 'boolean', description: 'Allow reviews' },
            purchase_note: { type: 'string', maxLength: 1000, description: 'Purchase note' },
            categories: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 }
                },
                required: ['id']
              },
              description: 'Product categories' 
            },
            tags: { 
              type: 'array', 
              items: { 
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 }
                },
                required: ['id']
              },
              description: 'Product tags' 
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  src: { type: 'string', format: 'uri' },
                  name: { type: 'string' },
                  alt: { type: 'string' },
                  position: { type: 'integer', minimum: 0 }
                },
                required: ['src']
              },
              description: 'Product images'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_delete_product',
        description: 'Delete a product from the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'integer', minimum: 1, description: 'Product ID' },
            force: { type: 'boolean', default: false, description: 'Force delete (bypass trash)' }
          },
          required: ['id']
        }
      },
      {
        name: 'wc_batch_products',
        description: 'Perform batch operations on products (create, update, delete multiple products in one request)',
        inputSchema: {
          type: 'object',
          properties: {
            create: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  type: { type: 'string', enum: ['simple', 'grouped', 'external', 'variable'], default: 'simple' },
                  status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'], default: 'publish' },
                  regular_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
                  description: { type: 'string', maxLength: 65535 },
                  short_description: { type: 'string', maxLength: 1000 },
                  sku: { type: 'string', maxLength: 100 }
                },
                required: ['name']
              },
              description: 'Products to create'
            },
            update: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', minimum: 1 },
                  name: { type: 'string', minLength: 1, maxLength: 255 },
                  status: { type: 'string', enum: ['draft', 'pending', 'private', 'publish'] },
                  regular_price: { type: 'string', pattern: '^\\d+(\\.\\d{1,2})?$' },
                  description: { type: 'string', maxLength: 65535 },
                  stock_quantity: { type: 'integer', minimum: 0 }
                },
                required: ['id']
              },
              description: 'Products to update'
            },
            delete: {
              type: 'array',
              items: { type: 'integer', minimum: 1 },
              description: 'Product IDs to delete'
            }
          }
        }
      }
    ];
  }

  async handleTool(name: string, params: MCPToolParams): Promise<MCPToolResult> {
    try {
      this.logger.info(`Executing product tool: ${name}`, { params });

      switch (name) {
        case 'wc_get_products':
          return await this.getProducts(params);
        case 'wc_get_product':
          return await this.getProduct(params);
        case 'wc_create_product':
          return await this.createProduct(params);
        case 'wc_update_product':
          return await this.updateProduct(params);
        case 'wc_delete_product':
          return await this.deleteProduct(params);
        case 'wc_batch_products':
          return await this.batchProducts(params);
        default:
          throw new Error(`Unknown product tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Product tool error: ${name}`, { error: error instanceof Error ? error.message : error, params });
      return {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async getProducts(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateListParams(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const products = await this.wooCommerce.getProducts(validation.value);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: products,
          count: products.length,
          message: `Retrieved ${products.length} products`
        }, null, 2)
      }]
    };
  }

  private async getProduct(params: MCPToolParams): Promise<MCPToolResult> {
    const { id } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    const product = await this.wooCommerce.getProduct(id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: product,
          message: `Retrieved product: ${product.name}`
        }, null, 2)
      }]
    };
  }

  private async createProduct(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateProduct(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    const product = await this.wooCommerce.createProduct(sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: product,
          message: `Product created successfully: ${product.name} (ID: ${product.id})`
        }, null, 2)
      }]
    };
  }

  private async updateProduct(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, ...updateData } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    const validation = ValidationUtils.validateProduct(updateData);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    const product = await this.wooCommerce.updateProduct(id, sanitizedData);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: product,
          message: `Product updated successfully: ${product.name} (ID: ${product.id})`
        }, null, 2)
      }]
    };
  }

  private async deleteProduct(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, force = false } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Product ID is required and must be a number');
    }

    const product = await this.wooCommerce.deleteProduct(id, force);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: product,
          message: `Product ${force ? 'permanently deleted' : 'moved to trash'}: ${product.name} (ID: ${product.id})`
        }, null, 2)
      }]
    };
  }

  private async batchProducts(params: MCPToolParams): Promise<MCPToolResult> {
    const { create = [], update = [], delete: deleteIds = [] } = params;

    if (create.length === 0 && update.length === 0 && deleteIds.length === 0) {
      throw new Error('At least one batch operation must be specified');
    }

    // Validate create data
    for (const product of create) {
      const validation = ValidationUtils.validateProduct(product);
      if (validation.error) {
        throw new Error(`Validation error in create batch: ${validation.error}`);
      }
    }

    // Validate update data
    for (const product of update) {
      if (!product.id || typeof product.id !== 'number') {
        throw new Error('Product ID is required for batch update');
      }
      const { id, ...updateData } = product;
      const validation = ValidationUtils.validateProduct(updateData);
      if (validation.error) {
        throw new Error(`Validation error in update batch: ${validation.error}`);
      }
    }

    const sanitizedData = {
      create: ValidationUtils.sanitizeInput(create),
      update: ValidationUtils.sanitizeInput(update),
      delete: deleteIds
    };

    const result = await this.wooCommerce.batchProducts(sanitizedData);
    
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
}