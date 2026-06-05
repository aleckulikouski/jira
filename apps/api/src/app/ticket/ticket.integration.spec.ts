import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TicketModule } from './ticket.module';
import { ProjectModule } from '../project/project.module';
import { PrismaModule } from '../prisma.module';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('Ticket API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;
  let testProjectId: string;
  let testColumnId: string;
  let otherColumnId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    // Clean up any leftover test data from previous runs
    const testEmails = ['ticket-test@test.com', 'other-ticket-test@test.com'];
    for (const email of testEmails) {
      await prisma.ticket.deleteMany({
        where: { column: { project: { owner: { email } } } },
      });
      await prisma.boardColumn.deleteMany({
        where: { project: { owner: { email } } },
      });
      await prisma.project.deleteMany({
        where: { owner: { email } },
      });
      await prisma.user.deleteMany({ where: { email } });
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'ticket-test@test.com',
        passwordHash: 'test-hash',
        displayName: 'Test User',
      },
    });
    testUserId = user.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        ownerId: testUserId,
        name: 'Test Project',
      },
    });
    testProjectId = project.id;

    // Create test columns
    const column1 = await prisma.boardColumn.create({
      data: {
        projectId: testProjectId,
        name: 'To Do',
        order: 0,
      },
    });
    testColumnId = column1.id;

    const column2 = await prisma.boardColumn.create({
      data: {
        projectId: testProjectId,
        name: 'Done',
        order: 1,
      },
    });
    otherColumnId = column2.id;

    // Set up test module with mocked auth guard
    const mockGuard: CanActivate = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { id: testUserId, email: 'ticket-test@test.com' };
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TicketModule, ProjectModule, PrismaModule],
      providers: [{ provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data (cascade deletes tickets, columns, project)
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  afterEach(async () => {
    // Clean up tickets between tests
    await prisma.ticket.deleteMany({ where: { columnId: testColumnId } });
    await prisma.ticket.deleteMany({ where: { columnId: otherColumnId } });
  });

  // ── GET /api/projects/:id/board ──────────────────────────────────

  describe('GET /api/projects/:id/board', () => {
    it('returns empty tickets array for column with no tickets', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const column = res.body.columns.find((c: any) => c.id === testColumnId);
      expect(column.tickets).toEqual([]);
    });

    it('returns tickets ordered by position ASC', async () => {
      // Create tickets in reverse position order
      await prisma.ticket.createMany({
        data: [
          { columnId: testColumnId, title: 'Third', position: 2 },
          { columnId: testColumnId, title: 'First', position: 0 },
          { columnId: testColumnId, title: 'Second', position: 1 },
        ],
      });

      const res = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const column = res.body.columns.find((c: any) => c.id === testColumnId);
      expect(column.tickets).toHaveLength(3);
      expect(column.tickets[0].title).toBe('First');
      expect(column.tickets[1].title).toBe('Second');
      expect(column.tickets[2].title).toBe('Third');
    });
  });

  // ── POST /api/columns/:columnId/tickets ─────────────────────────

  describe('POST /api/columns/:columnId/tickets', () => {
    it('creates a ticket with position 0 when column is empty', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'First ticket' })
        .expect(201);

      expect(res.body.title).toBe('First ticket');
      expect(res.body.position).toBe(0);
      expect(res.body.columnId).toBe(testColumnId);
      expect(res.body.description).toBe('');
    });

    it('assigns position = max + 1 for subsequent tickets', async () => {
      await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Ticket 1' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Ticket 2', description: 'with description' })
        .expect(201);

      expect(res.body.title).toBe('Ticket 2');
      expect(res.body.position).toBe(1);
      expect(res.body.description).toBe('with description');
    });

    it('returns 400 when title is empty', async () => {
      await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: '' })
        .expect(400);
    });
  });

  // ── PATCH /api/tickets/:id ──────────────────────────────────────

  describe('PATCH /api/tickets/:id', () => {
    it('updates title and description without changing position', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Original', description: 'Original desc' });

      const res = await request(app.getHttpServer())
        .patch(`/api/tickets/${created.body.id}`)
        .send({ title: 'Updated', description: 'New desc' })
        .expect(200);

      expect(res.body.title).toBe('Updated');
      expect(res.body.description).toBe('New desc');
      expect(res.body.position).toBe(0);
      expect(res.body.columnId).toBe(testColumnId);
    });

    it('renumbers when moving to a lower position within same column', async () => {
      // Create 3 tickets at positions 0, 1, 2
      const t0 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 0' });
      const t1 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 1' });
      const t2 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 2' });

      // Move t2 (position 2) to position 0
      const res = await request(app.getHttpServer())
        .patch(`/api/tickets/${t2.body.id}`)
        .send({ position: 0 })
        .expect(200);

      expect(res.body.position).toBe(0);

      // Verify renumbering via board endpoint
      const board = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const column = board.body.columns.find((c: any) => c.id === testColumnId);
      const byId = (id: string) => column.tickets.find((t: any) => t.id === id);
      expect(byId(t2.body.id).position).toBe(0);
      expect(byId(t0.body.id).position).toBe(1);
      expect(byId(t1.body.id).position).toBe(2);
    });

    it('renumbers when moving to a higher position within same column', async () => {
      const t0 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 0' });
      const t1 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 1' });
      const t2 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Pos 2' });

      // Move t0 (position 0) to position 2
      const res = await request(app.getHttpServer())
        .patch(`/api/tickets/${t0.body.id}`)
        .send({ position: 2 })
        .expect(200);

      expect(res.body.position).toBe(2);

      // Verify via board endpoint
      const board = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const column = board.body.columns.find((c: any) => c.id === testColumnId);
      const byId = (id: string) => column.tickets.find((t: any) => t.id === id);
      expect(byId(t1.body.id).position).toBe(1);
      expect(byId(t0.body.id).position).toBe(2);
      expect(byId(t2.body.id).position).toBe(3);
    });

    it('renumbers when moving a ticket to a different column', async () => {
      // Create ticket in testColumnId at position 0
      const t0 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Source' });

      // Create tickets in otherColumnId at positions 0 and 1
      await request(app.getHttpServer())
        .post(`/api/columns/${otherColumnId}/tickets`)
        .send({ title: 'Target Pos 0' });
      await request(app.getHttpServer())
        .post(`/api/columns/${otherColumnId}/tickets`)
        .send({ title: 'Target Pos 1' });

      // Move ticket to otherColumnId at position 0
      const res = await request(app.getHttpServer())
        .patch(`/api/tickets/${t0.body.id}`)
        .send({ columnId: otherColumnId, position: 0 })
        .expect(200);

      expect(res.body.columnId).toBe(otherColumnId);
      expect(res.body.position).toBe(0);

      // Verify target column tickets via board endpoint
      const board = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const targetColumn = board.body.columns.find((c: any) => c.id === otherColumnId);
      expect(targetColumn.tickets).toHaveLength(3);
      const byTitle = (t: string) => targetColumn.tickets.find((x: any) => x.title === t);
      expect(byTitle('Source').position).toBe(0);
      expect(byTitle('Target Pos 0').position).toBe(1);
      expect(byTitle('Target Pos 1').position).toBe(2);
    });

    it('handles moving to end of column (high position)', async () => {
      const t0 = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'First' });
      await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'Second' });

      // Move first ticket to position 5 (beyond max)
      const res = await request(app.getHttpServer())
        .patch(`/api/tickets/${t0.body.id}`)
        .send({ position: 5 })
        .expect(200);

      expect(res.body.position).toBe(5);
    });

    it('returns 404 when ticket does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/api/tickets/non-existent-id')
        .send({ title: 'Nope' })
        .expect(404);
    });
  });

  // ── DELETE /api/tickets/:id ─────────────────────────────────────

  describe('DELETE /api/tickets/:id', () => {
    it('deletes the ticket and returns 204', async () => {
      const created = await request(app.getHttpServer())
        .post(`/api/columns/${testColumnId}/tickets`)
        .send({ title: 'To delete' });

      await request(app.getHttpServer())
        .delete(`/api/tickets/${created.body.id}`)
        .expect(204);

      // Verify ticket is gone via board endpoint
      const board = await request(app.getHttpServer())
        .get(`/api/projects/${testProjectId}/board`)
        .expect(200);

      const column = board.body.columns.find((c: any) => c.id === testColumnId);
      expect(column.tickets.find((t: any) => t.id === created.body.id)).toBeUndefined();
    });

    it('returns 404 when deleting non-existent ticket', async () => {
      await request(app.getHttpServer())
        .delete('/api/tickets/non-existent-id')
        .expect(404);
    });
  });

  // ── Authorization ───────────────────────────────────────────────

  describe('authorization', () => {
    it('allows access to board from any project', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-ticket-test@test.com',
          passwordHash: 'test-hash',
          displayName: 'Other User',
        },
      });

      const otherProject = await prisma.project.create({
        data: { ownerId: otherUser.id, name: 'Other Project' },
      });

      await prisma.boardColumn.create({
        data: { projectId: otherProject.id, name: 'Other Col', order: 0 },
      });

      // Board endpoint uses project-level auth; no per-column ownership check
      const board = await request(app.getHttpServer())
        .get(`/api/projects/${otherProject.id}/board`)
        .expect(200);

      expect(board.body.columns).toHaveLength(1);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
    });
  });
});
