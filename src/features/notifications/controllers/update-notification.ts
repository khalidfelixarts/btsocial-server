import { notificationQueue } from '../../../shared/services/queues/notification.queue';
import { socketIONotificationObject } from '../../../shared/sockets/notification';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Update {
  public async notification(req: Request, res: Response): Promise<void> {
    const { notificationId } = req.params;
    socketIONotificationObject.emit('update notification', notificationId);
    notificationQueue.addNotificationJob('updateNotification', { key: notificationId });
    res.status(HTTP_STATUS.OK).json({ message: 'Notification marked as read' });
  }
}
