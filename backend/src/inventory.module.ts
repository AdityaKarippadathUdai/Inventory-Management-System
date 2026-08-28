import { Module } from '@nestjs/common';
import { AuthModule } from './auth.module.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({ imports: [AuthModule], controllers: [InventoryController], providers: [InventoryService] })
export class InventoryModule {}
