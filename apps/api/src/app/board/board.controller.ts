import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { BoardService } from './board.service';
import { WsGateway } from '../ws/ws.gateway';
import { CreateColumnDto } from '../column/dto/create-column.dto';
import { UpdateColumnDto } from '../column/dto/update-column.dto';
import { ReorderColumnsDto } from '../column/dto/reorder-columns.dto';
import { CreateTicketDto } from '../ticket/dto/create-ticket.dto';
import { UpdateTicketDto } from '../ticket/dto/update-ticket.dto';
import type { BroadcastEvent } from './board.types';

@Controller()
export class BoardController {
  constructor(
    private readonly board: BoardService,
    private readonly ws: WsGateway,
  ) {}

  @Get('projects/:id/board')
  @UseGuards(JwtAuthGuard)
  async getBoard(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.board.getBoard(id, req.user.id);
  }

  @Post('projects/:projectId/columns')
  @UseGuards(JwtAuthGuard)
  async createColumn(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    const { column, broadcast } = await this.board.createColumn(
      projectId,
      req.user.id,
      dto.name,
      dto.afterColumnId,
    );
    this.#broadcast(broadcast);
    return column;
  }

  @Patch('columns/:id')
  @UseGuards(JwtAuthGuard)
  async updateColumn(
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @Request() req: RequestWithUser,
  ) {
    const { column, broadcast } = await this.board.updateColumn(
      id,
      req.user.id,
      dto,
    );
    this.#broadcast(broadcast);
    return column;
  }

  @Delete('columns/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteColumn(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const { broadcast } = await this.board.deleteColumn(id, req.user.id);
    this.#broadcast(broadcast);
  }

  @Patch('projects/:projectId/columns/reorder')
  @UseGuards(JwtAuthGuard)
  async reorderColumns(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderColumnsDto,
    @Request() req: RequestWithUser,
  ) {
    const { broadcast } = await this.board.reorderColumns(
      projectId,
      req.user.id,
      dto.orderedIds,
    );
    this.#broadcast(broadcast);
    return { statusCode: 200 };
  }

  @Post('columns/:columnId/tickets')
  @UseGuards(JwtAuthGuard)
  async createTicket(
    @Param('columnId') columnId: string,
    @Body() dto: CreateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    const { ticket, broadcast } = await this.board.createTicket(
      columnId,
      req.user.id,
      dto,
    );
    this.#broadcast(broadcast);
    return ticket;
  }

  @Patch('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async updateTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    const { ticket, broadcast } = await this.board.updateTicket(
      id,
      req.user.id,
      dto,
    );
    this.#broadcast(broadcast);
    return ticket;
  }

  @Delete('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    const { broadcast } = await this.board.deleteTicket(id, req.user.id);
    this.#broadcast(broadcast);
  }

  #broadcast(event: BroadcastEvent): void {
    this.ws.emitToProject(
      event.event as any,
      event.projectId,
      event.payload,
    );
  }
}
