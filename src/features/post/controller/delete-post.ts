import { Request, Response } from 'express';
import { PostCache } from '../../../shared/services/redis/post.cache';
import HTTP_STATUS from 'http-status-codes';
import { postQueue } from '../../../shared/services/queues/post.queue';
import { socketIOPostObject } from '../../../shared/sockets/post';

const postCache: PostCache = new PostCache();

export class Delete {
  public async post(req: Request, res: Response): Promise<void> {
    socketIOPostObject.emit('delete post', req.params.postId);
    await postCache.deletePostFromCache(req.params.postId, `${req.currentUser!.userId}`);
    postQueue.addPostJob('deletePostFromDB', { keyOne: req.params.postId, keyTwo: req.currentUser!.userId });
    res.status(HTTP_STATUS.OK).json({ message: 'Post deleted successfully' });
  }
}
