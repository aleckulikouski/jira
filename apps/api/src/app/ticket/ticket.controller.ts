import { Controller, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller()
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('columns/:columnId/tickets')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('columnId') columnId: string,
    @Body() dto: CreateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    const ticket = await this.ticketService.create(columnId, req.user.id, dto);
    const projectId = ticket.column.projectId;

    this.eventEmitter.emit('ticket.created', { projectId, ticket });

    return ticket;
  }

  @Patch('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    const ticket = await this.ticketService.update(id, req.user.id, dto);
    const projectId = ticket.column.projectId;

    this.eventEmitter.emit('ticket.updated', { projectId, ticket });

    return ticket;
  }

  @Delete('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    const result = await this.ticketService.delete(id, req.user.id);

    this.eventEmitter.emit('ticket.deleted', { projectId: result.projectId, ticketId: id });

    return { statusCode: 204 };
  }
}
