import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { BoardColumn, Ticket } from '@org/shared-types';
import type {
  ColumnCreatedEvent,
  ColumnUpdatedEvent,
  ColumnDeletedEvent,
  ColumnsReorderedEvent,
  TicketCreatedEvent,
  TicketUpdatedEvent,
  TicketDeletedEvent,
} from './board.types';

const COLUMN_INCLUDE = { project: true } as const;
const TICKET_INCLUDE = { column: { include: { project: true } } } as const;

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Query ────────────────────────────────────────────────────────

  async getBoard(projectId: string, userId: string) {
    await this.#lookupProject(projectId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tickets: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  // ── Column operations ────────────────────────────────────────────

  async createColumn(
    projectId: string,
    userId: string,
    name: string,
    afterColumnId?: string,
  ): Promise<{ column: BoardColumn; broadcast: ColumnCreatedEvent }> {
    await this.#lookupProject(projectId);

    const column = await this.prisma.$transaction(async (tx) => {
      let target: { order: number } | null = null;
      if (afterColumnId) {
        target = await tx.boardColumn.findFirst({
          where: { id: afterColumnId, projectId },
          select: { order: true },
        });
      }

      let nextOrder: number;

      if (target) {
        nextOrder = target.order + 1;
        const trailingColumns = await tx.boardColumn.findMany({
          where: { projectId, order: { gt: target.order } },
          select: { id: true },
        });
        for (const col of trailingColumns) {
          await tx.boardColumn.update({
            where: { id: col.id },
            data: { order: { increment: 1 } },
          });
        }
      } else {
        const maxOrder = await tx.boardColumn.aggregate({
          where: { projectId },
          _max: { order: true },
        });
        nextOrder = (maxOrder._max.order ?? -1) + 1;
      }

      return tx.boardColumn.create({
        data: { projectId, name, order: nextOrder },
      });
    });

    return {
      column: column as unknown as BoardColumn,
      broadcast: {
        event: 'column:created',
        projectId: column.projectId,
        payload: column as unknown as BoardColumn,
      },
    };
  }

  async updateColumn(
    columnId: string,
    userId: string,
    changes: { name?: string; order?: number },
  ): Promise<{ column: BoardColumn; broadcast: ColumnUpdatedEvent }> {
    await this.#lookupColumn(columnId);

    const column = await this.prisma.boardColumn.update({
      where: { id: columnId },
      data: changes,
    });

    return {
      column: column as unknown as BoardColumn,
      broadcast: {
        event: 'column:updated',
        projectId: column.projectId,
        payload: column as unknown as BoardColumn,
      },
    };
  }

  async deleteColumn(
    columnId: string,
    userId: string,
  ): Promise<{ broadcast: ColumnDeletedEvent }> {
    const column = await this.#lookupColumn(columnId);
    const projectId = column.project.id;

    await this.prisma.$transaction(async (tx) => {
      const ticketCount = await tx.ticket.count({ where: { columnId } });
      if (ticketCount > 0) {
        throw new ConflictException(
          `Cannot delete column: it still contains ${ticketCount} ticket(s)`,
        );
      }
      await tx.boardColumn.delete({ where: { id: columnId } });
    });

    return {
      broadcast: {
        event: 'column:deleted',
        projectId,
        payload: { id: columnId },
      },
    };
  }

  async reorderColumns(
    projectId: string,
    userId: string,
    orderedIds: string[],
  ): Promise<{ broadcast: ColumnsReorderedEvent }> {
    await this.#lookupProject(projectId);

    const existingColumns = await this.prisma.boardColumn.findMany({
      where: { projectId },
      select: { id: true },
    });
    const existingIds = existingColumns.map((c) => c.id);
    const existingSet = new Set(existingIds);
    const orderedSet = new Set(orderedIds);

    if (
      orderedIds.length !== existingIds.length ||
      existingSet.size !== orderedSet.size ||
      existingIds.some((id) => !orderedSet.has(id))
    ) {
      throw new ConflictException('Column IDs do not match project columns');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx.boardColumn.update({
          where: { id },
          data: { order: index },
        });
      }
    });

    return {
      broadcast: {
        event: 'columns:reordered',
        projectId,
        payload: { projectId, orderedIds },
      },
    };
  }

  // ── Ticket operations ────────────────────────────────────────────

  async createTicket(
    columnId: string,
    userId: string,
    data: { title: string; description?: string },
  ): Promise<{ ticket: Ticket; broadcast: TicketCreatedEvent }> {
    await this.#lookupColumn(columnId);

    const maxPosition = await this.prisma.ticket.aggregate({
      where: { columnId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const ticket = await this.prisma.ticket.create({
      data: {
        columnId,
        title: data.title,
        description: data.description ?? '',
        position: nextPosition,
      },
      include: { column: { select: { projectId: true } } },
    });

    const projectId = ticket.column.projectId;

    return {
      ticket: ticket as unknown as Ticket,
      broadcast: {
        event: 'ticket:created',
        projectId,
        payload: ticket as unknown as Ticket,
      },
    };
  }

  async updateTicket(
    ticketId: string,
    userId: string,
    changes: {
      title?: string;
      description?: string;
      columnId?: string;
      position?: number;
    },
  ): Promise<{ ticket: Ticket; broadcast: TicketUpdatedEvent }> {
    const ticket = await this.#lookupTicket(ticketId);

    const { columnId, position, ...rest } = changes;
    const hasPositionChange = columnId !== undefined || position !== undefined;

    if (!hasPositionChange) {
      const updated = await this.prisma.ticket.update({
        where: { id: ticketId },
        data: rest,
        include: { column: { select: { projectId: true } } },
      });

      return {
        ticket: updated as unknown as Ticket,
        broadcast: {
          event: 'ticket:updated',
          projectId: updated.column.projectId,
          payload: updated as unknown as Ticket,
        },
      };
    }

    const targetColumnId = columnId ?? ticket.columnId;
    const targetPosition = position ?? ticket.position;

    // If changing column, verify target column ownership
    if (columnId !== undefined && columnId !== ticket.columnId) {
      await this.#lookupColumn(targetColumnId);
    }

    // Transactional renumbering
    const updated = await this.prisma.$transaction(async (tx) => {
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
        include: { column: { select: { projectId: true } } },
      });
    });

    return {
      ticket: updated as unknown as Ticket,
      broadcast: {
        event: 'ticket:updated',
        projectId: updated.column.projectId,
        payload: updated as unknown as Ticket,
      },
    };
  }

  async deleteTicket(
    ticketId: string,
    userId: string,
  ): Promise<{ broadcast: TicketDeletedEvent }> {
    const ticket = await this.#lookupTicket(ticketId);

    await this.prisma.ticket.delete({ where: { id: ticketId } });

    return {
      broadcast: {
        event: 'ticket:deleted',
        projectId: ticket.column.project.id,
        payload: { id: ticketId },
      },
    };
  }

  // ── Private entity lookup helpers ─────────────────────────────────

  async #lookupProject(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async #lookupColumn(id: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
      include: COLUMN_INCLUDE,
    });
    if (!column) throw new NotFoundException('Column not found');
    return column;
  }

  async #lookupTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
