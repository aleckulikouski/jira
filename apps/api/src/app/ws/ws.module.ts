import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WsGateway } from './ws.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { WsNotifierService } from './ws-notifier.service';

@Module({
  imports: [AuthModule],
  providers: [WsGateway, WsJwtGuard, WsNotifierService],
})
export class WsModule {}
