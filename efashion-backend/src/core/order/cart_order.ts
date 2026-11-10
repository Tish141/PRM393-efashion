import { AsyncSafeResult } from '../types';
import { OrderPaymentMethod, OrderResult, PaymentIntents } from './interfaces';
import { OrderPayment } from './order';
import UserModel, { UserDB } from '@/database/models/user';
import CartModel, { CartDB } from '@/database/models/cart';
import { AppError } from '../errors';
import { getCartItemsInfo } from '../user/cart';
import { createPaymentIntents } from '../payment/stripe';
import OrderModel from '@/database/models/order';
import * as Helper from './helper';
import Notification, { NotificationType } from '../notification';

export class CartOrder extends OrderPayment {
  constructor(userId: string) {
    super(userId);
  }
  async getClientSecret(): AsyncSafeResult<PaymentIntents> {
    try {
      const user = await this.getUserWithAddress(); // will throw error if user don't have address

      let clientSecret: string | null = null;
      const { totalPrice } = await this.populateCart(user);
      clientSecret = await createPaymentIntents({
        userId: user._id.toString(),
        totalPrice: totalPrice,
      });
      if (!clientSecret) {
        throw new Error();
      }
      return { result: { clientSecret }, error: null };
    } catch (error) {
      return { error, result: null };
    }
  }
  private async populateCart(
    user: UserDB,
  ): Promise<{ totalPrice: number; user: UserDB; cart: CartDB }> {
    await user.populate<{ cart: CartDB | null }>('cart');
    const cart = user.cart;
    if (!cart) throw AppError.invalid('Cart Not exist');
    if (cart.items.length === 0) {
      throw AppError.invalid('Cart is empty!');
    }
    await cart.populate('items.product');
    const totalPrice = getCartItemsInfo(cart).totalPrice;
    return { totalPrice, user, cart };
  }

  async cash() {
    return this.createOrder('CASH');
  }

  async stripe() {
    return this.createOrder('STRIPE');
  }

  private async createOrder(method: OrderPaymentMethod): AsyncSafeResult<OrderResult> {
    try {
      const user = await this.getUserWithAddress();
      const { cart, totalPrice } = await this.populateCart(user);
      const validCartItems = cart.items.filter(
        p => p.product != null && typeof p.product !== 'string',
      );
      const items = validCartItems.map(p => ({
        product: p.product._id,
        name: p.product.title,
        price: p.product.price - (p.product.discount || 0),
        quantity: p.quantity,
        size: p.size,
        color: p.color,
      }));
      const totalQuantity = validCartItems.reduce((acc, cur) => acc + (cur.quantity || 0), 0);
      const order = await OrderModel.create({
        address: {
          latitude: user.address.latitude,
          longitude: user.address.longitude,
        },
        items,
        paymentMethod: method,
        price: totalPrice,
        tax: 0,
        totalPrice: totalPrice,
        totalQuantity,
        user: this.userId,
        phoneNumber: user.phoneNumber,
        item_type: 'cart',
      });
      await CartModel.findByIdAndRemove(cart._id);
      await UserModel.findByIdAndUpdate(user._id, { $unset: { cart: '' } });
      const notification = new Notification(NotificationType.STATUS_ORDER, this.userId);
      await notification.push({
        title: `Order #${order._id.toString().slice(0, 4)}`,
        body: 'Your order is being processed',
      });
      return { result: Helper._formatOrder(order), error: null };
    } catch (error) {
      return { error, result: null };
    }
  }
}
