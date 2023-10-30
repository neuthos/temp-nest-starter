import { ApiTrxResponse } from './dto/third-transaction.dto';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { UpdateBillingPayloadDto } from './dto/billing.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @MessagePattern('PRODUCT_DIGITAL_TRANSACTION')
  public async transactionProduct(@Payload() data: Transaction) {
    return this.transactionsService.httpRequestSupplierProduct(data);
  }

  @MessagePattern('PRODUCT_DIGITAL_BILLING_QUEUE')
  async handleOrderAllowanceStream(
    @Payload() userOrderResult: UpdateBillingPayloadDto
  ) {
    return this.transactionsService.transactionHandlerAfterPay(userOrderResult);
  }

  @Post('/callback')
  @UseGuards(ProtectTransactionCallback)
  callbackTrx(@Body() body: ApiTrxResponse) {
    return this.transactionsService.processTransactionResponse(body);
  }

  @Get()
  list(@Headers() header: HeaderParam, @Query() query: any) {
    return this.transactionsService.list(header.companyId, query);
  }

  @Get('/stats')
  getTransactionStatistics(@Headers() header: HeaderParam) {
    return this.transactionsService.getTransactionStatistics(header.companyId);
  }

  @Get('/:transactionId')
  getStatusTrx(@Param('transactionId') transactionId: string) {
    return this.transactionsService.getStatusTrx(transactionId);
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
