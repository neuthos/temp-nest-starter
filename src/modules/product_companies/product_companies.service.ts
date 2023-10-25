/* eslint-disable no-await-in-loop */
import { CompanyService } from '../company/company.service';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompany } from './entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import paginate from '@/shared/pagination';

@Injectable()
export class ProductCompaniesService {
  constructor(
    @InjectRepository(ProductCompany)
    private productCompanyRepo: Repository<ProductCompany>,
    @InjectRepository(ProductDigitalBrand)
    private readonly brandRepository: Repository<ProductDigitalBrand>,

    private readonly productDigitalMasterService: ProductDigitalMasterService,
    private readonly companyService: CompanyService
  ) {}

  private async _validateCompanyId(
    productCompanyId: string,
    companyId: string,
    doCreate?: boolean
  ): Promise<ProductCompany> {
    const productCompany = await this.productCompanyRepo.findOne({
      where: { uuid: productCompanyId, company_id: companyId },
      select: [
        'uuid',
        'company_id',
        'margin',
        'status',
        'supplier_id',
        'product_digital_master_id',
        'supplier',
      ],
    });

    if (!productCompany) {
      if (doCreate) return null;
      throw NormalException.NOTFOUND(
        'Product company not found or invalid company ID.'
      );
    }

    return productCompany;
  }

  async list(filter: any, companyId: string, customSelection?: string[]) {
    const page = filter.page || 1;
    const limit = filter.limit || 1;

    const query = this.productCompanyRepo
      .createQueryBuilder('productCompany')
      .leftJoinAndMapOne(
        'productCompany.product_digital_master',
        'product_digital_master',
        'product_digital_master',
        'productCompany.product_digital_master_id = product_digital_master.uuid'
      )
      .leftJoin('productCompany.supplier', 'supplier')
      .addSelect(['supplier.uuid', 'supplier.name'])
      .where(
        'productCompany.company_id = :companyId AND product_digital_master.status = 1',
        {
          companyId,
        }
      );

    if (customSelection) query.select(customSelection);

    if (filter.product_digital_brand_id) {
      query.andWhere(
        'product_digital_master.product_digital_brand_id = :product_digital_brand_id',
        { product_digital_brand_id: filter.product_digital_brand_id }
      );
    }

    if (filter.is_bill_payment !== undefined) {
      query.andWhere(
        'product_digital_master.is_bill_payment = :is_bill_payment',
        {
          is_bill_payment: +filter.is_bill_payment,
        }
      );
    }

    if (filter.name) {
      query.andWhere('product_digital_master.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.product_code) {
      query.andWhere('product_digital_master.product_code LIKE :product_code', {
        product_code: `%${filter.product_code}%`,
      });
    }

    query.orderBy('product_digital_master.name', 'ASC');

    const result = await paginate(query, { page, limit });
    return result;
  }

  async detail(productCompanyId: string): Promise<ProductCompany> {
    const data = await this.productCompanyRepo.findOne({
      where: { uuid: productCompanyId },
    });
    if (!data) throw NormalException.NOTFOUND('Produk tidak ditemukan');
    return data;
  }

  async mobileList(brandIds: string[], companyId: string, prefix?: string) {
    const query = this.productCompanyRepo
      .createQueryBuilder('productCompany')
      .leftJoin(
        'productCompany.product_digital_master',
        'product_digital_master'
      )
      .leftJoin('productCompany.supplier', 'supplier')
      .leftJoin(
        'product_digital_master.product_digital_brand',
        'product_digital_brand'
      );

    if (prefix) {
      query.leftJoinAndMapOne(
        'product_digital_brand.product_brand_prefix',
        'product_brand_prefix',
        'product_brand_prefix',
        'product_digital_brand.uuid = product_brand_prefix.product_digital_brand_id',
        {
          prefix,
          wildcard: '%',
        }
      );
    }

    query.where('productCompany.company_id = :companyId', { companyId });
    query.andWhere('productCompany.status = 1');
    query.andWhere('product_digital_master.status = 1');
    query.andWhere(
      'product_digital_master.product_digital_brand_id IN (:...brandIds)',
      { brandIds }
    );

    if (prefix) {
      query.andWhere(
        "product_brand_prefix IS NOT NULL AND :prefix LIKE (product_brand_prefix.prefix || '%')",
        {
          prefix,
          wildcard: '%',
        }
      );
    }

    const selectCol = [
      'productCompany.uuid',
      'productCompany.product_digital_master_id',
      'productCompany.company_id',
      'productCompany.supplier_id',
      'productCompany.margin',
      'productCompany.buy_price',
      'product_digital_master.product_digital_brand_id',
      'product_digital_master.name',
      'product_digital_master.buy_price',
      'product_digital_master.description',
      'product_digital_master.denom',
      'product_digital_master.product_code',
      'product_digital_master.is_bill_payment',
      'supplier.uuid',
      'supplier.name',
      'product_digital_brand.uuid',
      'product_digital_brand.name',
      'product_digital_brand.icon',
    ];

    if (prefix) {
      selectCol.push('product_brand_prefix.uuid');
      selectCol.push('product_brand_prefix.prefix');
    }

    const productList = await query
      .select(selectCol)
      .orderBy('product_digital_master.name', 'ASC')
      .getMany();

    const dataToReturn = productList.map((item) => ({
      uuid: item.uuid,
      product_digital_master_id: item.product_digital_master_id,
      company_id: item.company_id,
      supplier_id: item.supplier_id,
      sell_price:
        (item.supplier_id === process.env.QPAY_UUID
          ? +item.product_digital_master.buy_price
          : +item.buy_price) + +item.margin,
      product_digital_master: {
        name: item.product_digital_master.name,
        description: item.product_digital_master.description,
        denom: item.product_digital_master.denom,
        product_code: item.product_digital_master.product_code,
        is_bill_payment: item.product_digital_master.is_bill_payment,
        product_digital_brand: {
          ...item.product_digital_master.product_digital_brand,
        },
      },
      supplier: {
        uuid: item.supplier.uuid,
        name: item.supplier.name,
      },
    }));

    return dataToReturn;
  }

  async updateStatus(
    productCompanyIds: string[],
    status: number,
    companyId: string
  ): Promise<string> {
    if (status !== 0 && status !== 1) {
      throw NormalException.UNEXPECTED('Invalid Status');
    }

    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId,
        status === 1
      );

      productCompany.status = status;
      await this.productCompanyRepo.save(productCompany);
    }

    return `Berhasil update status menjadi ${!status ? 'Nonaktif' : 'Aktif'}`;
  }

  async updateMargin(
    productCompanyIds: string[],
    margin: number,
    companyId: string
  ): Promise<string> {
    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId
      );

      productCompany.margin = margin;
      await this.productCompanyRepo.save(productCompany);
    }

    return 'Berhasil setting margin';
  }

  async updateSupplier(
    productCompanyIds: string[],
    supplierId: string,
    companyId: string,
    buyPrice?: number
  ): Promise<string> {
    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId
      );

      const isQpay = productCompany.supplier_id === process.env.QPAY_UUID;

      if (isQpay) {
        productCompany.buy_price = null;
      } else {
        const avianaFee = +process.env.AVIANA_FEE || 100;
        const affiliatorFee = 0;
        productCompany.buy_price = buyPrice + avianaFee + affiliatorFee;
      }

      productCompany.supplier_id = supplierId;
      await this.productCompanyRepo.save(productCompany);
    }

    return 'Berhasil memperbarui status';
  }

  async updateMarginByCategories(
    productCategoryId: string,
    companyId: string,
    margin: number
  ) {
    const brandIds = await this.brandRepository.find({
      where: { product_digital_category_id: productCategoryId },
      select: ['uuid'],
    });

    const productIds = [];

    for (let i = 0; i < brandIds.length; i += 1) {
      const brand = brandIds[i];
      const prodDataRaw = await this.productDigitalMasterService.list(
        {
          page: 1,
          limit: 99999,
          product_digital_brand_id: brand.uuid,
          companyId,
        },
        companyId
      );

      prodDataRaw?.data?.content?.forEach((el: any) => {
        if (el.product_companies) {
          productIds.push(el.product_companies?.uuid);
        }
      });
    }

    return this.updateMargin(productIds, margin, companyId);
  }

  async updateMarginByBrands(
    brandId: string,
    companyId: string,
    margin: number
  ) {
    const prodDataRaw = await this.productDigitalMasterService.list(
      {
        page: 1,
        limit: 99999,
        product_digital_brand_id: brandId,
      },
      companyId
    );

    const productIds = prodDataRaw?.data?.content?.map(
      (el: any) => el.product_companies?.uuid
    );

    return this.updateMargin(productIds, margin, companyId);
  }

  async updateMarginAllProducts(companyId: string, margin: number) {
    const prodDataRaw = await this.productDigitalMasterService.list(
      {
        page: 1,
        limit: 99999,
      },
      companyId
    );

    const productIds = prodDataRaw?.data?.content?.map(
      (el: any) => el.product_companies?.uuid
    );

    return this.updateMargin(productIds, margin, companyId);
  }

  async syncProduct(companyId: string) {
    const company = await this.companyService.detail(companyId);
    const dataProductRaw = await this.productDigitalMasterService.list(
      {
        page: 1,
        limit: 9999,
        noProductCompanies: false,
      },
      companyId
    );

    let count = 0;

    for (let i = 0; i < dataProductRaw?.data?.content.length; i += 1) {
      const data = dataProductRaw.data.content[i];
      if (!data.product_companies) {
        const newProductCompany = this.productCompanyRepo.create({
          product_digital_master_id: data.uuid,
          company_id: companyId,
          supplier_id: process.env.QPAY_UUID,
          margin: company.default_fee || 0,
          status: 1,
        });

        await this.productCompanyRepo.save(newProductCompany);
        count += 1;
      }
    }

    return `Berhasil mengaktifkan produk sebanyak ${count} produk`;
  }

  async mapSupplierProductPrice(payload: {
    trx: EntityManager;
    productCompany: ProductCompany;
  }): Promise<{
    feeToAviana: number;
    feeAffiliate: number;
    buyPrice: number;
    marginFee: number;
    sellPriceWithMargin: number;
  }> {
    const { productCompany } = payload;
    const { supplier } = productCompany;

    const isQpaySupplier: boolean = supplier.uuid === process.env.QPAY_UUID;

    if (!productCompany) {
      throw NormalException.NOTFOUND('Produk tidak ditemukan');
    }

    const feeToAviana: number = +process.env.AVIANA_FEE || 100;
    const feeAffiliate: number = 0; // TODO
    const marginFee: number = +productCompany.margin;

    let buyPrice: number = +productCompany.buy_price;
    if (isQpaySupplier) {
      buyPrice = +productCompany.product_digital_master.buy_price;
    }

    const sellPriceWithMargin = buyPrice + marginFee;

    return {
      feeToAviana,
      feeAffiliate,
      buyPrice,
      marginFee,
      sellPriceWithMargin,
    };
  }

  async productCompaniesByKeyVal(key: string, val: string) {
    return this.productCompanyRepo.find({
      where: { [key]: val },
    });
  }
}
