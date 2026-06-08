import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WsGateway } from './ws.gateway';
import type {
  ColumnCreatedPayload,
  ColumnUpdatedPayload,
  ColumnDeletedPayload,
  TicketCreatedPayload,
  TicketUpdatedPayload,
  TicketDeletedPayload,
  ColumnsReorderedPayload,
} from '@org/shared-types';

@Injectable()
export class WsNotifierService {
  private readonly logger = new Logger(WsNotifierService.name);

  constructor(private readonly gateway: WsGateway) {}

  @OnEvent('column.created')
  handleColumnCreated(payload: ColumnCreatedPayload): void {
    try {
      this.gateway.emitToProject('column:created', payload.projectId, payload.column);
    } catch (e) {
      this.logger.error('Failed to emit column:created', e);
    }
  }

  @OnEvent('column.updated')
  handleColumnUpdated(payload: ColumnUpdatedPayload): void {
    try {
      this.gateway.emitToProject('column:updated', payload.projectId, payload.column);
    } catch (e) {
      this.logger.error('Failed to emit column:updated', e);
    }
  }

  @OnEvent('column.deleted')
  handleColumnDeleted(payload: ColumnDeletedPayload): void {
    try {
      this.gateway.emitToProject('column:deleted', payload.projectId, { id: payload.columnId });
    } catch (e) {
      this.logger.error('Failed to emit column:deleted', e);
    }
  }

  @OnEvent('ticket.created')
  handleTicketCreated(payload: TicketCreatedPayload): void {
    try {
      this.gateway.emitToProject('ticket:created', payload.projectId, payload.ticket);
    } catch (e) {
      this.logger.error('Failed to emit ticket:created', e);
    }
  }

  @OnEvent('ticket.updated')
  handleTicketUpdated(payload: TicketUpdatedPayload): void {
    try {
      this.gateway.emitToProject('ticket:updated', payload.projectId, payload.ticket);
    } catch (e) {
      this.logger.error('Failed to emit ticket:updated', e);
    }
  }

  @OnEvent('ticket.deleted')
  handleTicketDeleted(payload: TicketDeletedPayload): void {
    try {
      this.gateway.emitToProject('ticket:deleted', payload.projectId, { id: payload.ticketId });
    } catch (e) {
      this.logger.error('Failed to emit ticket:deleted', e);
    }
  }

  @OnEvent('columns.reordered')
  handleColumnsReordered(payload: ColumnsReorderedPayload): void {
    try {
      this.gateway.emitToProject('columns:reordered', payload.projectId, {
        projectId: payload.projectId,
        orderedIds: payload.orderedIds,
      });
    } catch (e) {
      this.logger.error('Failed to emit columns:reordered', e);
    }
  }
}
