import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
