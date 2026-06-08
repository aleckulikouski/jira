import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { BoardModule } from './board/board.module';
import { WsModule } from './ws/ws.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: process.env['UPLOADS_DIR'] ?? join(__dirname, 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ProjectModule,
    BoardModule,
    WsModule,
  ],
})
export class AppModule {}
