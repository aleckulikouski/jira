import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return false;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string }>(token);
      client.data.user = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      client.disconnect();
      return false;
    }
  }
}
