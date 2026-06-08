import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: {
    project: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProjectService);
  });

  describe('getAll', () => {
    it('returns projects ordered by createdAt desc', async () => {
      const projects = [
        { id: 'p-2', name: 'Newer', createdAt: '2025-02-01', ownerId: 'user-1', updatedAt: '' },
        { id: 'p-1', name: 'Older', createdAt: '2025-01-01', ownerId: 'user-1', updatedAt: '' },
      ];
      prisma.project.findMany.mockResolvedValue(projects);

      const result = await service.getAll();

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(projects);
    });
  });

  describe('create', () => {
    it('creates a project when name is unique', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.create.mockResolvedValue({
        id: 'p-1', name: 'New Project', ownerId: 'user-1',
        createdAt: '2025-01-01', updatedAt: '2025-01-01',
      });

      const result = await service.create({ name: 'New Project' }, 'user-1');

      expect(result.name).toBe('New Project');
      expect(result.ownerId).toBe('user-1');
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { name: 'New Project', ownerId: 'user-1' },
      });
    });

    it('throws ConflictException when project name already exists', async () => {
      prisma.project.findFirst.mockResolvedValue({ id: 'p-1', name: 'Existing' });

      await expect(
        service.create({ name: 'Existing' }, 'user-1'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create({ name: 'Existing' }, 'user-1'),
      ).rejects.toThrow('A project with this name already exists');

      expect(prisma.project.create).not.toHaveBeenCalled();
    });
  });
});
