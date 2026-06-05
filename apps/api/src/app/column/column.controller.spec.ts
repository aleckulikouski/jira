import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ColumnController } from './column.controller';
import { ColumnService } from './column.service';

describe('ColumnController', () => {
  let controller: ColumnController;
  let service: { create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColumnController],
      providers: [{ provide: ColumnService, useValue: service }],
    }).compile();

    controller = module.get(ColumnController);
  });

  describe('create', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };
    const createdColumn = { id: 'c-1', projectId: 'p-1', name: 'To Do', order: 0, createdAt: new Date(), updatedAt: new Date() };

    it('passes afterColumnId from DTO to service and returns single column', async () => {
      const dto = { name: 'New Col', afterColumnId: 'c-target' };
      service.create.mockResolvedValue(createdColumn);

      const result = await controller.create('p-1', dto, { user: mockUser } as any);

      expect(service.create).toHaveBeenCalledWith('p-1', 'user-1', 'New Col', 'c-target');
      expect(result).toEqual(createdColumn);
    });

    it('omits afterColumnId when DTO field is absent', async () => {
      const dto = { name: 'New Col' } as any;
      service.create.mockResolvedValue(createdColumn);

      await controller.create('p-1', dto, { user: mockUser } as any);

      expect(service.create).toHaveBeenCalledWith('p-1', 'user-1', 'New Col', undefined);
    });
  });
});
