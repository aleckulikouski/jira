import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ColumnService } from './column.service';

@Controller('projects/:projectId/columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getForProject(@Param('projectId') projectId: string) {
    return this.columnService.getForProject(projectId);
  }
}
