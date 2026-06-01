import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async getForColumn(columnId: string, userId: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { project: true },
    });
    if (!column) throw new NotFoundException();
    if (column.project.ownerId !== userId) throw new ForbiddenException();

    return this.prisma.ticket.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });
  }

  async create(columnId: string, userId: string, data: { title: string; description?: string }) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { project: true },
    });
    if (!column) throw new NotFoundException();
    if (column.project.ownerId !== userId) throw new ForbiddenException();

    const maxPosition = await this.prisma.ticket.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.ticket.create({
      data: {
        columnId,
        title: data.title,
        description: data.description ?? '',
        position: nextPosition,
      },
    });
  }

  async update(
    ticketId: string,
    userId: string,
    data: { title?: string; description?: string; columnId?: string; position?: number },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { column: { include: { project: true } } },
    });
    if (!ticket) throw new NotFoundException();
    if (ticket.column.project.ownerId !== userId) throw new ForbiddenException();

    const { columnId, position, ...rest } = data;
    const hasPositionChange = columnId !== undefined || position !== undefined;

    if (!hasPositionChange) {
      return this.prisma.ticket.update({ where: { id: ticketId }, data: rest });
    }

    const targetColumnId = columnId ?? ticket.columnId;
    const targetPosition = position ?? ticket.position;

    // If changing column, verify target column ownership
    if (columnId !== undefined && columnId !== ticket.columnId) {
      const targetColumn = await this.prisma.boardColumn.findUnique({
        where: { id: targetColumnId },
        include: { project: true },
      });
      if (!targetColumn) throw new NotFoundException();
      if (targetColumn.project.ownerId !== userId) throw new ForbiddenException();
    }

    // Transactional renumbering
    return this.prisma.$transaction(async (tx) => {
      // Bump all tickets at or after the target position in the target column
      // Update from highest to lowest to avoid conflicts
      const ticketsToBump = await tx.ticket.findMany({
        where: {
          columnId: targetColumnId,
          position: { gte: targetPosition },
        },
        orderBy: { position: 'desc' },
      });

      for (const t of ticketsToBump) {
        await tx.ticket.update({
          where: { id: t.id },
          data: { position: t.position + 1 },
        });
      }

      // Update the ticket with new columnId and/or position
      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          ...rest,
          ...(columnId !== undefined ? { columnId } : {}),
          position: targetPosition,
        },
      });
    });
  }

  async delete(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { column: { include: { project: true } } },
    });
    if (!ticket) throw new NotFoundException();
    if (ticket.column.project.ownerId !== userId) throw new ForbiddenException();

    await this.prisma.ticket.delete({ where: { id: ticketId } });
  }
}
