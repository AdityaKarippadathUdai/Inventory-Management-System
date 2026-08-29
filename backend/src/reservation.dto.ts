import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
export enum ReservationType { TRANSFER = 'TRANSFER', ORDER = 'ORDER', INTERNAL_REQUEST = 'INTERNAL_REQUEST', PRODUCTION = 'PRODUCTION', OTHER = 'OTHER' }
export class ReservationItemDto { @IsUUID() productId!: string; @IsInt() @Min(1) quantity!: number; }
export class CreateReservationDto { @IsUUID() warehouseId!: string; @IsEnum(ReservationType) reservationType!: ReservationType; @IsOptional() @IsString() referenceType?: string; @IsOptional() @IsString() referenceId?: string; @IsArray() @ValidateNested({ each: true }) @Type(() => ReservationItemDto) items!: ReservationItemDto[]; @IsOptional() @IsDateString() expiresAt?: string; @IsOptional() @IsString() notes?: string; }
export class ConsumeReservationDto { @IsArray() @ValidateNested({ each: true }) @Type(() => ReservationItemDto) items!: ReservationItemDto[]; }
export class ReservationListDto { @IsOptional() @IsString() status?: string; @IsOptional() @IsEnum(ReservationType) reservationType?: ReservationType; @IsOptional() @IsUUID() warehouseId?: string; @IsOptional() @IsUUID() productId?: string; @IsOptional() @IsString() search?: string; @IsOptional() page?: number; @IsOptional() limit?: number; }
export class ReasonDto { @IsString() @MinLength(2) reason!: string; }
