import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class ColumnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthorizationService,
  ) {}

  async create(projectId: string, userId: string, name: string, afterColumnId?: string) {
    await this.auth.project(projectId, userId);

    return this.prisma.$transaction(async (tx) => {
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
  }

  async update(columnId: string, userId: string, data: { name?: string; order?: number }) {
    await this.auth.column(columnId, userId);

    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data,
    });
  }

  async delete(columnId: string, userId: string): Promise<{ projectId: string }> {
    const column = await this.auth.column(columnId, userId);
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

    return { projectId };
  }

  async reorder(projectId: string, userId: string, orderedIds: string[]) {
    await this.auth.project(projectId, userId);

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
  }
}
