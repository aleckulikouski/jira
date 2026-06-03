import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ColumnModule } from './column/column.module';
import { TicketModule } from './ticket/ticket.module';

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
    ColumnModule,
    TicketModule,
  ],
})
export class AppModule {}
