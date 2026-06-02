import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoardColumn, Ticket } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  getColumns(projectId: string) {
    return this.http.get<BoardColumn[]>(
      `${this.base}/projects/${projectId}/columns`,
    );
  }

  createColumn(projectId: string, name: string) {
    return this.http.post<BoardColumn>(
      `${this.base}/projects/${projectId}/columns`,
      { name },
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

  getTickets(columnId: string) {
    return this.http.get<Ticket[]>(
      `${this.base}/columns/${columnId}/tickets`,
    );
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
}
