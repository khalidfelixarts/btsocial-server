import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { MessageCache } from '../../../shared/services/redis/message.cache';
import { IMessageData } from '../interfaces/chat.interface';
import { socketIOChatObject } from '../../../shared/sockets/chat';
import { chatQueue } from '../../../shared/services/queues/chat.queue';

const messageCache: MessageCache = new MessageCache();

export class Delete {
  public async markMessageAsDeleted(req: Request, res: Response): Promise<void> {
    const { senderId, receiverId, messageId, type } = req.params;

    ////////// UPDATE CHANGES IN CACHE ////////
    const updatedMessage: IMessageData = await messageCache.markMessageAsDeleted(`${senderId}`, `${receiverId}`, `${messageId}`, type);

    //////// SOCKET EMIT FOR THE EVENT //////////
    socketIOChatObject.emit('message read', updatedMessage);
    socketIOChatObject.emit('chat list', updatedMessage);

    ////////// QUEUE TO REFLECT CHANGES IN MONGO DB /////////
    chatQueue.addChatJob('markMessageAsDeletedInDB', {
      messageId: new mongoose.Types.ObjectId(messageId),
      type
    });

    res.status(HTTP_STATUS.OK).json({ message: 'Message marked as deleted' });
  }
}
