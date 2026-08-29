import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) password!: string;
}

export class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/, {
    message: 'Password must be at least 10 characters with upper, lower, number, and special character',
  }) password!: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/, {
    message: 'Password must be at least 10 characters with upper, lower, number, and special character',
  }) password!: string;
}

export class ForgotPasswordDto { @IsEmail() email!: string; }

export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/) password!: string;
}

export class UpdateProfileDto { @IsString() @MinLength(2) name!: string; }

export class CreateUserDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,}$/) password!: string;
  @IsString() role!: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class StatusDto { @IsBoolean() isActive!: boolean; }
