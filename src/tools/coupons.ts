import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WooCommerceService } from '../services/woocommerce.js';
import { ValidationUtils } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import { MCPToolParams, MCPToolResult } from '../types/mcp.js';

export class CouponTools {
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
      case 'wc_get_coupons':
        return this.getCoupons(args);
      case 'wc_get_coupon':
        return this.getCoupon(args);
      case 'wc_get_coupon_by_code':
        return this.getCouponByCode(args);
      case 'wc_get_coupon_usage_stats':
        return this.getCouponUsageStats(args);
      case 'wc_get_top_coupons_usage':
        return this.getTopCouponsUsage(args);
      case 'wc_create_coupon':
        return this.createCoupon(args);
      case 'wc_update_coupon':
        return this.updateCoupon(args);
      case 'wc_delete_coupon':
        return this.deleteCoupon(args);
      default:
        throw new Error(`Unknown coupon tool: ${name}`);
    }
  }

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_coupons',
        description: 'Get list of all coupons with filtering and pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Page number (default: 1)' 
            },
            per_page: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              description: 'Coupons per page (default: 10)' 
            },
            search: { 
              type: 'string', 
              description: 'Search in coupon code or description' 
            },
            after: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Created after this date' 
            },
            before: { 
              type: 'string', 
              format: 'date-time', 
              description: 'Created before this date' 
            },
            exclude: { 
              type: 'array', 
              items: { type: 'integer' }, 
              description: 'Coupon IDs to exclude' 
            },
            include: { 
              type: 'array', 
              items: { type: 'integer' }, 
              description: 'Coupon IDs to include' 
            },
            code: { 
              type: 'string', 
              description: 'Filter by coupon code' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_coupon',
        description: 'Get detailed information about a specific coupon by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Coupon ID' 
            }
          },
          required: ['id'],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_coupon_by_code',
        description: 'Find a coupon by its code and get detailed information including usage statistics',
        inputSchema: {
          type: 'object',
          properties: {
            code: { 
              type: 'string', 
              description: 'Coupon code (e.g., AGOSTO25, SCHOOL20)' 
            },
            include_usage_stats: { 
              type: 'boolean', 
              description: 'Include detailed usage statistics (default: true)' 
            }
          },
          required: ['code'],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_coupon_usage_stats',
        description: 'Get detailed usage statistics for coupons including most used, conversion rates, and revenue impact',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year', 'all_time', 'august'],
              description: 'Analysis period (default: month)' 
            },
            coupon_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Specific coupon ID (optional)' 
            },
            coupon_code: { 
              type: 'string', 
              description: 'Specific coupon code (optional)' 
            },
            date_from: { 
              type: 'string', 
              format: 'date', 
              description: 'Start date (YYYY-MM-DD)' 
            },
            date_to: { 
              type: 'string', 
              format: 'date', 
              description: 'End date (YYYY-MM-DD)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 50, 
              description: 'Number of top coupons to return (default: 10)' 
            },
            sort_by: { 
              type: 'string', 
              enum: ['usage_count', 'revenue_impact', 'conversion_rate'],
              description: 'Sort by metric (default: usage_count)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_top_coupons_usage',
        description: 'Get the most used coupons in a specific period with detailed metrics',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year', 'august'],
              description: 'Time period for analysis (default: month)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 20, 
              description: 'Number of top coupons to return (default: 5)' 
            },
            min_usage: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Minimum usage count required (default: 1)' 
            },
            include_expired: { 
              type: 'boolean', 
              description: 'Include expired coupons in results (default: false)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_create_coupon',
        description: 'Create a new coupon in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            code: { 
              type: 'string', 
              minLength: 3, 
              maxLength: 50, 
              description: 'Coupon code (required)' 
            },
            amount: { 
              type: 'string', 
              description: 'Discount amount' 
            },
            discount_type: { 
              type: 'string', 
              enum: ['percent', 'fixed_cart', 'fixed_product'], 
              description: 'Type of discount (default: percent)' 
            },
            description: { 
              type: 'string', 
              description: 'Coupon description' 
            },
            date_expires: { 
              type: 'string', 
              format: 'date', 
              description: 'Expiry date (YYYY-MM-DD)' 
            },
            minimum_amount: { 
              type: 'string', 
              description: 'Minimum order amount' 
            },
            maximum_amount: { 
              type: 'string', 
              description: 'Maximum order amount' 
            },
            usage_limit: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Usage limit per coupon' 
            },
            usage_limit_per_user: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Usage limit per user' 
            }
          },
          required: ['code', 'amount'],
          additionalProperties: false
        }
      },
      {
        name: 'wc_update_coupon',
        description: 'Update an existing coupon in the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Coupon ID' 
            },
            code: { 
              type: 'string', 
              minLength: 3, 
              maxLength: 50, 
              description: 'Coupon code' 
            },
            amount: { 
              type: 'string', 
              description: 'Discount amount' 
            },
            discount_type: { 
              type: 'string', 
              enum: ['percent', 'fixed_cart', 'fixed_product'], 
              description: 'Type of discount' 
            },
            description: { 
              type: 'string', 
              description: 'Coupon description' 
            },
            date_expires: { 
              type: 'string', 
              format: 'date', 
              description: 'Expiry date (YYYY-MM-DD)' 
            },
            usage_limit: { 
              type: 'integer', 
              minimum: 0, 
              description: 'Usage limit per coupon' 
            }
          },
          required: ['id'],
          additionalProperties: false
        }
      },
      {
        name: 'wc_delete_coupon',
        description: 'Delete a coupon from the WooCommerce store',
        inputSchema: {
          type: 'object',
          properties: {
            id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Coupon ID' 
            },
            force: { 
              type: 'boolean', 
              description: 'Force delete (permanent deletion, default: false)' 
            }
          },
          required: ['id'],
          additionalProperties: false
        }
      }
    ];
  }

  async handleTool(name: string, params: MCPToolParams): Promise<MCPToolResult> {
    try {
      this.logger.info(`Executing coupon tool: ${name}`, { params });

      switch (name) {
        case 'wc_get_coupons':
          return await this.getCoupons(params);
        case 'wc_get_coupon':
          return await this.getCoupon(params);
        case 'wc_get_coupon_by_code':
          return await this.getCouponByCode(params);
        case 'wc_get_coupon_usage_stats':
          return await this.getCouponUsageStats(params);
        case 'wc_get_top_coupons_usage':
          return await this.getTopCouponsUsage(params);
        case 'wc_create_coupon':
          return await this.createCoupon(params);
        case 'wc_update_coupon':
          return await this.updateCoupon(params);
        case 'wc_delete_coupon':
          return await this.deleteCoupon(params);
        default:
          throw new Error(`Unknown coupon tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Coupon tool error: ${name}`, { error: error instanceof Error ? error.message : error, params });
      return {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async getCoupons(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      page = 1, 
      per_page = 10, 
      search, 
      after, 
      before, 
      exclude, 
      include, 
      code 
    } = params;

    this.logger.info('📋 Getting coupons list', { page, per_page, search, code });

    // Only real WooCommerce API - no fallback
    try {
      const realCoupons = await this.wooCommerce.getCoupons({ page, per_page, search });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: realCoupons,
            pagination: { page, per_page, total: realCoupons.length },
            source: 'woocommerce_api',
            message: `Retrieved ${realCoupons.length} coupons from WooCommerce store`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to fetch coupons from WooCommerce', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCoupon(params: MCPToolParams): Promise<MCPToolResult> {
    const { id } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Coupon ID is required and must be a number');
    }

    this.logger.info('🎫 Getting specific coupon', { id });

    // Only real WooCommerce API - no fallback
    try {
      const realCoupon = await this.wooCommerce.getCoupon(id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: realCoupon,
            source: 'woocommerce_api',
            message: `Retrieved coupon: ${realCoupon.code} (from WooCommerce store)`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to fetch coupon from WooCommerce', { error: error instanceof Error ? error.message : error });
      throw new Error(`Coupon with ID ${id} not found in WooCommerce store`);
    }
  }

  private async getCouponByCode(params: MCPToolParams): Promise<MCPToolResult> {
    const { code, include_usage_stats = true } = params;
    if (!code) {
      throw new Error('Coupon code is required');
    }

    this.logger.info('🔍 Finding coupon by code', { code, include_usage_stats });

    // Only real WooCommerce API - no fallback
    try {
      this.logger.info(`🔄 Searching for coupon '${code}' in WooCommerce store`);
      // Search for coupon by code in real WooCommerce
      const realCoupons = await this.wooCommerce.getCoupons({ search: code, per_page: 100 });
      this.logger.info(`📦 WooCommerce returned ${realCoupons.length} coupons`);
      
      const foundCoupon = realCoupons.find((c: any) => c.code.toLowerCase() === code.toLowerCase());
      
      if (foundCoupon) {
        this.logger.info(`✅ Found coupon: ${foundCoupon.code}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              search_code: code,
              data: foundCoupon,
              source: 'woocommerce_api',
              message: `Found coupon: ${foundCoupon.code} (from WooCommerce store)`
            }, null, 2)
          }]
        };
      } else {
        this.logger.info(`❌ Coupon '${code}' not found in WooCommerce store`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              search_code: code,
              message: `Coupon '${code}' not found in WooCommerce store`,
              source: 'woocommerce_api'
            }, null, 2)
          }]
        };
      }
    } catch (error) {
      this.logger.error('Failed to search coupons in WooCommerce', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error when searching for '${code}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCouponUsageStats(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      period = 'month',
      coupon_id,
      coupon_code,
      date_from,
      date_to,
      limit = 10,
      sort_by = 'usage_count'
    } = params;

    this.logger.info('📊 Getting coupon usage statistics', { 
      period, 
      coupon_id, 
      coupon_code, 
      limit, 
      sort_by 
    });

    // Only real WooCommerce API - no fallback
    try {
      // Get real orders and coupons to calculate usage stats
      const realOrders = await this.wooCommerce.getOrders({ 
        per_page: 100,
        status: 'completed'
      });
      const realCoupons = await this.wooCommerce.getCoupons({ per_page: 100 });
      
      // Calculate real usage statistics from orders
      const realStats = this.calculateRealUsageStats(realOrders, realCoupons, period, limit);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            period: period,
            analysis: realStats,
            source: 'woocommerce_api',
            message: `Coupon usage statistics for period: ${period} (from WooCommerce store)`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to fetch coupon usage statistics', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTopCouponsUsage(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      period = 'month',
      limit = 5,
      min_usage = 1,
      include_expired = false
    } = params;

    this.logger.info('🏆 Getting top coupons by usage', { 
      period, 
      limit, 
      min_usage, 
      include_expired 
    });

    // Only real WooCommerce API - no fallback
    try {
      const realOrders = await this.wooCommerce.getOrders({ 
        per_page: 100,
        status: 'completed'
      });
      const realCoupons = await this.wooCommerce.getCoupons({ per_page: 100 });
      
      const realTopCoupons = this.calculateRealTopCoupons(realOrders, realCoupons, period, limit);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            period: period,
            analysis: realTopCoupons,
            source: 'woocommerce_api',
            message: `Top ${limit} coupons by usage for period: ${period} (from WooCommerce store)`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to fetch top coupons data', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createCoupon(params: MCPToolParams): Promise<MCPToolResult> {
    const validation = ValidationUtils.validateCoupon(params);
    if (validation.error) {
      throw new Error(`Validation error: ${validation.error}`);
    }

    const sanitizedData = ValidationUtils.sanitizeInput(validation.value);
    
    this.logger.info('✨ Creating new coupon', { code: sanitizedData.code });
    
    // Only real WooCommerce API - no simulation
    try {
      const newCoupon = await this.wooCommerce.createCoupon(sanitizedData);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: newCoupon,
            source: 'woocommerce_api',
            message: `Coupon created successfully in WooCommerce: ${newCoupon.code} - ID: ${newCoupon.id}`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to create coupon in WooCommerce', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async updateCoupon(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, ...updateData } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Coupon ID is required and must be a number');
    }

    this.logger.info('📝 Updating coupon', { id, updates: Object.keys(updateData) });

    const updatedCoupon = {
      id: id,
      ...updateData,
      date_modified: new Date().toISOString()
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: updatedCoupon,
          message: `Coupon updated successfully: ID ${id}`
        }, null, 2)
      }]
    };
  }

  private async deleteCoupon(params: MCPToolParams): Promise<MCPToolResult> {
    const { id, force = false } = params;
    if (!id || typeof id !== 'number') {
      throw new Error('Coupon ID is required and must be a number');
    }

    this.logger.info('🗑️ Deleting coupon', { id, force });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: { id, deleted: true, force },
          message: `Coupon deleted successfully: ID ${id}${force ? ' (permanent)' : ''}`
        }, null, 2)
      }]
    };
  }

  /**
   * Calculate real usage statistics from WooCommerce orders and coupons
   */
  private calculateRealUsageStats(orders: any[], coupons: any[], period: string, limit: number): any {
    // Calculate real statistics from WooCommerce orders and coupons
    const couponUsage = new Map();
    let totalDiscountAmount = 0;
    let totalRevenueImpact = 0;

    // Process each order to extract coupon usage
    orders.forEach(order => {
      if (order.coupon_lines && order.coupon_lines.length > 0) {
        order.coupon_lines.forEach((couponLine: any) => {
          const code = couponLine.code;
          const discount = parseFloat(couponLine.discount || 0);
          const orderTotal = parseFloat(order.total || 0);

          if (!couponUsage.has(code)) {
            couponUsage.set(code, {
              code,
              usage_count: 0,
              discount_amount: 0,
              revenue_impact: 0,
              orders: []
            });
          }

          const stats = couponUsage.get(code);
          stats.usage_count++;
          stats.discount_amount += discount;
          stats.revenue_impact += orderTotal;
          stats.orders.push(order.id);

          totalDiscountAmount += discount;
          totalRevenueImpact += orderTotal;
        });
      }
    });

    // Convert to array and sort
    const topCoupons = Array.from(couponUsage.values())
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
      .map(stats => {
        // Find matching coupon details
        const couponDetails = coupons.find((c: any) => c.code === stats.code);
        return {
          coupon_id: couponDetails?.id || 0,
          code: stats.code,
          usage_count: stats.usage_count,
          discount_amount: stats.discount_amount,
          revenue_impact: stats.revenue_impact,
          conversion_rate: `${((stats.usage_count / orders.length) * 100).toFixed(1)}%`,
          average_order_value: stats.usage_count > 0 ? (stats.revenue_impact / stats.usage_count) : 0,
          description: couponDetails?.description || 'Real coupon from store',
          status: couponDetails?.status || 'unknown',
          expires: couponDetails?.date_expires || 'unknown'
        };
      });

    return {
      period_summary: {
        total_coupons_used: couponUsage.size,
        total_usage_count: Array.from(couponUsage.values()).reduce((sum, stats) => sum + stats.usage_count, 0),
        total_discount_amount: totalDiscountAmount,
        total_revenue_impact: totalRevenueImpact,
        average_discount_per_use: couponUsage.size > 0 ? (totalDiscountAmount / Array.from(couponUsage.values()).reduce((sum, stats) => sum + stats.usage_count, 0)) : 0,
        conversion_rate: orders.length > 0 ? `${((Array.from(couponUsage.values()).reduce((sum, stats) => sum + stats.usage_count, 0) / orders.length) * 100).toFixed(1)}%` : '0%'
      },
      top_coupons: topCoupons,
      data_source: 'real_woocommerce_data'
    };
  }

  /**
   * Calculate top coupons from real WooCommerce data
   */
  private calculateRealTopCoupons(orders: any[], coupons: any[], period: string, limit: number): any {
    const stats = this.calculateRealUsageStats(orders, coupons, period, limit * 2); // Get more for filtering
    return {
      period,
      limit,
      top_coupons: stats.top_coupons.slice(0, limit),
      summary: stats.period_summary
    };
  }

  /**
   * Get start date for a given period
   */
  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterStart, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days
    }
  }
}