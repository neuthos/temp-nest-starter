import { Company } from './entities/company.entity';
import { CompanyDataStream } from './types/company-stream.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private companyrepository: Repository<Company>
  ) {}

  async createOrUpdateCompany(payload: CompanyDataStream) {
    const company = await this.companyrepository.findOne({
      select: ['uuid'],
      where: {
        uuid: payload.id,
      },
    });

    if (company) {
      this.logger.log('🟢 DO UPDATE data COMPANY from CDC 🟢');
      company.name = payload.name;
      company.code = payload.code;

      await this.companyrepository.save(company);
      this.logger.log('🟢 DONE UPDATE data COMPANY from CDC 🟢');
    } else {
      this.logger.log('🟢 DO INSERT data COMPANY from CDC 🟢');
      const newCompany = new Company();
      newCompany.name = payload.name;
      newCompany.code = payload.code;
      newCompany.uuid = payload.id;
      await this.companyrepository.save(newCompany);
      this.logger.log('🟢 DONE INSERT data COMPANY from CDC');
    }
  }
}
