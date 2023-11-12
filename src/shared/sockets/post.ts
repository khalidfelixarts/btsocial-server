import { Server, Socket } from 'socket.io';
import { ICommentDocument } from 'src/features/comments/interfaces/comment.interface';
import { IReactionDocument } from 'src/features/reactions/interfaces/reaction.interface';

export let socketIOPostObject: Server;

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('reaction', (reaction: IReactionDocument) => {
        this.io.emit('update like', reaction);
      });

      socket.on('reaction', (data: ICommentDocument) => {
        this.io.emit('update comment', data);
      });
    });
  }
}
