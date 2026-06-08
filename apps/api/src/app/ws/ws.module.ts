import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WsGateway } from './ws.gateway';
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [AuthModule],
  providers: [WsGateway, WsJwtGuard],
  exports: [WsGateway],
})
export class WsModule {}
