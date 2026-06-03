import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { UserModule } from './user.module';
import { PrismaModule } from '../prisma.module';
import { PrismaService } from '../prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

describe('User API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    // Clean up any leftover test data
    await prisma.user.deleteMany({
      where: { email: 'avatar-test@test.com' },
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'avatar-test@test.com',
        passwordHash: 'test-hash',
        displayName: 'Avatar Test',
      },
    });
    testUserId = user.id;

    // Mock auth guard
    const mockGuard: CanActivate = {
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        request.user = { id: testUserId, email: 'avatar-test@test.com' };
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule, PrismaModule],
      providers: [{ provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    // Clean up test user and avatar files
    if (testUserId) {
      const possiblePaths = [
        path.join(__dirname, 'uploads', 'avatars', `${testUserId}.jpg`),
      ];
      for (const p of possiblePaths) {
        try { fs.unlinkSync(p); } catch {}
      }
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    await prisma.$disconnect();
    if (app) {
      await app.close();
    }
  });

  // ── PATCH /api/users/me/profile ───────────────────────────────────

  describe('PATCH /api/users/me/profile', () => {
    it('removes avatar when removeAvatar is true, deleting file and setting avatarUrl to null', async () => {
      // Set avatarUrl in DB (simulate having an avatar)
      await prisma.user.update({
        where: { id: testUserId },
        data: { avatarUrl: '/uploads/avatars/test-avatar.jpg' },
      });

      // Write a dummy avatar file
      const uploadsDir = path.join(__dirname, 'uploads', 'avatars');
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(uploadsDir, `${testUserId}.jpg`),
        Buffer.from('fake-image'),
      );

      const res = await request(app.getHttpServer())
        .patch('/api/users/me/profile')
        .field('removeAvatar', 'true')
        .expect(200);

      expect(res.body.avatarUrl).toBeNull();

      // Verify file was deleted
      expect(
        fs.existsSync(path.join(uploadsDir, `${testUserId}.jpg`)),
      ).toBe(false);
    });

    it('succeeds when removeAvatar is true but file does not exist on disk', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { avatarUrl: '/uploads/avatars/missing.jpg' },
      });

      const res = await request(app.getHttpServer())
        .patch('/api/users/me/profile')
        .field('removeAvatar', 'true')
        .expect(200);

      expect(res.body.avatarUrl).toBeNull();
    });

    it('returns current user when nothing to update (no-op)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/me/profile')
        .expect(200);

      expect(res.body.displayName).toBe('Avatar Test');
      expect(res.body.avatarUrl).toBeNull();
    });

    it('updates display name and removes avatar in a single request', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { avatarUrl: '/uploads/avatars/test-avatar.jpg' },
      });

      const res = await request(app.getHttpServer())
        .patch('/api/users/me/profile')
        .field('displayName', 'Fresh Name')
        .field('removeAvatar', 'true')
        .expect(200);

      expect(res.body.displayName).toBe('Fresh Name');
      expect(res.body.avatarUrl).toBeNull();
    });

    it('updates display name', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users/me/profile')
        .field('displayName', 'New Name')
        .expect(200);

      expect(res.body.displayName).toBe('New Name');
    });
  });
});
