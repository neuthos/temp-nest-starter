import { Controller, Get, Query } from '@nestjs/common';
import { ProductDigitalMasterService } from './product_digital_master.service';

@Controller('products')
export class ProductDigitalMasterController {
  constructor(
    private readonly productDigitalMasterService: ProductDigitalMasterService
  ) {}

  @Get()
  async list(@Query() filter: any) {
    return this.productDigitalMasterService.list(filter);
  }
}
