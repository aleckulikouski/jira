import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Controller()
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Get('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async getForProject(@Param('projectId') projectId: string, @Request() req: any) {
    return this.columnService.getForProject(projectId, req.user.id);
  }

  @Post('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Request() req: any,
  ) {
    return this.columnService.create(projectId, req.user.id, dto.name);
  }

  @Patch('columns/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Request() req: any,
  ) {
    return this.columnService.update(id, req.user.id, dto);
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.columnService.delete(id, req.user.id);
    return { statusCode: 204 };
  }
}
