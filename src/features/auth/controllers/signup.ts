import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '../../../shared/globals/decorators/joi-validation.decorator';
import { signupSchema } from '../schemes/signup';
import { IAuthDocument, ISignUpData } from '../interfaces/auth.interface';
import { authService } from '../../../shared/services/db/auth.service';
import { BadRequestError } from '../../../shared/globals/helpers/error-handler';
import { Helpers } from '../../../shared/globals/helpers/helpers';
import { UploadApiResponse } from 'cloudinary';
import { upload } from '../../../shared/globals/helpers/cloudinary-upload';
import HTTP_STATUS from 'http-status-codes';
import { IUserDocument } from '../../../features/user/interfaces/user.interface';
import { UserCache } from '../../../shared/services/redis/user.cache';
import { omit } from 'lodash';
import JWT from 'jsonwebtoken';
import { authQueue } from 'src/shared/services/queues/auth.queue';
import { userQueue } from 'src/shared/services/queues/user.queue';
import { config } from '../../../config';

const userCache: UserCache = new UserCache();

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;
    const checkIfUserExist: IAuthDocument = await authService.getUserByUsernameOrEmail(username, email);
    if (checkIfUserExist) {
      throw new BadRequestError('Invalid credentials');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${Helpers.generateRandomIntegers(12)}`;
    const authData: IAuthDocument = SignUp.prototype.signupData({
      _id: authObjectId,
      uId,
      username,
      email,
      password,
      avatarColor
    });

    const result: UploadApiResponse = (await upload(avatarImage, `${userObjectId}`, true, true)) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError('File upload: error occurred, Try again');
    }

    // ///////////////////////////////////
    // //ADD TO REDIS CACHE
    const userDataForCache: IUserDocument = SignUp.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // //ADD TO DATABASE
    omit(userDataForCache, ['uId', 'username', 'email', 'avatarColor', 'password']);
    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserToDB', { value: userDataForCache });
    //////////////////////////////////

    const userJwt: string = SignUp.prototype.signToken(authData, userObjectId);
    req.session = { jwt: userJwt };

    res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', user: userDataForCache, token: userJwt });
  }

  private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        userId: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.JWT_TOKEN!
    );
  }

  private signupData(data: ISignUpData): IAuthDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email: Helpers.lowerCase(email),
      password,
      avatarColor,
      createdAt: new Date()
    } as IAuthDocument;
  }

  private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
    const { _id, username, email, uId, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username: Helpers.firstLetterUppercase(username),
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDocument;
  }
}
