import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from './prisma.service.js';
import { MasterDataModule } from './master-data.module.js';

@Module({
  imports: [HealthModule, AuthModule, MasterDataModule],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService, PrismaService],
})
export class AppModule {}
