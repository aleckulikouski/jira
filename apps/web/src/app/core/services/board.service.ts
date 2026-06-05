import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoardColumn, Ticket } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  getBoard(projectId: string) {
    return this.http.get<{
      id: string;
      name: string;
      columns: import('@org/shared-types').BoardColumn[];
    }>(`${this.base}/projects/${projectId}/board`);
  }

  createColumn(projectId: string, name: string, afterColumnId?: string) {
    return this.http.post<BoardColumn>(
      `${this.base}/projects/${projectId}/columns`,
      { name, afterColumnId },
    );
  }

  updateColumn(id: string, data: { name?: string; order?: number }) {
    return this.http.patch<BoardColumn>(
      `${this.base}/columns/${id}`,
      data,
    );
  }

  deleteColumn(id: string) {
    return this.http.delete(`${this.base}/columns/${id}`);
  }

  createTicket(columnId: string, data: { title: string; description?: string }) {
    return this.http.post<Ticket>(
      `${this.base}/columns/${columnId}/tickets`,
      data,
    );
  }

  updateTicket(id: string, data: { title?: string; description?: string; columnId?: string; position?: number }) {
    return this.http.patch<Ticket>(
      `${this.base}/tickets/${id}`,
      data,
    );
  }

  deleteTicket(id: string) {
    return this.http.delete(`${this.base}/tickets/${id}`);
  }

  reorderColumns(projectId: string, orderedIds: string[]) {
    return this.http.patch<{ statusCode: number }>(
      `${this.base}/projects/${projectId}/columns/reorder`,
      { orderedIds },
    );
  }
}
