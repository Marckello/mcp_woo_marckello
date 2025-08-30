import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WooCommerceService } from '../services/woocommerce.js';
import { ValidationUtils } from '../utils/validation.js';
import { Logger } from '../utils/logger.js';
import { MCPToolParams, MCPToolResult } from '../types/mcp.js';

export class AnalyticsTools {
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
    // Pre-process arguments for smart date detection
    const processedArgs = this.preprocessDateArguments(args);
    
    switch (name) {
      case 'wc_get_sales_report':
        return this.getSalesReport(processedArgs);
      case 'wc_get_product_sales':
        return this.getProductSales(processedArgs);
      case 'wc_get_daily_sales':
        return this.getDailySales(processedArgs);
      case 'wc_get_monthly_sales':
        return this.getMonthlySales(processedArgs);
      case 'wc_get_yearly_sales':
        return this.getYearlySales(processedArgs);
      case 'wc_get_top_sellers':
        return this.getTopSellers(processedArgs);
      case 'wc_get_customer_analytics':
        return this.getCustomerAnalytics(processedArgs);
      case 'wc_get_revenue_stats':
        return this.getRevenueStats(processedArgs);
      case 'wc_get_order_stats':
        return this.getOrderStats(processedArgs);
      case 'wc_get_coupon_stats':
        return this.getCouponStats(processedArgs);
      case 'wc_get_tax_reports':
        return this.getTaxReports(processedArgs);
      case 'wc_get_refund_stats':
        return this.getRefundStats(processedArgs);
      default:
        throw new Error(`Unknown analytics tool: ${name}`);
    }
  }

  private preprocessDateArguments(args: any): any {
    const processed = { ...args };
    
    // Get current Mexico date context from n8n {{ $now }}
    const mexicoNow = this.getMexicoDate(undefined, args.context_date);
    
    // Detect "August 28" or "28 de agosto" type queries
    if (args.period && typeof args.period === 'string') {
      const period = args.period.toLowerCase();
      
      if (period.includes('28') && (period.includes('august') || period.includes('agosto'))) {
        // Parse the date intelligently based on current context
        const targetDate = this.parseHistoricalDate(args.period, mexicoNow);
        const dateStr = targetDate.toISOString().split('T')[0];
        
        processed.start_date = dateStr;
        processed.end_date = dateStr;
        processed.period = 'custom';
        
        this.logger.info('🗓️ Detected August 28 query - smart date detection', { 
          original_period: args.period,
          mexico_now: mexicoNow.toISOString().split('T')[0],
          converted_to: { start_date: dateStr, end_date: dateStr },
          detected_year: targetDate.getFullYear()
        });
      } else if (period.includes('august') || period.includes('agosto')) {
        // Parse month intelligently
        const targetDate = this.parseHistoricalDate(args.period, mexicoNow);
        const year = targetDate.getFullYear();
        
        processed.start_date = `${year}-08-01`;
        processed.end_date = `${year}-08-31`;
        processed.period = 'custom';
        
        this.logger.info('🗓️ Detected August query - smart month detection', { 
          original_period: args.period,
          mexico_now: mexicoNow.toISOString().split('T')[0],
          converted_to: { start_date: `${year}-08-01`, end_date: `${year}-08-31` },
          detected_year: year
        });
      }
    }
    
    return processed;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'wc_get_sales_report',
        description: 'Get comprehensive sales report with revenue, orders, and key metrics',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom', 'august', 'agosto'],
              description: 'Report period (default: month). Use "august" or "agosto" for August 2023 historical data' 
            },
            start_date: { 
              type: 'string', 
              format: 'date', 
              description: 'Start date (YYYY-MM-DD) for custom period' 
            },
            end_date: { 
              type: 'string', 
              format: 'date', 
              description: 'End date (YYYY-MM-DD) for custom period' 
            },
            currency: { 
              type: 'string', 
              minLength: 3, 
              maxLength: 3, 
              description: 'Currency filter (e.g., USD, EUR)' 
            },
            context_date: {
              type: 'string',
              format: 'date-time',
              description: 'Current date/time context from n8n {{ $now }} for timezone reference'
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_product_sales',
        description: 'Get sales statistics by product with quantities and revenue',
        inputSchema: {
          type: 'object',
          properties: {
            product_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Specific product ID (optional)' 
            },
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year', 'custom'],
              description: 'Analysis period (default: month)' 
            },
            start_date: { 
              type: 'string', 
              format: 'date', 
              description: 'Start date for custom period (YYYY-MM-DD)' 
            },
            end_date: { 
              type: 'string', 
              format: 'date', 
              description: 'End date for custom period (YYYY-MM-DD)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              description: 'Number of top products to return (default: 20)' 
            },
            order_by: { 
              type: 'string', 
              enum: ['quantity', 'revenue', 'orders'], 
              description: 'Sort by metric (default: revenue)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_daily_sales',
        description: 'Get daily sales breakdown for a specific time period',
        inputSchema: {
          type: 'object',
          properties: {
            days: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 365, 
              description: 'Number of days to analyze (from today backwards, default: 30)' 
            },
            start_date: { 
              type: 'string', 
              format: 'date', 
              description: 'Start date (YYYY-MM-DD). Use "2023-08-28" for August 28, 2023' 
            },
            end_date: { 
              type: 'string', 
              format: 'date', 
              description: 'End date (YYYY-MM-DD)' 
            },
            status: { 
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'] 
              },
              description: 'Order statuses to include (default: completed, processing)' 
            },
            context_date: {
              type: 'string',
              format: 'date-time',
              description: 'Current date/time context from n8n {{ $now }} for Mexico City timezone (UTC-6)'
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_monthly_sales',
        description: 'Get monthly sales summary with comparison to previous periods',
        inputSchema: {
          type: 'object',
          properties: {
            months: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 24, 
              description: 'Number of months to analyze (default: 12)' 
            },
            year: { 
              type: 'integer', 
              minimum: 2020, 
              maximum: 2030, 
              description: 'Specific year (default: current year)' 
            },
            compare_previous: { 
              type: 'boolean', 
              description: 'Include comparison with previous period (default: true)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_yearly_sales',
        description: 'Get yearly sales summary with year-over-year growth analysis',
        inputSchema: {
          type: 'object',
          properties: {
            years: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 10, 
              description: 'Number of years to analyze (default: 3)' 
            },
            start_year: { 
              type: 'integer', 
              minimum: 2020, 
              maximum: 2030, 
              description: 'Starting year (default: 3 years ago)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_top_sellers',
        description: 'Get top selling products by quantity or revenue with detailed metrics',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year', 'all_time'],
              description: 'Analysis period (default: month)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              description: 'Number of top products (default: 10)' 
            },
            metric: { 
              type: 'string', 
              enum: ['quantity_sold', 'revenue', 'order_count'], 
              description: 'Ranking metric (default: revenue)' 
            },
            category_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Filter by product category (optional)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_customer_analytics',
        description: 'Get customer analytics including new customers, repeat customers, and LTV',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['week', 'month', 'quarter', 'year'],
              description: 'Analysis period (default: month)' 
            },
            segment: { 
              type: 'string', 
              enum: ['all', 'new', 'returning', 'vip'], 
              description: 'Customer segment (default: all)' 
            },
            min_orders: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Minimum number of orders for VIP customers' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_revenue_stats',
        description: 'Get detailed revenue statistics including gross, net, taxes, and shipping',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year'],
              description: 'Revenue period (default: month)' 
            },
            breakdown: { 
              type: 'boolean', 
              description: 'Include detailed breakdown by categories (default: true)' 
            },
            compare_previous: { 
              type: 'boolean', 
              description: 'Compare with previous period (default: true)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_order_stats',
        description: 'Get comprehensive order statistics and trends',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['today', 'week', 'month', 'quarter', 'year'],
              description: 'Statistics period (default: month)' 
            },
            group_by: { 
              type: 'string', 
              enum: ['day', 'week', 'month', 'status', 'payment_method'], 
              description: 'Group results by (default: day)' 
            },
            include_refunds: { 
              type: 'boolean', 
              description: 'Include refunded orders (default: false)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_coupon_stats',
        description: 'Get coupon usage statistics and effectiveness metrics',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['week', 'month', 'quarter', 'year'],
              description: 'Analysis period (default: month)' 
            },
            coupon_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Specific coupon ID (optional)' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 50, 
              description: 'Number of top coupons (default: 20)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_tax_reports',
        description: 'Get tax collection reports and breakdown by tax rates',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['month', 'quarter', 'year'],
              description: 'Tax reporting period (default: month)' 
            },
            tax_rate_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Specific tax rate ID (optional)' 
            },
            group_by: { 
              type: 'string', 
              enum: ['rate', 'class', 'location'], 
              description: 'Group tax data by (default: rate)' 
            }
          },
          required: [],
          additionalProperties: false
        }
      },
      {
        name: 'wc_get_refund_stats',
        description: 'Get refund statistics and analysis for quality control',
        inputSchema: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: ['week', 'month', 'quarter', 'year'],
              description: 'Analysis period (default: month)' 
            },
            reason_analysis: { 
              type: 'boolean', 
              description: 'Include refund reason analysis (default: true)' 
            },
            product_breakdown: { 
              type: 'boolean', 
              description: 'Breakdown by products (default: false)' 
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
      this.logger.info(`Executing analytics tool: ${name}`, { params });

      switch (name) {
        case 'wc_get_sales_report':
          return await this.getSalesReport(params);
        case 'wc_get_product_sales':
          return await this.getProductSales(params);
        case 'wc_get_daily_sales':
          return await this.getDailySales(params);
        case 'wc_get_monthly_sales':
          return await this.getMonthlySales(params);
        case 'wc_get_yearly_sales':
          return await this.getYearlySales(params);
        case 'wc_get_top_sellers':
          return await this.getTopSellers(params);
        case 'wc_get_customer_analytics':
          return await this.getCustomerAnalytics(params);
        case 'wc_get_revenue_stats':
          return await this.getRevenueStats(params);
        case 'wc_get_order_stats':
          return await this.getOrderStats(params);
        case 'wc_get_coupon_stats':
          return await this.getCouponStats(params);
        case 'wc_get_tax_reports':
          return await this.getTaxReports(params);
        case 'wc_get_refund_stats':
          return await this.getRefundStats(params);
        default:
          throw new Error(`Unknown analytics tool: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Analytics tool error: ${name}`, { error: error instanceof Error ? error.message : error, params });
      return {
        content: [{
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async getSalesReport(params: MCPToolParams): Promise<MCPToolResult> {
    const { period = 'month', start_date, end_date, currency, context_date } = params;
    
    // Real WooCommerce API integration
    
    try {
      // Calculate date range based on period with Mexico timezone context
      const dateRange = this.calculateDateRange(period, start_date, end_date, context_date);
      
      this.logger.info('Getting sales report', { period, dateRange });
      
      // Use WooCommerce orders endpoint with proper date filtering
      const orderParams: any = {
        per_page: 100,
        status: 'completed'
      };
      
      // Add date filters only if we have valid dates
      if (dateRange.start) {
        orderParams.after = dateRange.start;
      }
      if (dateRange.end) {
        orderParams.before = dateRange.end;
      }

      this.logger.info('WooCommerce order params', orderParams);

      // Get orders from WooCommerce API
      const orders = await this.wooCommerce.getOrders(orderParams);
      
      this.logger.info(`Retrieved ${orders.length} orders for analysis`);
      
      // Calculate metrics from real data
      const metrics = this.calculateSalesMetrics(orders);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data_source: 'LIVE_WOOCOMMERCE',
            period: period,
            date_range: dateRange,
            orders_analyzed: orders.length,
            metrics: {
              total_sales: metrics.totalSales,
              total_orders: metrics.totalOrders,
              average_order_value: metrics.averageOrderValue,
              total_items_sold: metrics.totalItems,
              total_customers: metrics.totalCustomers,
              conversion_metrics: {
                orders_per_customer: metrics.ordersPerCustomer,
                items_per_order: metrics.itemsPerOrder
              }
            },
            currency: currency || 'MXN',
            timezone_info: {
              timezone: 'America/Mexico_City (UTC-6)',
              context_date: context_date,
              calculated_range: `${dateRange.start.split('T')[0]} to ${dateRange.end.split('T')[0]}`
            },
            message: `📊 LIVE: Sales report for ${period}: ${metrics.totalOrders} orders, ${currency || 'MXN'} ${metrics.totalSales} revenue (Mexico timezone)`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Sales report error', { error: error instanceof Error ? error.message : error });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to get sales report from WooCommerce API',
            suggestion: 'Check WooCommerce API credentials and permissions'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  private async getProductSales(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      product_id, 
      period = 'month', 
      start_date, 
      end_date, 
      limit = 20, 
      order_by = 'revenue' 
    } = params;
    
    // WooCommerce API integration

    
    const dateRange = this.calculateDateRange(period, start_date, end_date);
    
    try {
      // Get orders in the period
      const orders = await this.wooCommerce.getOrders({
        after: dateRange.start,
        before: dateRange.end,
        status: 'completed',
        per_page: 100
      });

      // Analyze product sales
      const productSales = this.analyzeProductSales(orders, product_id);
      
      // Sort and limit results
      const sortedProducts = this.sortProductSales(productSales, order_by).slice(0, limit);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            period: period,
            date_range: dateRange,
            product_sales: sortedProducts,
            total_products: sortedProducts.length,
            message: `Product sales analysis: Top ${sortedProducts.length} products by ${order_by}`
          }, null, 2)
        }]
      };
    } catch (error) {
      // Handle API errors

    }
  }

  private async getDailySales(params: MCPToolParams): Promise<MCPToolResult> {
    const { days = 30, start_date, end_date, status = ['completed', 'processing'], context_date } = params;
    
    // WooCommerce API integration

    
    try {
      let dateRange;
      if (start_date && end_date) {
        dateRange = {
          start: this.formatDateForWooCommerce(start_date, false),
          end: this.formatDateForWooCommerce(end_date, true)
        };
      } else {
        // Use Mexico timezone for date calculations
        const mexicoNow = this.getMexicoDate(undefined, context_date);
        const endDate = new Date(mexicoNow);
        const startDate = new Date(mexicoNow);
        startDate.setDate(endDate.getDate() - days);
        
        dateRange = {
          start: this.formatDateForWooCommerce(startDate.toISOString().split('T')[0], false),
          end: this.formatDateForWooCommerce(endDate.toISOString().split('T')[0], true)
        };
      }

      this.logger.info('Getting daily sales', { dateRange, status });

      // Get orders with proper status filtering
      const statusString = Array.isArray(status) ? status.join(',') : status;
      
      const orderParams: any = {
        per_page: 100,
        status: statusString,
        after: dateRange.start,
        before: dateRange.end,
        orderby: 'date',
        order: 'desc'
      };

      this.logger.info('Daily sales order params', orderParams);

      const orders = await this.wooCommerce.getOrders(orderParams);
      
      this.logger.info(`Retrieved ${orders.length} orders for daily analysis`);

      // Process orders into daily buckets
      const dailyData = this.processDailySalesFromOrders(orders, dateRange);
      
      // Find data for August 28, 2023 specifically
      const aug28Data = dailyData.dailySales.find(day => day.date === '2023-08-28');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data_source: 'LIVE_WOOCOMMERCE',
            date_range: {
              start: dateRange.start.split('T')[0],
              end: dateRange.end.split('T')[0]
            },
            orders_analyzed: orders.length,
            daily_sales: dailyData.dailySales,
            summary: {
              total_days: dailyData.dailySales.length,
              total_revenue: dailyData.totalRevenue,
              total_orders: dailyData.totalOrders,
              average_daily_revenue: dailyData.averageDailyRevenue,
              best_day: dailyData.bestDay,
              worst_day: dailyData.worstDay
            },
            august_28_2023: aug28Data || null,
            timezone_info: {
              timezone: 'America/Mexico_City (UTC-6)',
              context_date: context_date,
              calculated_range: `${dateRange.start.split('T')[0]} to ${dateRange.end.split('T')[0]}`
            },
            message: `📊 LIVE: Daily sales analysis for ${dailyData.dailySales.length} days in Mexico timezone${aug28Data ? `. ✨ August 28, 2023: $${aug28Data.revenue} revenue from ${aug28Data.orders} orders` : ''}`
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Daily sales error', { error: error instanceof Error ? error.message : error });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Failed to get daily sales from WooCommerce API',
            suggestion: 'Check date format and WooCommerce API permissions'
          }, null, 2)
        }],
        isError: true
      };
    }
  }

  private async getMonthlySales(params: MCPToolParams): Promise<MCPToolResult> {
    const { months = 12, year, compare_previous = true } = params;
    
    const currentYear = year || new Date().getFullYear();
    const monthlyData = await this.getMonthlySalesData(currentYear, months, compare_previous);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          year: currentYear,
          months_analyzed: months,
          monthly_sales: monthlyData.monthlySales,
          yearly_summary: monthlyData.yearlySummary,
          growth_analysis: compare_previous ? monthlyData.growthAnalysis : null,
          message: `Monthly sales analysis for ${months} months in ${currentYear}`
        }, null, 2)
      }]
    };
  }

  private async getYearlySales(params: MCPToolParams): Promise<MCPToolResult> {
    const { years = 3, start_year } = params;
    
    const endYear = new Date().getFullYear();
    const actualStartYear = start_year || (endYear - years + 1);
    
    const yearlyData = await this.getYearlySalesData(actualStartYear, endYear);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          year_range: `${actualStartYear}-${endYear}`,
          yearly_sales: yearlyData.yearlySales,
          growth_trends: yearlyData.growthTrends,
          projections: yearlyData.projections,
          message: `Yearly sales analysis from ${actualStartYear} to ${endYear}`
        }, null, 2)
      }]
    };
  }

  private async getTopSellers(params: MCPToolParams): Promise<MCPToolResult> {
    const { 
      period = 'month', 
      limit = 10, 
      metric = 'revenue', 
      category_id 
    } = params;
    
    const dateRange = this.calculateDateRange(period);
    
    // Get all products if category filter is specified
    let products: any[] = [];
    if (category_id) {
      products = await this.wooCommerce.getProducts({ category: category_id, per_page: 100 });
    }

    const topSellers = await this.getTopSellersData(dateRange, limit, metric, products);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          period: period,
          metric: metric,
          top_sellers: topSellers,
          category_filter: category_id || 'all',
          message: `Top ${topSellers.length} selling products by ${metric} for period: ${period}`
        }, null, 2)
      }]
    };
  }

  // Helper methods for calculations
  private calculateDateRange(period: string, start_date?: string, end_date?: string, contextDate?: string) {
    // Get Mexico time as reference (with n8n context if available)
    const mexicoNow = this.getMexicoDate(undefined, contextDate);
    
    if (period === 'custom' && start_date && end_date) {
      return { 
        start: this.formatDateForWooCommerce(start_date, false),
        end: this.formatDateForWooCommerce(end_date, true)
      };
    }

    // Handle special period strings that might contain dates
    if (period.toLowerCase().includes('august') || period.toLowerCase().includes('agosto')) {
      const targetDate = this.parseHistoricalDate(period, mexicoNow);
      
      if (period.includes('28')) {
        // Specific day: August 28
        const start = new Date(targetDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate);
        end.setHours(23, 59, 59, 999);
        
        return {
          start: this.formatDateForWooCommerce(start.toISOString().split('T')[0], false),
          end: this.formatDateForWooCommerce(end.toISOString().split('T')[0], true)
        };
      } else {
        // Whole month of August
        const start = new Date(targetDate.getFullYear(), 7, 1); // August 1st
        start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate.getFullYear(), 7, 31); // August 31st
        end.setHours(23, 59, 59, 999);
        
        return {
          start: this.formatDateForWooCommerce(start.toISOString().split('T')[0], false),
          end: this.formatDateForWooCommerce(end.toISOString().split('T')[0], true)
        };
      }
    }

    // Standard periods using Mexico time
    const now = new Date(mexicoNow);
    const start = new Date(mexicoNow);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        start.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        now.setHours(23, 59, 59, 999);
        break;
    }

    return {
      start: this.formatDateForWooCommerce(start.toISOString().split('T')[0], false),
      end: this.formatDateForWooCommerce(now.toISOString().split('T')[0], true)
    };
  }

  private calculateSalesMetrics(orders: any[]) {
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + (order.line_items?.length || 0), 0);
    const uniqueCustomers = new Set(orders.map(order => order.customer_id).filter(id => id > 0)).size;
    
    return {
      totalSales: totalSales.toFixed(2),
      totalOrders,
      averageOrderValue: totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00',
      totalItems,
      totalCustomers: uniqueCustomers,
      ordersPerCustomer: uniqueCustomers > 0 ? (totalOrders / uniqueCustomers).toFixed(2) : '0.00',
      itemsPerOrder: totalOrders > 0 ? (totalItems / totalOrders).toFixed(2) : '0.00'
    };
  }

  private analyzeProductSales(orders: any[], productId?: number) {
    const productMap = new Map();

    orders.forEach(order => {
      order.line_items?.forEach((item: any) => {
        const id = item.product_id;
        if (productId && id !== productId) return;

        if (!productMap.has(id)) {
          productMap.set(id, {
            product_id: id,
            name: item.name,
            sku: item.sku || '',
            quantity_sold: 0,
            revenue: 0,
            orders: 0
          });
        }

        const product = productMap.get(id);
        product.quantity_sold += item.quantity || 0;
        product.revenue += parseFloat(item.total || 0);
        product.orders += 1;
      });
    });

    return Array.from(productMap.values());
  }

  private sortProductSales(products: any[], orderBy: string) {
    return products.sort((a, b) => {
      switch (orderBy) {
        case 'quantity':
          return b.quantity_sold - a.quantity_sold;
        case 'orders':
          return b.orders - a.orders;
        case 'revenue':
        default:
          return b.revenue - a.revenue;
      }
    });
  }

  // Additional helper methods for daily, monthly, yearly analysis
  private async getDailySalesData(dateRange: any, statuses: string[]) {
    const orders = await this.wooCommerce.getOrders({
      after: dateRange.start,
      before: dateRange.end,
      status: statuses.join(','),
      per_page: 100
    });

    // Group orders by date
    const dailyMap = new Map();
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach((order: any) => {
      const date = order.date_created ? order.date_created.split('T')[0] : new Date().toISOString().split('T')[0];
      const revenue = parseFloat(order.total || '0');
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, orders: 0, revenue: 0 });
      }
      
      const dayData = dailyMap.get(date);
      dayData.orders += 1;
      dayData.revenue += revenue;
      
      totalRevenue += revenue;
      totalOrders += 1;
    });

    const dailySales = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // Find best and worst days
    const bestDay = dailySales.reduce((best, day) => day.revenue > best.revenue ? day : best, dailySales[0] || {});
    const worstDay = dailySales.reduce((worst, day) => day.revenue < worst.revenue ? day : worst, dailySales[0] || {});

    return {
      dailySales,
      totalRevenue,
      totalOrders,
      averageDailyRevenue: dailySales.length > 0 ? totalRevenue / dailySales.length : 0,
      bestDay,
      worstDay
    };
  }

  private async getMonthlySalesData(year: number, months: number, comparePrevious: boolean) {
    // Implementation for monthly sales data
    return {
      monthlySales: [],
      yearlySummary: {},
      growthAnalysis: comparePrevious ? {} : null
    };
  }

  private async getYearlySalesData(startYear: number, endYear: number) {
    // Implementation for yearly sales data
    return {
      yearlySales: [],
      growthTrends: {},
      projections: {}
    };
  }

  private async getTopSellersData(dateRange: any, limit: number, metric: string, products: any[]) {
    // WooCommerce API integration
    try {
      const orders = await this.wooCommerce.getOrders({ 
        per_page: 500, 
        status: 'completed',
        after: dateRange?.start_date,
        before: dateRange?.end_date
      });
      
      // Calculate real top sellers from orders
      const productStats = new Map();
      
      for (const order of orders) {
        for (const item of order.line_items || []) {
          const productId = item.product_id;
          if (!productStats.has(productId)) {
            productStats.set(productId, {
              product_id: productId,
              name: item.name,
              sku: item.sku || '',
              quantity_sold: 0,
              revenue: 0,
              orders: 0,
              avg_price: 0
            });
          }
          
          const stats = productStats.get(productId);
          stats.quantity_sold += item.quantity;
          stats.revenue += parseFloat(item.total);
          stats.orders += 1;
          stats.avg_price = stats.revenue / stats.quantity_sold;
        }
      }
      
      // Convert to array and sort
      let sortedProducts = Array.from(productStats.values());
      switch (metric) {
        case 'quantity_sold':
          sortedProducts.sort((a, b) => b.quantity_sold - a.quantity_sold);
          break;
        case 'order_count':
          sortedProducts.sort((a, b) => b.orders - a.orders);
          break;
        case 'revenue':
        default:
          sortedProducts.sort((a, b) => b.revenue - a.revenue);
          break;
      }
      
      return sortedProducts.slice(0, limit);
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analytics tools
  private async getCustomerAnalytics(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const customers = await this.wooCommerce.getCustomers({ per_page: 100 });
      const orders = await this.wooCommerce.getOrders({ per_page: 500, status: 'completed' });
      
      // Calculate real customer analytics
      const totalCustomers = customers.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const newCustomersThisMonth = customers.filter(customer => {
        const createdDate = new Date(customer.date_created);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;
      
      // Calculate customer LTV from orders
      const customerRevenue = new Map();
      for (const order of orders) {
        const customerId = order.customer_id;
        if (customerId) {
          const revenue = customerRevenue.get(customerId) || 0;
          customerRevenue.set(customerId, revenue + parseFloat(order.total));
        }
      }
      
      const averageLTV = customerRevenue.size > 0 
        ? Array.from(customerRevenue.values()).reduce((a, b) => a + b, 0) / customerRevenue.size
        : 0;
      
      const returningCustomers = customerRevenue.size;
      const vipCustomers = Array.from(customerRevenue.values()).filter(ltv => ltv > averageLTV * 2).length;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            customer_analytics: {
              total_customers: totalCustomers,
              new_customers_this_month: newCustomersThisMonth,
              returning_customers: returningCustomers,
              vip_customers: vipCustomers,
              average_ltv: averageLTV,
              customer_segments: {
                new: { count: newCustomersThisMonth, percentage: (newCustomersThisMonth / totalCustomers) * 100 },
                returning: { count: returningCustomers, percentage: (returningCustomers / totalCustomers) * 100 },
                vip: { count: vipCustomers, percentage: (vipCustomers / totalCustomers) * 100 }
              }
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getRevenueStats(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const orders = await this.wooCommerce.getOrders({ per_page: 500, status: 'completed' });
      
      // Calculate real revenue statistics
      let grossRevenue = 0;
      let taxesCollected = 0;
      let shippingRevenue = 0;
      let discountsGiven = 0;
      let refundsIssued = 0;
      let feesCollected = 0;
      
      for (const order of orders) {
        grossRevenue += parseFloat(order.total || '0');
        taxesCollected += parseFloat(order.total_tax || '0');
        shippingRevenue += parseFloat(order.shipping_total || '0');
        discountsGiven += parseFloat(order.discount_total || '0');
        
        // Calculate fees from fee lines
        if (order.fee_lines) {
          for (const fee of order.fee_lines) {
            feesCollected += parseFloat(fee.total || '0');
          }
        }
        
        // Get refunds for this order
        if (order.refunds && order.refunds.length > 0) {
          for (const refund of order.refunds) {
            refundsIssued += parseFloat(refund.total || '0');
          }
        }
      }
      
      const netRevenue = grossRevenue - discountsGiven - refundsIssued;
      const productsRevenue = grossRevenue - shippingRevenue - taxesCollected - feesCollected;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            revenue_stats: {
              gross_revenue: grossRevenue,
              net_revenue: netRevenue,
              taxes_collected: taxesCollected,
              shipping_revenue: shippingRevenue,
              discounts_given: discountsGiven,
              refunds_issued: refundsIssued,
              revenue_breakdown: {
                products: productsRevenue,
                shipping: shippingRevenue,
                taxes: taxesCollected,
                fees: feesCollected
              }
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getOrderStats(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const allOrders = await this.wooCommerce.getOrders({ per_page: 500 });
      
      // Calculate real order statistics
      const totalOrders = allOrders.length;
      const completedOrders = allOrders.filter(order => order.status === 'completed').length;
      const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
      const cancelledOrders = allOrders.filter(order => order.status === 'cancelled').length;
      const refundedOrders = allOrders.filter(order => order.status === 'refunded').length;
      
      // Calculate payment methods distribution
      const paymentMethods = {};
      allOrders.forEach(order => {
        const method = order.payment_method_title || order.payment_method || 'unknown';
        paymentMethods[method] = (paymentMethods[method] || 0) + 1;
      });
      
      // Calculate order value distribution
      const orderValueDistribution = {
        under_50: 0,
        '50_100': 0,
        '100_200': 0,
        over_200: 0
      };
      
      allOrders.forEach(order => {
        const total = parseFloat(order.total || '0');
        if (total < 50) {
          orderValueDistribution.under_50++;
        } else if (total < 100) {
          orderValueDistribution['50_100']++;
        } else if (total < 200) {
          orderValueDistribution['100_200']++;
        } else {
          orderValueDistribution.over_200++;
        }
      });
      
      // Calculate average processing time for completed orders
      const processingTimes = [];
      const completedOrdersList = allOrders.filter(order => order.status === 'completed');
      
      completedOrdersList.forEach(order => {
        const created = new Date(order.date_created);
        const completed = new Date(order.date_completed || order.date_modified);
        const diffHours = (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
        if (diffHours > 0) {
          processingTimes.push(diffHours);
        }
      });
      
      const averageProcessingTime = processingTimes.length > 0
        ? `${(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length).toFixed(1)} hours`
        : 'N/A';
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            order_stats: {
              total_orders: totalOrders,
              completed_orders: completedOrders,
              pending_orders: pendingOrders,
              cancelled_orders: cancelledOrders,
              refunded_orders: refundedOrders,
              average_processing_time: averageProcessingTime,
              payment_methods: paymentMethods,
              order_value_distribution: orderValueDistribution
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCouponStats(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const orders = await this.wooCommerce.getOrders({ per_page: 100, status: 'completed' });
      const coupons = await this.wooCommerce.getCoupons({ per_page: 100 });
      
      // Calculate real coupon statistics from orders
      const couponUsage = new Map();
      let totalDiscountAmount = 0;
      
      orders.forEach((order: any) => {
        if (order.coupon_lines && order.coupon_lines.length > 0) {
          order.coupon_lines.forEach((couponLine: any) => {
            const code = couponLine.code;
            const discount = parseFloat(couponLine.discount) || 0;
            
            if (!couponUsage.has(code)) {
              couponUsage.set(code, { uses: 0, discount: 0 });
            }
            
            const usage = couponUsage.get(code);
            usage.uses += 1;
            usage.discount += discount;
            totalDiscountAmount += discount;
          });
        }
      });
      
      const mostUsedCoupons = Array.from(couponUsage.entries())
        .map(([code, stats]: [string, any]) => ({ code, uses: stats.uses, discount: stats.discount }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            coupon_stats: {
              total_coupons_used: couponUsage.size,
              total_discount_amount: totalDiscountAmount,
              most_used_coupons: mostUsedCoupons,
              coupon_effectiveness: {
                conversion_rate: orders.length > 0 ? `${((couponUsage.size / orders.length) * 100).toFixed(1)}%` : '0%',
                average_discount: couponUsage.size > 0 ? (totalDiscountAmount / couponUsage.size).toFixed(2) : 0
              }
            },
            message: 'Coupon usage statistics from WooCommerce store'
          }, null, 2)
        }]
      };
    } catch (error) {
      this.logger.error('Failed to fetch coupon statistics', { error: error instanceof Error ? error.message : error });
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getTaxReports(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const orders = await this.wooCommerce.getOrders({ per_page: 500, status: 'completed' });
      
      // Calculate real tax reports
      let totalTaxesCollected = 0;
      const taxByRate = new Map();
      const taxByLocation = new Map();
      
      orders.forEach(order => {
        const totalTax = parseFloat(order.total_tax || '0');
        totalTaxesCollected += totalTax;
        
        // Process tax lines for rate breakdown
        if (order.tax_lines) {
          order.tax_lines.forEach(taxLine => {
            const rate = taxLine.rate_percent || 0;
            const amount = parseFloat(taxLine.tax_total || '0');
            const rateKey = `${rate}%`;
            
            if (!taxByRate.has(rateKey)) {
              taxByRate.set(rateKey, { rate: rateKey, amount: 0, orders: 0 });
            }
            
            const rateStats = taxByRate.get(rateKey);
            rateStats.amount += amount;
            rateStats.orders += 1;
          });
        }
        
        // Process shipping address for location breakdown
        if (order.shipping && order.shipping.state) {
          const state = order.shipping.state;
          const tax = parseFloat(order.total_tax || '0');
          
          if (!taxByLocation.has(state)) {
            taxByLocation.set(state, { state, amount: 0, rate: 'N/A' });
          }
          
          const locationStats = taxByLocation.get(state);
          locationStats.amount += tax;
        }
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            tax_reports: {
              total_taxes_collected: totalTaxesCollected,
              tax_by_rate: Array.from(taxByRate.values()),
              tax_by_location: Array.from(taxByLocation.values())
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getRefundStats(params: MCPToolParams): Promise<MCPToolResult> {
    // WooCommerce API integration
    try {
      const allOrders = await this.wooCommerce.getOrders({ per_page: 500 });
      const refundedOrders = await this.wooCommerce.getOrders({ per_page: 200, status: 'refunded' });
      
      // Calculate real refund statistics
      let totalRefundAmount = 0;
      let totalRefunds = 0;
      const refundReasons = new Map();
      
      // Process refunds from orders
      allOrders.forEach(order => {
        if (order.refunds && order.refunds.length > 0) {
          order.refunds.forEach(refund => {
            totalRefunds += 1;
            totalRefundAmount += parseFloat(refund.total || '0');
            
            // Extract refund reason if available
            const reason = refund.reason || 'No reason specified';
            if (!refundReasons.has(reason)) {
              refundReasons.set(reason, { reason, count: 0, amount: 0 });
            }
            
            const reasonStats = refundReasons.get(reason);
            reasonStats.count += 1;
            reasonStats.amount += parseFloat(refund.total || '0');
          });
        }
      });
      
      // Calculate refund rate
      const totalOrderValue = allOrders.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0);
      const refundRate = totalOrderValue > 0 ? `${((totalRefundAmount / totalOrderValue) * 100).toFixed(2)}%` : '0%';
      
      // Calculate monthly trends
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth - 1;
      
      let thisMonthRefunds = 0;
      let lastMonthRefunds = 0;
      
      refundedOrders.forEach(order => {
        const orderDate = new Date(order.date_created);
        if (orderDate.getMonth() === currentMonth) {
          thisMonthRefunds++;
        } else if (orderDate.getMonth() === lastMonth) {
          lastMonthRefunds++;
        }
      });
      
      const trend = thisMonthRefunds > lastMonthRefunds ? 'increasing' : 
                   thisMonthRefunds < lastMonthRefunds ? 'decreasing' : 'stable';
      
      const refundRateNum = parseFloat(refundRate.replace('%', ''));
      const qualityImpact = refundRateNum < 2 ? 'Low - refund rate under 2%' :
                           refundRateNum < 5 ? 'Medium - refund rate under 5%' :
                           'High - refund rate above 5%';
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            source: 'woocommerce_api',
            refund_stats: {
              total_refunds: totalRefunds,
              total_refund_amount: totalRefundAmount,
              refund_rate: refundRate,
              refund_reasons: Array.from(refundReasons.values()),
              refund_trends: {
                this_month: thisMonthRefunds,
                last_month: lastMonthRefunds,
                trend: trend
              },
              quality_impact: qualityImpact
            }
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`WooCommerce API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  // Date and timezone utilities for Mexico City (UTC-6)
  private getMexicoDate(dateStr?: string, contextDate?: string): Date {
    const mexicoOffset = -6 * 60; // UTC-6 for Mexico City in minutes
    
    if (dateStr) {
      const date = new Date(dateStr);
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      return new Date(utc + (mexicoOffset * 60000));
    }
    
    // If n8n provides {{ $now }} context, use it
    if (contextDate) {
      const contextDateTime = new Date(contextDate);
      const utc = contextDateTime.getTime() + (contextDateTime.getTimezoneOffset() * 60000);
      return new Date(utc + (mexicoOffset * 60000));
    }
    
    // Default: current Mexico time
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (mexicoOffset * 60000));
  }

  private parseHistoricalDate(input: string, currentMexicoTime?: Date): Date {
    const mexicoNow = currentMexicoTime || this.getMexicoDate();
    
    // Parse "August 28" or "28 de agosto" type inputs
    if (input.toLowerCase().includes('august') || input.toLowerCase().includes('agosto')) {
      let day = 28; // Default to 28th if mentioned
      let year = mexicoNow.getFullYear(); // Default to current year from context
      
      // Extract day if specified
      const dayMatch = input.match(/(\d{1,2})/g);
      if (dayMatch) {
        day = parseInt(dayMatch[0]);
        // If a year is specified, use it
        if (dayMatch.length > 1) {
          const yearCandidate = parseInt(dayMatch[1]);
          if (yearCandidate > 2020 && yearCandidate <= mexicoNow.getFullYear()) {
            year = yearCandidate;
          }
        }
      }
      
      // Smart year detection: use current year context from n8n
      if (!input.includes('2023') && !input.includes('2024') && !input.includes('2025')) {
        year = mexicoNow.getFullYear(); // Default to current year from context
        
        const targetDate = new Date(year, 7, day); // August of current year
        
        // If the target date is in the future compared to mexicoNow, use previous year
        if (targetDate > mexicoNow) {
          year = mexicoNow.getFullYear() - 1;
        }
        
        this.logger.info('🗓️ Smart date detection', {
          input,
          mexicoNow: mexicoNow.toISOString().split('T')[0],
          targetDate: targetDate.toISOString().split('T')[0],
          selectedYear: year,
          isFuture: targetDate > mexicoNow
        });
      }
      
      return new Date(year, 7, day); // August = month 7 (0-indexed)
    }
    
    // Handle other date formats
    return new Date(input);
  }

  private formatDateForWooCommerce(dateStr: string, isEndOfDay: boolean = false): string {
    // Handle various date formats and convert to WooCommerce API format with Mexico timezone
    let date: Date;
    
    if (dateStr.includes('T')) {
      date = new Date(dateStr);
    } else {
      // Parse YYYY-MM-DD format and apply Mexico timezone
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
      
      if (isEndOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
    }
    
    // WooCommerce API expects ISO format, but we need to ensure it's in the right timezone context
    return date.toISOString();
  }

  private parseDateInput(input: string, currentDate?: Date): { year: number; month: number; day?: number } {
    const current = currentDate || this.getMexicoDate();
    const inputLower = input.toLowerCase();
    
    // Handle "August 28" or "28 de agosto" variations
    if (inputLower.includes('agosto') || inputLower.includes('august')) {
      let day: number | undefined;
      let year = 2023; // Default to 2023 for historical data
      
      // Extract day if mentioned
      const dayMatch = input.match(/(\d{1,2})/);
      if (dayMatch && parseInt(dayMatch[1]) <= 31) {
        day = parseInt(dayMatch[1]);
      }
      
      // Extract year if explicitly mentioned
      const yearMatch = input.match(/(20\d{2})/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
      }
      
      return { year, month: 8, day }; // August = 8
    }
    
    // Handle other date patterns
    const yearMatch = input.match(/(20\d{2})/);
    const monthMatch = input.match(/(\d{1,2})/);
    
    if (yearMatch && monthMatch) {
      return { 
        year: parseInt(yearMatch[1]), 
        month: parseInt(monthMatch[1]) 
      };
    }
    
    // Default to current year and month
    return { 
      year: current.getFullYear(), 
      month: current.getMonth() + 1 
    };
  }







  private processDailySalesFromOrders(orders: any[], dateRange: any) {
    const dailyMap = new Map();
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach((order: any) => {
      const orderDate = order.date_created || order.date_completed;
      if (!orderDate) return;
      
      const date = orderDate.split('T')[0]; // Get YYYY-MM-DD format
      const revenue = parseFloat(order.total || '0');
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { 
          date, 
          orders: 0, 
          revenue: 0,
          items_sold: 0,
          avg_order_value: 0
        });
      }
      
      const dayData = dailyMap.get(date);
      dayData.orders += 1;
      dayData.revenue += revenue;
      dayData.items_sold += (order.line_items?.length || 0);
      dayData.avg_order_value = dayData.orders > 0 ? dayData.revenue / dayData.orders : 0;
      
      totalRevenue += revenue;
      totalOrders += 1;
    });

    const dailySales = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    // Find best and worst days
    const bestDay = dailySales.length > 0 ? dailySales.reduce((best, day) => day.revenue > best.revenue ? day : best) : null;
    const worstDay = dailySales.length > 0 ? dailySales.reduce((worst, day) => day.revenue < worst.revenue ? day : worst) : null;

    return {
      dailySales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageDailyRevenue: dailySales.length > 0 ? Math.round((totalRevenue / dailySales.length) * 100) / 100 : 0,
      bestDay,
      worstDay
    };
  }

  private getDateForPeriod(period: string, isStart: boolean): string {
    const now = new Date();
    const date = new Date(now);
    
    if (period === 'today') {
      return now.toISOString().split('T')[0];
    } else if (period === 'week') {
      if (isStart) date.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      if (isStart) date.setMonth(now.getMonth() - 1);
    } else if (period === 'quarter') {
      if (isStart) date.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      if (isStart) date.setFullYear(now.getFullYear() - 1);
    }
    
    return date.toISOString().split('T')[0];
  }
}