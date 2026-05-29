import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMine(@Request() req: any) {
    return this.projectService.getForUser(req.user.id);
  }
}
