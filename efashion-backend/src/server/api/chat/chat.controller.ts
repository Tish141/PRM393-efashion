import { Controller, Validate } from '@server/decorator';
import RequestError, { unwrapResult } from '@server/utils/errors';
import { HttpStatus } from '@server/utils/status';
import { Request, Response } from 'express';
import { createChat, getChatMessages, getUserChat, saveMessageToChat } from '@/core/chat';
import { NewMessageSchema, newMessageSchema } from './chat.valid';
import { validateId } from '@/core/utils';
import { SocketEvent, emitUserEvent, inWebSocket } from '@server/websocket/sockets';
import Notification, { NotificationType } from '@/core/notification';

@Controller()
class UserController {
  async newChat(req: Request, res: Response) {
    const userId = req.userId!;
    const chat = await createChat(userId);
    unwrapResult(chat);
    res.JSON(HttpStatus.Created, chat.result);
  }

  async getChat(req: Request, res: Response) {
    const userId = req.userId!;
    let chat = await getUserChat(userId);
    if (chat.error || !chat.result) {
      chat = await createChat(userId);
    }
    unwrapResult(chat);
    res.JSON(HttpStatus.Ok, chat.result);
  }

  @Validate(newMessageSchema)
  async sendMessage(req: Request, res: Response) {
    const body: NewMessageSchema = req.body;
    const chatId = req.params['id'];
    if (!validateId(chatId)) throw new RequestError('Invalid Chat id', HttpStatus.BadRequest);

    const content = body.content || body.message || '';
    const messageResult = await saveMessageToChat(chatId, req.userId!, content);
    const message = unwrapResult(messageResult);
    const io = req.app.get('io');

    if (message.to) {
      if (inWebSocket(message.to)) {
        emitUserEvent(io, message.to, SocketEvent.NEW_MESSAGE, {
          ...message.message,
          me: false,
        });
      } else if (message.to === message.userId) {
        const notification = new Notification(NotificationType.NEW_MESSAGE, message.to);
        await notification.push({
          title: 'New Message',
          body: message.message.content,
        });
      }
    } else if (!message.hasAdmin) {
      // Auto-reply from E-Fashion Support when no live admin is assigned yet
      setTimeout(async () => {
        try {
          const replyText =
            'Thank you for contacting E-Fashion Support! Our team has received your message and is assisting you.';
          const autoReplyResult = await saveMessageToChat(chatId, 'support', replyText);
          if (!autoReplyResult.error && autoReplyResult.result) {
            const reply = autoReplyResult.result;
            if (inWebSocket(reply.to)) {
              emitUserEvent(io, reply.to, SocketEvent.NEW_MESSAGE, {
                ...reply.message,
                me: false,
              });
            }
            const notification = new Notification(NotificationType.NEW_MESSAGE, reply.to);
            await notification.push({
              title: 'Support Reply',
              body: reply.message.content,
            });
          }
        } catch (err) {
          log.error(err);
        }
      }, 800);
    }

    res.JSON(HttpStatus.Created, message.message);
  }

  async getMessages(req: Request, res: Response) {
    const messages = await getChatMessages(req.params['id'], req.userId!);
    unwrapResult(messages);
    res.JSON(HttpStatus.Ok, messages.result);
  }
}

export default new UserController();
