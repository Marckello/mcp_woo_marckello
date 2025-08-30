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
    switch (name) {
      case 'wc_get_sales_report':
        return this.getSalesReport(args);
      case 'wc_get_product_sales':
        return this.getProductSales(args);
      case 'wc_get_daily_sales':
        return this.getDailySales(args);
      case 'wc_get_monthly_sales':
        return this.getMonthlySales(args);
      case 'wc_get_yearly_sales':
        return this.getYearlySales(args);
      case 'wc_get_top_sellers':
        return this.getTopSellers(args);
      case 'wc_get_customer_analytics':
        return this.getCustomerAnalytics(args);
      case 'wc_get_revenue_stats':
        return this.getRevenueStats(args);
      case 'wc_get_order_stats':
        return this.getOrderStats(args);
      case 'wc_get_coupon_stats':
        return this.getCouponStats(args);
      case 'wc_get_tax_reports':
        return this.getTaxReports(args);
      case 'wc_get_refund_stats':
        return this.getRefundStats(args);
      default:
        throw new Error(`Unknown analytics tool: ${name}`);
    }
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
              enum: ['today', 'yesterday', 'week', 'month', 'quarter', 'year', 'custom'],
              default: 'month',
              description: 'Report period' 
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
            }
          }
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
              default: 'month',
              description: 'Analysis period' 
            },
            start_date: { type: 'string', format: 'date', description: 'Start date for custom period' },
            end_date: { type: 'string', format: 'date', description: 'End date for custom period' },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              default: 20, 
              description: 'Number of top products to return' 
            },
            order_by: { 
              type: 'string', 
              enum: ['quantity', 'revenue', 'orders'], 
              default: 'revenue',
              description: 'Sort by metric' 
            }
          }
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
              default: 30, 
              description: 'Number of days to analyze (from today backwards)' 
            },
            start_date: { type: 'string', format: 'date', description: 'Start date (YYYY-MM-DD)' },
            end_date: { type: 'string', format: 'date', description: 'End date (YYYY-MM-DD)' },
            status: { 
              type: 'array',
              items: { 
                type: 'string', 
                enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed'] 
              },
              default: ['completed', 'processing'],
              description: 'Order statuses to include' 
            }
          }
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
              default: 12, 
              description: 'Number of months to analyze' 
            },
            year: { 
              type: 'integer', 
              minimum: 2020, 
              maximum: 2030, 
              description: 'Specific year (default: current year)' 
            },
            compare_previous: { 
              type: 'boolean', 
              default: true, 
              description: 'Include comparison with previous period' 
            }
          }
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
              default: 3, 
              description: 'Number of years to analyze' 
            },
            start_year: { 
              type: 'integer', 
              minimum: 2020, 
              maximum: 2030, 
              description: 'Starting year (default: 3 years ago)' 
            }
          }
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
              default: 'month',
              description: 'Analysis period' 
            },
            limit: { 
              type: 'integer', 
              minimum: 1, 
              maximum: 100, 
              default: 10, 
              description: 'Number of top products' 
            },
            metric: { 
              type: 'string', 
              enum: ['quantity_sold', 'revenue', 'order_count'], 
              default: 'revenue',
              description: 'Ranking metric' 
            },
            category_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Filter by product category' 
            }
          }
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
              default: 'month',
              description: 'Analysis period' 
            },
            segment: { 
              type: 'string', 
              enum: ['all', 'new', 'returning', 'vip'], 
              default: 'all',
              description: 'Customer segment' 
            },
            min_orders: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Minimum number of orders for VIP customers' 
            }
          }
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
              default: 'month',
              description: 'Revenue period' 
            },
            breakdown: { 
              type: 'boolean', 
              default: true, 
              description: 'Include detailed breakdown by categories' 
            },
            compare_previous: { 
              type: 'boolean', 
              default: true, 
              description: 'Compare with previous period' 
            }
          }
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
              default: 'month',
              description: 'Statistics period' 
            },
            group_by: { 
              type: 'string', 
              enum: ['day', 'week', 'month', 'status', 'payment_method'], 
              default: 'day',
              description: 'Group results by' 
            },
            include_refunds: { 
              type: 'boolean', 
              default: false, 
              description: 'Include refunded orders' 
            }
          }
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
              default: 'month',
              description: 'Analysis period' 
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
              default: 20, 
              description: 'Number of top coupons' 
            }
          }
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
              default: 'month',
              description: 'Tax reporting period' 
            },
            tax_rate_id: { 
              type: 'integer', 
              minimum: 1, 
              description: 'Specific tax rate ID (optional)' 
            },
            group_by: { 
              type: 'string', 
              enum: ['rate', 'class', 'location'], 
              default: 'rate',
              description: 'Group tax data by' 
            }
          }
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
              default: 'month',
              description: 'Analysis period' 
            },
            reason_analysis: { 
              type: 'boolean', 
              default: true, 
              description: 'Include refund reason analysis' 
            },
            product_breakdown: { 
              type: 'boolean', 
              default: false, 
              description: 'Breakdown by products' 
            }
          }
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
    const { period = 'month', start_date, end_date, currency } = params;
    
    // Calculate date range based on period
    const dateRange = this.calculateDateRange(period, start_date, end_date);
    
    // Get orders for the period
    const orderParams = {
      after: dateRange.start,
      before: dateRange.end,
      status: 'completed',
      per_page: 100
    };

    const orders = await this.wooCommerce.getOrders(orderParams);
    
    // Calculate metrics
    const metrics = this.calculateSalesMetrics(orders);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          period: period,
          date_range: dateRange,
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
          currency: currency || 'USD',
          message: `Sales report for ${period}: ${metrics.totalOrders} orders, ${currency || 'USD'} ${metrics.totalSales} revenue`
        }, null, 2)
      }]
    };
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
    
    const dateRange = this.calculateDateRange(period, start_date, end_date);
    
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
  }

  private async getDailySales(params: MCPToolParams): Promise<MCPToolResult> {
    const { days = 30, start_date, end_date, status = ['completed', 'processing'] } = params;
    
    let dateRange;
    if (start_date && end_date) {
      dateRange = { start: start_date, end: end_date };
    } else {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      dateRange = {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }

    // Get orders for each day
    const dailyData = await this.getDailySalesData(dateRange, status);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          date_range: dateRange,
          daily_sales: dailyData.dailySales,
          summary: {
            total_days: dailyData.dailySales.length,
            total_revenue: dailyData.totalRevenue,
            total_orders: dailyData.totalOrders,
            average_daily_revenue: dailyData.averageDailyRevenue,
            best_day: dailyData.bestDay,
            worst_day: dailyData.worstDay
          },
          message: `Daily sales analysis for ${dailyData.dailySales.length} days`
        }, null, 2)
      }]
    };
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
  private calculateDateRange(period: string, start_date?: string, end_date?: string) {
    if (period === 'custom' && start_date && end_date) {
      return { start: start_date, end: end_date };
    }

    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
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
    // Implementation for top sellers data
    return [];
  }

  // Placeholder methods for remaining analytics tools
  private async getCustomerAnalytics(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Customer analytics coming soon' }] };
  }

  private async getRevenueStats(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Revenue stats coming soon' }] };
  }

  private async getOrderStats(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Order stats coming soon' }] };
  }

  private async getCouponStats(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Coupon stats coming soon' }] };
  }

  private async getTaxReports(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Tax reports coming soon' }] };
  }

  private async getRefundStats(params: MCPToolParams): Promise<MCPToolResult> {
    return { content: [{ type: 'text', text: 'Refund stats coming soon' }] };
  }
}