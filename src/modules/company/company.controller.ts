import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { CompanyDataStream } from './types/company-stream.types';
import { CompanyService } from './company.service';
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

  @Patch('default-margin')
  async updateDefaultFEe(
    @Headers() header: HeaderParam,
    @Body()
    updateProductCompanyStatusDto: {
      defaultMargin: number;
    }
  ): Promise<any> {
    return this.companyService.updateDefaultFee(
      header.companyId,
      updateProductCompanyStatusDto.defaultMargin
    );
  }
}
