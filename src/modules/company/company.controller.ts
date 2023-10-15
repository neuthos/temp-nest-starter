import { CompanyDataStream } from './types/company-stream.types';
import { CompanyService } from './company.service';
import { Controller, Get, Headers } from '@nestjs/common';
import { HeaderParam } from '@/shared/interfaces';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @MessagePattern('STREAM-COMPANY')
  public async listenCompanyTags(@Payload() data: CompanyDataStream) {
    return this.companyService.createOrUpdateCompany(data);
  }

  @Get('fee')
  async getFee(@Headers() header: HeaderParam): Promise<any> {
    return this.companyService.getFee(header.companyId);
  }
}
