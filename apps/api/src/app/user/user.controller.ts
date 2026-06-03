import {
  Controller,
  HttpCode,
  Patch,
  Post,
  Body,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { Request } from 'express';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 1 * 1024 * 1024 },
    }),
  )
  async updateProfile(
    @Req() req: Request & { user: { id: string; email: string } },
    @Body('displayName') displayName: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userService.updateProfile(req.user.id, displayName, file);
  }

  @Post('change-password')
  @HttpCode(204)
  async changePassword(
    @Req() req: Request & { user: { id: string; email: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.userService.changePassword(req.user.id, dto);
  }
}
