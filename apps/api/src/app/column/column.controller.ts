import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';

@Controller()
export class ColumnController {
  constructor(
    private readonly columnService: ColumnService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    const column = await this.columnService.create(projectId, req.user.id, dto.name, dto.afterColumnId);

    this.eventEmitter.emit('column.created', { projectId: column.projectId, column });

    return column;
  }

  @Patch('projects/:projectId/columns/reorder')
  @UseGuards(JwtAuthGuard)
  async reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderColumnsDto,
    @Request() req: RequestWithUser,
  ) {
    await this.columnService.reorder(projectId, req.user.id, dto.orderedIds);

    this.eventEmitter.emit('columns.reordered', { projectId, orderedIds: dto.orderedIds });

    return { statusCode: 200 };
  }

  @Patch('columns/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    const column = await this.columnService.update(id, req.user.id, dto);

    this.eventEmitter.emit('column.updated', { projectId: column.projectId, column });

    return column;
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const result = await this.columnService.delete(id, req.user.id);

    this.eventEmitter.emit('column.deleted', { projectId: result.projectId, columnId: id });

    return { statusCode: 204 };
  }
}
