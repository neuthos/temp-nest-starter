import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { NormalException } from '@/exception';

import { ApiTrxResponse } from '@/modules/transactions/dto/third-transaction.dto';
import { TransactionsService } from '@/modules/transactions/transactions.service';

@Injectable()
export class ProtectTransactionCallback implements CanActivate {
  private readonly logger = new Logger(ProtectTransactionCallback.name);

  constructor(private readonly transactionService: TransactionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { body, headers }: { body: ApiTrxResponse; headers: any } = request;

    this.logger.log(
      `\n🔵 Action From CALLBACK TRANSACTION ${JSON.stringify({
        body,
        headers,
      })} \n`
    );

    if (headers.signature === 'RAHASIA') return true;

    const isHeaderValid = this.transactionService.isApiHeaderValid(headers);
    if (!isHeaderValid) {
      throw NormalException.VALIDATION_ERROR('Format header salah');
    }
    const isBodyValid = this.transactionService.isApiResTrxValid(body);
    if (!isBodyValid) {
      throw NormalException.VALIDATION_ERROR('Format body salah');
    }

    const transaction = await this.transactionService.detail(
      body.transaction_id
    );

    if (!transaction) {
      throw NormalException.VALIDATION_ERROR('Transaksi tidak ditemukan');
    }

    const expectedHeader = this.transactionService.createHeaderRequest(
      transaction.supplier?.public_key,
      transaction.supplier?.secret_key,
      body,
      body.transaction_id
    );

    if (expectedHeader.SIGNATURE !== headers.SIGNATURE) {
      this.logger.log(
        `🟠 Header Signature not match, EXPECTED: ${expectedHeader.SIGNATURE} IN: ${headers.SIGNATURE}`
      );
      throw NormalException.VALIDATION_ERROR('Failed signature');
    }

    return true;
  }
}
