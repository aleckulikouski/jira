import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      getAll: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: service }],
    }).compile();

    controller = module.get(ProjectController);
  });

  describe('getAll', () => {
    it('delegates to ProjectService.getAll', async () => {
      const projects = [{ id: 'p-1', name: 'Test', ownerId: 'user-1', createdAt: '', updatedAt: '' }];
      service.getAll.mockResolvedValue(projects);

      const result = await controller.getAll();

      expect(service.getAll).toHaveBeenCalled();
      expect(result).toEqual(projects);
    });
  });

  describe('create', () => {
    it('delegates to ProjectService.create with user from request', async () => {
      const project = { id: 'p-1', name: 'New', ownerId: 'user-1', createdAt: '', updatedAt: '' };
      service.create.mockResolvedValue(project);

      const dto = { name: 'New' };
      const result = await controller.create(dto, {
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
      expect(result).toEqual(project);
    });
  });
});
