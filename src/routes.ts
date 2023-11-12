import { Application } from 'express';
import { authRoutes } from './features/auth/routes/authRoutes';
import { serverAdapter } from './shared/services/queues/base.queue';
import { currentUserRoutes } from './features/auth/routes/currentRoutes';
import { authMiddleware } from './shared/globals/helpers/auth-middleware';
import { postRoutes } from './features/post/routes/postRoutes';
import { reactionRoutes } from './features/reactions/routes/reactionRoutes';
import { commentRoutes } from './features/comments/routes/commentRoutes';
import { followerRoutes } from './features/followers/routes/followerRoutes';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.signoutRoute());

    app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
  };
  routes();
};
