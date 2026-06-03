import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import type { User } from '@org/shared-types';
import { ChangePasswordDto } from './dto/change-password.dto';

const IMAGE_SIGNATURES: Record<string, number[]> = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
};

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    displayName?: string,
    file?: Express.Multer.File,
    removeAvatar?: string,
  ): Promise<User> {
    if (!displayName?.trim() && !file && removeAvatar !== 'true') {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
      });
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      };
    }

    let avatarUrl: string | null | undefined;

    if (removeAvatar === 'true') {
      await this.deleteAvatar(userId);
      avatarUrl = null;
      this.logger.log(`Avatar removed for user ${userId}`);
    } else if (file) {
      this.validateImage(file);
      avatarUrl = await this.saveAvatar(userId, file);
      this.logger.log(`Avatar saved for user ${userId} at ${avatarUrl}`);
    }

    const data: Record<string, unknown> = {};
    if (displayName?.trim()) {
      data['displayName'] = displayName.trim();
    }
    if (avatarUrl !== undefined) {
      data['avatarUrl'] = avatarUrl;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
    };
  }

  private validateImage(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 1MB limit');
    }

    const bytes = Array.from(file.buffer.subarray(0, 8));
    const isImage = Object.values(IMAGE_SIGNATURES).some((sig) =>
      sig.every((b, i) => bytes[i] === b),
    );

    if (!isImage) {
      throw new BadRequestException('File is not a valid image');
    }
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password changed for user ${userId}`);
  }

  private async deleteAvatar(userId: string): Promise<void> {
    const uploadsDir =
      process.env['UPLOADS_DIR'] ?? path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, 'avatars', `${userId}.jpg`);

    try {
      await fs.promises.unlink(filePath);
    } catch (err: unknown) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  private async saveAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const uploadsDir =
      process.env['UPLOADS_DIR'] ?? path.join(__dirname, 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    const filePath = path.join(avatarsDir, `${userId}.jpg`);

    await fs.promises.mkdir(avatarsDir, { recursive: true });
    await fs.promises.writeFile(filePath, file.buffer);

    return `/uploads/avatars/${userId}.jpg?v=${Date.now()}`;
  }
}
