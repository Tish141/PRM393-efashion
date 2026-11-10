import Joi from 'joi';

export const devSchema = Joi.object({
  device: Joi.string().trim().min(3),
  device_token: Joi.string().trim().min(3),
}).or('device', 'device_token');
