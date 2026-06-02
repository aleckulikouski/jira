import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';

@Module({
  imports: [AuthModule],
  controllers: [ColumnController],
  providers: [ColumnService],
})
export class ColumnModule {}
