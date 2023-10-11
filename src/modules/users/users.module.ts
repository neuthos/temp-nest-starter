import { ClientsModule, Transport } from '@nestjs/microservices';
import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/users.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(KoperasiMiddleware).forRoutes(UsersController);
  }
}
