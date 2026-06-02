import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '@org/shared-types';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:3000/api';

  getMine() {
    return this.http.get<Project>(`${this.base}/projects/me`);
  }
}
