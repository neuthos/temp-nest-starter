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
import {
  LabelLog,
  StatusLog,
  TransactionLog,
} from './entities/transaction-log.entity';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { RabbitmqPublisherService } from '../rmq-publisher/rmq-publisher.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { Transaction } from './entities/transaction.entity';
import { UpdateBillingPayloadDto } from './dto/billing.dto';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';
import { hashSHA256NonSalt } from '@/utils/helper';
import dayjs from 'dayjs';
import paginate from '@/shared/pagination';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionLog)
    private transactionLogRepo: Repository<TransactionLog>,

    private productCompanyService: ProductCompaniesService,
    private rabbitMqPublisher: RabbitmqPublisherService,
    private userService: UsersService,
    private supplierService: SuppliersService,
    private httpRequestService: HttpRequestService
  ) {}

  async list(companyId: string, filterDto: any) {
    const { product_id, start_date, end_date, reference_number, show_log } =
      filterDto;
    const page = +filterDto.page || 1;
    const limit = +filterDto.limit || 10;

    const query = this.transactionRepo
      .createQueryBuilder('transaction')
      .where(
        'transaction.company_id = :companyId AND transaction.type = :type',
        {
          companyId,
          type: 'TRX',
        }
      );

    if (product_id) {
      query.andWhere('transaction.product_master_id = :product_id', {
        product_id,
      });
    }

    if (start_date && end_date) {
      query.andWhere('transaction.created_at BETWEEN :startDate AND :endDate', {
        startDate: start_date,
        endDate: end_date,
      });
    }

    if (reference_number) {
      query.andWhere('transaction.reference_number = :reference_number', {
        reference_number,
      });
    }

    if (show_log) {
      query.leftJoinAndMapMany(
        'transaction.logs',
        TransactionLog,
        'logs',
        'logs.transaction_id = transaction.uuid'
      );
    }

    return paginate(query, { page, limit });
  }

  async getTransactionStatistics(companyId: string) {
    const query = `
      SELECT
      (SELECT COUNT(*) FROM transactions WHERE  company_id = '${companyId}' AND type = 'TRX') AS total_transactions,
      (SELECT COUNT(*) FROM transactions WHERE status = 1 AND company_id = '${companyId}' AND type = 'TRX') AS total_successful_transactions,
      (SELECT COUNT(*) FROM transactions WHERE status = 0 AND company_id = '${companyId}' AND type = 'TRX') AS total_pending_transactions,
      (SELECT COUNT(*) FROM transactions WHERE status = 2 AND company_id = '${companyId}' AND type = 'TRX') AS total_failed_transactions,
      (SELECT COALESCE(SUM(pc.margin), 0) FROM transactions t
          JOIN product_companies pc ON t.product_companies_id = pc.uuid WHERE t.status = 1 AND t.company_id = '${companyId}' AND t.type = 'TRX') AS total_margin,
      (SELECT COALESCE(SUM(t.sell_price), 0) FROM transactions t WHERE t.status = 1 AND t.company_id = '${companyId}' AND t.type = 'TRX') AS total_revenue;
    `;

    const results = await this.transactionRepo.query(query);
    if (results[0]) return results[0];
    return {
      total_transactions: 0,
      total_successful_transactions: 0,
      total_pending_transactions: 0,
      total_failed_transactions: 0,
      total_margin: 0,
      total_revenue: 0,
    };
  }

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

  async checkUserAllowance(userId: string, accessToken: string) {
    const path = `${process.env.OLD_API_HOST_URL}/api/usage/find-member-by-guid?guid=${userId}`;

    this.logger.log(`🔵 Check User Balance with url ${path} 🔵 \n\n`);

    const response = await this.httpRequestService.get(path, null, {
      Authorization: `Bearer ${accessToken}`,
    });

    this.logger.log(`🔵 RESPONSE ${JSON.stringify(response)} 🔵 \n\n`);

    if (!response.success) {
      throw NormalException.NOTFOUND('User tidak ditemukan');
    }

    return response;
  }

  async checkUserEwallet(electricCardId: string, accessToken: string) {
    const path = `${process.env.OLD_API_HOST_URL}/api/ewallet/wallet/kasir/info?electric_card=${electricCardId}`;

    this.logger.log(`🔵 Check User EWALLET Balance with url ${path} 🔵 \n\n`);

    const response = await this.httpRequestService.get(path, null, {
      Authorization: `Bearer ${accessToken}`,
    });

    this.logger.log(`🔵 RESPONSE ${JSON.stringify(response)} 🔵 \n\n`);

    if (!response.success) {
      throw NormalException.NOTFOUND('Electric card tidak ditemukan');
    }

    return response;
  }

  private async checkUserBalance(
    paymentMethod: string,
    userOrElectricCardId: string,
    accessToken: string
  ) {
    switch (paymentMethod) {
      case 'ALLOWANCE':
        if (!userOrElectricCardId) {
          throw NormalException.NOTFOUND('User tidak ditemukan');
        }
        await this.checkUserAllowance(userOrElectricCardId, accessToken);
        break;
      case 'EWALLET':
        if (!userOrElectricCardId) {
          throw NormalException.NOTFOUND('User tidak ditemukan');
        }
        await this.checkUserEwallet(userOrElectricCardId, accessToken);
        break;
      default:
        break;
    }
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

    if (!response.success) {
      return true;
      throw NormalException.UNEXPECTED('Add koperasi balance error');
    }

    this.logger.log(`🔵 RESPONSE ${JSON.stringify(response)} 🔵 \n\n`);

    return response.data;
  }

  async addKoperasiBalance(trxId: string) {
    const signature = hashSHA256NonSalt(`Galang Ganteng`);
    const path = `${process.env.OLD_API_HOST_URL}/api/walletpayment/v1/internal/transaction/void?reference_number=${trxId}&signature=${signature}`;

    this.logger.log(
      `🔵 ADD KOPERASI BALANCE:  Will make a request to ${path} 🔵\n\n`
    );

    const response = await this.httpRequestService.patch(
      path,
      {},
      {
        'content-type': 'application/json',
      }
    );

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    if (!response.success) {
      throw NormalException.UNEXPECTED('Add koperasi balance error');
    }

    return response?.data;
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
      payment_code: trxDetail.paymentMethod,
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

    await this.insertLog({
      transactionId: newTransaction.uuid,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_CREATE_BILLING,
      title: `Melakukan permintaan untuk membuat billing`,
      log: {
        url: path,
        body,
      },
    });

    this.logger.log(`🔵 With body ${JSON.stringify(body)} 🔵\n\n`);

    const response = await this.httpRequestService.post(path, body, {
      'content-type': 'application/json',
    });

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    if (!response.success) {
      await this.insertLog({
        transactionId: newTransaction.uuid,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_CREATE_BILLING,
        title: `Mendapatkan respon membuat billing`,
        log: {
          ...response,
        },
      });

      throw NormalException.UNEXPECTED('Billing error');
    }

    await this.insertLog({
      transactionId: newTransaction.uuid,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_CREATE_BILLING,
      title: `Mendapatkan respon membuat billing`,
      log: {
        ...response,
      },
    });
    return response?.data?.data;
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

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_SUPPLIER,
      title: `Melakukan request ke supplier`,
      log: {
        url,
        body,
        header,
      },
    });

    const response = await this.httpRequestService.post(url, body, {
      ...header,
    });

    const data: ApiTrxResponse = response?.data;

    if (!this.isApiResTrxValid(data)) {
      await this.insertLog({
        transactionId: transaction.uuid,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_SUPPLIER,
        title: `Mendapatkan response dari supplier`,
        log: {
          message: 'Invalid Format',
        },
      });
      this.logger.error('Invalid API response format');
      throw new Error('Invalid API response format');
    }

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_SUPPLIER,
      title: `Mendapatkan response dari supplier`,
      log: {
        ...data,
      },
    });

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

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_INQUIRY_SUPPLIER,
      title: `Melakukan request inquiry ke supplier`,
      log: {
        url,
        body,
        header,
      },
    });

    const response = await this.httpRequestService.post(url, body, {
      ...header,
    });

    const data = response?.data;

    if (!this.isApiResInquiryValid(data)) {
      await this.insertLog({
        transactionId: transaction.uuid,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_INQUIRY_SUPPLIER,
        title: `Mendaptakan response inquiry dari supplier`,
        log: {
          message: 'invalid api format',
        },
      });
      this.logger.error('Invalid API response format');
      throw new Error('Invalid API response format');
    }

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_INQUIRY_SUPPLIER,
      title: `Mendaptakan response inquiry dari supplier`,
      log: {
        ...data,
      },
    });
    this.logger.log(`🔵 END With response ${JSON.stringify(response)} 🔵\n\n`);
    return data;
  }

  async processTransactionResponse(data: ApiTrxResponse) {
    const transaction = await this.detail(data.transaction_id);

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.CALLBACK_SUPPLIER,
      title: `Mendaptakan callback dari supplier`,
      log: {
        ...data,
      },
    });

    if (!transaction) {
      throw NormalException.NOTFOUND('Transaksi tidak ditemukan');
    }

    switch (data.response_code) {
      case '00':
        transaction.status = 0;
        break;
      case '01':
        if (transaction.status !== 1) {
          transaction.status = 1;
          transaction.message = data.message;
          transaction.callback_at = new Date();
        }
        // SUKSES
        break;
      case '02':
        if (transaction.status !== 2) {
          transaction.status = 2;
          transaction.message = data.message;
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

  async getStatusTrx(transactionId: string) {
    const data = await this.transactionRepo.findOne({
      where: { uuid: transactionId },
      select: ['uuid', 'reference_number', 'status'],
    });

    if (!data) {
      throw NormalException.NOTFOUND('Transaksi tidak ditemukan');
    }

    return data;
  }

  async informOrderByQris(
    trxId: string,
    totalPay: number,
    accessToken: string
  ) {
    const path = `${process.env.OLD_API_HOST_URL}/api/walletpayment/v1/payment`;

    this.logger.log(`🔵 Will make a request to ${path} 🔵\n\n`);

    const body = {
      referenceNumber: trxId,
      channelCode: 'QRIS',
      amount: totalPay,
    };

    this.logger.log(`🔵 With body ${JSON.stringify(body)} 🔵\n\n`);

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_INFORM_PAYMENT_BILLING,
      title: `Melakukan request informasi pembayaran QRIS`,
      log: {
        path,
        body: {},
      },
    });

    const response = await this.httpRequestService.post(path, body, {
      Authorization: `Bearer ${accessToken}`,
    });

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    if (!response.success) {
      await this.updateTransactionToFailed(trxId);
      // await this.addKoperasiBalance(trxId);
      await this.insertLog({
        transactionId: trxId,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
        title: `Mendapatkan respon informasi pembayaran QRIS`,
        log: {
          path,
          body: {},
        },
      });
      throw NormalException.UNEXPECTED('Billing error');
    }

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
      title: `Mendapatkan respon informasi pembayaran QRIS`,
      log: {
        path,
        body: {},
      },
    });

    return response?.data?.data;
  }

  async informOrderByCash(trxId: string) {
    const path = `${process.env.OLD_API_HOST_URL}/internal/api/billing/payment/cash?referenceNumber=${trxId}`;

    this.logger.log(`🔵 Will make a request to INFORM CASH ${path} 🔵\n\n`);

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_INFORM_PAYMENT_BILLING,
      title: `Melakukan request informasi pembayaran cash`,
      log: {
        path,
        body: {},
      },
    });

    const response = await this.httpRequestService.patch(
      path,
      {},
      {
        'content-type': 'application/json',
      }
    );

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    if (!response.success) {
      await this.updateTransactionToFailed(trxId);
      // await this.addKoperasiBalance(trxId);
      await this.insertLog({
        transactionId: trxId,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
        title: `Mendapatkan respon informasi pembayaran Cash`,
        log: {
          ...response,
        },
      });
      throw NormalException.UNEXPECTED('Inform payment error');
    }

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
      title: `Mendapatkan respon informasi pembayaran Cash`,
      log: {
        ...response,
      },
    });
    return response?.data;
  }

  async updateTransactionToFailed(trxId: string) {
    return this.transactionRepo.update(trxId, {
      status: 2,
    });
  }

  async updateTransctionToSuccess(trxId: string) {
    return this.transactionRepo.update(trxId, {
      status: 1,
    });
  }

  async updateTransctionToPending(trxId: string) {
    return this.transactionRepo.update(trxId, {
      status: 1,
    });
  }

  async informOrderPaymentEwallet(
    header: HeaderParam,
    trxId: string,
    electricCardId: string,
    totalPay: number
  ) {
    const path = `${process.env.OLD_API_HOST_URL}/api/walletpayment/v1/internal/transaction/payment-to-merchant`;

    this.logger.log(
      `🔵 INFORM ORDER PAYMENT WALLET Will make a request to ${path} 🔵\n\n`
    );

    const trxHash = hashSHA256NonSalt(
      `${process.env.EWALLET_TRX_KEY}${trxId}${totalPay}${electricCardId}`
    );

    const body = {
      userId: '',
      companyId: header.companyId,
      referenceNumber: trxId,
      electricCard: electricCardId,
      amount: totalPay,
      signature: trxHash,
    };

    this.logger.log(`🔵 With body ${JSON.stringify(body)} 🔵\n\n`);

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.REQUEST,
      labelLog: LabelLog.REQUEST_INFORM_PAYMENT_BILLING,
      title: `Melakukan request informasi pembayaran EWALLET`,
      log: {
        path,
        body,
      },
    });

    const response = await this.httpRequestService.post(path, body, {
      'content-type': 'application/json',
    });

    this.logger.log(`🔵 With response ${JSON.stringify(response)} 🔵\n\n`);

    if (!response.success) {
      await this.insertLog({
        transactionId: trxId,
        statusLog: StatusLog.ERROR,
        labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
        title: `Mendapatakan response informasi pembayaran EWALLET`,
        log: {
          ...response,
        },
      });

      throw NormalException.UNEXPECTED('Billing error');
    }

    await this.insertLog({
      transactionId: trxId,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
      title: `Mendapatakan response informasi pembayaran EWALLET`,
      log: {
        ...response,
      },
    });

    return response?.data;
  }

  async paymentMethodHandler(payload: {
    paymentMethod: string;
    header: HeaderParam;
    data: { trxId: string; totalPay: number; electricCardId?: string };
  }) {
    let res = null;
    switch (payload.paymentMethod) {
      case 'CASH':
        res = await this.informOrderByCash(payload.data.trxId);
        break;
      case 'QRIS':
        res = await this.informOrderByQris(
          payload.data.trxId,
          payload.data.totalPay,
          payload.header.access_token
        );
        break;
      case 'EWALLET':
        res = await this.informOrderPaymentEwallet(
          payload.header,
          payload.data.trxId,
          payload.data.electricCardId,
          payload.data.totalPay
        );
        break;
      case 'ALLOWANCE':
        res = { reffId: payload.data.trxId };
        break;
      default:
        break;
    }

    return res;
  }

  async transactionHandlerAfterPay(billingData: UpdateBillingPayloadDto) {
    this.logger.log(
      `🔵 INCOMING BILLING ${JSON.stringify(billingData)} 🔵\n\n`
    );

    const transaction = await this.detail(billingData.referenceNumber);

    await this.insertLog({
      transactionId: transaction.uuid,
      statusLog: StatusLog.SUCCESS,
      labelLog: LabelLog.RESPONSE_INFORM_PAYMENT_BILLING,
      title: `Mendapatkan respons untuk membuat billing`,
      log: {
        ...billingData,
      },
    });

    if (!transaction) {
      this.logger.log(`🔵 Transaksi tidak ditemukan 🔵\n\n`);
      throw NormalException.NOTFOUND('Transaksi tidak ditemukan');
    }

    const isBillingSuccess = billingData.status === 1;

    if (isBillingSuccess) {
      this.logger.log('✅ Do: Payment Success \n');
      await this.rabbitMqPublisher.publishMessage(
        transaction,
        'PRODUCT_DIGITAL_TRANSACTION'
      );
    } else {
      this.logger.log('🚫 Do: Payment Failed \n');
      await this.updateTransactionToFailed(transaction.uuid);
    }
  }

  async create(payload: CreateTransactionDTO, header: HeaderParam) {
    return this.transactionRepo.manager.transaction(async (trx) => {
      await this.checkUserBalance(
        payload.paymentMethod,
        payload.paymentMethod === 'EWALLET'
          ? payload.electricCardId
          : payload.buyer_id,
        header.access_token
      );

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

      const resBilling = await this.httpRequestCreateBilling(
        newTransaction,
        header
      );

      newTransaction.reference_number = resBilling.invoiceNo;

      // await this.deductKoperasiBalance(
      //   header.access_token,
      //   newTransaction.uuid,
      //   newTransaction.buy_price,
      //   newTransaction.company_id
      // );

      const resInform = await this.paymentMethodHandler({
        paymentMethod: payload.paymentMethod,
        header,
        data: {
          trxId: newTransaction.uuid,
          totalPay: newTransaction.sell_price,
          electricCardId: payload.electricCardId,
        },
      });

      await this.transactionRepo.save(newTransaction);

      const transactionResponse = {
        uuid: newTransaction.uuid,
        sell_price: newTransaction.sell_price,
        reference_number: newTransaction.reference_number,
        status: newTransaction.status,
        payment_method: newTransaction.payment_method,
      };

      return {
        message: 'Transaksimu sedang di proses',
        data: {
          transaction: transactionResponse,
          billing: resInform,
        },
      };
    });
  }

  async inquiry(payload: InquiryTrx, header: HeaderParam) {
    return this.transactionRepo.manager.transaction(async (trx) => {
      const productDetail = await this.productCompanyService.detail(
        payload.product_company_id
      );
      if (
        productDetail.product_digital_master.is_bill_payment !== 1 &&
        productDetail.product_digital_master.product_digital_brand
          .product_digital_categories.layout_type !== 'CARD_DENOM_INQUIRY'
      ) {
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
      newTransaction.type = 'INQUIRY';

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
    await this.checkUserBalance(
      payload.paymentMethod,
      payload.paymentMethod === 'EWALLET'
        ? payload.electricCardId
        : header.user_guid,
      header.access_token
    );

    const transaction = await this.detail(payload.reff_id);

    if (!transaction) {
      throw NormalException.NOTFOUND('Reff tidak ditemukan');
    }

    transaction.payment_method = payload.paymentMethod;
    const resBilling = await this.httpRequestCreateBilling(transaction, header);
    transaction.type = 'TRX';
    transaction.reference_number = resBilling.invoiceNo;

    await this.deductKoperasiBalance(
      header.access_token,
      transaction.uuid,
      transaction.buy_price,
      transaction.company_id
    );

    const resInform = await this.paymentMethodHandler({
      paymentMethod: payload.paymentMethod,
      header,
      data: {
        trxId: transaction.uuid,
        totalPay: transaction.sell_price,
        electricCardId: payload.electricCardId,
      },
    });

    await this.transactionRepo.save(transaction);

    const transactionResponse = {
      uuid: transaction.uuid,
      sell_price: transaction.sell_price,
      reference_number: transaction.reference_number,
      status: transaction.status,
      payment_method: transaction.payment_method,
    };

    return {
      message: 'Transaksimu sedang di proses',
      data: {
        transaction: transactionResponse,
        billing: resInform,
      },
    };
  }

  async insertLog(payload: {
    transactionId: string;
    statusLog: StatusLog;
    labelLog: LabelLog;
    title: string;
    log: any;
  }) {
    const newTrxLog = this.transactionLogRepo.create({
      transaction_id: payload.transactionId,
      status_log: payload.statusLog,
      label_log: payload.labelLog,
      title: payload.title,
      log: payload.log,
    });

    await this.transactionLogRepo.save(newTrxLog);
    return newTrxLog;
  }
}
