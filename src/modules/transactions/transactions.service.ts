/* eslint-disable @typescript-eslint/naming-convention */
import { ApiHeaderFormat, ApiTrxResponse } from './dto/third-transaction.dto';
import {
  CreateTransactionDTO,
  InquiryPayment,
  InquiryTrx,
} from './dto/create-trx-dto';
import { EntityManager, Repository } from 'typeorm';
import { HeaderParam } from '@/shared/interfaces';
import { HttpRequestService } from '../http-request/http-request.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { RabbitmqPublisherService } from '../rmq-publisher/rmq-publisher.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { Transaction } from './entities/transaction.entity';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { hashSHA256NonSalt } from '@/utils/helper';
import dayjs from 'dayjs';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,

    private productCompanyService: ProductCompaniesService,
    private rabbitMqPublisher: RabbitmqPublisherService,
    private userService: UsersService,
    private supplierService: SuppliersService,
    private httpRequestService: HttpRequestService
  ) {}

  createHeaderRequest(
    publicKey: string,
    secretKey: string,
    body: any,
    transactionId: string
  ): ApiHeaderFormat {
    const timestamp = dayjs().format('YYYY-MM-DD:HH:mm:ssZ');
    const formatSignature = `${secretKey}:${timestamp}:${JSON.stringify(
      body
    )}:${transactionId}`;

    return {
      'X-TIMESTAMP': timestamp,
      'PUBLIC-KEY': publicKey,
      'SIGNATURE': hashSHA256NonSalt(formatSignature),
    };
  }

  isApiResTrxValid(response: ApiTrxResponse): boolean {
    if (!response) return false;
    const { success, response_code, message, transaction_id, data } = response;
    return (
      typeof response === 'object' &&
      typeof success === 'boolean' &&
      typeof response_code === 'string' &&
      typeof message === 'string' &&
      typeof transaction_id === 'string' &&
      typeof data === 'object' &&
      typeof data.destination === 'string' &&
      typeof data.sku === 'string' &&
      typeof data.serial_number === 'string' &&
      typeof data.total_price === 'number'
    );
  }

  isApiResInquiryValid(response: any) {
    if (!response) return false;
    const { success, response_code, message, transaction_id, data } = response;
    return (
      typeof response === 'object' &&
      typeof success === 'boolean' &&
      typeof response_code === 'string' &&
      typeof message === 'string' &&
      typeof transaction_id === 'string' &&
      typeof data === 'object' &&
      typeof data.destination === 'string' &&
      typeof data.sku === 'string' &&
      typeof data.serial_number === 'string' &&
      typeof data.total_price === 'number' &&
      typeof data.base_price === 'number' &&
      typeof data.admin_fee === 'number'
    );
  }

  isApiHeaderValid(header: ApiHeaderFormat): boolean {
    if (!header) return false;
    return (
      typeof header['PUBLIC-KEY'] === 'string' &&
      typeof header.SIGNATURE === 'string' &&
      typeof header['X-TIMESTAMP'] === 'string'
    );
  }

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
    trxDetail: InquiryTrx | CreateTransactionDTO
  ) {
    const supplierPrice =
      await this.productCompanyService.mapSupplierProductPrice({
        trx,
        productCompany,
      });

    const dataToInsert = {
      company_id: productCompany.company_id,
      user_id: user?.uuid,
      supplier_id: productCompany.supplier_id,
      product_master_id: productCompany.product_digital_master_id,
      product_companies_id: productCompany?.uuid,
      product_name: productCompany.product_digital_master.name,
      product_categories:
        productCompany.product_digital_master.product_digital_brand
          .product_digital_categories.name,
      product_brand:
        productCompany.product_digital_master.product_digital_brand.name,
      product_code: productCompany.product_digital_master.product_code,
      sell_price: supplierPrice.sellPriceWithMargin,
      buy_price: supplierPrice.buyPrice,
      supplier_name: productCompany.suppliers.name,
      supplier_host: productCompany.suppliers.host,
      destination: trxDetail.destination,
      payment_method: trxDetail.paymentMethod || null,
      payment_code: null,
      payment_fee: 0,
      user_name: user.name,
      user_email: user.email,
      affiliate_total_commision: supplierPrice.feeAffiliate,
    };

    this.logger.log(
      `🔵 INSERT INITIAL TRANSACTION WITH DATA ${JSON.stringify(
        dataToInsert
      )} 🔵`
    );

    const newTrx = this.transactionRepo.create({
      ...dataToInsert,
    });
    await this.transactionRepo.save(newTrx);
    return newTrx;
  }

  private async httpRequestCreateBilling(
    newTransaction: Transaction,
    header: HeaderParam
  ) {
    const path = `${process.env.OLD_API_HOST_URL}/internal/api/billing/create`;

    const trxHash = hashSHA256NonSalt(
      `${
        process.env.BILLING_TRX_KEY +
        newTransaction.sell_price +
        newTransaction.uuid
      }`
    );
    this.logger.log(`🔵 Will make a request to ${path} 🔵\n\n`);
    const body = {
      memberGUID: newTransaction.user_id,
      koperasiGUID: newTransaction.company_id,
      branchGUID: header.branch_guid,
      referenceNumber: newTransaction.uuid,
      amount: +newTransaction.sell_price,
      convenienceFee: 0,
      description: 'POS',
      product: 'PRODUK DIGITAL',
      paymentMethod: newTransaction.payment_method,
      discount: 0,
      fixerPrice: 0,
      signature: trxHash,
    };
    this.logger.log(`🔵 With body ${JSON.stringify(body)} 🔵\n\n`);

    const response = await this.httpRequestService.post(path, body, {
      headers: {
        'content-type': 'application/json',
      },
    });

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    return response;
  }

  async httpRequestSupplierProduct(transaction: Transaction) {
    this.logger.log(
      `\n🔵 Incoming Request Transaction Billing ${JSON.stringify(
        transaction
      )} 🔵\n`
    );
    const supplier = await this.supplierService.detail(transaction.supplier_id);

    const url = transaction.supplier_host + process.env.TRANSACTION_PREFIX_PATH;
    this.logger.log(`\n🔵 With URL ${url} 🔵\n`);

    const body = {
      transaction_id: transaction.uuid,
      sku: transaction.product_code,
      destination: transaction.destination,
    };

    this.logger.log(`\n🔵 With BODY ${JSON.stringify(body)} 🔵\n`);

    const header = this.createHeaderRequest(
      supplier.public_key,
      supplier.secret_key,
      body,
      transaction.uuid
    );
    this.logger.log(`\n🔵 With HEADER ${JSON.stringify(header)} 🔵\n`);

    const response = await this.httpRequestService.post(url, body, {
      headers: header,
    });

    const data: ApiTrxResponse = response?.data;

    if (!this.isApiResTrxValid(data)) {
      this.logger.error('Invalid API response format');
      throw new Error('Invalid API response format');
    }

    if (data) {
      const isTrxSuccess = data.response_code === '01';
      if (isTrxSuccess) await this.processTransactionResponse(data);
    }

    this.logger.log(`🔵 END With response ${JSON.stringify(response)} 🔵\n\n`);
    return response;
  }

  async httpRequestInquiryProduct(transaction: Transaction) {
    this.logger.log(
      `\n🔵 Incoming Request INQUIRY  ${JSON.stringify(transaction)} 🔵\n`
    );

    const supplier = await this.supplierService.detail(transaction.supplier_id);

    const url = `https://eo3q3xv2x52p9nr.m.pipedream.net${process.env.INQUIRY_PREFIX_PATH}`;
    this.logger.log(`\n🔵 With URL ${url} 🔵\n`);

    const body = {
      transaction_id: transaction.uuid,
      sku: transaction.product_code,
      destination: transaction.destination,
    };

    this.logger.log(`\n🔵 With BODY ${JSON.stringify(body)} 🔵\n`);

    const header = this.createHeaderRequest(
      supplier.public_key,
      supplier.secret_key,
      body,
      transaction.uuid
    );

    this.logger.log(`\n🔵 With HEADER ${JSON.stringify(header)} 🔵\n`);

    const response = await this.httpRequestService.post(url, body, {
      headers: header,
    });

    const data = response?.data;

    if (!this.isApiResInquiryValid(data)) {
      this.logger.error('Invalid API response format');
      throw new Error('Invalid API response format');
    }

    this.logger.log(`🔵 END With response ${JSON.stringify(response)} 🔵\n\n`);
    return data;
  }

  async processTransactionResponse(data: ApiTrxResponse) {
    const transaction = await this.detail(data.transaction_id);

    switch (data.response_code) {
      case '00':
        break;
      case '01':
        if (transaction.status !== 1) {
          transaction.status = 1;
          transaction.message = JSON.stringify(JSON.stringify(data));
          transaction.callback_at = new Date();
        }
        // SUKSES
        break;
      case '02':
        if (transaction.status !== 2) {
          transaction.status = 2;
          transaction.message = JSON.stringify(JSON.stringify(data));
          transaction.callback_at = new Date();
        }
        break;
      default:
        break;
    }

    return this.transactionRepo.save(transaction);
  }

  async detail(transactionId: string) {
    return this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndMapOne(
        'transaction.supplier',
        'suppliers',
        'supplier',
        'supplier.uuid = transaction.supplier_id'
      )
      .where('transaction.uuid = :transactionId', { transactionId })
      .getOne();
  }

  async create(payload: CreateTransactionDTO, header: HeaderParam) {
    return this.transactionRepo.manager.transaction(async (trx) => {
      const checkUserWallet =
        payload.paymentMethod === 'ALLOWANCE' ||
        payload.paymentMethod === 'EWALLET';

      if (checkUserWallet) {
        await this.checkUserBalance(header.user_guid, header.access_token);
      }

      // this.logger.log(`🔵 Check Koperasi Balance with UID ${companyId} 🔵`);
      // await this.checkKoperasiBalance(companyId, z);

      const productDetail = await this.productCompanyService.detail(
        payload.product_company_id
      );

      const user = await this.userService.userDetail(header.user_guid);

      const newTransaction = await this.insertInitialTransaction(
        trx,
        productDetail,
        user,
        payload
      );

      await this.httpRequestCreateBilling(newTransaction, header);

      // const responseDeductKoperasi = await this.deductKoperasiBalance(
      //   header.access_token,
      //   newTransaction.uuid,
      //   productDetail.buy_price,
      //   productDetail.company_id
      // );

      // if (!responseDeductKoperasi) {
      //   throw NormalException.VALIDATION_ERROR(
      //     'Transaksi gagal, Silahkan hubungi admin'
      //   );
      // }

      if (checkUserWallet) {
        const responseDeductUser = await this.deductUserBalance(
          payload.paymentMethod
        );

        if (!responseDeductUser) {
          throw NormalException.VALIDATION_ERROR(
            'Transaksi gagal, Silahkan hubungi admin'
          );
        }
      }

      await this.rabbitMqPublisher.publishMessage(
        newTransaction,
        'PRODUCT_DIGITAL_TRANSACTION'
      );

      return {
        message: 'Transaksimu sedang di proses',
        data: newTransaction,
      };
    });
  }

  async inquiry(payload: InquiryTrx, header: HeaderParam) {
    return this.transactionRepo.manager.transaction(async (trx) => {
      const productDetail = await this.productCompanyService.detail(
        payload.product_company_id
      );

      if (productDetail.product_digital_master.is_bill_payment !== 1) {
        throw NormalException.NOTFOUND('Produk bukan prabayar');
      }

      const user = await this.userService.userDetail(header.user_guid);

      const newTransaction = await this.insertInitialTransaction(
        trx,
        productDetail,
        user,
        payload
      );

      const inquiryData = await this.httpRequestInquiryProduct(newTransaction);

      newTransaction.message = inquiryData;
      await this.transactionRepo.save(newTransaction);

      return {
        message: 'Transaksimu sedang di proses',
        data: {
          reff: newTransaction.uuid,
          inquiryData,
        },
      };
    });
  }

  async paymentInquiry(payload: InquiryPayment, header: HeaderParam) {
    const checkUserWallet =
      payload.paymentMethod === 'ALLOWANCE' ||
      payload.paymentMethod === 'EWALLET';

    if (checkUserWallet) {
      await this.checkUserBalance(header.user_guid, header.access_token);
    }

    const transaction = await this.detail(payload.reff_id);

    if (!transaction) {
      throw NormalException.NOTFOUND('Reff tidak ditemukan');
    }

    transaction.payment_method = payload.paymentMethod;

    await this.httpRequestCreateBilling(transaction, header);

    if (checkUserWallet) {
      const responseDeductUser = await this.deductUserBalance(
        payload.paymentMethod
      );

      if (!responseDeductUser) {
        throw NormalException.VALIDATION_ERROR(
          'Transaksi gagal, Silahkan hubungi admin'
        );
      }
    }

    await this.rabbitMqPublisher.publishMessage(
      transaction,
      'PRODUCT_DIGITAL_TRANSACTION'
    );

    return {
      message: 'Transaksimu sedang di proses',
      data: transaction,
    };
  }
}
