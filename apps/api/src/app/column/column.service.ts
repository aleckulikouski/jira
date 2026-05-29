import { Injectable } from '@nestjs/common';
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
}
