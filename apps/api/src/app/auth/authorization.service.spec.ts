import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { PrismaService } from '../prisma.service';

function makeMockPrisma(overrides?: {
  project?: Record<string, unknown>;
  boardColumn?: Record<string, unknown>;
  ticket?: Record<string, unknown>;
}) {
  return {
    project: { findUnique: vi.fn(), ...overrides?.project },
    boardColumn: { findUnique: vi.fn(), ...overrides?.boardColumn },
    ticket: { findUnique: vi.fn(), ...overrides?.ticket },
  } as unknown as PrismaService;
}

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let prisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    prisma = makeMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AuthorizationService);
  });

  describe('project', () => {
    it('returns the project when owner matches', async () => {
      const project = { id: 'p-1', ownerId: 'user-1', name: 'Test' };
      (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(project);

      const result = await service.project('p-1', 'user-1');
      expect(result).toBe(project);
    });

    it('throws NotFoundException when project does not exist', async () => {
      (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.project('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when owner does not match', async () => {
      const project = { id: 'p-1', ownerId: 'other-user', name: 'Test' };
      (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(project);

      await expect(service.project('p-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('column', () => {
    it('returns column with project when owner matches', async () => {
      const column = {
        id: 'c-1',
        projectId: 'p-1',
        name: 'To Do',
        order: 0,
        project: { id: 'p-1', ownerId: 'user-1', name: 'My Project' },
      };
      (prisma.boardColumn.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(column);

      const result = await service.column('c-1', 'user-1');
      expect(result).toBe(column);
      expect(result.project.ownerId).toBe('user-1');
    });

    it('throws NotFoundException when column does not exist', async () => {
      (prisma.boardColumn.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.column('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when project owner does not match', async () => {
      const column = {
        id: 'c-1',
        projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'other-user' },
      };
      (prisma.boardColumn.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(column);

      await expect(service.column('c-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('ticket', () => {
    const makeTicket = (ownerId: string) => ({
      id: 't-1',
      columnId: 'c-1',
      title: 'Test Ticket',
      description: '',
      position: 0,
      column: {
        id: 'c-1',
        projectId: 'p-1',
        project: { id: 'p-1', ownerId, name: 'My Project' },
      },
    });

    it('returns ticket with column and project when owner matches', async () => {
      const ticket = makeTicket('user-1');
      (prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(ticket);

      const result = await service.ticket('t-1', 'user-1');
      expect(result).toBe(ticket);
      expect(result.column.project.ownerId).toBe('user-1');
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      (prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.ticket('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when project owner does not match', async () => {
      const ticket = makeTicket('other-user');
      (prisma.ticket.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(ticket);

      await expect(service.ticket('t-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
