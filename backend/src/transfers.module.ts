import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module.js';
import { TransfersController } from './transfers.controller.js';
import { TransfersService } from './transfers.service.js';
import { ReservationsModule } from './reservations.module.js';

@Module({ imports: [AuthModule, ReservationsModule], controllers: [TransfersController], providers: [TransfersService] })
export class TransfersModule {}
