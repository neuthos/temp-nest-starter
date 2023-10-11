import { Controller } from '@nestjs/common';
import { ProductCompaniesService } from './product_companies.service';

@Controller('product-companies')
export class ProductCompaniesController {
  constructor(
    private readonly productCompaniesService: ProductCompaniesService
  ) {}
}
