/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

enum PaymentMethod {
  CASH = 'CASH',
  ALLOWANCE = 'ALLOWANCE',
  QRIS = 'QRIS',
  EWALLET = 'EWALLET',
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
}
export class CreateTransactionDTO {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  product_company_id: string;

  @ApiProperty()
  @IsOptional()
  voucher_id?: string | undefined;
}

export class InquiryTrx {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  product_company_id: string;

  @IsString()
  @IsOptional()
  paymentMethod?: PaymentMethod | undefined | null;
}

export class InquiryPayment {
  @IsString()
  @IsNotEmpty()
  reff_id: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @IsOptional()
  voucher_id?: string | undefined;
}
