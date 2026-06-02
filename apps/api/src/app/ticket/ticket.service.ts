import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class TicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthorizationService,
  ) {}

  async getForColumn(columnId: string, userId: string) {
    await this.auth.column(columnId, userId);

    return this.prisma.ticket.findMany({
      where: { columnId },
      orderBy: { position: 'asc' },
    });
  }

  async create(columnId: string, userId: string, data: { title: string; description?: string }) {
    await this.auth.column(columnId, userId);

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
    const ticket = await this.auth.ticket(ticketId, userId);

    const { columnId, position, ...rest } = data;
    const hasPositionChange = columnId !== undefined || position !== undefined;

    if (!hasPositionChange) {
      return this.prisma.ticket.update({ where: { id: ticketId }, data: rest });
    }

    const targetColumnId = columnId ?? ticket.columnId;
    const targetPosition = position ?? ticket.position;

    // If changing column, verify target column ownership
    if (columnId !== undefined && columnId !== ticket.columnId) {
      await this.auth.column(targetColumnId, userId);
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
    await this.auth.ticket(ticketId, userId);

    await this.prisma.ticket.delete({ where: { id: ticketId } });
  }
}
