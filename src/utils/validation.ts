import Joi from 'joi';
import { WooCommerceConfig } from '../types/woocommerce.js';

// Configuration validation schema
export const wooCommerceConfigSchema = Joi.object({
  siteUrl: Joi.string().uri().required().messages({
    'string.uri': 'Site URL must be a valid URI',
    'any.required': 'Site URL is required'
  }),
  consumerKey: Joi.string().min(10).required().messages({
    'string.min': 'Consumer key must be at least 10 characters',
    'any.required': 'Consumer key is required'
  }),
  consumerSecret: Joi.string().min(10).required().messages({
    'string.min': 'Consumer secret must be at least 10 characters',
    'any.required': 'Consumer secret is required'
  }),
  version: Joi.string().valid('1', '2', '3').default('3'),
  timeout: Joi.number().integer().min(1000).max(120000).default(30000)
});

// Product validation schema
export const productSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  type: Joi.string().valid('simple', 'grouped', 'external', 'variable').default('simple'),
  status: Joi.string().valid('draft', 'pending', 'private', 'publish').default('publish'),
  featured: Joi.boolean().default(false),
  catalog_visibility: Joi.string().valid('visible', 'catalog', 'search', 'hidden').default('visible'),
  description: Joi.string().allow('').max(65535),
  short_description: Joi.string().allow('').max(1000),
  sku: Joi.string().allow('').max(100),
  regular_price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/),
  sale_price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).allow(''),
  manage_stock: Joi.boolean().default(false),
  stock_quantity: Joi.number().integer().min(0),
  stock_status: Joi.string().valid('instock', 'outofstock', 'onbackorder').default('instock'),
  backorders: Joi.string().valid('no', 'notify', 'yes').default('no'),
  sold_individually: Joi.boolean().default(false),
  weight: Joi.string().pattern(/^\d+(\.\d+)?$/),
  virtual: Joi.boolean().default(false),
  downloadable: Joi.boolean().default(false),
  tax_status: Joi.string().valid('taxable', 'shipping', 'none').default('taxable'),
  tax_class: Joi.string().allow(''),
  reviews_allowed: Joi.boolean().default(true),
  purchase_note: Joi.string().allow('').max(1000),
  menu_order: Joi.number().integer().min(0).default(0)
});

// Order validation schema
export const orderSchema = Joi.object({
  status: Joi.string().valid('pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed').default('pending'),
  currency: Joi.string().length(3).default('USD'),
  customer_id: Joi.number().integer().min(0).default(0),
  billing: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company: Joi.string().max(100),
    address_1: Joi.string().max(100),
    address_2: Joi.string().max(100),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postcode: Joi.string().max(20),
    country: Joi.string().length(2),
    email: Joi.string().email(),
    phone: Joi.string().max(20)
  }),
  shipping: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company: Joi.string().max(100),
    address_1: Joi.string().max(100),
    address_2: Joi.string().max(100),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postcode: Joi.string().max(20),
    country: Joi.string().length(2)
  }),
  line_items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().min(1).required(),
      quantity: Joi.number().integer().min(1).required(),
      variation_id: Joi.number().integer().min(0).default(0),
      meta_data: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          value: Joi.any().required()
        })
      )
    })
  ).min(1).required(),
  customer_note: Joi.string().allow('').max(1000),
  payment_method: Joi.string().max(100),
  payment_method_title: Joi.string().max(100),
  transaction_id: Joi.string().max(200)
});

// Customer validation schema
export const customerSchema = Joi.object({
  email: Joi.string().email().required(),
  first_name: Joi.string().max(100),
  last_name: Joi.string().max(100),
  username: Joi.string().alphanum().min(3).max(60),
  password: Joi.string().min(6).max(100),
  billing: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company: Joi.string().max(100),
    address_1: Joi.string().max(100),
    address_2: Joi.string().max(100),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postcode: Joi.string().max(20),
    country: Joi.string().length(2),
    email: Joi.string().email(),
    phone: Joi.string().max(20)
  }),
  shipping: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    company: Joi.string().max(100),
    address_1: Joi.string().max(100),
    address_2: Joi.string().max(100),
    city: Joi.string().max(100),
    state: Joi.string().max(100),
    postcode: Joi.string().max(20),
    country: Joi.string().length(2)
  })
});

// Category validation schema
export const categorySchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  slug: Joi.string().max(200),
  parent: Joi.number().integer().min(0).default(0),
  description: Joi.string().allow('').max(1000),
  display: Joi.string().valid('default', 'products', 'subcategories', 'both').default('default'),
  menu_order: Joi.number().integer().min(0).default(0)
});

// Tag validation schema
export const tagSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  slug: Joi.string().max(200),
  description: Joi.string().allow('').max(1000)
});

// Coupon validation schema
export const couponSchema = Joi.object({
  code: Joi.string().min(1).max(50).required(),
  amount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).default('0'),
  discount_type: Joi.string().valid('percent', 'fixed_cart', 'fixed_product').default('fixed_cart'),
  description: Joi.string().allow('').max(1000),
  individual_use: Joi.boolean().default(false),
  usage_limit: Joi.number().integer().min(1),
  usage_limit_per_user: Joi.number().integer().min(1),
  limit_usage_to_x_items: Joi.number().integer().min(1),
  free_shipping: Joi.boolean().default(false),
  exclude_sale_items: Joi.boolean().default(false),
  minimum_amount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/),
  maximum_amount: Joi.string().pattern(/^\d+(\.\d{1,2})?$/),
  product_ids: Joi.array().items(Joi.number().integer().min(1)),
  excluded_product_ids: Joi.array().items(Joi.number().integer().min(1)),
  product_categories: Joi.array().items(Joi.number().integer().min(1)),
  excluded_product_categories: Joi.array().items(Joi.number().integer().min(1)),
  email_restrictions: Joi.array().items(Joi.string().email())
});

// List parameters validation schema
export const listParamsSchema = Joi.object({
  context: Joi.string().valid('view', 'edit').default('view'),
  page: Joi.number().integer().min(1).default(1),
  per_page: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(200),
  exclude: Joi.array().items(Joi.number().integer().min(1)),
  include: Joi.array().items(Joi.number().integer().min(1)),
  offset: Joi.number().integer().min(0),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  orderby: Joi.string().valid(
    'date', 'id', 'include', 'title', 'slug', 'modified', 'menu_order', 'price', 'popularity', 'rating'
  ).default('date'),
  parent: Joi.array().items(Joi.number().integer().min(0)),
  parent_exclude: Joi.array().items(Joi.number().integer().min(0)),
  status: Joi.string(),
  type: Joi.string(),
  sku: Joi.string(),
  featured: Joi.boolean(),
  category: Joi.string(),
  tag: Joi.string(),
  shipping_class: Joi.string(),
  attribute: Joi.string(),
  attribute_term: Joi.string(),
  tax_class: Joi.string(),
  min_price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/),
  max_price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/),
  stock_status: Joi.string().valid('instock', 'outofstock', 'onbackorder'),
  on_sale: Joi.boolean(),
  customer: Joi.number().integer().min(1)
});

// Validation utility functions
export class ValidationUtils {
  static validateConfig(config: WooCommerceConfig): { error?: string; value?: WooCommerceConfig } {
    const { error, value } = wooCommerceConfigSchema.validate(config);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateProduct(product: any): { error?: string; value?: any } {
    const { error, value } = productSchema.validate(product);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateOrder(order: any): { error?: string; value?: any } {
    const { error, value } = orderSchema.validate(order);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateCustomer(customer: any): { error?: string; value?: any } {
    const { error, value } = customerSchema.validate(customer);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateCategory(category: any): { error?: string; value?: any } {
    const { error, value } = categorySchema.validate(category);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateTag(tag: any): { error?: string; value?: any } {
    const { error, value } = tagSchema.validate(tag);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateCoupon(coupon: any): { error?: string; value?: any } {
    const { error, value } = couponSchema.validate(coupon);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static validateListParams(params: any): { error?: string; value?: any } {
    const { error, value } = listParamsSchema.validate(params);
    if (error) {
      return { error: error.details[0].message };
    }
    return { value };
  }

  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
    }
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    return input;
  }
}