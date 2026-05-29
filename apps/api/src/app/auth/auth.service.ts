import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const DEFAULT_COLUMNS = [
  { name: 'To Do', order: 0 },
  { name: 'In Progress', order: 1 },
  { name: 'Done', order: 2 },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName,
        },
      });

      const project = await tx.project.create({
        data: {
          ownerId: u.id,
          name: 'My Project',
        },
      });

      for (const col of DEFAULT_COLUMNS) {
        await tx.boardColumn.create({
          data: {
            projectId: project.id,
            name: col.name,
            order: col.order,
          },
        });
      }

      return u;
    });

    return this.tokenFor(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenFor(user);
  }

  private tokenFor(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
