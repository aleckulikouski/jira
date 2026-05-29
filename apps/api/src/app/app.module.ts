import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ColumnModule } from './column/column.module';

@Module({
  imports: [AuthModule, ProjectModule, ColumnModule],
})
export class AppModule {}
