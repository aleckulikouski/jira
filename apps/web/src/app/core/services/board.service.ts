import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoardColumn } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  private headers() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }

  getColumns(projectId: string) {
    return this.http.get<BoardColumn[]>(
      `${this.base}/projects/${projectId}/columns`,
      { headers: this.headers() },
    );
  }

  createColumn(projectId: string, name: string) {
    return this.http.post<BoardColumn>(
      `${this.base}/projects/${projectId}/columns`,
      { name },
      { headers: this.headers() },
    );
  }

  updateColumn(id: string, data: { name?: string; order?: number }) {
    return this.http.patch<BoardColumn>(
      `${this.base}/columns/${id}`,
      data,
      { headers: this.headers() },
    );
  }

  deleteColumn(id: string) {
    return this.http.delete(`${this.base}/columns/${id}`, {
      headers: this.headers(),
    });
  }
}
