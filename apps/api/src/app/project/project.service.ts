import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    return this.prisma.project.findFirst({
      where: { ownerId: userId },
    });
  }
}
