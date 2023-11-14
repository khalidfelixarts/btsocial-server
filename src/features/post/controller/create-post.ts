import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '../../../shared/globals/decorators/joi-validation.decorator';
import { postSchema, postWithImageSchema, postWithVideoSchema } from '../schemes/post.schemes';
import { IPostDocument } from '../interfaces/post.interface';
import { PostCache } from '../../../shared/services/redis/post.cache';
import { socketIOPostObject } from '../../../shared/sockets/post';
import { postQueue } from '../../../shared/services/queues/post.queue';
import { UploadApiResponse } from 'cloudinary';
import { upload, videoUpload } from '../../../shared/globals/helpers/cloudinary-upload';
import { BadRequestError } from '../../../shared/globals/helpers/error-handler';
import { imageQueue } from '../../../shared/services/queues/image.queue';

const postCache: PostCache = new PostCache();

export class Create {
  @joiValidation(postSchema)
  public async post(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings } = req.body;

    const postObjectId: ObjectId = new ObjectId();

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as unknown as IPostDocument;

    socketIOPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });

    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created successfully' });
  }

  ////////////////////////////////////////////////////////////////////
  ////////////////// POST WITH IMAGE FEATURE /////////////////////////
  ////////////////////////////////////////////////////////////////////

  @joiValidation(postWithImageSchema)
  public async postWithImage(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, image } = req.body;

    const result: UploadApiResponse = (await upload(image)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();

    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: result.version.toString(),
      imgId: result.public_id,
      videoId: '',
      videoVersion: '',
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as unknown as IPostDocument;

    socketIOPostObject.emit('add post', createdPost);

    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });

    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });

    ////////////// NEED TO CALL IMAGE QUEUE TO ADD IMAGE TO MONGODB /////////////////////////
    imageQueue.addImageJob('addImageToDB', {
      key: `${req.currentUser!.userId}`,
      imgId: result.public_id,
      imgVersion: result.version.toString()
    });

    res.status(HTTP_STATUS.CREATED).json({ message: 'IMG Post created successfully' });
  }

  /////////////// VIDEO POST FEATURE /////////////////////
  @joiValidation(postWithVideoSchema)
  public async postWithVideo(req: Request, res: Response): Promise<void> {
    const { post, bgColor, privacy, gifUrl, profilePicture, feelings, video } = req.body;

    const result: UploadApiResponse = (await videoUpload(video)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError(result.message);
    }

    const postObjectId: ObjectId = new ObjectId();
    const createdPost: IPostDocument = {
      _id: postObjectId,
      userId: req.currentUser!.userId,
      username: req.currentUser!.username,
      email: req.currentUser!.email,
      avatarColor: req.currentUser!.avatarColor,
      profilePicture,
      post,
      bgColor,
      feelings,
      privacy,
      gifUrl,
      commentsCount: 0,
      imgVersion: '',
      imgId: '',
      videoId: result.public_id,
      videoVersion: result.version.toString(),
      createdAt: new Date(),
      reactions: { like: 0, love: 0, happy: 0, sad: 0, wow: 0, angry: 0 }
    } as IPostDocument;
    socketIOPostObject.emit('add post', createdPost);
    await postCache.savePostToCache({
      key: postObjectId,
      currentUserId: `${req.currentUser!.userId}`,
      uId: `${req.currentUser!.uId}`,
      createdPost
    });
    postQueue.addPostJob('addPostToDB', { key: req.currentUser!.userId, value: createdPost });
    res.status(HTTP_STATUS.CREATED).json({ message: 'Post created with video successfully' });
  }
}
