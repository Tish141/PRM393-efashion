import CartModel, { CartDB } from '@/database/models/cart';
import { CartItemData, CartResult } from './interfaces';
import ProductModel from '@/database/models/product';
import { AppError } from '../errors';
import { Types } from 'mongoose';
import { AsyncSafeResult } from '../types';

export class Cart {
  constructor(private cart: CartDB) {}

  static async createCart(): Promise<CartDB> {
    return await CartModel.create({});
  }

  private _recalculateTotalQuantity() {
    this.cart.totalQuantity = this.cart.items.reduce((acc, cur) => acc + (cur.quantity || 0), 0);
  }

  async addItem(item: CartItemData): AsyncSafeResult<CartResult> {
    try {
      const product = await ProductModel.findById(item.id);
      if (!product) {
        throw AppError.invalid('Product not found.');
      }

      const itemIndex = this.cart.items.findIndex(
        i =>
          i.product &&
          i.product.toString() === product._id.toString() &&
          item.color === i.color &&
          item.size === i.size,
      );

      if (itemIndex !== -1) {
        this.cart.items[itemIndex].quantity += item.quantity;
      } else {
        const cartItem = {
          product: product._id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        };
        this.cart.items.push(cartItem);
      }

      this._recalculateTotalQuantity();
      await this.cart.save();

      return { result: await this._formatCart(), error: null };
    } catch (err) {
      return { error: err, result: null };
    }
  }

  async removeItem(id: string): AsyncSafeResult<CartResult> {
    try {
      const item = this.cart.items.find(i => i._id?.toString() === id);
      if (!item) throw AppError.invalid('Product with id ' + id + ' not found.');
      (this.cart.items as Types.DocumentArray<any>).pull({ _id: id });
      this._recalculateTotalQuantity();
      await this.cart.save();
      return { result: await this._formatCart(), error: null };
    } catch (err) {
      return { error: err, result: null };
    }
  }

  async editItemQuantity(id: string, newQ: number): AsyncSafeResult<CartResult> {
    try {
      const itemIndex = this.cart.items.findIndex(i => i._id?.toString() === id);
      if (itemIndex === -1) throw AppError.invalid('Product with id ' + id + ' not found.');
      const newItem = (this.cart.items as Types.DocumentArray<any>)[itemIndex];
      newItem.quantity = newQ;
      (this.cart.items as Types.DocumentArray<any>).set(itemIndex, newItem);
      this._recalculateTotalQuantity();
      await this.cart.save();
      return { result: await this._formatCart(), error: null };
    } catch (err) {
      return { error: err, result: null };
    }
  }

  async getCart(): Promise<CartResult> {
    return await this._formatCart();
  }

  private async _formatCart(): Promise<CartResult> {
    await this.cart.populate('items.product');
    const validItems = this.cart.items.filter(i => i.product != null && typeof i.product !== 'string');
    const { totalPrice } = getCartItemsInfo(this.cart);
    const totalQuantity = validItems.reduce((acc, cur) => acc + (cur.quantity || 0), 0);
    return {
      items: validItems.map(i => {
        const discount = i.product.discount || 0;
        const unitPrice = i.product.price - discount;
        return {
          id: i._id!.toString(),
          productId: i.product._id,
          title: i.product.title,
          color: i.color,
          size: i.size,
          imageUrl: i.product.imagesURL[0],
          stock: i.product.stock,
          quantity: i.quantity,
          price: unitPrice,
          totalPrice: unitPrice * i.quantity,
          oldPrice: i.product.price,
          oldTotalPrice: i.product.price * i.quantity,
        };
      }),
      subtotal: totalPrice,
      totalQuantity,
      tax: 0,
      total: totalPrice,
    };
  }
}

export function getCartItemsInfo(cart: CartDB) {
  let result: { totalPrice: number } = { totalPrice: 0 };
  for (const i of cart.items) {
    if (!i.product || typeof i.product === 'string') continue;
    result.totalPrice += (i.product.price - (i.product.discount || 0)) * i.quantity;
  }
  return result;
}
