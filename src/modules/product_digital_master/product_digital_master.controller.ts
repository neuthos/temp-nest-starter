import { Controller, Get, Headers, Query } from '@nestjs/common';
import { HeaderParam } from '@/shared/interfaces';
import { ProductDigitalMasterService } from './product_digital_master.service';

@Controller('products')
export class ProductDigitalMasterController {
  constructor(
    private readonly productDigitalMasterService: ProductDigitalMasterService
  ) {}

  @Get()
  async list(@Query() filter: any, @Headers() header: HeaderParam) {
    return this.productDigitalMasterService.list(filter, header.companyId);
  }
}
