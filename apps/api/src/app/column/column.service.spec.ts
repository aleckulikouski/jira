import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnService } from './column.service';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

function makeMockPrisma(txOverrides?: { ticketCount?: number }) {
  const tx = {
    ticket: { count: vi.fn().mockResolvedValue(txOverrides?.ticketCount ?? 0) },
    boardColumn: { delete: vi.fn().mockResolvedValue(undefined) },
  };

  const prisma = {
    boardColumn: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb: (client: any) => unknown) => cb(tx)),
  };

  return { prisma, tx };
}

describe('ColumnService', () => {
  let service: ColumnService;
  let prisma: ReturnType<typeof makeMockPrisma>['prisma'];
  let tx: ReturnType<typeof makeMockPrisma>['tx'];
  let auth: { project: ReturnType<typeof vi.fn>; column: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const mock = makeMockPrisma();
    prisma = mock.prisma;
    tx = mock.tx;

    auth = {
      project: vi.fn().mockResolvedValue({ id: 'p-1', ownerId: 'user-1' }),
      column: vi.fn().mockResolvedValue({ id: 'c-1', projectId: 'p-1', project: { ownerId: 'user-1' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColumnService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthorizationService, useValue: auth },
      ],
    }).compile();

    service = module.get(ColumnService);
  });

  describe('delete', () => {
    it('throws ConflictException when column has tickets', async () => {
      tx.ticket.count.mockResolvedValue(3);

      await expect(service.delete('c-1', 'user-1')).rejects.toThrow(ConflictException);
      await expect(service.delete('c-1', 'user-1')).rejects.toThrow(
        'Cannot delete column: it still contains 3 ticket(s)',
      );
      expect(tx.boardColumn.delete).not.toHaveBeenCalled();
    });

    it('deletes the column when it has no tickets', async () => {
      tx.ticket.count.mockResolvedValue(0);

      await service.delete('c-1', 'user-1');

      expect(tx.ticket.count).toHaveBeenCalledWith({ where: { columnId: 'c-1' } });
      expect(tx.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
    });
  });
});
