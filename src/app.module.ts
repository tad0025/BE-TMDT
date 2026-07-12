import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './module/auth/auth.module';
import { ProductsModule } from './module/products/products.module';
import { CategoriesModule } from './module/categories/categories.module';
import { CartModule } from './module/cart/cart.module';
import { ReviewsModule } from './module/reviews/reviews.module';
import { CustomThrottlerGuard } from './core/security/throttler/custom-throttler.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './module/users/users.module';
import { CheckoutModule } from './module/checkout/checkout.module';
import { AdminsModule } from './module/admins/admins.module';
import { StaffsModule } from './module/staffs/staffs.module';
import { SellersModule } from './module/sellers/sellers.module';
import { DashboardModule } from './module/admin-dashboard/dashboard.module';
import { MediaModule } from './module/media/media.module';
import { OrdersModule } from './module/orders/orders.module';
import { VouchersModule } from './module/vouchers/vouchers.module';
import { OpensearchModule } from './module/opensearch/opensearch.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 1000,
        limit: 6,
      },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: { rejectUnauthorized: false }
      }),
    }),

    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    ReviewsModule,
    UsersModule,
    CheckoutModule,
    SellersModule,
    AdminsModule,
    StaffsModule,
    DashboardModule,
    MediaModule,
    OrdersModule,
    VouchersModule,
    OpensearchModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
