import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma.service';
import { AuthorizationService } from '../auth/authorization.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: { project: { findUnique: ReturnType<typeof vi.fn> } };
  let auth: { project: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prisma = {
      project: {
        findUnique: vi.fn(),
      },
    };

    auth = {
      project: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthorizationService, useValue: auth },
      ],
    }).compile();

    service = module.get(ProjectService);
  });

  describe('getBoard', () => {
    it('authorizes the user against the project', async () => {
      auth.project.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.project.findUnique.mockResolvedValue({
        id: 'p-1',
        name: 'Test Project',
        columns: [],
      });

      await service.getBoard('p-1', 'user-1');

      expect(auth.project).toHaveBeenCalledWith('p-1', 'user-1');
    });

    it('returns nested project data with columns and tickets', async () => {
      auth.project.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });

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
          {
            id: 'c-2',
            projectId: 'p-1',
            name: 'Done',
            order: 1,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
            tickets: [],
          },
        ],
      };

      prisma.project.findUnique.mockResolvedValue(mockBoard);

      const result = await service.getBoard('p-1', 'user-1');

      expect(result).toEqual(mockBoard);
    });

    it('uses Prisma select with column include to fetch board', async () => {
      auth.project.mockResolvedValue({ id: 'p-1', ownerId: 'user-1' });
      prisma.project.findUnique.mockResolvedValue({ id: 'p-1', columns: [] });

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
});
