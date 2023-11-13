import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '../../../shared/services/redis/user.cache';
import { joiValidation } from '../../../shared/globals/decorators/joi-validation.decorator';
import { addImageSchema } from '../schemes/images';
import { upload } from '../../../shared/globals/helpers/cloudinary-upload';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '../../../shared/globals/helpers/error-handler';
import { IUserDocument } from '../../user/interfaces/user.interface';
import { socketIOImageObject } from '../../../shared/sockets/image';
import { imageQueue } from '../../../shared/services/queues/image.queue';
import { IBgUploadResponse } from '../interfaces/image.interface';
import { Helpers } from '../../../shared/globals/helpers/helpers';
import { config } from '../../../config';

const userCache: UserCache = new UserCache();

export class Add {
  @joiValidation(addImageSchema)
  public async profileImage(req: Request, res: Response): Promise<void> {
    const result: UploadApiResponse = (await upload(req.body.image, req.currentUser!.userId, true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again.');
    }
    const url = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
    const cachedUser: IUserDocument = (await userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'profilePicture',
      url
    )) as IUserDocument;
    socketIOImageObject.emit('update user', cachedUser);
    imageQueue.addImageJob('addUserProfileImageToDB', {
      key: `${req.currentUser!.userId}`,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  @joiValidation(addImageSchema)
  public async backgroundImage(req: Request, res: Response): Promise<void> {
    const { version, publicId }: IBgUploadResponse = await Add.prototype.backgroundUpload(req.body.image);
    const bgImageId: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageId',
      publicId
    ) as Promise<IUserDocument>;
    const bgImageVersion: Promise<IUserDocument> = userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      'bgImageVersion',
      version
    ) as Promise<IUserDocument>;
    const response: [IUserDocument, IUserDocument] = (await Promise.all([bgImageId, bgImageVersion])) as [IUserDocument, IUserDocument];
    socketIOImageObject.emit('update user', {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0]
    });

    //////// QUEUE TO UPDATE IMAGE IN MONGODB ////////
    imageQueue.addImageJob('updateBGImageInDB', {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString()
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Image added successfully' });
  }

  private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
    const isDataURL = Helpers.isDataURL(image);
    let version = '';
    let publicId = '';
    if (isDataURL) {
      const result: UploadApiResponse = (await upload(image)) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      } else {
        version = result.version.toString();
        publicId = result.public_id;
      }
    } else {
      const value = image.split('/');
      version = value[value.length - 2];
      publicId = value[value.length - 1];
    }
    return { version: version.replace(/v/g, ''), publicId };
  }
}
