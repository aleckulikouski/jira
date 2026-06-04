import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

@Injectable()
export class ColumnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthorizationService,
  ) {}

  async getForProject(projectId: string, userId: string) {
    await this.auth.project(projectId, userId);
    return this.prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async create(projectId: string, userId: string, name: string) {
    await this.auth.project(projectId, userId);

    const maxOrder = await this.prisma.boardColumn.aggregate({
      where: { projectId },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    return this.prisma.boardColumn.create({
      data: { projectId, name, order: nextOrder },
    });
  }

  async update(columnId: string, userId: string, data: { name?: string; order?: number }) {
    await this.auth.column(columnId, userId);

    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data,
    });
  }

  async delete(columnId: string, userId: string) {
    await this.auth.column(columnId, userId);

    await this.prisma.$transaction(async (tx) => {
      const ticketCount = await tx.ticket.count({ where: { columnId } });
      if (ticketCount > 0) {
        throw new ConflictException(
          `Cannot delete column: it still contains ${ticketCount} ticket(s)`,
        );
      }
      await tx.boardColumn.delete({ where: { id: columnId } });
    });
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
