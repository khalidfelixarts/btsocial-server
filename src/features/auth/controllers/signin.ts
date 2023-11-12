import { Request, Response } from 'express';
import { config } from '../../../config';
import JWT from 'jsonwebtoken';
import { joiValidation } from '../../../shared/globals/decorators/joi-validation.decorator';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '../../../shared/services/db/auth.service';
import { BadRequestError } from '../../../shared/globals/helpers/error-handler';
import { loginSchema } from '../schemes/signin';
import { IAuthDocument } from '../interfaces/auth.interface';
import { userService } from '../../../shared/services/db/user.service';
import { IUserDocument } from '../../user/interfaces/user.interface';

//////////// EMAIL SENT TEST //////////////
// import { IResetPasswordParams } from 'src/features/user/interfaces/user.interface';
// import { emailQueue } from 'src/shared/services/queues/email.queue';
// import moment from 'moment';
// import publicIP from 'ip';
// import { resetPasswordTemplate } from 'src/shared/services/emails/templates/reset-password/reset-password-template';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }

    const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);

    const userJwt: string = JWT.sign(
      {
        userId: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );

    ///////////// EMAIL SENT TEST CODE ////////////////
    // const templateParams: IResetPasswordParams = {
    //   username: existingUser.username!,
    //   email: existingUser.email!,
    //   ipaddress: publicIP.address(),
    //   date: moment().format('DD//MM//YYYY HH:mm')
    // };

    // const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    // emailQueue.addEmailJob('forgotPasswordEmail', {
    //   template,
    //   receiverEmail: 'gino42@ethereal.email',
    //   subject: 'Password reset confirmation'
    // });
    //////////////////////////////////////////////////

    req.session = { jwt: userJwt };

    const userDocument: IUserDocument = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDocument;

    res.status(HTTP_STATUS.OK).json({ message: 'User Logged In Successfully', user: userDocument, token: userJwt });
  }
}
