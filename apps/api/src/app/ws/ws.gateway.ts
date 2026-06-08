import { UseGuards, NotFoundException } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaService } from '../prisma.service';
import type { ServerToClientEvents } from '@org/shared-types';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4200' },
})
@UseGuards(WsJwtGuard)
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server!: Server<ServerToClientEvents>;

  private readonly logger = new Logger(WsGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): Promise<void> {
    const userId = client.data.user?.id;
    if (!userId) return;

    // Verify project exists. Authorization is intentionally open —
    // any authenticated user can access any project, matching the
    // existing REST authorization model (see issue 038).
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const room = `project:${data.projectId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ): Promise<void> {
    const room = `project:${data.projectId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left ${room}`);
  }

  emitToProject<Ev extends keyof ServerToClientEvents>(
    event: Ev,
    projectId: string,
    ...args: Parameters<ServerToClientEvents[Ev]>
  ): void {
    const room = `project:${projectId}`;
    this.server.to(room).emit(event, ...args);
  }
}
