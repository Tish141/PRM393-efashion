import Joi from 'joi';

export const newMessageSchema = Joi.object({
  content: Joi.string().trim(),
  message: Joi.string().trim(),
}).or('content', 'message');

export interface NewMessageSchema {
  content?: string;
  message?: string;
}
