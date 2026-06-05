import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { Project, BoardColumn, Ticket } from '../../generated/prisma/client';

const COLUMN_INCLUDE = { project: true } as const;
const TICKET_INCLUDE = { column: { include: { project: true } } } as const;

export type AuthorizedProject = Project;

export type AuthorizedColumn = BoardColumn & {
  project: Project;
};

export type AuthorizedTicket = Ticket & {
  column: BoardColumn & { project: Project };
};

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async project(id: string, userId: string): Promise<AuthorizedProject> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async column(id: string, userId: string): Promise<AuthorizedColumn> {
    const column = await this.prisma.boardColumn.findUnique({
      where: { id },
      include: COLUMN_INCLUDE,
    });
    if (!column) throw new NotFoundException('Column not found');
    return column;
  }

  async ticket(id: string, userId: string): Promise<AuthorizedTicket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
