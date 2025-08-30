import { Tool, Resource } from '@modelcontextprotocol/sdk/types.js';

export interface MCPServerConfig {
  name: string;
  version: string;
  port?: number;
  host?: string;
  woocommerce: {
    siteUrl: string;
    consumerKey: string;
    consumerSecret: string;
    version?: string;
    timeout?: number;
  };
  logging?: {
    level: 'error' | 'warn' | 'info' | 'debug';
    file?: string;
  };
  security?: {
    enableCors: boolean;
    rateLimiting?: {
      windowMs: number;
      max: number;
    };
  };
}

export interface MCPToolParams {
  [key: string]: any;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export interface WooCommerceTool extends Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface WooCommerceResource extends Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Tool categories for better organization
export enum ToolCategory {
  PRODUCTS = 'products',
  ORDERS = 'orders', 
  CUSTOMERS = 'customers',
  CATEGORIES = 'categories',
  TAGS = 'tags',
  COUPONS = 'coupons',
  SHIPPING = 'shipping',
  TAXES = 'taxes',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  SYSTEM = 'system'
}

// Resource categories for better organization  
export enum ResourceCategory {
  STORE_INFO = 'store_info',
  PRODUCT_DATA = 'product_data',
  ORDER_DATA = 'order_data',
  CUSTOMER_DATA = 'customer_data',
  ANALYTICS = 'analytics',
  CONFIGURATION = 'configuration'
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: any;
  handler: (params: MCPToolParams) => Promise<MCPToolResult>;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  category: ResourceCategory;
  mimeType: string;
  handler: () => Promise<any>;
}

// API response wrapper for consistent error handling
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    executionTime?: number;
    version?: string;
  };
}

// N8n integration specific types
export interface N8nWebhookConfig {
  enabled: boolean;
  url?: string;
  secret?: string;
  events?: string[];
}

export interface N8nCompatibleResponse {
  json: any;
  binary?: any;
  pairedItem?: {
    item: number;
  };
}