import { CompanyDataStream } from './types/company-stream.types';
import { CompanyService } from './company.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @MessagePattern('STREAM-COMPANY')
  public async listenCompanyTags(@Payload() data: CompanyDataStream) {
    return this.companyService.createOrUpdateCompany(data);
  }
}
