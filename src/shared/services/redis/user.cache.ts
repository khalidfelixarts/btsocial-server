import Logger from 'bunyan';
import { IUserDocument } from '../../../features/user/interfaces/user.interface';
import { BaseCache } from './base.cache';
import { config } from '../../../config';
import { ServerError } from 'src/shared/globals/helpers/error-handler';
import { Helpers } from 'src/shared/globals/helpers/helpers';

const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache {
  constructor() {
    super('userCache');
  }

  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDocument): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;

    // const firstList: string[] = [
    //   '_id',
    //   `${_id}`,
    //   'uId',
    //   `${uId}`,
    //   'username',
    //   `${username}`,
    //   'email',
    //   `${email}`,
    //   'avatarColor',
    //   `${avatarColor}`,
    //   'createdAt',
    //   `${createdAt}`,
    //   'postsCount',
    //   `${postsCount}`
    // ];
    // const secondList: string[] = [
    //   'blocked',
    //   JSON.stringify(blocked),
    //   'blockedBy',
    //   JSON.stringify(blockedBy),
    //   'profilePicture',
    //   `${profilePicture}`,
    //   'followersCount',
    //   `${followersCount}`,
    //   'followingCount',
    //   `${followingCount}`,
    //   'notifications',
    //   JSON.stringify(notifications),
    //   'social',
    //   JSON.stringify(social)
    // ];
    // const thirdList: string[] = [
    //   'work',
    //   `${work}`,
    //   'location',
    //   `${location}`,
    //   'school',
    //   `${school}`,
    //   'quote',
    //   `${quote}`,
    //   'bgImageVersion',
    //   `${bgImageVersion}`,
    //   'bgImageId',
    //   `${bgImageId}`
    // ];

    // const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

    const dataToSave = {
      _id: `${_id}`,
      uId: `${uId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      createdAt: `${createdAt}`,
      postsCount: `${postsCount}`,
      blocked: JSON.stringify(blocked),
      blockedBy: JSON.stringify(blockedBy),
      profilePicture: `${profilePicture}`,
      followersCount: `${followersCount}`,
      followingCount: `${followingCount}`,
      notifications: JSON.stringify(notifications),
      social: JSON.stringify(social),
      work: `${work}`,
      location: `${location}`,
      school: `${school}`,
      quote: `${quote}`,
      bgImageVersion: `${bgImageVersion}`,
      bgImageId: `${bgImageId}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });

      // await this.client.HSET(`users:${key}`, dataToSave);
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`users:${key}`, `${itemKey}`, `${itemValue}`);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server Error, Try again.');
    }
  }

  public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: IUserDocument = (await this.client.HGETALL(`users:${userId}`)) as unknown as IUserDocument;
      response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
      response.postsCount = Helpers.parseJson(`${response.postsCount}`);
      response.blocked = Helpers.parseJson(`${response.blocked}`);
      response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
      response.notifications = Helpers.parseJson(`${response.notifications}`);
      response.social = Helpers.parseJson(`${response.social}`);
      response.followersCount = Helpers.parseJson(`${response.followersCount}`);
      response.followingCount = Helpers.parseJson(`${response.followingCount}`);
      // response.bgImageId = Helpers.parseJson(`${response.bgImageId}`);
      // response.bgImageVersion = Helpers.parseJson(`${response.bgImageVersion}`);
      // response.profilePicture = Helpers.parseJson(`${response.profilePicture}`);
      // response.work = Helpers.parseJson(`${response.work}`);
      // response.school = Helpers.parseJson(`${response.school}`);
      // response.location = Helpers.parseJson(`${response.location}`);
      // response.quote = Helpers.parseJson(`${response.quote}`);

      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error, Try again');
    }
  }
}