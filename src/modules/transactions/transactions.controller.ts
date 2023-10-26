import { ApiTrxResponse } from './dto/third-transaction.dto';
import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import {
  CreateTransactionDTO,
  InquiryPayment,
  InquiryTrx,
} from './dto/create-trx-dto';
import { HeaderParam } from '@/shared/interfaces';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProtectTransactionCallback } from '@/middleware/transaction.guard';
import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @MessagePattern('PRODUCT_DIGITAL_TRANSACTION')
  public async transactionProduct(@Payload() data: Transaction) {
    return this.transactionsService.httpRequestSupplierProduct(data);
  }

  @Post('/callback')
  @UseGuards(ProtectTransactionCallback)
  callbackTrx(@Body() body: ApiTrxResponse) {
    return this.transactionsService.processTransactionResponse(body);
  }

  @Post('/create')
  create(
    @Headers() header: HeaderParam,
    @Body() payload: CreateTransactionDTO
  ) {
    return this.transactionsService.create(payload, header);
  }

  @Post('/inquiry')
  inquiry(@Headers() header: HeaderParam, @Body() payload: InquiryTrx) {
    return this.transactionsService.inquiry(payload, header);
  }

  @Post('/inquiry/payment')
  paymentInquiry(
    @Headers() header: HeaderParam,
    @Body() payload: InquiryPayment
  ) {
    return this.transactionsService.paymentInquiry(payload, header);
  }
}
