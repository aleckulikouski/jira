import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll() {
    return this.projectService.getAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProjectDto, @Request() req: RequestWithUser) {
    return this.projectService.create(dto, req.user.id);
  }

  @Get(':id/board')
  @UseGuards(JwtAuthGuard)
  async getBoard(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.projectService.getBoard(id, req.user.id);
  }
}
