import { Helpers } from '../../globals/helpers/helpers';
import { IAuthDocument } from '../../../features/auth/interfaces/auth.interface';
import { AuthModel } from '../../../features/auth/models/auth.schema';

class AuthService {
  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDocument> {
    const query = {
      $or: [{ username: Helpers.firstLetterUppercase(username) }, { email: Helpers.lowerCase(email) }]
    };

    const user: IAuthDocument = (await AuthModel.findOne(query).exec()) as IAuthDocument;
    return user;
  }
}

export const authService: AuthService = new AuthService();
