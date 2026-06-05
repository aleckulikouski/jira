import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map, pairwise, startWith, filter } from 'rxjs';
import { ProjectFacade } from '../../store/project/project.facade';

@Component({
  selector: 'app-project-selector',
  imports: [
    AsyncPipe,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './project-selector.component.html',
  styleUrl: './project-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSelectorComponent implements OnInit {
  private readonly projectFacade = inject(ProjectFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading$ = this.projectFacade.loading$;
  readonly projects$ = this.projectFacade.projects$;
  readonly noProjects$ = this.projects$.pipe(map((p) => p.length === 0));
  readonly routeId$ = this.route.paramMap.pipe(map((p) => p.get('id')));

  /** Whether initial load has completed (loading transitioned true→false) */
  loaded = false;

  ngOnInit(): void {
    this.projectFacade.loadProjects();

    // Track load completion: loading transitioned from true to false
    this.loading$
      .pipe(
        startWith(false),
        pairwise(),
        filter(([was, now]) => was && !now),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loaded = true;
      });

    // Validate route param against projects after load completes
    combineLatest([this.route.paramMap, this.projects$, this.loading$])
      .pipe(
        filter(([, , loading]) => !loading),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([params, projects]) => {
        const id = params.get('id');
        if (!id) return;

        const match = projects.find((p) => p.id === id);
        if (match) {
          this.projectFacade.selectProject(id);
        } else {
          // Invalid ID whether list is empty or populated
          this.snackBar.open('Project not found', 'Close', { duration: 5000 });
          this.router.navigate(['/']);
        }
      });
  }

  onProjectSelect(id: string): void {
    if (id) {
      this.router.navigate(['/projects', id, 'board']);
    }
  }
}
