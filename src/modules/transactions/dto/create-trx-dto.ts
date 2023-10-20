import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTransactionDTO {
  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  product_company_id: string;

  @IsString()
  paymentCode?: string;

  @IsString()
  paymentFee?: number;
}
