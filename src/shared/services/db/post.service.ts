import { UpdateQuery } from 'mongoose';
import { IGetPostsQuery, IPostDocument } from 'src/features/post/interfaces/post.interface';
import { PostModel } from 'src/features/post/models/post.schema';
import { IUserDocument } from 'src/features/user/interfaces/user.interface';
import { UserModel } from 'src/features/user/models/user.schema';

class PostService {
  public async addPostToDB(userId: string, createdPost: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } });
    await Promise.all([post, user]);
  }

  public async getPosts(query: IGetPostsQuery, skip = 0, limit = 0, sort: Record<string, 1 | -1>): Promise<IPostDocument[]> {
    let postQuery = {};
    if (query?.imgId && query?.gifUrl) {
      postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
    } else if (query?.videoId) {
      postQuery = { $or: [{ videoId: { $ne: '' } }] };
    } else {
      postQuery = query;
    }
    const posts: IPostDocument[] = await PostModel.aggregate([{ $match: postQuery }, { $sort: sort }, { $skip: skip }, { $limit: limit }]);
    return posts;
  }

  public async postsCount(): Promise<number> {
    const count: number = await PostModel.find({}).countDocuments();
    return count;
  }
}

export const postService: PostService = new PostService();
