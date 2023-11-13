import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '../../../shared/services/redis/user.cache';
import { IUserDocument } from '../../user/interfaces/user.interface';
import { socketIOImageObject } from '../../../shared/sockets/image';
import { imageQueue } from '../../../shared/services/queues/image.queue';
import { IFileImageDocument } from '../interfaces/image.interface';
import { imageService } from '../../../shared/services/db/image.service';

const userCache: UserCache = new UserCache();

export class Delete {
  public async image(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;
    socketIOImageObject.emit('delete image', imageId);
    imageQueue.addImageJob('removeImageFromDB', {
      imageId
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }

  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const image: IFileImageDocument = await imageService.getImageByBackgroundId(req.params.bgImageId);
    socketIOImageObject.emit('delete image', image?._id);
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      ''
    ) as Promise<IUserDocument>;
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      ''
    ) as Promise<IUserDocument>;
    (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];
    imageQueue.addImageJob('removeImageFromDB', {
      imageId: image?._id
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image deleted successfully' });
  }
}
