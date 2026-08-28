import { Module } from '@nestjs/common';
import { CategoriesController, ProductsController, SuppliersController, WarehousesController } from './master-data.controller.js';
import { MasterDataService } from './master-data.service.js';
import { AuthModule } from './auth.module.js';

@Module({ imports: [AuthModule], controllers: [WarehousesController, CategoriesController, ProductsController, SuppliersController], providers: [MasterDataService] })
export class MasterDataModule {}
