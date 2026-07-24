import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  EMAIL_PROVIDER: Joi.string().valid('ses', 'resend', 'console').default('console'),
  AWS_REGION: Joi.string().allow('').optional(),
  SES_FROM_ADDRESS: Joi.string().allow('').optional(),
  RESEND_API_KEY: Joi.string().allow('').optional(),
  RESEND_FROM_ADDRESS: Joi.string().allow('').optional(),
  CORS_ORIGINS: Joi.string().allow('').optional(),
});
