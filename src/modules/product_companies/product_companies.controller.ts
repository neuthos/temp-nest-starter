import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { HeaderParam } from '@/shared/interfaces';
import { ProductCompaniesService } from './product_companies.service';

@Controller('product-companies')
export class ProductCompaniesController {
  constructor(
    private readonly productCompaniesService: ProductCompaniesService
  ) {}

  @Get()
  async list(@Query() filter: any, @Headers() header: HeaderParam) {
    return this.productCompaniesService.list(filter, header.companyId);
  }

  @Patch('update-status')
  async updateStatus(
    @Body()
    updateProductCompanyStatusDto: {
      status: number;
      productCompanyIds: string[];
    },
    @Headers() header: HeaderParam
  ): Promise<any> {
    return this.productCompaniesService.updateStatus(
      updateProductCompanyStatusDto.productCompanyIds,
      updateProductCompanyStatusDto.status,
      header.companyId
    );
  }

  @Patch('update-margin')
  async updateMargin(
    @Body()
    updateProductCompanyStatusDto: {
      margin: number;
      productCompanyIds: string[];
    },
    @Headers() header: HeaderParam
  ): Promise<string> {
    return this.productCompaniesService.updateMargin(
      updateProductCompanyStatusDto.productCompanyIds,
      updateProductCompanyStatusDto.margin,
      header.companyId
    );
  }

  @Patch('update-margin-by-category/:categoryId')
  async updateMarginByCategories(
    @Body()
    updateProductCompanyStatusDto: {
      margin: number;
    },
    @Param('categoryId') categoryId: string,
    @Headers() header: HeaderParam
  ): Promise<string> {
    return this.productCompaniesService.updateMarginByCategories(
      categoryId,
      header.companyId,
      updateProductCompanyStatusDto.margin
    );
  }

  @Patch('update-margin-by-brand/:brandId')
  async updateMarginByBrands(
    @Body()
    updateProductCompanyStatusDto: {
      margin: number;
    },
    @Param('brandId') brandId: string,
    @Headers() header: HeaderParam
  ): Promise<string> {
    return this.productCompaniesService.updateMarginByBrands(
      brandId,
      header.companyId,
      updateProductCompanyStatusDto.margin
    );
  }

  @Patch('update-margin/all')
  async updateMarginAllProduct(
    @Body()
    updateProductCompanyStatusDto: {
      margin: number;
    },
    @Headers() header: HeaderParam
  ): Promise<string> {
    return this.productCompaniesService.updateMarginAllProducts(
      header.companyId,
      updateProductCompanyStatusDto.margin
    );
  }

  @Patch('update-supplier')
  async updateSupplier(
    @Body()
    updateProductCompanyStatusDto: {
      supplierId: string;
      buyPrice: number;
      productCompanyIds: string[];
    },
    @Headers() header: HeaderParam
  ): Promise<string> {
    return this.productCompaniesService.updateSupplier(
      updateProductCompanyStatusDto.productCompanyIds,
      updateProductCompanyStatusDto.supplierId,
      header.companyId,
      updateProductCompanyStatusDto.buyPrice
    );
  }
}
