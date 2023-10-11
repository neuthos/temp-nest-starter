import { ClientsModule, Transport } from '@nestjs/microservices';
import { Company } from './entities/company.entity';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    ClientsModule.register([
      {
        name: 'SERVICE_USER',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'PRODUCTDIGITAL_STREAM_QUEUE',
          persistent: true,
          prefetchCount: 2,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(KoperasiMiddleware).forRoutes(CompanyController);
  }
}
