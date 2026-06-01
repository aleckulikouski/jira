import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ColumnModule } from './column/column.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [AuthModule, ProjectModule, ColumnModule, TicketModule],
})
export class AppModule {}
