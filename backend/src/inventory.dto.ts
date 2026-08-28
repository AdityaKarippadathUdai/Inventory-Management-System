import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export enum AdjustmentType { ADJUSTMENT_IN = 'ADJUSTMENT_IN', ADJUSTMENT_OUT = 'ADJUSTMENT_OUT' }
export class InventoryListDto { @IsOptional() @IsString() search?: string; @IsOptional() @IsUUID() warehouseId?: string; @IsOptional() @IsUUID() productId?: string; @IsOptional() @IsUUID() categoryId?: string; @IsOptional() @IsString() stockStatus?: string; @IsOptional() page?: number; @IsOptional() limit?: number; @IsOptional() @IsString() sortBy?: string; @IsOptional() @IsString() sortOrder?: string; }
export class ReceiveStockDto { @IsUUID() warehouseId!: string; @IsUUID() productId!: string; @IsInt() @Min(1) quantity!: number; @IsString() @MinLength(2) reason!: string; @IsOptional() @IsString() notes?: string; }
export class AdjustStockDto { @IsUUID() warehouseId!: string; @IsUUID() productId!: string; @IsEnum(AdjustmentType) type!: AdjustmentType; @IsInt() @Min(1) quantity!: number; @IsString() @MinLength(2) reason!: string; @IsOptional() @IsString() notes?: string; }
