import { Injectable } from '@nestjs/common';
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

    await this.prisma.boardColumn.delete({ where: { id: columnId } });
  }
}
