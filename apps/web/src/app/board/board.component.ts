import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Observable, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthFacade } from '../core/store/auth.facade';

interface Project {
  id: string;
  name: string;
}

interface BoardColumn {
  id: string;
  name: string;
  order: number;
}

@Component({
  selector: 'app-board',
  imports: [AsyncPipe, MatCardModule, MatButtonModule, MatToolbarModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit {
  readonly auth = inject(AuthFacade);
  private readonly http = inject(HttpClient);

  project$!: Observable<Project>;
  columns$!: Observable<BoardColumn[]>;

  ngOnInit() {
    const api = 'http://localhost:3000/api';

    this.project$ = this.auth.token$.pipe(
      switchMap((token) =>
        this.http.get<Project>(`${api}/projects/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );

    this.columns$ = this.project$.pipe(
      switchMap((project) =>
        this.http.get<BoardColumn[]>(
          `${api}/projects/${project.id}/columns`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
        ),
      ),
    );
  }
}
