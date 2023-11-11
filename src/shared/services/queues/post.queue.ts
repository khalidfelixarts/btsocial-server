import { postWorker } from 'src/shared/workers/post.worker';
import { BaseQueue } from './base.queue';
import { IPostJobData } from 'src/features/post/interfaces/post.interface';

class PostQueue extends BaseQueue {
  constructor() {
    super('posts');
    this.processJob('addPostToDB', 5, postWorker.savePostToDB);
  }

  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
