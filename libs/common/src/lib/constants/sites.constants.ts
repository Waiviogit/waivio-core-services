export const APP_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const);

export const APP_COLORS = Object.freeze({
  BACKGROUND: 'background',
  FONT: 'font',
  HOVER: 'hover',
  HEADER: 'header',
  BUTTON: 'button',
  BORDER: 'border',
  FOCUS: 'focus',
  LINKS: 'links',
} as const);

export const APP_SHOP_SETTINGS_TYPE = Object.freeze({
  USER: 'user',
  OBJECT: 'object',
} as const);

export const APP_BILLING_TYPE = Object.freeze({
  CRYPTO: 'crypto',
  PAYPAL_SUBSCRIPTION: 'paypal_subscription',
} as const);
