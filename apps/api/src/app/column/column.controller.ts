import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';

@Controller()
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Get('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async getForProject(@Param('projectId') projectId: string, @Request() req: RequestWithUser) {
    return this.columnService.getForProject(projectId, req.user.id);
  }

  @Post('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    return this.columnService.create(projectId, req.user.id, dto.name, dto.afterColumnId);
  }

  @Patch('projects/:projectId/columns/reorder')
  @UseGuards(JwtAuthGuard)
  async reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderColumnsDto,
    @Request() req: RequestWithUser,
  ) {
    await this.columnService.reorder(projectId, req.user.id, dto.orderedIds);
    return { statusCode: 200 };
  }

  @Patch('columns/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    return this.columnService.update(id, req.user.id, dto);
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.columnService.delete(id, req.user.id);
    return { statusCode: 204 };
  }
}
