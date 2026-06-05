import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnService } from './column.service';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

function makeMockPrisma(txOverrides?: { ticketCount?: number }) {
  const tx = {
    ticket: { count: vi.fn().mockResolvedValue(txOverrides?.ticketCount ?? 0) },
    boardColumn: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };

  const prisma = {
    boardColumn: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb: ((client: any) => unknown) | any[]) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb);
      }
      return cb(tx);
    }),
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

  describe('reorder', () => {
    it('updates each column order to its index in orderedIds', async () => {
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);

      await service.reorder('p-1', 'user-1', ['c-3', 'c-1', 'c-2']);

      expect(tx.boardColumn.update).toHaveBeenCalledTimes(3);
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-3' },
        data: { order: 0 },
      });
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { order: 1 },
      });
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-2' },
        data: { order: 2 },
      });
    });

    it('throws ConflictException when orderedIds has wrong columns', async () => {
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
      ]);

      await expect(
        service.reorder('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.reorder('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow('Column IDs do not match project columns');
    });

    it('throws ConflictException when orderedIds is missing a column', async () => {
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);

      await expect(
        service.reorder('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when orderedIds contains duplicates', async () => {
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);

      await expect(
        service.reorder('p-1', 'user-1', ['c-1', 'c-1', 'c-2', 'c-3']),
      ).rejects.toThrow(ConflictException);
    });

    it('verifies the user owns the project before reordering', async () => {
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);

      await service.reorder('p-1', 'user-1', ['c-2', 'c-1']);

      expect(auth.project).toHaveBeenCalledWith('p-1', 'user-1');
    });
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

  describe('create', () => {
    const allColumns = [
      { id: 'c-1', projectId: 'p-1', name: 'To Do', order: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c-2', projectId: 'p-1', name: 'In Progress', order: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 'c-3', projectId: 'p-1', name: 'Done', order: 2, createdAt: new Date(), updatedAt: new Date() },
    ];

    it('appends column to end when afterColumnId is omitted', async () => {
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 2 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 3, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.create('p-1', 'user-1', 'New Col');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 3 },
      });
      expect(result.id).toBe('c-new');
      expect(result.name).toBe('New Col');
      expect(result.order).toBe(3);
    });

    it('appends with order 0 when no columns exist', async () => {
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: null } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-first', projectId: 'p-1', name: 'First', order: 0, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.create('p-1', 'user-1', 'First');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'First', order: 0 },
      });
      expect(result.id).toBe('c-first');
    });

    it('inserts after target column when afterColumnId is provided', async () => {
      tx.boardColumn.findFirst.mockResolvedValue({ order: 0 }); // target is c-1 at order 0
      tx.boardColumn.findMany.mockResolvedValueOnce(
        allColumns.slice(0, 1), // trailing columns for increment: c-1 but only those with order > 0
      );
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.create('p-1', 'user-1', 'New Col', 'c-1');

      expect(tx.boardColumn.findFirst).toHaveBeenCalledWith({
        where: { id: 'c-1', projectId: 'p-1' },
        select: { order: true },
      });
      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 1 },
      });
      expect(result.id).toBe('c-new');
      expect(result.order).toBe(1);
    });

    it('increments order of columns after the target', async () => {
      // Target is c-1 at order 0; c-2 and c-3 are trailing
      tx.boardColumn.findFirst.mockResolvedValue({ order: 0 });
      tx.boardColumn.findMany.mockResolvedValueOnce([
        { id: 'c-2' },
        { id: 'c-3' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1, createdAt: new Date(), updatedAt: new Date(),
      });

      await service.create('p-1', 'user-1', 'New Col', 'c-1');

      expect(tx.boardColumn.update).toHaveBeenCalledTimes(2);
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-2' },
        data: { order: { increment: 1 } },
      });
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-3' },
        data: { order: { increment: 1 } },
      });
    });

    it('falls back to append when afterColumnId is not found', async () => {
      tx.boardColumn.findFirst.mockResolvedValue(null); // stale afterColumnId
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 5 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 6, createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.create('p-1', 'user-1', 'New Col', 'stale-id');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 6 },
      });
      expect(result.id).toBe('c-new');
    });

    it('falls back to append when afterColumnId belongs to a different project', async () => {
      tx.boardColumn.findFirst.mockResolvedValue(null); // scoped to projectId, so cross-project returns null
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 3 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 4, createdAt: new Date(), updatedAt: new Date(),
      });

      await service.create('p-1', 'user-1', 'New Col', 'other-project-col');

      expect(tx.boardColumn.findFirst).toHaveBeenCalledWith({
        where: { id: 'other-project-col', projectId: 'p-1' },
        select: { order: true },
      });
      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 4 },
      });
    });

    it('returns the created column', async () => {
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 2 } });
      const created = {
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 3, createdAt: new Date(), updatedAt: new Date(),
      };
      tx.boardColumn.create.mockResolvedValue(created);

      const result = await service.create('p-1', 'user-1', 'New Col');

      expect(result).toEqual(created);
    });

    it('inserts after the last column with correct trailing increment', async () => {
      tx.boardColumn.findFirst.mockResolvedValue({ order: 2 }); // target is last column
      tx.boardColumn.findMany.mockResolvedValueOnce([]); // nothing after it, empty trailing array
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 3, createdAt: new Date(), updatedAt: new Date(),
      });

      await service.create('p-1', 'user-1', 'New Col', 'c-3');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 3 },
      });
    });

    it('verifies the user owns the project before creating', async () => {
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 0 } });
      tx.boardColumn.create.mockResolvedValue({ id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1, createdAt: new Date(), updatedAt: new Date() });

      await service.create('p-1', 'user-1', 'New Col');

      expect(auth.project).toHaveBeenCalledWith('p-1', 'user-1');
    });
  });
});
