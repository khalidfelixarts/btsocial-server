import { Request, Response } from 'express';
import * as cloudinaryUploads from '../../../../shared/globals/helpers/cloudinary-upload';
import { authMockRequest, authMockResponse } from 'src/mocks/auth.mock';
import { SignUp } from '../signup';
import { CustomError } from 'src/shared/globals/helpers/error-handler';

jest.mock('../../../../shared/services/queues/base.queue');
jest.mock('../../../../shared/services/redis/user.cache');
jest.mock('../../../../shared/services/queues/user.queue.ts');
jest.mock('../../../../shared/services/queues/auth.queue.ts');
jest.mock('../../../../shared/globals/helpers/cloudinary-upload');

describe('SignUp', () => {
  it('username is a required field', () => {
    const req: Request = authMockRequest(
      {},
      {
        username: '',
        email: 'khalid@test.com',
        password: 'qwerty',
        avatarColor: 'red',
        avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
      }
    ) as Request;
    const res: Response = authMockResponse();

    SignUp.prototype.create(req, res).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors()).toEqual('username is a required field');
    });
  });
});
