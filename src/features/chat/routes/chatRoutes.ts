import express, { Router } from 'express';
import { authMiddleware } from '../../../shared/globals/helpers/auth-middleware';
import { Add } from '../controllers/add-chat-message';
import { Get } from '../controllers/get-chat-message';
import { Delete } from '../controllers/delete-chat-message';
import { Update } from '../controllers/update-chat-message';
import { Message } from '../controllers/add-message-reaction';

class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/chat/message/conversation-list', authMiddleware.checkAuthentication, Get.prototype.conversationList);
    this.router.get('/chat/message/user/:receiverId', authMiddleware.checkAuthentication, Get.prototype.messages);
    this.router.post('/chat/message', authMiddleware.checkAuthentication, Add.prototype.message);
    this.router.post('/chat/message/add-chat-users', authMiddleware.checkAuthentication, Add.prototype.addChatUsers);
    this.router.post('/chat/message/remove-chat-users', authMiddleware.checkAuthentication, Add.prototype.removeChatUsers);
    this.router.put('/chat/message/mark-as-read', authMiddleware.checkAuthentication, Update.prototype.message);
    this.router.put('/chat/message/reaction', authMiddleware.checkAuthentication, Message.prototype.reaction);
    this.router.delete(
      '/chat/message/mark-as-deleted/:messageId/:senderId/:receiverId/:type',
      authMiddleware.checkAuthentication,
      Delete.prototype.markMessageAsDeleted
    );

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
