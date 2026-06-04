import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/auth.types';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller()
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('columns/:columnId/tickets')
  @UseGuards(JwtAuthGuard)
  async getForColumn(@Param('columnId') columnId: string, @Request() req: RequestWithUser) {
    return this.ticketService.getForColumn(columnId, req.user.id);
  }

  @Post('columns/:columnId/tickets')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('columnId') columnId: string,
    @Body() dto: CreateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ticketService.create(columnId, req.user.id, dto);
  }

  @Patch('tickets/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: RequestWithUser,
  ) {
    return this.ticketService.update(id, req.user.id, dto);
  }

  @Delete('tickets/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.ticketService.delete(id, req.user.id);
    return { statusCode: 204 };
  }
}
