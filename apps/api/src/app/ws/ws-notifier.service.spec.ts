import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WsNotifierService } from './ws-notifier.service';
import { WsGateway } from './ws.gateway';

function makeMockGateway() {
  return {
    emitToProject: vi.fn(),
  } as unknown as WsGateway;
}

describe('WsNotifierService', () => {
  let service: WsNotifierService;
  let gateway: ReturnType<typeof makeMockGateway>;

  beforeEach(() => {
    gateway = makeMockGateway();
    service = new WsNotifierService(gateway);
  });

  describe('column.created', () => {
    it('emits column:created to the correct project room', () => {
      const payload = {
        projectId: 'p-1',
        column: {
          id: 'c-1',
          projectId: 'p-1',
          name: 'To Do',
          order: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      service.handleColumnCreated(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'column:created',
        'p-1',
        payload.column,
      );
    });
  });

  describe('column.updated', () => {
    it('emits column:updated to the correct project room', () => {
      const payload = {
        projectId: 'p-1',
        column: {
          id: 'c-1',
          projectId: 'p-1',
          name: 'In Progress',
          order: 1,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      service.handleColumnUpdated(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'column:updated',
        'p-1',
        payload.column,
      );
    });
  });

  describe('column.deleted', () => {
    it('emits column:deleted with just the id', () => {
      const payload = { projectId: 'p-1', columnId: 'c-1' };

      service.handleColumnDeleted(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'column:deleted',
        'p-1',
        { id: 'c-1' },
      );
    });
  });

  describe('ticket.created', () => {
    it('emits ticket:created to the correct project room', () => {
      const payload = {
        projectId: 'p-1',
        ticket: {
          id: 't-1',
          columnId: 'c-1',
          assigneeId: null,
          title: 'Fix bug',
          description: 'Need to fix',
          position: 1000,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      };

      service.handleTicketCreated(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'ticket:created',
        'p-1',
        payload.ticket,
      );
    });
  });

  describe('ticket.updated', () => {
    it('emits ticket:updated to the correct project room', () => {
      const payload = {
        projectId: 'p-1',
        ticket: {
          id: 't-1',
          columnId: 'c-2',
          assigneeId: null,
          title: 'Fix bug',
          description: 'Updated desc',
          position: 2000,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      };

      service.handleTicketUpdated(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'ticket:updated',
        'p-1',
        payload.ticket,
      );
    });
  });

  describe('ticket.deleted', () => {
    it('emits ticket:deleted with just the id', () => {
      const payload = { projectId: 'p-1', ticketId: 't-1' };

      service.handleTicketDeleted(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'ticket:deleted',
        'p-1',
        { id: 't-1' },
      );
    });
  });

  describe('columns.reordered', () => {
    it('emits columns:reordered with projectId and orderedIds', () => {
      const payload = {
        projectId: 'p-1',
        orderedIds: ['c-2', 'c-1', 'c-3'],
      };

      service.handleColumnsReordered(payload);

      expect(gateway.emitToProject).toHaveBeenCalledWith(
        'columns:reordered',
        'p-1',
        { projectId: 'p-1', orderedIds: ['c-2', 'c-1', 'c-3'] },
      );
    });
  });
});
