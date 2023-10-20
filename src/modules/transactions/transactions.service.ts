import { CreateTransactionDTO } from './dto/create-trx-dto';
import { EntityManager, Repository } from 'typeorm';
import { HttpRequestService } from '../http-request/http-request.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { RabbitmqPublisherService } from '../rmq-publisher/rmq-publisher.service';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { hashSHA256NonSalt } from '@/utils/helper';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,

    private productCompanyService: ProductCompaniesService,
    private rabbitMqPublisher: RabbitmqPublisherService,
    private userService: UsersService,
    private httpRequestService: HttpRequestService
  ) {}

  private async checkUserBalance(userId: string, accessToken: string) {
    const path = `${process.env.OLD_API_HOST_URL}/api/usage/find-member-by-guid?guid=${userId}`;

    this.logger.log(`🔵 Check User Balance with UID ${userId} 🔵 \n\n`);
    const response = await this.httpRequestService.get(path, null, {
      Authorization: `Bearer ${accessToken}`,
    });
    this.logger.log(`🔵 RESPONSE ${JSON.stringify(response)} 🔵 \n\n`);

    if (!response.data?.success) {
      throw NormalException.NOTFOUND('User tidak ditemukan');
    }

    return response;
  }

  private async deductKoperasiBalance(
    accessToken: string,
    referenceNumber: string,
    buyPrice: number,
    companyId: string
  ) {
    const path = `${process.env.OLD_API_HOST_URL}/api/walletpayment/v1/internal/transaction`;
    const body = {
      referenceNumber,
      amount: buyPrice,
      accountCode: 'KOPERASI_WALLET',
      userId: companyId,
      signature: 'asdad',
    };

    this.logger.log(`🔵 Deduct koperasi balance with ID ${companyId} 🔵 \n\n`);
    const response = await this.httpRequestService.post(path, body, {
      Authorization: `Bearer ${accessToken}`,
    });
    this.logger.log(`🔵 RESPONSE ${JSON.stringify(response)} 🔵 \n\n`);

    return response;
  }

  private async deductUserBalance(paymentMethod: string) {
    switch (paymentMethod) {
      case 'ALLOWANCE':
        this.logger.log(`🔵 Will do Deduct user ALLOWANCE  🔵\n\n`);
        break;
      case 'WALLET':
        this.logger.log(`🔵 Will do Deduct user WALLET  🔵\n\n`);
        break;
      case 'PAYMENT_METHOD':
        this.logger.log(`🔵 Will do Deduct user PAYMENT METHOD  🔵\n\n`);
        break;
      default:
        break;
    }

    return true;
  }

  private async insertInitialTransaction(
    trx: EntityManager,
    productCompany: ProductCompany,
    user: User,
    trxDetail: CreateTransactionDTO
  ) {
    const supplierPrice =
      await this.productCompanyService.mapSupplierProductPrice({
        trx,
        productCompany,
      });

    const dataToInsert = {
      company_id: productCompany.company_id,
      user_id: user.uuid,
      supplier_id: productCompany.supplier_id,
      product_master_id: productCompany.supplier_id,
      product_companies_id: productCompany.uuid,
      product_name: productCompany.product_digital_master.name,
      product_categories:
        productCompany.product_digital_master.product_digital_brand
          .product_digital_category.name,
      product_brand:
        productCompany.product_digital_master.product_digital_brand.name,
      product_code: productCompany.product_digital_master.product_code,
      sell_price: supplierPrice.sellPriceWithMargin,
      buy_price: supplierPrice.buyPrice,
      supplier_name: productCompany.supplier.name,
      supplier_host: productCompany.supplier.host,
      destination: trxDetail.destination,
      payment_method: trxDetail.paymentMethod,
      payment_code: trxDetail.paymentCode || null,
      payment_fee: trxDetail.paymentFee || 0,
      user_name: user.name,
      user_email: user.email,
      affiliate_total_commision: supplierPrice.feeAffiliate,
    };

    this.logger.log(
      `🔵 INSERT INITIAL TRANSACTION WITH DATA ${JSON.stringify(
        dataToInsert
      )} 🔵`
    );

    return this.transactionRepo.create({
      ...dataToInsert,
    });
  }

  private async httpRequestCreateBilling(
    newTransaction: Transaction,
    branchGUID?: string
  ) {
    const path = `${process.env.OLD_API_HOST_URL}/internal/api/billing/create`;

    const trxHash = hashSHA256NonSalt(
      process.env.BILLING_TRX_KEY +
        newTransaction.sell_price +
        newTransaction.uuid
    );
    this.logger.log(`🔵 Will make a request to ${path} 🔵\n\n`);
    const body = {
      memberGUID: newTransaction.user_id,
      koperasiGUID: newTransaction.company_id,
      branchGUID,
      referenceNumber: newTransaction.uuid,
      amount: newTransaction.sell_price,
      convenienceFee: 0,
      description: 'POS',
      product: 'PRODUK DIGITAL',
      paymentMethod: newTransaction.payment_method,
      discount: 0,
      fixerPrice: 0,
      signature: trxHash,
    };
    this.logger.log(`🔵 With body ${JSON.stringify(body)} 🔵\n\n`);

    const response = await this.httpRequestService.post(path, {}, {});

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    return response;
  }

  async create(
    payload: CreateTransactionDTO,
    userId: string,
    branchGuid?: string,
    accessToken?: string
  ) {
    return this.transactionRepo.manager.transaction(async (trx) => {
      await this.checkUserBalance(userId, accessToken);

      // this.logger.log(`🔵 Check Koperasi Balance with UID ${companyId} 🔵`);
      // await this.checkKoperasiBalance(companyId, z);

      const productDetail = await this.productCompanyService.detail(
        payload.product_company_id
      );

      const user = await this.userService.userDetail(userId);

      const newTransaction = await this.insertInitialTransaction(
        trx,
        productDetail,
        user,
        payload
      );

      await this.httpRequestCreateBilling(newTransaction, branchGuid);

      const responseDeductKoperasi = await this.deductKoperasiBalance(
        accessToken,
        'REFF-ID',
        productDetail.buy_price,
        productDetail.company_id
      );
      if (!responseDeductKoperasi) {
        throw NormalException.VALIDATION_ERROR(
          'Transaksi gagal, Silahkan hubungi admin'
        );
      }

      const responseDeductUser = await this.deductUserBalance('CASH');
      if (!responseDeductUser) {
        throw NormalException.VALIDATION_ERROR(
          'Transaksi gagal, Silahkan hubungi admin'
        );
      }

      await this.rabbitMqPublisher.publishMessage(
        { data: 123 },
        'PRODUCT_DIGITAL_TRANSACTION'
      );

      return {
        message: 'Transaksimu sedang di proses',
        data: newTransaction,
      };
    });
  }
}
