import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { RabbitmqPublisherService } from '../rmq-publisher/rmq-publisher.service';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,

    private productCompanyService: ProductCompaniesService,
    private rabbitMqPublisher: RabbitmqPublisherService
  ) {}

  private async checkUserBalance(userId: string) {
    return true;
  }

  private async checkKoperasiBalance(koperasiId: string) {
    return true;
  }

  private async addKoperasiBalance(userId: string) {
    return true;
  }

  private async deductKoperasiBalance(companyId: string) {
    return true;
  }

  private async addUserBalance(userId: string) {
    return true;
  }

  private async deductUserBalance(userId: string) {
    return true;
  }

  async create() {
    return this.transactionRepo.manager.transaction(async (trx) => {
      const userID = 'USERID';
      const companyId = 'COMPANYID';
      const supplierId = 'COMPANYID';
      const productCompanyId = 'COMPANYID';

      this.logger.log(`🔵 Check User Balance with UID ${userID} 🔵`);
      await this.checkUserBalance(userID);

      this.logger.log(`🔵 Check Koperasi Balance with UID ${companyId} 🔵`);
      await this.checkKoperasiBalance(companyId);

      const supplierPriceDetail =
        await this.productCompanyService.mapSupplierProductPrice({
          trx,
          supplierId,
          productCompanyId,
        });

      this.logger.warn(
        `🔵 Supplier Price Detail ${JSON.stringify(supplierPriceDetail)} 🔵`
      );

      this.logger.log(`🔵DO DEDUCT KOPERASI Balance with UID ${companyId} 🔵`);
      const responseDeductKoperasi = await this.deductKoperasiBalance(
        companyId
      );
      this.logger.log(
        `🔵DONE DEDUCT KOPERASI Balance with response ${JSON.stringify(
          responseDeductKoperasi
        )}🔵`
      );

      if (!responseDeductKoperasi) {
        throw NormalException.VALIDATION_ERROR(
          'Transaksi gagal, Silahkan hubungi admin'
        );
      }

      this.logger.log(`🔵DO DEDUCT USER Balance with UID ${userID} 🔵`);
      const responseDeductUser = await this.deductUserBalance(userID);
      this.logger.log(
        `🔵DONE DEDUCT USER Balance with response ${JSON.stringify(
          responseDeductUser
        )}🔵`
      );

      if (!responseDeductUser) {
        throw NormalException.VALIDATION_ERROR(
          'Transaksi gagal, Silahkan hubungi admin'
        );
      }

      await this.rabbitMqPublisher.publishMessage(
        { data: 123 },
        'PRODUCT_DIGITAL_TRANSACTION'
      );

      console.log(trx);
    });
  }
}
