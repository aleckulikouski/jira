import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ColumnService {
  constructor(private readonly prisma: PrismaService) {}

  async getForProject(projectId: string) {
    return this.prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async create(projectId: string, userId: string, name: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });
    if (!project) throw new ForbiddenException();

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
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { project: true },
    });
    if (!column) throw new NotFoundException();
    if (column.project.ownerId !== userId) throw new ForbiddenException();

    return this.prisma.boardColumn.update({
      where: { id: columnId },
      data,
    });
  }

  async delete(columnId: string, userId: string) {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id: columnId },
      include: { project: true },
    });
    if (!column) throw new NotFoundException();
    if (column.project.ownerId !== userId) throw new ForbiddenException();

    await this.prisma.boardColumn.delete({ where: { id: columnId } });
  }
}
