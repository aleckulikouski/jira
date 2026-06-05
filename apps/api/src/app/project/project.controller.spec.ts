import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ProjectController', () => {
  let controller: ProjectController;
  let service: { getAll: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; getBoard: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getAll: vi.fn(),
      create: vi.fn(),
      getBoard: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: service }],
    }).compile();

    controller = module.get(ProjectController);
  });

  describe('getBoard', () => {
    const mockUser = { id: 'user-1', email: 'test@test.com' };

    it('delegates to ProjectService.getBoard with project id and user id', async () => {
      const mockBoard = {
        id: 'p-1',
        name: 'Test',
        columns: [],
      };
      service.getBoard.mockResolvedValue(mockBoard);

      const result = await controller.getBoard('p-1', { user: mockUser } as any);

      expect(service.getBoard).toHaveBeenCalledWith('p-1', 'user-1');
      expect(result).toEqual(mockBoard);
    });

    it('has JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        ProjectController.prototype.getBoard,
      );
      expect(guards).toBeDefined();
      expect(guards.length).toBeGreaterThan(0);
      expect(guards[0]).toBe(JwtAuthGuard);
    });
  });
});
