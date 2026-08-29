import { Module } from '@nestjs/common';
import { StockCountsService } from './stock-counts.service.js';
import { ReconciliationsService } from './reconciliations.service.js';
import { StockCountsController, ReconciliationsController } from './stock-counts.controller.js';
import { AuthModule } from './auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [StockCountsController, ReconciliationsController],
  providers: [StockCountsService, ReconciliationsService],
  exports: [StockCountsService, ReconciliationsService],
})
export class StockCountsModule {}
