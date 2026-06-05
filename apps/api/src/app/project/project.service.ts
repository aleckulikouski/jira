import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProjectDto, userId: string) {
    const existing = await this.prisma.project.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('A project with this name already exists');
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        ownerId: userId,
      },
    });
  }
}
