import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateProjectData, Project } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  getAll() {
    return this.http.get<Project[]>(`${this.base}/projects`);
  }

  create(data: CreateProjectData) {
    return this.http.post<Project>(`${this.base}/projects`, data);
  }
}
