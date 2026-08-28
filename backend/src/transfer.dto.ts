import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto { @IsUUID() productId!: string; @IsInt() @Min(1) requestedQuantity!: number; }
export class CreateTransferDto { @IsUUID() sourceWarehouseId!: string; @IsUUID() destinationWarehouseId!: string; @IsArray() @ValidateNested({ each: true }) @Type(() => TransferItemDto) items!: TransferItemDto[]; @IsOptional() @IsString() notes?: string; }
export class ReasonDto { @IsString() @MinLength(2) reason!: string; }
export class ReceiveTransferItemDto { @IsUUID() itemId!: string; @IsInt() @Min(0) receivedQuantity!: number; }
export class ReceiveTransferDto { @IsArray() @ValidateNested({ each: true }) @Type(() => ReceiveTransferItemDto) items!: ReceiveTransferItemDto[]; }
export class TransferListDto { @IsOptional() @IsString() status?: string; @IsOptional() @IsUUID() sourceWarehouseId?: string; @IsOptional() @IsUUID() destinationWarehouseId?: string; @IsOptional() @IsString() search?: string; @IsOptional() page?: number; @IsOptional() limit?: number; }
