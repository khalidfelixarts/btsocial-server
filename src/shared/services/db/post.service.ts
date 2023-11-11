import { UpdateQuery } from 'mongoose';
import { IPostDocument } from 'src/features/post/interfaces/post.interface';
import { PostModel } from 'src/features/post/models/post.schema';
import { IUserDocument } from 'src/features/user/interfaces/user.interface';
import { UserModel } from 'src/features/user/models/user.schema';

class PostService {
  public async addPostToDB(userId: string, createdPost: IPostDocument): Promise<void> {
    const post: Promise<IPostDocument> = PostModel.create(createdPost);
    const user: UpdateQuery<IUserDocument> = UserModel.updateOne({ _id: userId }, { $inc: { postsCount: 1 } });
    await Promise.all([post, user]);
  }
}

export const postService: PostService = new PostService();
