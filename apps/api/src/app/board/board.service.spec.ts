import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { PrismaService } from '../prisma.service';

function makeMockPrisma(txOverrides?: { ticketCount?: number }) {
  const tx = {
    ticket: {
      count: vi.fn().mockResolvedValue(txOverrides?.ticketCount ?? 0),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    },
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
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    boardColumn: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    $transaction: vi.fn((cb: ((client: unknown) => unknown) | unknown[]) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb);
      }
      return (cb as (client: unknown) => unknown)(tx);
    }),
  };

  return { prisma, tx };
}

describe('BoardService', () => {
  let service: BoardService;
  let prisma: ReturnType<typeof makeMockPrisma>['prisma'];
  let tx: ReturnType<typeof makeMockPrisma>['tx'];

  beforeEach(async () => {
    const mock = makeMockPrisma();
    prisma = mock.prisma;
    tx = mock.tx;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BoardService);
  });

  // ── getBoard ─────────────────────────────────────────────────────

  describe('getBoard', () => {
    it('returns nested project data with columns and tickets', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });

      const mockBoard = {
        id: 'p-1',
        name: 'Test Project',
        columns: [
          {
            id: 'c-1',
            projectId: 'p-1',
            name: 'To Do',
            order: 0,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
            tickets: [
              {
                id: 't-1',
                columnId: 'c-1',
                assigneeId: null,
                title: 'First ticket',
                description: '',
                position: 0,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-01'),
              },
            ],
          },
        ],
      };

      prisma.project.findUnique.mockResolvedValue(mockBoard);

      const result = await service.getBoard('p-1', 'user-1');
      expect(result).toEqual(mockBoard);
    });

    it('verifies the project exists before querying', async () => {
      prisma.project.findUnique
        .mockResolvedValueOnce({ id: 'p-1', ownerId: 'user-1' }) // lookup
        .mockResolvedValueOnce({ id: 'p-1', name: 'Test', columns: [] }); // query

      await service.getBoard('p-1', 'user-1');

      expect(prisma.project.findUnique).toHaveBeenCalledTimes(2);
    });

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.getBoard('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('uses Prisma select with column include to fetch board', async () => {
      prisma.project.findUnique
        .mockResolvedValueOnce({ id: 'p-1', ownerId: 'user-1' })
        .mockResolvedValueOnce({ id: 'p-1', columns: [] });

      await service.getBoard('p-1', 'user-1');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        select: {
          id: true,
          name: true,
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tickets: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      });
    });
  });

  // ── createColumn ─────────────────────────────────────────────────

  describe('createColumn', () => {
    it('appends column to end when afterColumnId is omitted', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 2 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 3,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createColumn('p-1', 'user-1', 'New Col');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 3 },
      });
      expect(result.column.id).toBe('c-new');
      expect(result.column.name).toBe('New Col');
      expect(result.column.order).toBe(3);
      expect(result.broadcast.event).toBe('column:created');
      expect(result.broadcast.projectId).toBe('p-1');
    });

    it('appends with order 0 when no columns exist', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: null } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-first', projectId: 'p-1', name: 'First', order: 0,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createColumn('p-1', 'user-1', 'First');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'First', order: 0 },
      });
      expect(result.column.order).toBe(0);
    });

    it('inserts after target column when afterColumnId is provided', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.findFirst.mockResolvedValue({ order: 0 });
      tx.boardColumn.findMany.mockResolvedValueOnce([]);
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createColumn('p-1', 'user-1', 'New Col', 'c-1');

      expect(tx.boardColumn.findFirst).toHaveBeenCalledWith({
        where: { id: 'c-1', projectId: 'p-1' },
        select: { order: true },
      });
      expect(result.column.order).toBe(1);
    });

    it('increments order of columns after the target', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.findFirst.mockResolvedValue({ order: 0 });
      tx.boardColumn.findMany.mockResolvedValueOnce([
        { id: 'c-2' },
        { id: 'c-3' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1,
        createdAt: new Date(), updatedAt: new Date(),
      });

      await service.createColumn('p-1', 'user-1', 'New Col', 'c-1');

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
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.findFirst.mockResolvedValue(null);
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 5 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 6,
        createdAt: new Date(), updatedAt: new Date(),
      });

      const result = await service.createColumn('p-1', 'user-1', 'New Col', 'stale-id');

      expect(tx.boardColumn.create).toHaveBeenCalledWith({
        data: { projectId: 'p-1', name: 'New Col', order: 6 },
      });
      expect(result.column.order).toBe(6);
    });

    it('verifies the project exists before creating', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      tx.boardColumn.aggregate.mockResolvedValue({ _max: { order: 0 } });
      tx.boardColumn.create.mockResolvedValue({
        id: 'c-new', projectId: 'p-1', name: 'New Col', order: 1,
        createdAt: new Date(), updatedAt: new Date(),
      });

      await service.createColumn('p-1', 'user-1', 'New Col');

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });
  });

  // ── updateColumn ─────────────────────────────────────────────────

  describe('updateColumn', () => {
    it('updates column and returns broadcast', async () => {
      const column = {
        id: 'c-1', projectId: 'p-1', name: 'Renamed', order: 0,
        project: { id: 'p-1', ownerId: 'user-1' },
        createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.boardColumn.findUnique.mockResolvedValue(column);
      prisma.boardColumn.update.mockResolvedValue(column);

      const result = await service.updateColumn('c-1', 'user-1', { name: 'Renamed' });

      expect(prisma.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { name: 'Renamed' },
      });
      expect(result.column.name).toBe('Renamed');
      expect(result.broadcast.event).toBe('column:updated');
      expect(result.broadcast.projectId).toBe('p-1');
    });

    it('throws NotFoundException when column does not exist', async () => {
      prisma.boardColumn.findUnique.mockResolvedValue(null);

      await expect(
        service.updateColumn('nonexistent', 'user-1', { name: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteColumn ─────────────────────────────────────────────────

  describe('deleteColumn', () => {
    it('throws ConflictException when column has tickets', async () => {
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-1', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });
      tx.ticket.count.mockResolvedValue(3);

      await expect(service.deleteColumn('c-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.deleteColumn('c-1', 'user-1')).rejects.toThrow(
        'Cannot delete column: it still contains 3 ticket(s)',
      );
      expect(tx.boardColumn.delete).not.toHaveBeenCalled();
    });

    it('deletes the column when it has no tickets', async () => {
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-1', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });
      tx.ticket.count.mockResolvedValue(0);

      const result = await service.deleteColumn('c-1', 'user-1');

      expect(tx.ticket.count).toHaveBeenCalledWith({ where: { columnId: 'c-1' } });
      expect(tx.boardColumn.delete).toHaveBeenCalledWith({ where: { id: 'c-1' } });
      expect(result.broadcast.event).toBe('column:deleted');
      expect(result.broadcast.projectId).toBe('p-1');
      expect(result.broadcast.payload).toEqual({ id: 'c-1' });
    });
  });

  // ── reorderColumns ───────────────────────────────────────────────

  describe('reorderColumns', () => {
    it('updates each column order to its index in orderedIds', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);

      const result = await service.reorderColumns('p-1', 'user-1', ['c-3', 'c-1', 'c-2']);

      expect(tx.boardColumn.update).toHaveBeenCalledTimes(3);
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-3' },
        data: { order: 0 },
      });
      expect(tx.boardColumn.update).toHaveBeenCalledWith({
        where: { id: 'c-1' },
        data: { order: 1 },
      });
      expect(result.broadcast.event).toBe('columns:reordered');
      expect(result.broadcast.payload).toEqual({
        projectId: 'p-1',
        orderedIds: ['c-3', 'c-1', 'c-2'],
      });
    });

    it('throws ConflictException when orderedIds has wrong columns', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
      ]);

      await expect(
        service.reorderColumns('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.reorderColumns('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow('Column IDs do not match project columns');
    });

    it('throws ConflictException when orderedIds is missing a column', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);

      await expect(
        service.reorderColumns('p-1', 'user-1', ['c-1', 'c-3']),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when orderedIds contains duplicates', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
        { id: 'c-3' },
      ]);

      await expect(
        service.reorderColumns('p-1', 'user-1', ['c-1', 'c-1', 'c-2', 'c-3']),
      ).rejects.toThrow(ConflictException);
    });

    it('verifies the project exists before reordering', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.boardColumn.findMany.mockResolvedValue([
        { id: 'c-1' },
        { id: 'c-2' },
      ]);
      tx.boardColumn.update.mockResolvedValue(undefined);

      await service.reorderColumns('p-1', 'user-1', ['c-2', 'c-1']);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });
  });

  // ── createTicket ─────────────────────────────────────────────────

  describe('createTicket', () => {
    it('creates a ticket with position 0 when column is empty', async () => {
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-1', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });
      prisma.ticket.aggregate.mockResolvedValue({ _max: { position: null } });
      prisma.ticket.create.mockResolvedValue({
        id: 't-1', columnId: 'c-1', title: 'First', description: '',
        position: 0, assigneeId: null, createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        column: { projectId: 'p-1' },
      });

      const result = await service.createTicket('c-1', 'user-1', { title: 'First' });

      expect(result.ticket.title).toBe('First');
      expect(result.ticket.position).toBe(0);
      expect(result.broadcast.event).toBe('ticket:created');
      expect(result.broadcast.projectId).toBe('p-1');
    });

    it('assigns position = max + 1 for subsequent tickets', async () => {
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-1', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });
      prisma.ticket.aggregate.mockResolvedValue({ _max: { position: 2 } });
      prisma.ticket.create.mockResolvedValue({
        id: 't-3', columnId: 'c-1', title: 'Third', description: '',
        position: 3, assigneeId: null, createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        column: { projectId: 'p-1' },
      });

      const result = await service.createTicket('c-1', 'user-1', { title: 'Third' });

      expect(result.ticket.position).toBe(3);
    });
  });

  // ── updateTicket ─────────────────────────────────────────────────

  describe('updateTicket', () => {
    const makeTicketLookup = () => ({
      id: 't-1',
      columnId: 'c-1',
      title: 'Original',
      description: '',
      position: 0,
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      column: {
        id: 'c-1',
        projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      },
    });

    it('updates title and description without changing position', async () => {
      const ticket = makeTicketLookup();
      prisma.ticket.findUnique.mockResolvedValue(ticket);
      prisma.ticket.update.mockResolvedValue({
        ...ticket,
        title: 'Updated',
        description: 'New desc',
        column: { projectId: 'p-1' },
      });

      const result = await service.updateTicket('t-1', 'user-1', {
        title: 'Updated',
        description: 'New desc',
      });

      expect(result.ticket.title).toBe('Updated');
      expect(result.ticket.description).toBe('New desc');
      expect(result.broadcast.event).toBe('ticket:updated');
      expect(result.broadcast.projectId).toBe('p-1');
    });

    it('renumbers when moving to a lower position within same column', async () => {
      prisma.ticket.findUnique.mockResolvedValue(makeTicketLookup());
      // target column lookup
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-1', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });

      tx.ticket.findMany.mockResolvedValue([
        { id: 't-3', position: 2 },
        { id: 't-2', position: 1 },
      ]);
      tx.ticket.update.mockResolvedValue({
        id: 't-1', columnId: 'c-1', title: 'Original', description: '',
        position: 0, assigneeId: null, createdAt: new Date(), updatedAt: new Date(),
        column: { projectId: 'p-1' },
      });

      const result = await service.updateTicket('t-1', 'user-1', { position: 0 });

      expect(result.ticket.position).toBe(0);
      // Bump calls for tickets at positions >= 0
      expect(tx.ticket.update).toHaveBeenCalledWith({
        where: { id: 't-3' },
        data: { position: 3 },
      });
      expect(tx.ticket.update).toHaveBeenCalledWith({
        where: { id: 't-2' },
        data: { position: 2 },
      });
    });

    it('verifies target column when moving between columns', async () => {
      prisma.ticket.findUnique.mockResolvedValue({ ...makeTicketLookup(), columnId: 'c-1' });
      prisma.boardColumn.findUnique.mockResolvedValue({
        id: 'c-2', projectId: 'p-1',
        project: { id: 'p-1', ownerId: 'user-1' },
      });

      tx.ticket.findMany.mockResolvedValue([]);
      tx.ticket.update.mockResolvedValue({
        id: 't-1', columnId: 'c-2', title: 'Original', description: '',
        position: 0, assigneeId: null, createdAt: new Date(), updatedAt: new Date(),
        column: { projectId: 'p-1' },
      });

      const result = await service.updateTicket('t-1', 'user-1', {
        columnId: 'c-2',
        position: 0,
      });

      expect(prisma.boardColumn.findUnique).toHaveBeenCalledWith({
        where: { id: 'c-2' },
        include: { project: true },
      });
      expect(result.ticket.columnId).toBe('c-2');
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTicket('nonexistent', 'user-1', { title: 'Nope' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteTicket ─────────────────────────────────────────────────

  describe('deleteTicket', () => {
    it('deletes the ticket and returns broadcast', async () => {
      prisma.ticket.findUnique.mockResolvedValue({
        id: 't-1',
        columnId: 'c-1',
        title: 'To delete',
        description: '',
        position: 0,
        assigneeId: null,
        column: {
          id: 'c-1',
          projectId: 'p-1',
          project: { id: 'p-1', ownerId: 'user-1' },
        },
      });

      const result = await service.deleteTicket('t-1', 'user-1');

      expect(prisma.ticket.delete).toHaveBeenCalledWith({ where: { id: 't-1' } });
      expect(result.broadcast.event).toBe('ticket:deleted');
      expect(result.broadcast.projectId).toBe('p-1');
      expect(result.broadcast.payload).toEqual({ id: 't-1' });
    });

    it('throws NotFoundException when ticket does not exist', async () => {
      prisma.ticket.findUnique.mockResolvedValue(null);

      await expect(service.deleteTicket('nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
