import Joi from 'joi';

export interface OrderSchema {
  collectionId?: string;
  type?: string;
}

export const orderSchema = Joi.object({
  collectionId: Joi.string().allow('', null),
  type: Joi.string().allow('', null),
});
